// backend/cloud/workflows/verify-paid-invoices/00-master.js
// Orchestre la vérification des factures payées

// Charger les variables d'environnement depuis .env
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const { writeLog } = require("../../utils/logger");
const verifyPaidInvoices = require("./01-verifyPaidInvoices");
const cleanupPaidInvoicesRelances = require("./02-cleanupPaidInvoicesRelances");
const generateRelancesMaster = require("../generate-relances/00-master");

/**
 * Orchestre la vérification des factures payées
 * @param {Object} options - Options de configuration
 * @returns {Promise<Object>} Statistiques
 */
async function verifyPaidInvoicesMaster(options = {}) {
    const startedAt = new Date();
    console.log(
        `[verify-paid-invoices/master] Début du processus de vérification des factures payées`,
    );
    writeLog(
        `INFO: Début du processus (trigger: ${options.trigger || "manual"})`,
    );

    const stats = {
        result: null,
        cleanup: null,
        generation: null,
        errors: [],
        total: {
            startedAt,
            finishedAt: null,
            durationMs: 0,
        },
    };

    try {
        // Étape 1: Vérification des factures payées
        console.log(
            "[verify-paid-invoices/master] Étape 1/3: Vérification des factures payées...",
        );
        stats.result = await verifyPaidInvoices(options);
        console.log(
            `[verify-paid-invoices/master] Étape 1 terminée: ${stats.result?.updated ?? 0} factures mises à jour, ${stats.result?.skipped ?? 0} ignorées`,
        );

        // Étape 2: Nettoyage des relances pour les factures nouvellement payées
        console.log(
            "[verify-paid-invoices/master] Étape 2/3: Nettoyage des relances...",
        );
        stats.cleanup = await cleanupPaidInvoicesRelances(options);
        console.log(
            `[verify-paid-invoices/master] Étape 2 terminée: ${stats.cleanup?.deleted ?? 0} relances supprimées, ${stats.cleanup?.updated ?? 0} mises à jour, ${stats.cleanup?.skipped ?? 0} ignorées`,
        );

        // Étape 3: Génération des relances
        console.log(
            "[verify-paid-invoices/master] Étape 3/3: Génération des relances...",
        );
        const generationResult = await generateRelancesMaster(options);
        stats.generation = generationResult.stats;
        console.log(
            `[verify-paid-invoices/master] Étape 3 terminée: ${generationResult.stats.etape1?.relancesCreated ?? 0} relances créées, ${generationResult.stats.etape1?.relancesUpdated ?? 0} mises à jour`,
        );
    } catch (error) {
        console.error("[verify-paid-invoices/master] Erreur:", error.message);
        stats.result = { updated: 0, skipped: 0, errors: [error.message] };
        stats.errors.push({
            step: 1,
            script: "verifyPaidInvoicesMaster",
            error: error.message,
        });
    }

    const finishedAt = new Date();
    stats.total.finishedAt = finishedAt;
    stats.total.durationMs = finishedAt - startedAt;

    console.log(
        `[verify-paid-invoices/master] Durée totale: ${(finishedAt - startedAt) / 1000} secondes`,
    );
    writeLog(
        `SUCCESS: Processus terminé (${finishedAt - startedAt}ms) - ${stats.result?.updated || 0} factures mises à jour, ${stats.cleanup?.deleted || 0} relances nettoyées, ${stats.generation?.etape1?.relancesCreated || 0} relances générées`,
    );

    return stats;
}

module.exports = verifyPaidInvoicesMaster;

// Cloud Function pour déclencher la vérification manuellement
Parse.Cloud.define("verifyPaidInvoicesNow", async (request) => {
    if (!request.master && !request.user) {
        throw "Non autorisé - nécessite authentification";
    }
    return await verifyPaidInvoicesMaster({ trigger: "manual" });
});

// Exécution directe si appelé en CLI
if (require.main === module) {
    verifyPaidInvoicesMaster()
        .then((stats) => {
            console.log(
                "Processus verify-paid-invoices terminé:",
                JSON.stringify(stats, null, 2),
            );
            process.exit(stats.errors.length > 0 ? 1 : 0);
        })
        .catch((error) => {
            console.error("Erreur dans verify-paid-invoices/master:", error);
            process.exit(1);
        });
}
