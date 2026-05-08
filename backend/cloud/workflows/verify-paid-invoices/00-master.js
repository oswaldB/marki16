// backend/cloud/workflows/verify-paid-invoices/00-master.js
// Orchestre la vérification des factures payées

// Charger les variables d'environnement depuis .env
require('dotenv').config({ path: '/home/ubuntu/prod/adti/.env' });

const { writeLog } = require('../../utils/logger');
const verifyPaidInvoices = require('./01-verifyPaidInvoices');

/**
 * Orchestre la vérification des factures payées
 * @param {Object} options - Options de configuration
 * @returns {Promise<Object>} Statistiques
 */
async function verifyPaidInvoicesMaster(options = {}) {
  const startedAt = new Date();
  console.log(`[verify-paid-invoices/master] Début du processus de vérification des factures payées`);
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
    console.log('[verify-paid-invoices/master] Étape 1/1: Vérification des factures payées...');
    stats.result = await verifyPaidInvoices(options);
    console.log(`[verify-paid-invoices/master] Vérification terminée: ${stats.result?.updated ?? 0} factures mises à jour, ${stats.result?.skipped ?? 0} ignorées`);
  } catch (error) {
    console.error('[verify-paid-invoices/master] Erreur:', error.message);
    stats.result = { updated: 0, skipped: 0, errors: [error.message] };
    stats.errors.push({ step: 1, script: '01-verifyPaidInvoices', error: error.message });
  }

  const finishedAt = new Date();
  stats.total.finishedAt = finishedAt;
  stats.total.durationMs = finishedAt - startedAt;

  console.log(`[verify-paid-invoices/master] Durée totale: ${(finishedAt - startedAt) / 1000} secondes`);
  writeLog(`SUCCESS: Processus terminé (${finishedAt - startedAt}ms) - ${stats.result?.updated || 0} factures mises à jour`);

  // Persistance du log d'exécution global
  try {
    if (process.env.NODE_ENV !== 'test') {
      const log = new Parse.Object('VerifyPaidInvoicesMasterLog');
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
    console.error('[verify-paid-invoices/master] Impossible d\'écrire le VerifyPaidInvoicesMasterLog:', logErr.message);
  }

  return stats;
}

module.exports = verifyPaidInvoicesMaster;

// Exécution directe si appelé en CLI
if (require.main === module) {
  verifyPaidInvoicesMaster()
    .then((stats) => {
      console.log('Processus verify-paid-invoices terminé:', JSON.stringify(stats, null, 2));
      process.exit(stats.errors.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Erreur dans verify-paid-invoices/master:', error);
      process.exit(1);
    });
}
