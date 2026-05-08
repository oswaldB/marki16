// backend/cloud/workflows/import-invoice/07-fetchImpayesWithSequence.js
// Étape 7 : Récupère les impayés qui ont une séquence attribuée (avec ou sans relance)
// Input: { state }
// Output: { sansRelance: [], avecRelance: [], stats, state }

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
 * Étape 7 : Récupère les impayés avec séquence attribuée
 * @param {Object} param0 - { state }
 * @returns {Promise<Object>} { sansRelance: [], avecRelance: [], stats, state }
 */
async function fetchImpayesWithSequence({ state }) {
  const stats = {
    total: 0,
    avecSequenceValide: 0,
    avecRelance: 0,
    sansRelance: 0
  };

  info('Étape 7: Début de la récupération des impayés avec séquence', 'import-invoice', 'fetchImpayesWithSequence');

  try {
    debug('Étape 7.1: Trouver tous les impayés non soldés avec reste à payer > 0', 'import-invoice', 'fetchImpayesWithSequence');
    // 1. Trouver tous les impayés non soldés avec reste à payer > 0
    const Impaye = Parse.Object.extend('Impaye');
    const Relance = Parse.Object.extend('Relance');
    
    const impayeQuery = new Parse.Query(Impaye);
    impayeQuery.equalTo('facture_soldee', false);
    impayeQuery.greaterThan('reste_a_payer', 0);
    impayeQuery.include('sequence');
    impayeQuery.include('contact_relance');
    impayeQuery.limit(999999);
    
    const impayesAvecSequence = await impayeQuery.find({ useMasterKey: true });
    stats.total = impayesAvecSequence.length;
    info(`${impayesAvecSequence.length} impayés total récupérés`, 'import-invoice', 'fetchImpayesWithSequence', { total: impayesAvecSequence.length });

    debug('Étape 7.2: Filtrer les impayés avec sequence valide', 'import-invoice', 'fetchImpayesWithSequence');
    // 2. Filtrer manuellement pour ne garder que ceux avec sequence valide (non null, non undefined)
    const impayesAvecSequenceFiltres = impayesAvecSequence.filter(imp => {
      const seq = imp.get('sequence');
      return seq !== null && seq !== undefined;
    });

    stats.avecSequenceValide = impayesAvecSequenceFiltres.length;
    info(`${impayesAvecSequence.length} impayés total, ${impayesAvecSequenceFiltres.length} avec séquence valide`, 'import-invoice', 'fetchImpayesWithSequence', { 
      total: impayesAvecSequence.length, 
      avecSequenceValide: impayesAvecSequenceFiltres.length 
    });

    debug('Étape 7.3: Trouver tous les impayés qui ont déjà une relance', 'import-invoice', 'fetchImpayesWithSequence');
    // 3. Trouver tous les impayés qui ont déjà une relance
    const relanceQuery = new Parse.Query(Relance);
    relanceQuery.exists('impaye');
    relanceQuery.limit(999999);
    const relances = await relanceQuery.find({ useMasterKey: true });
    info(`Trouvé ${relances.length} relances`, 'import-invoice', 'fetchImpayesWithSequence', { relancesCount: relances.length });

    debug('Étape 7.4: Extraire les IDs des impayés avec relance', 'import-invoice', 'fetchImpayesWithSequence');
    // 4. Extraire les IDs des impayés qui ont déjà une relance et mapper impayeId -> relance
    const impayesAvecRelanceMap = new Map();
    for (const relance of relances) {
      const impaye = relance.get('impaye');
      if (impaye) {
        impayesAvecRelanceMap.set(impaye.id, relance);
      }
      // Vérifier aussi le tableau impayes
      const impayesArray = relance.get('impayes');
      if (impayesArray && Array.isArray(impayesArray)) {
        for (const impayeId of impayesArray) {
          if (!impayesAvecRelanceMap.has(impayeId)) {
            impayesAvecRelanceMap.set(impayeId, relance);
          }
        }
      }
    }

    debug('Étape 7.5: Séparer les impayés en deux groupes', 'import-invoice', 'fetchImpayesWithSequence');
    // 5. Séparer les impayés en deux groupes
    const impayesSansRelance = [];
    const impayesAvecRelance = [];
    
    for (const impaye of impayesAvecSequenceFiltres) {
      if (impayesAvecRelanceMap.has(impaye.id)) {
        impayesAvecRelance.push({
          impaye,
          relance: impayesAvecRelanceMap.get(impaye.id)
        });
      } else {
        impayesSansRelance.push(impaye);
      }
    }
    
    stats.sansRelance = impayesSansRelance.length;
    stats.avecRelance = impayesAvecRelance.length;

    info(`${impayesSansRelance.length} sans relance, ${impayesAvecRelance.length} avec relance`, 'import-invoice', 'fetchImpayesWithSequence', { 
      sansRelance: impayesSansRelance.length, 
      avecRelance: impayesAvecRelance.length 
    });

    // Log des impayés sans séquence valide (pour débogage)
    const sansSequenceValide = impayesAvecSequence.length - impayesAvecSequenceFiltres.length;
    if (sansSequenceValide > 0) {
      warn(`${sansSequenceValide} impayés avec sequence=null/undefined (non traités)`, 'import-invoice', 'fetchImpayesWithSequence', { count: sansSequenceValide });
    }

    const newState = {
      ...state,
      currentStep: '08-createRelances',
      steps: {
        ...state.steps,
        '07-fetchImpayesWithSequence': {
          status: 'completed',
          total: stats.total,
          avec_sequence_valide: stats.avecSequenceValide,
          sans_relance: stats.sansRelance,
          avec_relance: stats.avecRelance,
          completedAt: new Date().toISOString()
        }
      },
      updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));

    return {
      sansRelance: impayesSansRelance,
      avecRelance: impayesAvecRelance,
      stats,
      state: newState
    };

  } catch (err) {
    error(`Erreur Étape 7: ${err.message}`, 'import-invoice', 'fetchImpayesWithSequence', { error: err.message, stack: err.stack?.substring(0, 500) });
    throw err;
  }
}

module.exports = fetchImpayesWithSequence;
