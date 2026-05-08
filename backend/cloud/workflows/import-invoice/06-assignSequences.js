// backend/cloud/workflows/import-invoice/06-assignSequences.js
// Étape 6 : Attribue automatiquement des séquences aux impayés selon les règles définies
// Input: { state }
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
const { appliquerReglesAttributionAutomatique } = require("../../workflows/appliquer-regles-attribution/01-appliquerReglesAttributionAutomatique");

/**
 * Étape 6 : Attribue automatiquement des séquences aux impayés
 * @param {Object} param0 - { state }
 * @returns {Promise<Object>} { stats, state }
 */
async function assignSequences({ state }) {
  const stats = {
    impayesTraites: 0,
    sequencesAttribuees: 0,
    erreurs: [],
  };

  info('Étape 6: Début de l\'attribution des séquences', 'import-invoice', 'assignSequences', { dryRun: false });

  try {
    debug('Étape 6.1: Récupération des impayés sans séquence', 'import-invoice', 'assignSequences');
    // 1. Récupérer tous les impayés sans séquence attribuée, non soldés
    const Impaye = Parse.Object.extend("Impaye");
    const query = new Parse.Query(Impaye);
    query.doesNotExist("sequence");
    query.equalTo("facture_soldee", false);
    query.greaterThan("reste_a_payer", 0);
    query.include('contact_relance');
    query.limit(999999);

    const impayes = await query.find({ useMasterKey: true });
    info(`${impayes.length} impayés à traiter (sans séquence)`, 'import-invoice', 'assignSequences', { count: impayes.length });

    // 2. Traiter chaque impayé
    debug('Étape 6.2: Traitement de chaque impayé', 'import-invoice', 'assignSequences');
    for (const impaye of impayes) {
      try {
        stats.impayesTraites++;
        debug(`Traitement impayé ${impaye.id} (${impaye.get("nfacture")})`, 'import-invoice', 'assignSequences', { impayeId: impaye.id, nfacture: impaye.get("nfacture") });

        // 3. Appliquer les règles d'attribution automatique
        debug('Appel de appliquerReglesAttributionAutomatique', 'import-invoice', 'assignSequences');
        const sequence = await appliquerReglesAttributionAutomatique(impaye);

        if (sequence) {
          stats.sequencesAttribuees++;
          info(`Séquence attribuée: ${sequence.id}`, 'import-invoice', 'assignSequences', { sequenceId: sequence.id });

          // 4. Sauvegarder l'impayé avec la séquence attribuée
          debug('Sauvegarde de l\'impayé avec la séquence', 'import-invoice', 'assignSequences', { impayeId: impaye.id });
          impaye.set('sequence', sequence);
          await impaye.save(null, { useMasterKey: true });
          info(`Séquence sauvegardée pour ${impaye.id}`, 'import-invoice', 'assignSequences', { impayeId: impaye.id });
        } else {
          warn(`Aucune séquence applicable pour ${impaye.id} (${impaye.get("nfacture")})`, 'import-invoice', 'assignSequences', { impayeId: impaye.id, nfacture: impaye.get("nfacture") });
          stats.erreurs.push({
            impayeId: impaye.id,
            nfacture: impaye.get("nfacture"),
            erreur: "Aucune séquence applicable"
          });
        }
      } catch (err) {
        error(`Erreur impayé ${impaye.id}: ${err.message}`, 'import-invoice', 'assignSequences', { impayeId: impaye.id, error: err.message, stack: err.stack?.substring(0, 500) });
        stats.erreurs.push({
          impayeId: impaye.id,
          nfacture: impaye.get("nfacture"),
          erreur: err.message,
          stack: err.stack && err.stack.substring(0, 500)
        });
      }
    }

    info(`Étape 6 terminée - ${stats.impayesTraites} traités, ${stats.sequencesAttribuees} séquences attribuées`, 'import-invoice', 'assignSequences', { 
      traites: stats.impayesTraites, 
      attribuées: stats.sequencesAttribuees,
      erreurs: stats.erreurs.length 
    });

    const newState = {
      ...state,
      currentStep: '07-fetchImpayesWithSequence',
      steps: {
        ...state.steps,
        '06-assignSequences': {
          status: 'completed',
          impayes_traites: stats.impayesTraites,
          sequences_attribuees: stats.sequencesAttribuees,
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
    error(`Erreur Étape 6: ${err.message}`, 'import-invoice', 'assignSequences', { error: err.message, stack: err.stack?.substring(0, 500) });
    throw err;
  }
}

module.exports = assignSequences;
