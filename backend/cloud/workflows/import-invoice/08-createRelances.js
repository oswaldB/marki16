// backend/cloud/workflows/import-invoice/08-createRelances.js
// Étape 8 : Crée les relances à partir des impayés avec séquence
// Input: { sansRelance, avecRelance, state }
// Output: { stats, state }

const fs = require('fs');
const path = require('path');

const { info, warn, error, debug } = require('../../utils/logger');

// Initialiser Parse si nécessaire
if (typeof Parse === 'undefined') {
  const Parse = require('parse/node');
  Parse.initialize(
    process.env.PARSE_APP_ID,
    process.env.PARSE_JAVASCRIPT_KEY,
    process.env.PARSE_MASTER_KEY
  );
  Parse.serverURL = process.env.PARSE_SERVER_URL;
  Parse.Cloud.useMasterKey();
  global.Parse = Parse;
}

const STATE_FILE = path.join(__dirname, 'state', 'sync-state.json');

/**
 * Calcule la date d'envoi prévue à partir du délai du scénario
 */
function getDateEnvoiPrevue(scenario) {
  const delai = scenario.delai || 0;
  const date = new Date();
  date.setDate(date.getDate() + delai);
  return date;
}

/**
 * Étape 8 : Crée les relances à partir des impayés avec séquence
 * @param {Object} param0 - { sansRelance: [], avecRelance: [], state }
 * @returns {Promise<Object>} { stats, state }
 */
