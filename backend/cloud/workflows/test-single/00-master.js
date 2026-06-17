// backend/cloud/workflows/test-single/00-master.js
// PILOTE DU WORKFLOW : Envoie un seul email de test

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
                        "test-single",
                        "clearLogs",
                    );
                }
            });
            info(
                `Répertoire logs vidé: ${files.length} fichiers supprimés`,
                "test-single",
                "master",
            );
        }
    } catch (err) {
        warn(
            `Impossible de vider le répertoire logs: ${err.message}`,
            "test-single",
            "clearLogs",
        );
    }
}

// Initialiser Parse
let Parse;
try {
    Parse = require("parse/node");
    Parse.initialize(
        process.env.PARSE_APP_ID,
        process.env.PARSE_JAVASCRIPT_KEY,
        process.env.PARSE_MASTER_KEY,
    );
    Parse.serverURL = process.env.PARSE_SERVER_URL;
    Parse.Cloud.useMasterKey();
    global.Parse = Parse;
} catch (e) {
    error(
        `[MASTER] ❌ Erreur initialisation Parse: ${e.message}`,
        "test-single",
        "master",
    );
    throw e;
}

// Séparateur visuel
info(
    "\n═════════════════════════════════════════════════════════════",
    "test-single",
    "master",
);
info(
    `🚀 DÉBUT: test-single - Enregistrement des Cloud Functions`,
    "test-single",
    "master",
);
info(
    "═════════════════════════════════════════════════════════════",
    "test-single",
    "master",
);

// Importer les étapes du workflow
const fetchData = require("./01-fetchData");
const replaceVariables = require("./01b-replaceVariables");
const generateContent = require("./02-generateContent");
const sendEmail = require("./03-sendEmail");

// 🟢 CLOUD FUNCTION PRINCIPALE
Parse.Cloud.define("testSingleEmail", async (request) => {
    // Nettoyer les logs au début de chaque exécution
    clearLogs();

    const startedAt = new Date();
    const params = request.params;

    // Log détaillé des paramètres d'entrée
    info(
        `📥 NOUVELLE REQUÊTE: testSingleEmail`,
        "test-single",
        "master",
    );
    info(
        `📋 Paramètres: sequenceId=${params.sequenceId}, testEmail=${params.testEmail}, payeurId=${params.payeurId}, emailIndex=${params.emailIndex}`,
        "test-single",
        "master",
    );
    info(
        `⏰ Heure de début: ${startedAt.toISOString()}`,
        "test-single",
        "master",
    );

    try {
        // ⚡ ÉTAPE 1/3 : Récupération des données Parse
        info(
            "[MASTER] ➡️  ÉTAPE 1/3 : Récupération données Parse",
            "test-single",
            "master",
        );
        const data1Start = new Date();
        const data1 = await fetchData(params);
        const data1Duration = ((new Date() - data1Start) / 1000).toFixed(2);
        info(
            `[MASTER] ✅ Étape 1 TERMINÉE en ${data1Duration}s: sequence=${data1.sequence?.id || "unknown"}, payeur=${data1.payeur?.id || "unknown"}, impayes=${data1.impayes.length}, emailIndex=${data1.emailIndex}`,
            "test-single",
            "master",
        );

        // ⚡ ÉTAPE 1b/3 : Remplacement des variables [[...]]
        info(
            "[MASTER] ➡️  ÉTAPE 1b/3 : Remplacement des variables [[...]]",
            "test-single",
            "master",
        );
        const data1bStart = new Date();
        const data1b = await replaceVariables(data1);
        const data1bDuration = ((new Date() - data1bStart) / 1000).toFixed(2);
        info(
            `[MASTER] ✅ Étape 1b TERMINÉE en ${data1bDuration}s: templates pré-remplis`,
            "test-single",
            "master",
        );

        // ⚡ ÉTAPE 2/3 : Génération du contenu avec Ollama
        info(
            "[MASTER] ➡️  ÉTAPE 2/3 : Génération contenu avec Ollama",
            "test-single",
            "master",
        );
        const data2Start = new Date();
        const data2 = await generateContent(data1b);
        const data2Duration = ((new Date() - data2Start) / 1000).toFixed(2);
        info(
            `[MASTER] ✅ Étape 2 TERMINÉE en ${data2Duration}s: email généré`,
            "test-single",
            "master",
        );

        // Log de l'email généré
        info(
            `[MASTER]   Email: to=${data2.email?.to}, subject=${data2.email?.subject?.substring(0, 60)}...`,
            "test-single",
            "master",
        );

        // ⚡ ÉTAPE 3/3 : Envoi de l'email
        info(
            "[MASTER] ➡️  ÉTAPE 3/3 : Envoi email via Nodemailer",
            "test-single",
            "master",
        );
        const data3Start = new Date();
        const result = await sendEmail(data2);
        const data3Duration = ((new Date() - data3Start) / 1000).toFixed(2);
        info(
            `[MASTER] ✅ Étape 3 TERMINÉE en ${data3Duration}s: ${result.sentEmails}/${result.totalEmails} email(s) envoyé(s)`,
            "test-single",
            "master",
        );

        if (result.errors && result.errors.length > 0) {
            error(
                `[MASTER] ⚠️  Erreurs d'envoi: ${JSON.stringify(result.errors, null, 2)}`,
                "test-single",
                "master",
            );
        }

        const totalDuration = ((new Date() - startedAt) / 1000).toFixed(2);
        info(
            `[MASTER] ════════════════════════════════════════════`,
            "test-single",
            "master",
        );
        info(
            `[MASTER] ✅ WORKFLOW TERMINÉ AVEC SUCCÈS`,
            "test-single",
            "master",
        );
        info(
            `[MASTER] ⏱️  Durée totale: ${totalDuration}s`,
            "test-single",
            "master",
        );
        info(
            `[MASTER] 📊 Résultat: ${result.sentEmails}/${result.totalEmails} email(s) envoyé(s)`,
            "test-single",
            "master",
        );
        info(
            `[MASTER] ════════════════════════════════════════════`,
            "test-single",
            "master",
        );

        return result;
    } catch (err) {
        const errorDuration = ((new Date() - startedAt) / 1000).toFixed(2);
        error(
            `[MASTER] ════════════════════════════════════════════`,
            "test-single",
            "master",
        );
        error(
            `[MASTER] ❌ WORKFLOW ÉCHOUÉ après ${errorDuration}s`,
            "test-single",
            "master",
        );
        error(
            `[MASTER] Erreur: ${err.message}`,
            "test-single",
            "master",
        );
        error(`[MASTER] Stack: ${err.stack}`, "test-single", "master");
        error(
            `[MASTER] ════════════════════════════════════════════`,
            "test-single",
            "master",
        );
        throw err;
    }
});

info(
    "\n═════════════════════════════════════════════════════════════",
    "test-single",
    "master",
);
info(
    "✅ Cloud Function enregistrée avec succès" +
        "\n   - 00-master.js (pilote)" +
        "\n   - 01-fetchData.js (données Parse)" +
        "\n   - 02-generateContent.js (génération)" +
        "\n   - 03-sendEmail.js (envoi)",
    "test-single",
    "master",
);
info(
    "═════════════════════════════════════════════════════════════",
    "test-single",
    "master",
);

// Module export vide - Parse.Cloud.define gère l'enregistrement
module.exports = {};
