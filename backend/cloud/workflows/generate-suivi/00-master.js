// backend/cloud/workflows/generate-suivi/00-master.js
// Orchestrateur du workflow autonome de génération des suivis

// Charger les variables d'environnement depuis .env
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const fs = require("fs");
const path = require("path");
const { info, warn, error } = require("../../utils/logger");

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
                        "generate-suivi",
                        "clearLogs",
                    );
                }
            });
            info(
                `Répertoire logs vidé: ${files.length} fichiers supprimés`,
                "generate-suivi",
                "generateSuivisMaster",
            );
        }
    } catch (err) {
        warn(
            `Impossible de vider le répertoire logs: ${err.message}`,
            "generate-suivi",
            "generateSuivisMaster",
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

// Charger les scripts d'étape
const createSuivis = require("./01-createSuivis");
const generateSuivis = require("./02-generateSuivis");

/**
 * Orchestrateur principal du workflow generate-suivi
 * @param {Object} options - { trigger }
 * @returns {Promise<Object>} { stats }
 */
async function generateSuivisMaster({ trigger = "cron" } = {}) {
    const startedAt = new Date();

    // Règle 1: Vider le répertoire logs au début
    if (trigger !== "test") {
        clearLogs();
    }

    // Séparateur visuel
    info(
        "\n═════════════════════════════════════════════════════════════",
        "generate-suivi",
        "generateSuivisMaster",
    );
    info(
        `🚀 DÉBUT: generate-suivi (trigger: ${trigger})`,
        "generate-suivi",
        "generateSuivisMaster",
        { trigger },
    );
    info(
        "═════════════════════════════════════════════════════════════",
        "generate-suivi",
        "generateSuivisMaster",
    );

    const stats = {
        errors: [],
        total: {
            startedAt: startedAt.toISOString(),
            finishedAt: null,
            durationMs: 0,
        },
        etape1: {},
        etape2: {},
    };

    try {
        // ========== ÉTAPE 1: Création des suivis ==========
        info(
            "\n═════════════════════════════════════════════════════════════",
            "generate-suivi",
            "generateSuivisMaster",
        );
        info(
            "📧 ÉTAPE 1/2: Création des suivis...",
            "generate-suivi",
            "generateSuivisMaster",
            { step: 1 },
        );
        const result1 = await createSuivis();
        stats.etape1 = result1.stats;
        info(
            `✅ ÉTAPE 1 TERMINÉE: ${result1.stats.suivisCreated || 0} créés, ${result1.stats.suivisUpdated || 0} mis à jour, ${result1.stats.skipped || 0} ignorés`,
            "generate-suivi",
            "generateSuivisMaster",
            {
                step: 1,
                created: result1.stats.suivisCreated || 0,
                updated: result1.stats.suivisUpdated || 0,
                skipped: result1.stats.skipped || 0,
            },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-suivi",
            "generateSuivisMaster",
        );

        // ========== ÉTAPE 2: Génération du contenu ==========
        info(
            "\n═════════════════════════════════════════════════════════════",
            "generate-suivi",
            "generateSuivisMaster",
        );
        info(
            "📝 ÉTAPE 2/2: Génération du contenu des suivis...",
            "generate-suivi",
            "generateSuivisMaster",
            { step: 2 },
        );
        const result2 = await generateSuivis();
        stats.etape2 = result2.stats;
        info(
            `✅ ÉTAPE 2 TERMINÉE: ${result2.stats.processed || 0} traités, ${result2.stats.errors.length || 0} erreurs`,
            "generate-suivi",
            "generateSuivisMaster",
            {
                step: 2,
                processed: result2.stats.processed || 0,
                errors: result2.stats.errors.length || 0,
            },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-suivi",
            "generateSuivisMaster",
        );

        // ========== FIN SUCCESS ==========
        info(
            "\n═════════════════════════════════════════════════════════════",
            "generate-suivi",
            "generateSuivisMaster",
        );
        info(
            "✅ PROCESSUS TERMINÉ AVEC SUCCÈS",
            "generate-suivi",
            "generateSuivisMaster",
            { errorsCount: stats.errors.length },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-suivi",
            "generateSuivisMaster",
        );
    } catch (err) {
        info(
            "\n═════════════════════════════════════════════════════════════",
            "generate-suivi",
            "generateSuivisMaster",
        );
        error(
            `❌ ERREUR DANS LE WORKFLOW: ${err.message}`,
            "generate-suivi",
            "generateSuivisMaster",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        stats.errors.push({
            step: "generateSuivisMaster",
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });

        warn(
            "❌ PROCESSUS TERMINÉ AVEC ERREUR",
            "generate-suivi",
            "generateSuivisMaster",
            { errorsCount: stats.errors.length },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-suivi",
            "generateSuivisMaster",
        );
    }

    const finishedAt = new Date();
    stats.total.finishedAt = finishedAt.toISOString();
    stats.total.durationMs = finishedAt - startedAt;
    const durationSec = ((finishedAt - startedAt) / 1000).toFixed(2);

    info(
        "\n═════════════════════════════════════════════════════════════",
        "generate-suivi",
        "generateSuivisMaster",
    );
    info(
        `⏱️  DURÉE TOTALE: ${durationSec} secondes`,
        "generate-suivi",
        "generateSuivisMaster",
        { durationMs: stats.total.durationMs, durationSec },
    );
    info(
        "═════════════════════════════════════════════════════════════",
        "generate-suivi",
        "generateSuivisMaster",
    );

    info(
        "═════════════════════════════════════════════════════════════",
        "generate-suivi",
        "generateSuivisMaster",
    );

    return { stats };
}

module.exports = generateSuivisMaster;

// Cloud Function pour déclencher la génération des suivis via Parse
Parse.Cloud.define("generateSuivis", async (request) => {
    info(
        "🌐 Cloud Function generateSuivis appelée",
        "generate-suivi",
        "generateSuivis",
        { user: request.user?.id, master: request.master },
    );

    if (!request.master && !request.user) {
        throw new Error(
            "Non autorisé - cette fonction nécessite un utilisateur authentifié ou le master key",
        );
    }

    info(
        "Cloud Function: exécution autonome - récupération de toutes les données depuis Parse",
        "generate-suivi",
        "generateSuivis",
    );

    return await generateSuivisMaster({
        trigger: "cloud-function",
    });
});

// Exécution directe si appelé en CLI
if (require.main === module) {
    generateSuivisMaster({ trigger: "cli" })
        .then((result) => {
            info(
                "✅ Workflow generate-suivi terminé via CLI",
                "generate-suivi",
                "generateSuivisMaster",
                {
                    errors: result.stats.errors.length,
                    durationMs: result.stats.total.durationMs,
                },
            );
            process.exit(result.stats.errors.length > 0 ? 1 : 0);
        })
        .catch((error) => {
            error(
                `❌ Erreur dans generate-suivi/master: ${error.message}`,
                "generate-suivi",
                "generateSuivisMaster",
                { error: error.message, stack: error.stack?.substring(0, 500) },
            );
            process.exit(1);
        });
}
