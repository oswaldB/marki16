// backend/cloud/jobs/verifyPaidInvoices.js
// Vérifie les factures marquées comme payées dans la DB externe et met à jour Parse
// Retourne { updated, errors, skipped }

// Charger les variables d'environnement si ce n'est pas déjà fait
if (!process.env.EXTERNAL_DB_URI) {
  require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
}

const { Pool } = require('pg');

// Initialiser Parse si ce n'est pas déjà fait
let Parse;
if (typeof Parse === 'undefined') {
  Parse = require('parse/node');
  Parse.initialize(
    process.env.PARSE_APP_ID || 'marki15-app-id',
    process.env.PARSE_JAVASCRIPT_KEY || ''
  );
  Parse.serverURL = process.env.PARSE_SERVER_URL || 'http://127.0.0.1:1555/parse';
  Parse.masterKey = process.env.PARSE_MASTER_KEY || 'marki15-master-key';
}

// ─── Requête SQL validée ────────────────────────────────────────────────────
const PAID_INVOICES_QUERY = (invoiceIds) => {
  if (invoiceIds.length === 0) return 'SELECT 1 WHERE FALSE';
  return `
    SELECT p."nfacture", p."facturesoldee", p."resteapayer"
    FROM "public"."(GCO) GcoPiece" p
    WHERE p."facturesoldee" = TRUE
      AND p."resteapayer" = 0
      AND p."nfacture" IN (${invoiceIds.join(',')})
  `;
};

// ─── verifyPaidInvoices ──────────────────────────────────────────────────────
async function verifyPaidInvoices({ trigger = 'cron' } = {}) {
  const startedAt = new Date();
  const stats = {
    updated: 0,
    errors: [],
    skipped: 0,
    invoiceNumbers: []
  };

  // Étape 1: Récupérer les factures impayées depuis Parse
  const Impaye = Parse.Object.extend('Impaye');
  const qi = new Parse.Query(Impaye);
  qi.equalTo('facture_soldee', false);
  qi.limit(10000); // Limite raisonnable
  
  const impayes = await qi.find({ useMasterKey: true });
  const unpaidInvoiceIds = impayes.map(i => i.get('externe_id')).filter(id => id !== undefined);
  
  if (unpaidInvoiceIds.length === 0) {
    console.log('[verifyPaidInvoices] Aucune facture impayée trouvée dans Parse');
    return stats;
  }
  
  console.log(`[verifyPaidInvoices] Trouvé ${unpaidInvoiceIds.length} factures impayées dans Parse`);

  const pool = new Pool({
    connectionString: process.env.EXTERNAL_DB_URI,
    connectionTimeoutMillis: 10000,
  });

  let client;
  try {
    client = await pool.connect();
    // Étape 2: Chercher les factures payées dans PostgreSQL qui sont dans la liste des impayées de Parse
    const query = PAID_INVOICES_QUERY(unpaidInvoiceIds);
    const { rows } = await client.query(query);

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

        // Mettre à jour le statut dans Parse
        impaye.set('facture_soldee', true);
        impaye.set('solde', true);
        impaye.set('solde_le', new Date());
        await impaye.save(null, { useMasterKey: true });
        
        stats.updated++;
        console.log(`[verifyPaidInvoices] ✓ Facture ${row.nfacture} marquée comme payée (Parse)`);

        // Créer une activité pour le paiement
        try {
          const activite = new Parse.Object('Activite');
          activite.set('type', 'paiement');
          activite.set('operation', 'payment_received');
          activite.set('nfacture', row.nfacture);
          activite.set('impaye_id', impaye.id);
          activite.set('montant', row.resteapayer != null ? Number(row.resteapayer) : 0);
          activite.set('date_paiement', new Date());
          activite.set('trigger', trigger);
          activite.set('timestamp', new Date());
          activite.set('description', `Paiement reçu pour la facture ${row.nfacture}`);
          await activite.save(null, { useMasterKey: true });
          console.log(`[verifyPaidInvoices] ✓ Activité de paiement créée pour la facture ${row.nfacture}`);
        } catch (logErr) {
          console.error(`[verifyPaidInvoices] Erreur création activité de paiement pour ${row.nfacture}:`, logErr.message);
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

    // Nettoyer les relances pour les factures nouvellement payées
    if (stats.updated > 0) {
      try {
        const cleanupRelances = require('./cleanupPaidInvoicesRelances');
        const cleanupStats = await cleanupRelances({ trigger: trigger });
        console.log(`[verifyPaidInvoices] Nettoyage relances terminé — ${cleanupStats.deletedRelances} relances supprimées`);
      } catch (cleanupErr) {
        console.error('[verifyPaidInvoices] Erreur nettoyage relances:', cleanupErr.message);
      }
    }

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