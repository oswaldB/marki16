/**
 * Noeud 04: Créer les relances à partir des impayés avec séquence
 * Basé sur cloud/jobs/createRelances.js
 * 
 * Ce script:
 * 1. Récupère les séquences publiées (publiee: true)
 * 2. Pour chaque séquence, récupère les impayés non soldés
 * 3. Filtre les impayés avec email valide et non blacklistés
 * 4. Regroupe les impayés par payeur
 * 5. Crée ou met à jour les relances selon le scénario
 */

// Charger les variables d'environnement depuis .env
require('dotenv').config({ path: '/home/ubuntu/prod/adti/.env' });

// Initialiser le logger
const { info, warn, error, debug } = require('../../utils/logger');

// Initialiser Parse
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
 * Crée les relances à partir des impayés non soldés
 */
const createRelancesFromImpayes = async () => {
  info('Démarrage de la création des relances', 'import-invoice', 'createRelancesFromImpayes');
  debug('Initialisation du workflow', 'import-invoice', 'createRelancesFromImpayes');
  
  try {
    let totalRelancesCreated = 0;
    let totalRelancesUpdated = 0;
    let totalSkipped = 0;
    
    debug('Étape 1: Récupération des séquences publiées', 'import-invoice', 'createRelancesFromImpayes');
    // 1. Récupérer toutes les séquences publiées
    const Sequence = Parse.Object.extend('Sequence');
    const sequenceQuery = new Parse.Query(Sequence);
    sequenceQuery.equalTo('publiee', true);
    const sequences = await sequenceQuery.find({ useMasterKey: true });
    
    info(`Trouvé ${sequences.length} séquences publiées`, 'import-invoice', 'createRelancesFromImpayes', { count: sequences.length });
    
    // 2. Pour chaque séquence
    for (const sequence of sequences) {
      debug(`Traitement séquence: ${sequence.id} - ${sequence.get('nom')}`, 'import-invoice', 'createRelancesFromImpayes', { sequenceId: sequence.id, nom: sequence.get('nom') });
      
      const emails = sequence.get('emails') || [];
      const validationObligatoire = sequence.get('validation_obligatoire') || false;
      
      debug('Étape 2: Récupération des impayés non soldés pour cette séquence', 'import-invoice', 'createRelancesFromImpayes', { sequenceId: sequence.id });
      // 3. Récupérer les impayés non soldés pour cette séquence
      const Impaye = Parse.Object.extend('Impaye');
      const impayeQuery = new Parse.Query(Impaye);
      impayeQuery.equalTo('sequence', sequence);
      impayeQuery.equalTo('facture_soldee', false);
      impayeQuery.include(['contact_relance']);
      impayeQuery.limit(9999);
      
      const impayes = await impayeQuery.find({ useMasterKey: true });
      info(`→ ${impayes.length} impayés non soldés trouvés`, 'import-invoice', 'createRelancesFromImpayes', { count: impayes.length, sequenceId: sequence.id });
      
      if (impayes.length === 0) {
        info(`⏭️ Aucune impayé à traiter pour cette séquence`, 'import-invoice', 'createRelancesFromImpayes', { sequenceId: sequence.id });
        continue;
      }
      
      // 4. Filtrer les impayés : email existe, non vide, non blacklisté
      debug('Étape 4: Filtrage des impayés valides', 'import-invoice', 'createRelancesFromImpayes', { sequenceId: sequence.id });
      const validImpayes = impayes.filter(impaye => {
        const contact = impaye.get('contact_relance');
        if (!contact) return false;
        const email = contact.get('email');
        const isBlacklisted = contact.get('isBlacklisted') || false;
        return email && email.trim() !== '' && !isBlacklisted;
      });
      
      info(`✓ ${validImpayes.length} impayés valides après filtrage`, 'import-invoice', 'createRelancesFromImpayes', { count: validImpayes.length, sequenceId: sequence.id });
      
      // 5. Regrouper les impayés par payeur
      debug('Étape 5: Regroupement des impayés par payeur', 'import-invoice', 'createRelancesFromImpayes', { sequenceId: sequence.id });
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
      
      info(`👥 ${Object.keys(impayesByPayeur).length} payeurs uniques identifiés`, 'import-invoice', 'createRelancesFromImpayes', { 
        payeursCount: Object.keys(impayesByPayeur).length, 
        sequenceId: sequence.id 
      });
      
      // 6. Traiter chaque groupe payeur+impayés
      debug('Étape 6: Traitement de chaque groupe payeur+impayés', 'import-invoice', 'createRelancesFromImpayes', { sequenceId: sequence.id });
      for (const [payeurId, group] of Object.entries(impayesByPayeur)) {
        const { payeur, impayes: groupImpayes } = group;
        const impayeIds = groupImpayes.map(i => i.id);
        const scenarioFormat = groupImpayes.length > 1 ? 'multiple' : 'single';
        
        debug(`Traitement groupe payeur ${payeurId}`, 'import-invoice', 'createRelancesFromImpayes', { payeurId, impayesCount: groupImpayes.length, scenarioFormat });
        // Trouver le bon email/scénarios pour ce format
        const matchingEmails = emails.filter(e => 
          e.scenarios && e.scenarios.some(s => s.format === scenarioFormat)
        );
        
        if (matchingEmails.length === 0) {
          warn(`Aucun scénario "${scenarioFormat}" trouvé, skip payeur ${payeurId}`, 'import-invoice', 'createRelancesFromImpayes', { payeurId, scenarioFormat });
          totalSkipped++;
          continue;
        }
        
        const emailConfig = matchingEmails[0];
        const scenario = emailConfig.scenarios.find(s => s.format === scenarioFormat);
        
        if (!scenario) {
          warn(`Scénario introuvable, skip payeur ${payeurId}`, 'import-invoice', 'createRelancesFromImpayes', { payeurId });
          totalSkipped++;
          continue;
        }
        
        debug(`Traitement payeur ${payeurId}: ${groupImpayes.length} impayé(s), scénario: ${scenarioFormat}`, 'import-invoice', 'createRelancesFromImpayes', { payeurId, count: groupImpayes.length, scenarioFormat });
        
        debug('Étape 7: Vérification des relances existantes pour ce payeur', 'import-invoice', 'createRelancesFromImpayes', { payeurId });
        // 7. Vérifier si une relance existe déjà pour ce payeur SANS dateEnvoi
        const Relance = Parse.Object.extend('Relance');
        const existingRelanceQuery = new Parse.Query(Relance);
        existingRelanceQuery.equalTo('contact', payeur);
        existingRelanceQuery.doesNotExist('dateEnvoi');
        const existingRelances = await existingRelanceQuery.find({ useMasterKey: true });
        
        if (existingRelances.length > 0) {
          debug(`Relance existante trouvée pour payeur ${payeurId}`, 'import-invoice', 'createRelancesFromImpayes', { payeurId, existingRelanceId: existingRelances[0].id });
          const existingRelance = existingRelances[0];
          const currentImpayeIds = existingRelance.get('impayes') || [];
          const newImpayeIds = impayeIds.filter(id => !currentImpayeIds.includes(id));
          
          if (newImpayeIds.length > 0) {
            debug('Vérification de tous les impayés existants pour ce contact', 'import-invoice', 'createRelancesFromImpayes', { payeurId });
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
              info(`⏭️ Tous les impayés existent déjà, skip`, 'import-invoice', 'createRelancesFromImpayes', { payeurId });
              totalSkipped++;
              continue;
            }
            
            debug(`Mise à jour de la relance ${existingRelance.id}`, 'import-invoice', 'createRelancesFromImpayes', { relanceId: existingRelance.id, impayesToAdd: impayesToAdd.length });
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
            info(`✅ Relance ${existingRelance.id} mise à jour`, 'import-invoice', 'createRelancesFromImpayes', { relanceId: existingRelance.id });
            totalRelancesUpdated++;
          } else {
            info(`⏭️ Aucun nouvel impayé à ajouter, skip`, 'import-invoice', 'createRelancesFromImpayes', { payeurId });
            totalSkipped++;
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
          info(`✅ Nouvelle relance créée: ${newRelance.id}`, 'import-invoice', 'createRelancesFromImpayes', { relanceId: newRelance.id });
          totalRelancesCreated++;
        }
      }
    }
    
    info(`Résumé: ${totalRelancesCreated} créées, ${totalRelancesUpdated} mises à jour, ${totalSkipped} ignorées`, 'import-invoice', 'createRelancesFromImpayes', { 
      created: totalRelancesCreated, 
      updated: totalRelancesUpdated, 
      skipped: totalSkipped 
    });
    return { created: totalRelancesCreated, updated: totalRelancesUpdated, skipped: totalSkipped };
    
  } catch (error) {
    error(`Erreur: ${error.message}`, 'import-invoice', 'createRelancesFromImpayes', { error: error.message, stack: error.stack?.substring(0, 500) });
    throw error;
  }
};

module.exports = createRelancesFromImpayes;

if (require.main === module) {
  createRelancesFromImpayes()
    .then(result => {
      info('Création des relances terminée', 'import-invoice', 'createRelancesFromImpayes', { result });
      process.exit(0);
    })
    .catch(error => {
      error(`Erreur: ${error.message}`, 'import-invoice', 'createRelancesFromImpayes', { error: error.message, stack: error.stack?.substring(0, 500) });
      process.exit(1);
    });
}
