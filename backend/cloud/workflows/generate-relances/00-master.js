// backend/cloud/workflows/generate-relances/00-master.js
// Orchestrateur du workflow autonome de génération des relances

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
                        "generate-relances",
                        "clearLogs",
                    );
                }
            });
            info(
                `Répertoire logs vidé: ${files.length} fichiers supprimés`,
                "generate-relances",
                "generateRelancesMaster",
            );
        }
    } catch (err) {
        warn(
            `Impossible de vider le répertoire logs: ${err.message}`,
            "generate-relances",
            "generateRelancesMaster",
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
const createRelances = require("./01-createRelances");
const replaceVariables = require("./01b-replaceVariables");
const generateRelances = require("./02-generateRelances");
const perfectWithOllama = require("./03-perfectWithOllama");

/**
 * Orchestrateur principal du workflow generate-relances
 * @param {Object} options - { trigger }
 * @returns {Promise<Object>} { stats }
 */
async function generateRelancesMaster({ trigger = "cron" } = {}) {
    const startedAt = new Date();

    // Règle 1: Vider le répertoire logs au début
    if (trigger !== "test") {
        clearLogs();
    }

    // Séparateur visuel
    info(
        "\n═════════════════════════════════════════════════════════════",
        "generate-relances",
        "generateRelancesMaster",
    );
    info(
        `🚀 DÉBUT: generate-relances (trigger: ${trigger})`,
        "generate-relances",
        "generateRelancesMaster",
        { trigger },
    );
    info(
        "═════════════════════════════════════════════════════════════",
        "generate-relances",
        "generateRelancesMaster",
    );

    const stats = {
        errors: [],
        total: {
            startedAt: startedAt.toISOString(),
            finishedAt: null,
            durationMs: 0,
        },
        etape1: {},
        etape1b: {},
        etape2: {},
        etape3: {},
    };

    try {
        // ========== ÉTAPE 1: Création des relances ==========
        info(
            "\n═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );
        info(
            "📧 ÉTAPE 1/3: Création des relances...",
            "generate-relances",
            "generateRelancesMaster",
            { step: 1 },
        );
        const result1 = await createRelances();
        stats.etape1 = result1.stats;
        info(
            `✅ ÉTAPE 1 TERMINÉE: ${result1.stats.relancesCreated || 0} créées, ${result1.stats.relancesUpdated || 0} mises à jour, ${result1.stats.skipped || 0} ignorées`,
            "generate-relances",
            "generateRelancesMaster",
            {
                step: 1,
                created: result1.stats.relancesCreated || 0,
                updated: result1.stats.relancesUpdated || 0,
                skipped: result1.stats.skipped || 0,
            },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );

        // ========== ÉTAPE 1b: Remplacement des variables ==========
        info(
            "\n═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );
        info(
            "🏷️  ÉTAPE 1b/3: Remplacement des variables [[...]]...",
            "generate-relances",
            "generateRelancesMaster",
            { step: 1.5 },
        );
        const result1b = await replaceVariables();
        stats.etape1b = result1b.stats;
        info(
            `✅ ÉTAPE 1b TERMINÉE: ${result1b.stats.processed || 0} traitées, ${result1b.stats.replaced || 0} modifiées, ${result1b.stats.errors.length || 0} erreurs`,
            "generate-relances",
            "generateRelancesMaster",
            {
                step: 1.5,
                processed: result1b.stats.processed || 0,
                replaced: result1b.stats.replaced || 0,
                errors: result1b.stats.errors.length || 0,
            },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );

        // ========== ÉTAPE 2: Génération du contenu ==========
        info(
            "\n═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );
        info(
            "📝 ÉTAPE 2/3: Génération du contenu des relances...",
            "generate-relances",
            "generateRelancesMaster",
            { step: 2 },
        );
        const result2 = await generateRelances();
        stats.etape2 = result2.stats;
        info(
            `✅ ÉTAPE 2 TERMINÉE: ${result2.stats.processed || 0} traités, ${result2.stats.errors.length || 0} erreurs`,
            "generate-relances",
            "generateRelancesMaster",
            {
                step: 2,
                processed: result2.stats.processed || 0,
                errors: result2.stats.errors.length || 0,
            },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );

        // ========== ÉTAPE 3: Amélioration avec Ollama ==========
        info(
            "\n═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );
        info(
            "🤖 ÉTAPE 3/3: Amélioration du contenu avec Ollama...",
            "generate-relances",
            "generateRelancesMaster",
            { step: 3 },
        );
        const result3 = await perfectWithOllama();
        stats.etape3 = result3.stats;
        info(
            `✅ ÉTAPE 3 TERMINÉE: ${result3.stats.processed || 0} traités, ${result3.stats.improved || 0} améliorés, ${result3.stats.errors.length || 0} erreurs`,
            "generate-relances",
            "generateRelancesMaster",
            {
                step: 3,
                processed: result3.stats.processed || 0,
                improved: result3.stats.improved || 0,
                errors: result3.stats.errors.length || 0,
            },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );

        // ========== FIN SUCCESS ==========
        info(
            "\n═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );
        info(
            "✅ PROCESSUS TERMINÉ AVEC SUCCÈS",
            "generate-relances",
            "generateRelancesMaster",
            { errorsCount: stats.errors.length },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );
    } catch (err) {
        info(
            "\n═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );
        error(
            `❌ ERREUR DANS LE WORKFLOW: ${err.message}`,
            "generate-relances",
            "generateRelancesMaster",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        stats.errors.push({
            step: "generateRelancesMaster",
            error: err.message,
            stack: err.stack?.substring(0, 500),
        });

        warn(
            "❌ PROCESSUS TERMINÉ AVEC ERREUR",
            "generate-relances",
            "generateRelancesMaster",
            { errorsCount: stats.errors.length },
        );
        info(
            "═════════════════════════════════════════════════════════════",
            "generate-relances",
            "generateRelancesMaster",
        );
    }

    const finishedAt = new Date();
    stats.total.finishedAt = finishedAt.toISOString();
    stats.total.durationMs = finishedAt - startedAt;
    const durationSec = ((finishedAt - startedAt) / 1000).toFixed(2);

    info(
        "\n═════════════════════════════════════════════════════════════",
        "generate-relances",
        "generateRelancesMaster",
    );
    info(
        `⏱️  DURÉE TOTALE: ${durationSec} secondes`,
        "generate-relances",
        "generateRelancesMaster",
        { durationMs: stats.total.durationMs, durationSec },
    );
    info(
        "═════════════════════════════════════════════════════════════",
        "generate-relances",
        "generateRelancesMaster",
    );

    info(
        "═════════════════════════════════════════════════════════════",
        "generate-relances",
        "generateRelancesMaster",
    );

    return { stats };
}

module.exports = generateRelancesMaster;

// Cloud Function pour déclencher la génération des relances via Parse
Parse.Cloud.define("generateRelances", async (request) => {
    info(
        "🌐 Cloud Function generateRelances appelée",
        "generate-relances",
        "generateRelances",
        { user: request.user?.id, master: request.master },
    );

    if (!request.master && !request.user) {
        throw new Error(
            "Non autorisé - cette fonction nécessite un utilisateur authentifié ou le master key",
        );
    }

    info(
        "Cloud Function: exécution autonome - récupération de toutes les données depuis Parse",
        "generate-relances",
        "generateRelances",
    );

    return await generateRelancesMaster({
        trigger: "cloud-function",
    });
});

// Exécution directe si appelé en CLI
if (require.main === module) {
    generateRelancesMaster({ trigger: "cli" })
        .then((result) => {
            info(
                "✅ Workflow generate-relances terminé via CLI",
                "generate-relances",
                "generateRelancesMaster",
                {
                    errors: result.stats.errors.length,
                    durationMs: result.stats.total.durationMs,
                },
            );
            process.exit(result.stats.errors.length > 0 ? 1 : 0);
        })
        .catch((error) => {
            error(
                `❌ Erreur dans generate-relances/master: ${error.message}`,
                "generate-relances",
                "generateRelancesMaster",
                { error: error.message, stack: error.stack?.substring(0, 500) },
            );
            process.exit(1);
        });
}