async function createRelances({ sansRelance, avecRelance, state }) {
  const stats = {
    relancesCreated: 0,
    relancesUpdated: 0,
    skipped: 0,
    erreurs: []
  };

  info('Étape 8: Début de la création des relances', 'import-invoice', 'createRelances', { 
    sansRelanceCount: sansRelance.length, 
    avecRelanceCount: avecRelance.length 
  });

  try {
    debug('Étape 8.1: Récupération des séquences publiées', 'import-invoice', 'createRelances');
    // 1. Récupérer toutes les séquences publiées
    const Sequence = Parse.Object.extend('Sequence');
    const sequenceQuery = new Parse.Query(Sequence);
    sequenceQuery.equalTo('publiee', true);
    const sequences = await sequenceQuery.find({ useMasterKey: true });

    info(`Trouvé ${sequences.length} séquences publiées`, 'import-invoice', 'createRelances', { count: sequences.length });

    // Traiter seulement les impayés sans relance (ceux avec relance sont déjà traités)
    debug('Étape 8.2: Traitement des impayés sans relance', 'import-invoice', 'createRelances', { count: sansRelance.length });

    // Regrouper les impayés sans relance par séquence
    const impayesBySequence = {};
    for (const impaye of sansRelance) {
      const seq = impaye.get('sequence');
      if (!seq) continue;
      if (!impayesBySequence[seq.id]) {
        impayesBySequence[seq.id] = [];
      }
      impayesBySequence[seq.id].push(impaye);
    }

    info(`Impayés sans relance groupés par séquence: ${Object.keys(impayesBySequence).length} séquences`, 'import-invoice', 'createRelances', { 
      sequenceCount: Object.keys(impayesBySequence).length 
    });

    // Traiter chaque séquence
    for (const sequence of sequences) {
      const sequenceId = sequence.id;
      const emails = sequence.get('emails') || [];
      const validationObligatoire = sequence.get('validation_obligatoire') || false;

      const sequenceImpayes = impayesBySequence[sequenceId] || [];
      
      if (sequenceImpayes.length === 0) {
        info(`⏭️ Aucune impayé sans relance à traiter pour séquence ${sequenceId}`, 'import-invoice', 'createRelances', { sequenceId });
        continue;
      }

      debug(`Traitement séquence: ${sequenceId} - ${sequence.get('nom')} (${sequenceImpayes.length} impayés)`, 'import-invoice', 'createRelances', { 
        sequenceId, 
        nom: sequence.get('nom'), 
        count: sequenceImpayes.length 
      });

      // Filtrer les impayés : email existe, non vide, non blacklisté
      debug('Étape 8.3: Filtrage des impayés valides', 'import-invoice', 'createRelances', { sequenceId });
      const validImpayes = sequenceImpayes.filter(impaye => {
        const contact = impaye.get('contact_relance');
        if (!contact) return false;
        const email = contact.get('email');
        const isBlacklisted = contact.get('isBlacklisted') || false;
        return email && email.trim() !== '' && !isBlacklisted;
      });

      info(`✓ ${validImpayes.length} impayés valides après filtrage pour séquence ${sequenceId}`, 'import-invoice', 'createRelances', { 
        count: validImpayes.length, 
        sequenceId 
      });

      // Regrouper les impayés par payeur
      debug('Étape 8.4: Regroupement des impayés par payeur', 'import-invoice', 'createRelances', { sequenceId });
      const impayesByPayeur = {};
      
      for (const impaye of validImpayes) {
        const contact = impaye.get('contact_relance');
        if (!contact) continue;
        const payeurId = contact.id;
        if (!impayesByPayeur[payeurId]) {
          impayesByPayeur[payeurId] = { payeur: contact, impayes: [] };
        }
        impayesByPayeur[payeurId].impayes.push(impaye);
      }

      info(`👥 ${Object.keys(impayesByPayeur).length} payeurs uniques identifiés pour séquence ${sequenceId}`, 'import-invoice', 'createRelances', { 
        payeursCount: Object.keys(impayesByPayeur).length, 
        sequenceId 
      });

      // Traiter chaque groupe payeur+impayés
      debug('Étape 8.5: Traitement de chaque groupe payeur+impayés', 'import-invoice', 'createRelances', { sequenceId });
      for (const [payeurId, group] of Object.entries(impayesByPayeur)) {
        const { payeur, impayes: groupImpayes } = group;
        const impayeIds = groupImpayes.map(i => i.id);
        const scenarioFormat = groupImpayes.length > 1 ? 'multiple' : 'single';

        debug(`Traitement groupe payeur ${payeurId}`, 'import-invoice', 'createRelances', { payeurId, impayesCount: groupImpayes.length, scenarioFormat });

        // Trouver le bon email/scénarios pour ce format
        const matchingEmails = emails.filter(e => 
          e.scenarios && e.scenarios.some(s => s.format === scenarioFormat)
        );

        if (matchingEmails.length === 0) {
          warn(`Aucun scénario "${scenarioFormat}" trouvé, skip payeur ${payeurId}`, 'import-invoice', 'createRelances', { payeurId, scenarioFormat });
          stats.skipped++;
          continue;
        }

        const emailConfig = matchingEmails[0];
        const scenario = emailConfig.scenarios.find(s => s.format === scenarioFormat);

        if (!scenario) {
          warn(`Scénario introuvable, skip payeur ${payeurId}`, 'import-invoice', 'createRelances', { payeurId });
          stats.skipped++;
          continue;
        }

        debug(`Traitement payeur ${payeurId}: ${groupImpayes.length} impayé(s), scénario: ${scenarioFormat}`, 'import-invoice', 'createRelances', { payeurId, count: groupImpayes.length, scenarioFormat });

        debug('Étape 8.6: Vérification des relances existantes pour ce payeur', 'import-invoice', 'createRelances', { payeurId });
        // Vérifier si une relance existe déjà pour ce payeur SANS dateEnvoi
        const Relance = Parse.Object.extend('Relance');
        const existingRelanceQuery = new Parse.Query(Relance);
        existingRelanceQuery.equalTo('contact', payeur);
        existingRelanceQuery.doesNotExist('dateEnvoi');
        const existingRelances = await existingRelanceQuery.find({ useMasterKey: true });

        if (existingRelances.length > 0) {
          debug(`Relance existante trouvée pour payeur ${payeurId}`, 'import-invoice', 'createRelances', { payeurId, existingRelanceId: existingRelances[0].id });
          const existingRelance = existingRelances[0];
          const currentImpayeIds = existingRelance.get('impayes') || [];
          const newImpayeIds = impayeIds.filter(id => !currentImpayeIds.includes(id));

          if (newImpayeIds.length > 0) {
            debug('Vérification de tous les impayés existants pour ce contact', 'import-invoice', 'createRelances', { payeurId });
            const existingRelancesForContact = new Parse.Query(Relance);
            existingRelancesForContact.equalTo('contact', payeur);
            existingRelancesForContact.doesNotExist('dateEnvoi');
            const allExisting = await existingRelancesForContact.find({ useMasterKey: true });

            const existingImpayeIdsSet = new Set();
            for (const rel of allExisting) {
              (rel.get('impayes') || []).forEach(id => existingImpayeIdsSet.add(id));
            }

            const impayesToAdd = impayeIds.filter(id => !existingImpayeIdsSet.has(id));

            if (impayesToAdd.length === 0) {
              info(`⏭️ Tous les impayés existent déjà, skip`, 'import-invoice', 'createRelances', { payeurId });
              stats.skipped++;
              continue;
            }

            debug(`Mise à jour de la relance ${existingRelance.id}`, 'import-invoice', 'createRelances', { relanceId: existingRelance.id, impayesToAdd: impayesToAdd.length });
            existingRelance.set('impayes', [...currentImpayeIds, ...impayesToAdd]);
            existingRelance.set('scenario', scenarioFormat);
            existingRelance.set('email_index', scenario.email_index || 0);
            existingRelance.set('date_envoi_prevue', getDateEnvoiPrevue(scenario));
            existingRelance.set('valide', !validationObligatoire);

            if (!existingRelance.get('sequence')) existingRelance.set('sequence', sequence);
            if (!existingRelance.get('objet')) existingRelance.set('objet', 'Généré au moment de l\'envoi');
            if (!existingRelance.get('corps')) existingRelance.set('corps', 'Générer au moment de l\'envoi');
            if (!existingRelance.get('statut')) existingRelance.set('statut', 'En attente de génération');

            await existingRelance.save(null, { useMasterKey: true });
            info(`✅ Relance ${existingRelance.id} mise à jour`, 'import-invoice', 'createRelances', { relanceId: existingRelance.id });
            stats.relancesUpdated++;
          } else {
            info(`⏭️ Aucun nouvel impayé à ajouter, skip`, 'import-invoice', 'createRelances', { payeurId });
            stats.skipped++;
          }

        } else {
          const newRelance = new Relance();
          newRelance.set('impayes', impayeIds);
          newRelance.set('contact', payeur);
          newRelance.set('sequence', sequence);
          newRelance.set('scenario', scenarioFormat);
          newRelance.set('email_index', scenario.email_index || 0);
          newRelance.set('date_envoi_prevue', getDateEnvoiPrevue(scenario));
          newRelance.set('objet', 'Généré au moment de l\'envoi');
          newRelance.set('corps', 'Générer au moment de l\'envoi');
          newRelance.set('statut', 'En attente de génération');
          newRelance.set('valide', !validationObligatoire);

          if (scenario.smtp) {
            const SmtpProfile = Parse.Object.extend('SmtpProfile');
            const smtpQuery = new Parse.Query(SmtpProfile);
            const smtpProfile = await smtpQuery.get(scenario.smtp, { useMasterKey: true });
            newRelance.set('smtpProfil', smtpProfile);
          }

          await newRelance.save(null, { useMasterKey: true });
          info(`✅ Nouvelle relance créée: ${newRelance.id}`, 'import-invoice', 'createRelances', { relanceId: newRelance.id });
          stats.relancesCreated++;
        }
      }
    }

    info(`Étape 8 terminée: ${stats.relancesCreated} créées, ${stats.relancesUpdated} mises à jour, ${stats.skipped} ignorées`, 'import-invoice', 'createRelances', { 
      created: stats.relancesCreated, 
      updated: stats.relancesUpdated, 
      skipped: stats.skipped 
    });

    const newState = {
      ...state,
      currentStep: '09-generateRelances',
      steps: {
        ...state.steps,
        '08-createRelances': {
          status: 'completed',
          relances_created: stats.relancesCreated,
          relances_updated: stats.relancesUpdated,
          skipped: stats.skipped,
          erreurs: stats.erreurs.length,
          completedAt: new Date().toISOString()
        }
      },
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));

    return {
      stats,
      state: newState
    };

  } catch (err) {
    error(`Erreur Étape 8: ${err.message}`, 'import-invoice', 'createRelances', { error: err.message, stack: err.stack?.substring(0, 500) });
    throw err;
  }
}

module.exports = createRelances;
