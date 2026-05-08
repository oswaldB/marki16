// cloud/relances/jobs/import-invoices/02-assignSequencesAutomatically.js
// Attribue automatiquement des séquences aux impayés selon les règles définies
// Script autonome : récupère lui-même les impayés sans séquence et leur attribue

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

const {
  appliquerReglesAttributionAutomatique,
} = require("../../workflows/appliquer-regles-attribution/01-appliquerReglesAttributionAutomatique");

/**
 * Attribue automatiquement des séquences aux impayés et crée les relances
 * @param {Object} options - Options de configuration
 * @param {boolean} options.dryRun - Mode simulation (ne sauvegarde pas)
 * @returns {Promise<Object>} Statistiques d'exécution
 */
async function assignSequencesAutomatically({ dryRun = false } = {}) {
  const startedAt = new Date();
  const stats = {
    impayesTraites: 0,
    sequencesAttribuees: 0,
    relancesCrees: 0,
    erreurs: [],
  };
  info("Début de l'attribution des séquences", 'import-invoice', 'assignSequencesAutomatically', { dryRun });
  debug('Initialisation des statistiques', 'import-invoice', 'assignSequencesAutomatically', { stats });

  try {
    debug('Étape 1: Récupération des impayés sans séquence', 'import-invoice', 'assignSequencesAutomatically');
    // 1. Récupérer tous les impayés sans séquence attribuée, non soldés
    const Impaye = Parse.Object.extend("Impaye");
    const query = new Parse.Query(Impaye);
    query.doesNotExist("sequence");
    query.equalTo("facture_soldee", false);
    query.greaterThan("reste_a_payer", 0);
    query.include('contact_relance');
    query.limit(999999);

    const impayes = await query.find({ useMasterKey: true });
    info(`${impayes.length} impayés à traiter (sans séquence)`, 'import-invoice', 'assignSequencesAutomatically', { count: impayes.length });

    // 2. Traiter chaque impayé
    debug('Étape 2: Traitement de chaque impayé', 'import-invoice', 'assignSequencesAutomatically');
    for (const impaye of impayes) {
      try {
        stats.impayesTraites++;
        debug(`Traitement impayé ${impaye.id} (${impaye.get("nfacture")})`, 'import-invoice', 'assignSequencesAutomatically', { impayeId: impaye.id, nfacture: impaye.get("nfacture") });

        // 3. Appliquer les règles d'attribution automatique
        debug('Appel de appliquerReglesAttributionAutomatique', 'import-invoice', 'assignSequencesAutomatically');
        const sequence = await appliquerReglesAttributionAutomatique(impaye);

        if (sequence) {
          stats.sequencesAttribuees++;
          info(`Séquence attribuée: ${sequence.id}`, 'import-invoice', 'assignSequencesAutomatically', { sequenceId: sequence.id });

          // 4. Sauvegarder l'impayé avec la séquence attribuée
          if (!dryRun) {
            debug('Sauvegarde de limpayé avec la séquence', 'import-invoice', 'assignSequencesAutomatically', { impayeId: impaye.id });
            impaye.set('sequence', sequence);
            await impaye.save(null, { useMasterKey: true });
            info(`Séquence sauvegardée pour ${impaye.id}`, 'import-invoice', 'assignSequencesAutomatically', { impayeId: impaye.id });
          } else {
            info('Mode dryRun - séquences non sauvegardées', 'import-invoice', 'assignSequencesAutomatically');
          }
        } else {
          warn(`Aucune séquence applicable pour ${impaye.id} (${impaye.get("nfacture")})`, 'import-invoice', 'assignSequencesAutomatically', { impayeId: impaye.id, nfacture: impaye.get("nfacture") });
          stats.erreurs.push({
            impayeId: impaye.id,
            nfacture: impaye.get("nfacture"),
            erreur: "Aucune séquence applicable"
          });
        }
      } catch (error) {
        error(`Erreur impayé ${impaye.id}: ${error.message}`, 'import-invoice', 'assignSequencesAutomatically', { impayeId: impaye.id, error: error.message, stack: error.stack?.substring(0, 500) });
        stats.erreurs.push({
          impayeId: impaye.id,
          nfacture: impaye.get("nfacture"),
          erreur: error.message,
          stack: error.stack && error.stack.substring(0, 500) // Limiter la taille
        });
      }
    }

    info(`Terminé - ${stats.impayesTraites} traités, ${stats.sequencesAttribuees} séquences attribuées`, 'import-invoice', 'assignSequencesAutomatically', { 
      traites: stats.impayesTraites, 
      attribuées: stats.sequencesAttribuees,
      erreurs: stats.erreurs.length 
    });
  } catch (error) {
    error(`Erreur globale: ${error.message}`, 'import-invoice', 'assignSequencesAutomatically', { error: error.message, stack: error.stack?.substring(0, 500) });
    stats.erreurs.push({
      source: "global",
      erreur: error.message,
      stack: error.stack && error.stack.substring(0, 500)
    });
  } finally {
    // Persistance du log d'exécution dans Parse (désactivé en mode test)
    debug('Écriture du log dans Parse (SequenceAssignmentLog)', 'import-invoice', 'assignSequencesAutomatically');
    try {
      if (process.env.NODE_ENV !== "test") {
        const finishedAt = new Date();
        const log = new Parse.Object("SequenceAssignmentLog");
        log.set("startedAt", startedAt);
        log.set("finishedAt", finishedAt);
        log.set("durationMs", finishedAt - startedAt);
        log.set(
          "status",
          stats.erreurs.length === 0
            ? "success"
            : stats.sequencesAttribuees > 0
              ? "partial"
              : "error",
        );
        log.set("impayes_traites", stats.impayesTraites);
        log.set("sequences_attribuees", stats.sequencesAttribuees);
        log.set("relances_creees", stats.relancesCrees);
        log.set(
          "erreurs",
          stats.erreurs.map((e) => JSON.stringify(e)),
        );
        await log.save(null, { useMasterKey: true });
        info('Log Parse sauvegardé avec succès', 'import-invoice', 'assignSequencesAutomatically');
      }
    } catch (logErr) {
      if (process.env.NODE_ENV !== "test") {
        error(`Impossible d'écrire le SequenceAssignmentLog: ${logErr.message}`, 'import-invoice', 'assignSequencesAutomatically', { error: logErr.message, stack: logErr.stack?.substring(0, 500) });
      }
    }
  }

  return stats;
}

module.exports = assignSequencesAutomatically;

// Exécution directe si appelé en CLI
if (require.main === module) {
  assignSequencesAutomatically()
    .then((stats) => {
      info("Attribution des séquences terminée", 'import-invoice', 'assignSequencesAutomatically', { stats });
      debug('Exit code: ' + (stats.erreurs.length > 0 ? 1 : 0), 'import-invoice', 'assignSequencesAutomatically');
      process.exit(stats.erreurs.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      error(`Erreur lors de l'attribution des séquences: ${error.message}`, 'import-invoice', 'assignSequencesAutomatically', { error: error.message, stack: error.stack?.substring(0, 500) });
      process.exit(1);
    });
}
