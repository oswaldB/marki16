// backend/cloud/workflows/send-emails/00-master.js
// Orchestre l'envoi des relances par email

// Charger les variables d'environnement depuis .env
require('dotenv').config({ path: '/home/ubuntu/prod/adti/.env' });

const { writeLog } = require('../../utils/logger');
const envoyerRelances = require('./01-envoyerRelances');

/**
 * Orchestre l'envoi des relances
 * @param {Object} options - Options de configuration
 * @returns {Promise<Object>} Statistiques
 */
async function sendEmailsMaster(options = {}) {
  const startedAt = new Date();
  console.log(`[send-emails/master] Début du processus d'envoi des relances`);
  writeLog(`INFO: Début du processus (trigger: ${options.trigger || 'manual'})`);

  const stats = {
    result: null,
    errors: [],
    total: {
      startedAt,
      finishedAt: null,
      durationMs: 0
    }
  };

  try {
    console.log('[send-emails/master] Étape 1/1: Envoi des relances...');
    stats.result = await envoyerRelances(options);
    console.log(`[send-emails/master] Envoi terminé: ${stats.result?.relancesEnvoyees ?? 0} relances envoyées, ${stats.result?.relancesErreurs ?? 0} erreurs`);
  } catch (error) {
    console.error('[send-emails/master] Erreur:', error.message);
    stats.result = { relancesEnvoyees: 0, relancesErreurs: 0, erreurs: [error.message] };
    stats.errors.push({ step: 1, script: '01-envoyerRelances', error: error.message });
  }

  const finishedAt = new Date();
  stats.total.finishedAt = finishedAt;
  stats.total.durationMs = finishedAt - startedAt;

  console.log(`[send-emails/master] Durée totale: ${(finishedAt - startedAt) / 1000} secondes`);
  writeLog(`SUCCESS: Processus terminé (${finishedAt - startedAt}ms) - ${stats.result?.relancesEnvoyees || 0} relances envoyées`);

  // Persistance du log d'exécution global
  try {
    if (process.env.NODE_ENV !== 'test') {
      const log = new Parse.Object('SendEmailsMasterLog');
      log.set('startedAt', startedAt);
      log.set('finishedAt', finishedAt);
      log.set('durationMs', finishedAt - startedAt);
      log.set('trigger', options.trigger || 'manual');
      log.set('status', stats.errors.length === 0 ? 'success' : 'error');
      log.set('stats', stats.result);
      log.set('errors', stats.errors.map(e => JSON.stringify(e)));
      await log.save(null, { useMasterKey: true });
    }
  } catch (logErr) {
    console.error('[send-emails/master] Impossible d\'écrire le SendEmailsMasterLog:', logErr.message);
  }

  return stats;
}

module.exports = sendEmailsMaster;

// Exécution directe si appelé en CLI
if (require.main === module) {
  sendEmailsMaster()
    .then((stats) => {
      console.log('Processus send-emails terminé:', JSON.stringify(stats, null, 2));
      process.exit(stats.errors.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Erreur dans send-emails/master:', error);
      process.exit(1);
    });
}
