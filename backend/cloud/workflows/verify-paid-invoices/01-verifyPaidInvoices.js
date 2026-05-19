// backend/cloud/jobs/verifyPaidInvoices.js
// Vérifie les factures marquées comme payées dans la DB externe et met à jour Parse
// Retourne { updated, errors, skipped }

// Charger les variables d'environnement si ce n'est pas déjà fait
if (!process.env.EXTERNAL_DB_URI) {
    require("dotenv").config({
        path: require("path").join(__dirname, "../../../.env"),
    });
}

const Database = require("better-sqlite3");
const { info, warn, error } = require("../../utils/logger");

// Initialiser Parse si ce n'est pas déjà fait
let Parse;
if (typeof Parse === "undefined") {
    Parse = require("parse/node");
    Parse.initialize(
        process.env.PARSE_APP_ID || "marki15-app-id",
        process.env.PARSE_JAVASCRIPT_KEY || "",
    );
    Parse.serverURL =
        process.env.PARSE_SERVER_URL || "http://127.0.0.1:1555/parse";
    Parse.masterKey = process.env.PARSE_MASTER_KEY || "marki15-master-key";
}

// ─── Requête SQL validée ────────────────────────────────────────────────────
const PAID_INVOICES_QUERY = (invoiceIds) => {
    if (invoiceIds.length === 0) return "SELECT 1 WHERE FALSE";
    return `
    SELECT p.nfacture, p.facturesoldee, p.resteapayer
    FROM _GCO__GcoPiece p
    WHERE p.facturesoldee = 1
      AND p.resteapayer = 0
      AND p.nfacture IN (${invoiceIds.join(",")})
  `;
};

