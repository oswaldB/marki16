// backend/cloud/relances/jobs/import-invoices/03-fetchImpayesWithSequence.js
// Récupère les impayés qui ont une séquence attribuée (avec ou sans relance)
// Étape 3/5 : Script autonome - récupère lui-même les données depuis Parse Server

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
 * Récupère tous les impayés qui ont une séquence attribuée, avec ou sans relance
 * @returns {Promise<Object>} { sansRelance: Array, avecRelance: Array }
 */
async function fetchImpayesWithSequence() {
  const Impaye = Parse.Object.extend('Impaye');
  const Relance = Parse.Object.extend('Relance');
  
  const startedAt = new Date();
  const stats = {
    total: 0,
    avecSequenceValide: 0,
    avecRelance: 0,
    sansRelance: 0
  };
  
  info('Début de la récupération des impayés avec séquence', 'import-invoice', 'fetchImpayesWithSequence');
  debug('Initialisation des statistiques', 'import-invoice', 'fetchImpayesWithSequence', { stats });

  try {
    debug('Étape 1: Trouver tous les impayés non soldés avec reste à payer > 0', 'import-invoice', 'fetchImpayesWithSequence');
    // 1. Trouver tous les impayés non soldés avec reste à payer > 0
    const impayeQuery = new Parse.Query(Impaye);
    impayeQuery.equalTo('facture_soldee', false);
    impayeQuery.greaterThan('reste_a_payer', 0);
    impayeQuery.include('sequence');
    impayeQuery.include('contact_relance');
    impayeQuery.limit(999999);
    
    const impayesAvecSequence = await impayeQuery.find({ useMasterKey: true });
    stats.total = impayesAvecSequence.length;
    info(`${impayesAvecSequence.length} impayés total récupérés`, 'import-invoice', 'fetchImpayesWithSequence', { total: impayesAvecSequence.length });
    
    debug('Étape 2: Filtrer les impayés avec sequence valide', 'import-invoice', 'fetchImpayesWithSequence');
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
    
    debug('Étape 3: Trouver tous les impayés qui ont déjà une relance', 'import-invoice', 'fetchImpayesWithSequence');
    // 3. Trouver tous les impayés qui ont déjà une relance
    const relanceQuery = new Parse.Query(Relance);
    relanceQuery.exists('impaye');
    relanceQuery.limit(999999);
    const relances = await relanceQuery.find({ useMasterKey: true });
    info(`Trouvé ${relances.length} relances`, 'import-invoice', 'fetchImpayesWithSequence', { relancesCount: relances.length });
    
    debug('Étape 4: Extraire les IDs des impayés avec relance', 'import-invoice', 'fetchImpayesWithSequence');
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
    
    debug('Étape 5: Séparer les impayés en deux groupes', 'import-invoice', 'fetchImpayesWithSequence');
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
    
    // Persistance du log d'exécution dans Parse
    debug('Écriture du log dans Parse (FetchImpayesLog)', 'import-invoice', 'fetchImpayesWithSequence');
    try {
      if (process.env.NODE_ENV !== 'test') {
        const finishedAt = new Date();
        const log = new Parse.Object('FetchImpayesLog');
        log.set('startedAt', startedAt);
        log.set('finishedAt', finishedAt);
        log.set('durationMs', finishedAt - startedAt);
        log.set('status', 'success');
        log.set('total_impayes', stats.total);
        log.set('avec_sequence_valide', stats.avecSequenceValide);
        log.set('sans_relance', stats.sansRelance);
        log.set('avec_relance', stats.avecRelance);
        await log.save(null, { useMasterKey: true });
        info('Log Parse sauvegardé avec succès', 'import-invoice', 'fetchImpayesWithSequence');
      }
    } catch (logErr) {
      error(`Impossible d'écrire le log: ${logErr.message}`, 'import-invoice', 'fetchImpayesWithSequence', { error: logErr.message, stack: logErr.stack?.substring(0, 500) });
    }
    
    return { sansRelance: impayesSansRelance, avecRelance: impayesAvecRelance, stats };
    
  } catch (error) {
    error(`Erreur: ${error.message}`, 'import-invoice', 'fetchImpayesWithSequence', { error: error.message, stack: error.stack?.substring(0, 500) });
    stats.erreur = error.message;
    stats.stack = error.stack;
    return { sansRelance: [], avecRelance: [], stats };
  }
}

module.exports = fetchImpayesWithSequence;

// Exécution directe si appelé en CLI
if (require.main === module) {
  fetchImpayesWithSequence()
    .then(({ sansRelance, avecRelance, stats }) => {
      info('Récupération terminée', 'import-invoice', 'fetchImpayesWithSequence', { 
        sansRelance: sansRelance.length, 
        avecRelance: avecRelance.length, 
        ...stats 
      });
      process.exit(0);
    })
    .catch((error) => {
      error(`Erreur: ${error.message}`, 'import-invoice', 'fetchImpayesWithSequence', { error: error.message, stack: error.stack?.substring(0, 500) });
      process.exit(1);
    });
}
