// backend/cloud/jobs/cleanupPaidInvoicesRelances.js
// Supprime les relances des factures marquées comme payées
// Retourne { deletedRelances, errors }

module.exports = async function cleanupPaidInvoicesRelances({ trigger = 'cron' } = {}) {
  if (typeof Parse === 'undefined') {
    throw new Error('Parse SDK not initialized. This job must run in a Parse Cloud environment.');
  }

  console.log('[cleanupPaidInvoicesRelances] Début nettoyage des relances pour factures payées...');

  const startedAt = new Date();
  const stats = {
    deletedRelances: 0,
    errors: 0,
    invoiceNumbers: []
  };

  try {
    // 1. Trouver toutes les factures marquées comme payées
    const impayeQuery = new Parse.Query('Impaye');
    impayeQuery.equalTo('facture_soldee', true);
    impayeQuery.select(['externe_id']);
    impayeQuery.limit(10000);

    const impayesPayes = await impayeQuery.find({ useMasterKey: true });
    const paidInvoiceIds = impayesPayes.map(impaye => impaye.get('externe_id')).filter(id => id !== undefined);

    if (paidInvoiceIds.length === 0) {
      console.log('[cleanupPaidInvoicesRelances] Aucune facture payée trouvée');
      return stats;
    }

    console.log(`[cleanupPaidInvoicesRelances] Trouvé ${paidInvoiceIds.length} factures payées`);

    // 2. Trouver toutes les relances pour ces factures qui n'ont pas encore été envoyées
    const relanceQuery = new Parse.Query('Relance');
    relanceQuery.containedIn('impaye_id', paidInvoiceIds);
    relanceQuery.containedIn('statut', ['pending', 'draft']); // Seulement les relances non envoyées
    relanceQuery.select(['impaye_id', 'statut', 'to', 'sequence']);
    relanceQuery.limit(10000);

    const relancesToDelete = await relanceQuery.find({ useMasterKey: true });

    if (relancesToDelete.length === 0) {
      console.log('[cleanupPaidInvoicesRelances] Aucune relance à supprimer trouvée');
      return stats;
    }

    console.log(`[cleanupPaidInvoicesRelances] ${relancesToDelete.length} relances à supprimer pour factures payées`);

    // 3. Supprimer les relances
    for (const relance of relancesToDelete) {
      try {
        const impayeId = relance.get('impaye_id');
        stats.invoiceNumbers.push(impayeId);

        // Supprimer la relance
        await relance.destroy({ useMasterKey: true });
        stats.deletedRelances++;

        console.log(`[cleanupPaidInvoicesRelances] ✓ Relance supprimée pour facture ${impayeId}`);

        // Log individuel pour cette suppression
        try {
          const activite = new Parse.Object('Activite');
          activite.set('type', 'nettoyage_relance');
          activite.set('operation', 'deleted');
          activite.set('nfacture', impayeId);
          activite.set('relance_id', relance.id);
          activite.set('statut_relance', relance.get('statut'));
          activite.set('trigger', trigger);
          activite.set('timestamp', new Date());
          await activite.save(null, { useMasterKey: true });
        } catch (logErr) {
          console.error(`[cleanupPaidInvoicesRelances] Erreur log activite pour ${impayeId}:`, logErr.message);
        }

      } catch (err) {
        console.error(`[cleanupPaidInvoicesRelances] Erreur suppression relance:`, err.message);
        stats.errors++;

        // Log individuel pour l'erreur
        try {
          const activite = new Parse.Object('Activite');
          activite.set('type', 'nettoyage_relance');
          activite.set('operation', 'error');
          activite.set('error_message', err.message);
          activite.set('trigger', trigger);
          activite.set('timestamp', new Date());
          await activite.save(null, { useMasterKey: true });
        } catch (logErr) {
          console.error(`[cleanupPaidInvoicesRelances] Erreur log activite erreur:`, logErr.message);
        }
      }
    }

    console.log(`[cleanupPaidInvoicesRelances] Terminé — ${stats.deletedRelances} relances supprimées, ${stats.errors} erreurs`);

  } catch (err) {
    console.error('[cleanupPaidInvoicesRelances] Erreur:', err.message);
    stats.errors++;
  } finally {
    // Persistance du log d'exécution
    try {
      const finishedAt = new Date();
      const log = new Parse.Object('CleanupLog');
      log.set('startedAt', startedAt);
      log.set('finishedAt', finishedAt);
      log.set('durationMs', finishedAt - startedAt);
      log.set('trigger', trigger);
      log.set('status', stats.errors === 0 ? 'success' : (stats.deletedRelances > 0 ? 'partial' : 'error'));
      log.set('relances_deleted', stats.deletedRelances);
      log.set('invoice_numbers', stats.invoiceNumbers);
      await log.save(null, { useMasterKey: true });
    } catch (logErr) {
      console.error('[cleanupPaidInvoicesRelances] Impossible d\'écrire le CleanupLog:', logErr.message);
    }
  }

  return stats;
};

// Export pour utilisation directe
if (typeof module !== 'undefined' && module.exports) {
  module.exports = cleanupPaidInvoicesRelances;
}