// ─── verifyPaidInvoices ──────────────────────────────────────────────────────
async function verifyPaidInvoices({ trigger = "cron" } = {}) {
    const startedAt = new Date();
    const stats = {
        updated: 0,
        errors: [],
        skipped: 0,
        invoiceNumbers: [],
    };

    // Étape 1: Récupérer les factures impayées depuis Parse
    const Impaye = Parse.Object.extend("Impaye");
    const qi = new Parse.Query(Impaye);
    qi.equalTo("facture_soldee", false);
    qi.limit(10000); // Limite raisonnable

    const impayes = await qi.find({ useMasterKey: true });
    const unpaidInvoiceIds = impayes
        .map((i) => i.get("externe_id"))
        .filter((id) => id !== undefined);

    if (unpaidInvoiceIds.length === 0) {
        info(
            "[verifyPaidInvoices] Aucune facture impayée trouvée dans Parse",
            "verify-paid-invoices",
            "verifyPaidInvoices",
        );
        return stats;
    }

    info(
        `[verifyPaidInvoices] Trouvé ${unpaidInvoiceIds.length} factures impayées dans Parse`,
        "verify-paid-invoices",
        "verifyPaidInvoices",
    );

    // En mode test, utiliser la copie locale de la DB
    const dbPath =
        process.env.NODE_ENV === "test" && process.env.TEST_DB_PATH
            ? process.env.TEST_DB_PATH
            : "/home/arthur/adti/sync.db";

    // Fonction utilitaire pour ouvrir la DB SQLite avec retry en cas de corruption
    async function openDatabaseWithRetry(
        path,
        maxRetries = 3,
        retryDelayMs = 60000,
    ) {
        let retries = 0;
        while (retries < maxRetries) {
            try {
                const db = new Database(path);
                db.prepare("SELECT 1").get();
                info(
                    `[verifyPaidInvoices] Connexion DB SQLite réussie (${path})`,
                    "verify-paid-invoices",
                    "openDatabaseWithRetry",
                );
                return db;
            } catch (err) {
                retries++;
                error(
                    `[verifyPaidInvoices] Erreur DB SQLite (attempt ${retries}/${maxRetries}): ${err.message}`,
                    "verify-paid-invoices",
                    "openDatabaseWithRetry",
                );
                if (
                    err.message.includes("database disk image is malformed") &&
                    retries < maxRetries
                ) {
                    info(
                        `[verifyPaidInvoices] Attente de 1 minute avant retry...`,
                        "verify-paid-invoices",
                        "openDatabaseWithRetry",
                    );
                    await new Promise((resolve) =>
                        setTimeout(resolve, retryDelayMs),
                    );
                } else {
                    throw err;
                }
            }
        }
        throw new Error(
            `[verifyPaidInvoices] Impossible d'ouvrir la DB après ${maxRetries} tentatives`,
        );
    }

    const db = await openDatabaseWithRetry(dbPath);

    try {
        // Étape 2: Chercher les factures payées dans SQLite qui sont dans la liste des impayées de Parse
        const query = PAID_INVOICES_QUERY(unpaidInvoiceIds);
        const rows = db.prepare(query).all();

        info(
            `[verifyPaidInvoices] Trouvé ${rows.length} facture(s) payée(s) à vérifier`,
            "verify-paid-invoices",
            "verifyPaidInvoices",
        );

        for (const row of rows) {
            try {
                stats.invoiceNumbers.push(row.nfacture);

                // Vérifier que la facture existe bien dans Parse comme impayée
                const Impaye = Parse.Object.extend("Impaye");
                const qi = new Parse.Query(Impaye);
                qi.equalTo("externe_id", row.nfacture);
                qi.equalTo("facture_soldee", false);

                const impaye = await qi.first({ useMasterKey: true });

                if (!impaye) {
                    info(
                        `[verifyPaidInvoices] Facture ${row.nfacture} introuvable ou déjà marquée comme payée`,
                        "verify-paid-invoices",
                        "verifyPaidInvoices",
                    );
                    stats.skipped++;
                    continue;
                }

                // Mettre à jour le statut dans Parse
                impaye.set("facture_soldee", true);
                impaye.set("solde", true);
                impaye.set("solde_le", new Date());
                await impaye.save(null, { useMasterKey: true });

                stats.updated++;
                info(
                    `[verifyPaidInvoices] Facture ${row.nfacture} marquée comme payée (Parse)`,
                    "verify-paid-invoices",
                    "verifyPaidInvoices",
                );

                // Créer une activité pour le paiement
                try {
                    const activite = new Parse.Object("Activite");
                    activite.set("type", "paiement");
                    activite.set("operation", "payment_received");
                    activite.set("nfacture", row.nfacture);
                    activite.set("impaye_id", impaye.id);
                    activite.set(
                        "montant",
                        row.resteapayer != null ? Number(row.resteapayer) : 0,
                    );
                    activite.set("date_paiement", new Date());
                    activite.set("trigger", trigger);
                    activite.set("timestamp", new Date());
                    activite.set(
                        "description",
                        `Paiement reçu pour la facture ${row.nfacture}`,
                    );
                    await activite.save(null, { useMasterKey: true });
                    info(
                        `[verifyPaidInvoices] Activité de paiement créée pour la facture ${row.nfacture}`,
                        "verify-paid-invoices",
                        "verifyPaidInvoices",
                    );
                } catch (logErr) {
                    error(
                        `[verifyPaidInvoices] Erreur création activité de paiement pour ${row.nfacture}: ${logErr.message}`,
                        "verify-paid-invoices",
                        "verifyPaidInvoices",
                    );
                }
            } catch (err) {
                error(
                    `[verifyPaidInvoices] Erreur facture ${row.nfacture}: ${err.message}`,
                    "verify-paid-invoices",
                    "verifyPaidInvoices",
                );
                stats.errors.push({
                    nfacture: row.nfacture,
                    error: err.message,
                    externalStatus: row.facturesoldee,
                    externalRemaining: row.resteapayer,
                });

                // Log individuel pour l'erreur
                try {
                    const activite = new Parse.Object("Activite");
                    activite.set("type", "verification_paiement");
                    activite.set("operation", "error");
                    activite.set("nfacture", row.nfacture);
                    activite.set("error_message", err.message);
                    activite.set("trigger", trigger);
                    activite.set("timestamp", new Date());
                    await activite.save(null, { useMasterKey: true });
                } catch (logErr) {
                    error(
                        `[verifyPaidInvoices] Erreur log activite erreur pour ${row.nfacture}: ${logErr.message}`,
                        "verify-paid-invoices",
                        "verifyPaidInvoices",
                    );
                }
            }
        }

        info(
            `[verifyPaidInvoices] Terminé — ${stats.updated} mis à jour, ${stats.skipped} ignorés, ${stats.errors.length} erreurs`,
            "verify-paid-invoices",
            "verifyPaidInvoices",
        );
    } catch (err) {
        error(
            `[verifyPaidInvoices] Erreur base de données SQLite: ${err.message}`,
            "verify-paid-invoices",
            "verifyPaidInvoices",
        );
        stats.errors.push({ error: err.message });
    } finally {
        db.close();
    }

    return stats;
}

module.exports = verifyPaidInvoices;
