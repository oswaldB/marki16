// backend/cloud/workflows/send-emails/00-master.js
// Orchestre l'envoi des relances par email

// Charger les variables d'environnement depuis .env
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const fs = require("fs");
const path = require("path");
const { info, warn, error } = require("../../utils/logger");
const envoyerRelances = require("./01-envoyerRelances");

// Chemin du répertoire logs
const LOGS_DIR = path.join(__dirname, "logs");

/**
 * Vide le répertoire logs
 */
function clearLogs() {
    try {
        if (fs.existsSync(LOGS_DIR)) {
            const files = fs.readdirSync(LOGS_DIR);
            files.forEach((file) => {
                const filePath = path.join(LOGS_DIR, file);
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    warn(
                        `Impossible de supprimer ${filePath}: ${err.message}`,
                        "send-emails",
                        "clearLogs",
                    );
                }
            });
            info(
                `Répertoire logs vidé: ${files.length} fichiers supprimés`,
                "send-emails",
                "sendEmailsMaster",
            );
        }
    } catch (err) {
        warn(
            `Impossible de vider le répertoire logs: ${err.message}`,
            "send-emails",
            "sendEmailsMaster",
        );
    }
}

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
 * Orchestre l'envoi des relances
 * @param {Object} options - Options de configuration
 * @returns {Promise<Object>} Statistiques
 */
async function sendEmailsMaster(options = {}) {
    const startedAt = new Date();

    // Règle 1: Vider le répertoire logs au début
    if (options.trigger !== "test") {
        clearLogs();
    }

    // Séparateur visuel
    info(
        "\n═════════════════════════════════════════════════════════════",
        "send-emails",
        "sendEmailsMaster",
    );
    info(
        `🚀 DÉBUT: send-emails (trigger: ${options.trigger || "manual"})`,
        "send-emails",
        "sendEmailsMaster",
        { trigger: options.trigger || "manual" },
    );
    info(
        "═════════════════════════════════════════════════════════════",
        "send-emails",
        "sendEmailsMaster",
    );

    const stats = {
        result: null,
        errors: [],
        total: {
            startedAt,
            finishedAt: null,
            durationMs: 0,
        },
    };

    try {
        // Étape 1: Envoi des relances
        info(
            "\n═════════════════════════════════════════════════════════════",
            "send-emails",
            "sendEmailsMaster",
        );
        info(
            "📧 ÉTAPE 1/1: Envoi des relances...",
            "send-emails",
            "sendEmailsMaster",
            { step: 1 },
        );
        stats.result = await envoyerRelances(options);
        info(
            `✅ ÉTAPE 1 TERMINÉE: ${stats.result?.relancesEnvoyees ?? 0} relances envoyées, ${stats.result?.relancesErreurs ?? 0} erreurs`,
            "send-emails",
            "sendEmailsMaster",
            {
                step: 1,
                envoyees: stats.result?.relancesEnvoyees ?? 0,
                erreurs: stats.result?.relancesErreurs ?? 0,
            },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "send-emails",
            "sendEmailsMaster",
        );

        // ========== FIN SUCCESS ==========
        info(
            "\n═════════════════════════════════════════════════════════════",
            "send-emails",
            "sendEmailsMaster",
        );
        info(
            "✅ PROCESSUS TERMINÉ AVEC SUCCÈS",
            "send-emails",
            "sendEmailsMaster",
            { errorsCount: 0 },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "send-emails",
            "sendEmailsMaster",
        );
    } catch (err) {
        info(
            "\n═════════════════════════════════════════════════════════════",
            "send-emails",
            "sendEmailsMaster",
        );
        error(
            `❌ ERREUR DANS LE WORKFLOW: ${err.message}`,
            "send-emails",
            "sendEmailsMaster",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        stats.result = {
            relancesEnvoyees: 0,
            relancesErreurs: 0,
            erreurs: [err.message],
        };
        stats.errors.push({
            step: 1,
            script: "01-envoyerRelances",
            error: err.message,
        });

        warn(
            "❌ PROCESSUS TERMINÉ AVEC ERREUR",
            "send-emails",
            "sendEmailsMaster",
            { errorsCount: stats.errors.length },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "send-emails",
            "sendEmailsMaster",
        );
    }

    const finishedAt = new Date();
    stats.total.finishedAt = finishedAt;
    stats.total.durationMs = finishedAt - startedAt;
    const durationSec = ((finishedAt - startedAt) / 1000).toFixed(2);

    info(
        "\n═════════════════════════════════════════════════════════════",
        "send-emails",
        "sendEmailsMaster",
    );
    info(
        `⏱️  DURÉE TOTALE: ${durationSec} secondes`,
        "send-emails",
        "sendEmailsMaster",
        { durationMs: stats.total.durationMs, durationSec },
    );
    info(
        "═════════════════════════════════════════════════════════════",
        "send-emails",
        "sendEmailsMaster",
    );

    info(
        "═════════════════════════════════════════════════════════════",
        "send-emails",
        "sendEmailsMaster",
    );

    return stats;
}

module.exports = sendEmailsMaster;

// Exécution directe si appelé en CLI
if (require.main === module) {
    sendEmailsMaster()
        .then((stats) => {
            info(
                "✅ Processus send-emails terminé via CLI",
                "send-emails",
                "sendEmailsMaster",
                { errors: stats.errors.length },
            );
            process.exit(stats.errors.length > 0 ? 1 : 0);
        })
        .catch((error) => {
            error(
                `❌ Erreur dans send-emails/master: ${error.message}`,
                "send-emails",
                "sendEmailsMaster",
                { error: error.message, stack: error.stack?.substring(0, 500) },
            );
            process.exit(1);
        });
}
