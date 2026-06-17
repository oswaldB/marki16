// backend/cloud/workflows/get-contact-impayes/00-master.js
// Orchestrateur du workflow de récupération des impayés par contact

// Charger les variables d'environnement depuis .env
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const { info, warn, error } = require("../../utils/logger");

// Initialiser Parse si nécessaire
if (typeof Parse === "undefined") {
    const Parse = require("parse/node");
    Parse.initialize(
        process.env.PARSE_APP_ID,
        process.env.PARSE_JAVASCRIPT_KEY,
        process.env.PARSE_MASTER_KEY,
    );
    Parse.serverURL = process.env.PARSE_SERVER_URL;
    Parse.Cloud.useMasterKey();
    global.Parse = Parse;
}

/**
 * Orchestrateur principal du workflow get-contact-impayes
 * @param {Object} options - Options de configuration
 * @returns {Promise<Object>} Statistiques
 */
async function getContactImpayesMaster(options = {}) {
    const startedAt = new Date();
    const stats = {
        retrieved: 0,
        errors: [],
        total: {
            startedAt,
            finishedAt: null,
            durationMs: 0,
        },
    };

    info(
        `[get-contact-impayes/master] Début du processus de récupération des impayés par contact (trigger: ${options.trigger || "manual"})`,
        "get-contact-impayes",
        "getContactImpayesMaster",
    );

    try {
        // TODO: Implémenter la logique de récupération des impayés par contact
        info(
            `[get-contact-impayes/master] Workflow get-contact-impayes non encore implémenté`,
            "get-contact-impayes",
            "getContactImpayesMaster",
        );
        
        stats.retrieved = 0;
    } catch (err) {
        error(
            `[get-contact-impayes/master] Erreur: ${err.message}`,
            "get-contact-impayes",
            "getContactImpayesMaster",
        );
        stats.errors.push({
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });
    }

    const finishedAt = new Date();
    stats.total.finishedAt = finishedAt;
    stats.total.durationMs = finishedAt - startedAt;

    info(
        `[get-contact-impayes/master] Durée totale: ${(finishedAt - startedAt) / 1000} secondes`,
        "get-contact-impayes",
        "getContactImpayesMaster",
    );

    return stats;
}

module.exports = getContactImpayesMaster;

// Cloud Function pour déclencher la récupération des impayés par contact via Parse
Parse.Cloud.define("getContactImpayes", async (request) => {
    info(
        "Cloud Function getContactImpayes appelée",
        "get-contact-impayes",
        "getContactImpayes",
        { user: request.user?.id, master: request.master },
    );

    if (!request.master && !request.user) {
        throw new Error(
            "Non autorisé - cette fonction nécessite un utilisateur authentifié ou le master key",
        );
    }

    return await getContactImpayesMaster({ trigger: "cloud-function" });
});

// Exécution directe si appelé en CLI
if (require.main === module) {
    getContactImpayesMaster({ trigger: "cli" })
        .then((stats) => {
            info(
                "Workflow get-contact-impayes terminé via CLI",
                "get-contact-impayes",
                "getContactImpayesMaster",
                {
                    errors: stats.errors.length,
                    durationMs: stats.total.durationMs,
                },
            );
            process.exit(stats.errors.length > 0 ? 1 : 0);
        })
        .catch((error) => {
            error(
                `Erreur dans get-contact-impayes/master: ${error.message}`,
                "get-contact-impayes",
                "getContactImpayesMaster",
                { error: error.message, stack: error.stack?.substring(0, 500) },
            );
            process.exit(1);
        });
}
