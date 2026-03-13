// backend/cloud/jobs/verifyPaidInvoices.js
// Vérifie les factures marquées comme payées dans la DB externe et met à jour Parse
// Retourne { updated, errors, skipped }

const { Pool } = require('pg');

// ─── Requête SQL validée ────────────────────────────────────────────────────
const PAID_INVOICES_QUERY = `
  SELECT p."nfacture", p."facturesoldee", p."resteapayer"
  FROM "public"."(GCO) GcoPiece" p
  WHERE p."facturesoldee" = TRUE
    AND p."resteapayer" = 0
    AND p."nfacture" IN (
      SELECT i."externe_id"
      FROM "Impaye" i
      WHERE i."facture_soldee" = FALSE
    )
`;

// ─── verifyPaidInvoices ──────────────────────────────────────────────────────
async function verifyPaidInvoices({ trigger = 'cron' } = {}) {
  const startedAt = new Date();
  const stats = {
    updated: 0,
    errors: [],
    skipped: 0,
    invoiceNumbers: []
  };

  const pool = new Pool({
    connectionString: process.env.EXTERNAL_DB_URI,
    connectionTimeoutMillis: 10000,
  });

  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query(PAID_INVOICES_QUERY);

    console.log(`[verifyPaidInvoices] Trouvé ${rows.length} facture(s) payée(s) à vérifier`);

    for (const row of rows) {
      try {
        stats.invoiceNumbers.push(row.nfacture);

        // Vérifier que la facture existe bien dans Parse comme impayée
        const Impaye = Parse.Object.extend('Impaye');
        const qi = new Parse.Query(Impaye);
        qi.equalTo('externe_id', row.nfacture);
        qi.equalTo('facture_soldee', false);
        
        const impaye = await qi.first({ useMasterKey: true });

        if (!impaye) {
          console.log(`[verifyPaidInvoices] Facture ${row.nfacture} introuvable ou déjà marquée comme payée`);
          stats.skipped++;
          continue;
        }

        // Mettre à jour le statut
        impaye.set('facture_soldee', true);
        await impaye.save(null, { useMasterKey: true });
        
        stats.updated++;
        console.log(`[verifyPaidInvoices] ✓ Facture ${row.nfacture} marquée comme payée`);

        // Log individuel pour cette facture payée
        try {
          const activite = new Parse.Object('Activite');
          activite.set('type', 'verification_paiement');
          activite.set('operation', 'paid');
          activite.set('nfacture', row.nfacture);
          activite.set('impaye_id', impaye.id);
          activite.set('montant', row.resteapayer != null ? Number(row.resteapayer) : null);
          activite.set('trigger', trigger);
          activite.set('timestamp', new Date());
          await activite.save(null, { useMasterKey: true });
        } catch (logErr) {
          console.error(`[verifyPaidInvoices] Erreur log activite pour ${row.nfacture}:`, logErr.message);
        }

      } catch (err) {
        console.error(`[verifyPaidInvoices] Erreur facture ${row.nfacture}:`, err.message);
        stats.errors.push({
          nfacture: row.nfacture,
          error: err.message,
          externalStatus: row.facturesoldee,
          externalRemaining: row.resteapayer
        });

        // Log individuel pour l'erreur
        try {
          const activite = new Parse.Object('Activite');
          activite.set('type', 'verification_paiement');
          activite.set('operation', 'error');
          activite.set('nfacture', row.nfacture);
          activite.set('error_message', err.message);
          activite.set('trigger', trigger);
          activite.set('timestamp', new Date());
          await activite.save(null, { useMasterKey: true });
        } catch (logErr) {
          console.error(`[verifyPaidInvoices] Erreur log activite erreur pour ${row.nfacture}:`, logErr.message);
        }
      }
    }

    console.log(`[verifyPaidInvoices] Terminé — ${stats.updated} mis à jour, ${stats.skipped} ignorés, ${stats.errors.length} erreurs`);

  } catch (err) {
    console.error('[verifyPaidInvoices] Erreur connexion PostgreSQL:', err.message);
    stats.errors.push({ error: err.message });
  } finally {
    if (client) client.release();
    await pool.end();

    // Persistance du log d'exécution
    try {
      const finishedAt = new Date();
      const log = new Parse.Object('VerificationLog');
      log.set('startedAt', startedAt);
      log.set('finishedAt', finishedAt);
      log.set('durationMs', finishedAt - startedAt);
      log.set('trigger', trigger);
      log.set('status', stats.errors.length === 0 ? 'success' : (stats.updated > 0 ? 'partial' : 'error'));
      log.set('invoices_updated', stats.updated);
      log.set('invoices_skipped', stats.skipped);
      log.set('invoice_numbers', stats.invoiceNumbers);
      log.set('errors', stats.errors.map(e => JSON.stringify(e)));
      await log.save(null, { useMasterKey: true });
    } catch (logErr) {
      console.error('[verifyPaidInvoices] Impossible d\'écrire le VerificationLog:', logErr.message);
    }
  }

  return stats;
}

module.exports = verifyPaidInvoices;