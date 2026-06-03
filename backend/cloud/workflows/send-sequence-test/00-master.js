// backend/cloud/workflows/send-sequence-test/00-master.js
// PILOTE DU WORKFLOW : Envoie des emails de test

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
                        "send-sequence-test",
                        "clearLogs",
                    );
                }
            });
            info(
                `Répertoire logs vidé: ${files.length} fichiers supprimés`,
                "send-sequence-test",
                "master",
            );
        }
    } catch (err) {
        warn(
            `Impossible de vider le répertoire logs: ${err.message}`,
            "send-sequence-test",
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
        "send-sequence-test",
        "master",
    );
    throw e;
}

// Séparateur visuel
info(
    "\n═════════════════════════════════════════════════════════════",
    "send-sequence-test",
    "master",
);
info(
    `🚀 DÉBUT: send-sequence-test - Enregistrement des Cloud Functions`,
    "send-sequence-test",
    "master",
);
info(
    "═════════════════════════════════════════════════════════════",
    "send-sequence-test",
    "master",
);

// Importer les étapes du workflow
const fetchData = require("./01-fetchData");
const generateContent = require("./03-generateContent");
const sendEmails = require("./04-sendEmails");

// 🟢 CLOUD FUNCTION PRINCIPALE
Parse.Cloud.define("sendSequenceTest", async (request) => {
    // Nettoyer les logs au début de chaque exécution
    clearLogs();

    const startedAt = new Date();
    const params = request.params;

    // Log détaillé des paramètres d'entrée
    info(
        `📥 NOUVELLE REQUÊTE: sendSequenceTest`,
        "send-sequence-test",
        "master",
    );
    info(
        `📋 Paramètres: sequenceId=${params.sequenceId}, testEmail=${params.testEmail}, payeurId=${params.payeurId}`,
        "send-sequence-test",
        "master",
    );
    info(
        `⏰ Heure de début: ${startedAt.toISOString()}`,
        "send-sequence-test",
        "master",
    );

    try {
        // ⚡ ÉTAPE 1/4 : Récupération des données Parse
        info(
            "[MASTER] ➡️  ÉTAPE 1/4 : Récupération données Parse",
            "send-sequence-test",
            "master",
        );
        const data1Start = new Date();
        const data1 = await fetchData(params);
        const data1Duration = ((new Date() - data1Start) / 1000).toFixed(2);
        info(
            `[MASTER] ✅ Étape 1 TERMINÉE en ${data1Duration}s: sequence=${data1.sequence?.id || "unknown"}, payeur=${data1.payeur?.id || "unknown"}, impayes=${data1.impayes.length}`,
            "send-sequence-test",
            "master",
        );

        // ⚡ ÉTAPE 2/4 : Génération du contenu avec Ollama
        info(
            "[MASTER] ➡️  ÉTAPE 2/4 : Génération contenu avec Ollama",
            "send-sequence-test",
            "master",
        );
        const data2Start = new Date();
        const data2 = await generateContent(data1);
        const data2Duration = ((new Date() - data2Start) / 1000).toFixed(2);
        info(
            `[MASTER] ✅ Étape 2 TERMINÉE en ${data2Duration}s: emails=${data2.emails.length}`,
            "send-sequence-test",
            "master",
        );

        // Log des emails générés
        data2.emails.forEach((email, index) => {
            info(
                `[MASTER]   Email ${index + 1}: to=${email.to}, subject=${email.subject.substring(0, 60)}...`,
                "send-sequence-test",
                "master",
            );
        });

        // ⚡ ÉTAPE 3/4 : Envoi des emails
        info(
            "[MASTER] ➡️  ÉTAPE 3/4 : Envoi emails via Nodemailer",
            "send-sequence-test",
            "master",
        );
        const data4Start = new Date();
        const result = await sendEmails({ emails: data2.emails });
        const data4Duration = ((new Date() - data4Start) / 1000).toFixed(2);
        info(
            `[MASTER] ✅ Étape 4 TERMINÉE en ${data4Duration}s: ${result.sentEmails}/${result.totalEmails} emails envoyés`,
            "send-sequence-test",
            "master",
        );

        if (result.errors && result.errors.length > 0) {
            error(
                `[MASTER] ⚠️  Erreurs d'envoi: ${JSON.stringify(result.errors, null, 2)}`,
                "send-sequence-test",
                "master",
            );
        }

        const totalDuration = ((new Date() - startedAt) / 1000).toFixed(2);
        info(
            `[MASTER] ════════════════════════════════════════════`,
            "send-sequence-test",
            "master",
        );
        info(
            `[MASTER] ✅ WORKFLOW TERMINÉ AVEC SUCCÈS`,
            "send-sequence-test",
            "master",
        );
        info(
            `[MASTER] ⏱️  Durée totale: ${totalDuration}s`,
            "send-sequence-test",
            "master",
        );
        info(
            `[MASTER] 📊 Résultat: ${result.sentEmails}/${result.totalEmails} emails envoyés`,
            "send-sequence-test",
            "master",
        );
        info(
            `[MASTER] ════════════════════════════════════════════`,
            "send-sequence-test",
            "master",
        );

        return result;
    } catch (err) {
        const errorDuration = ((new Date() - startedAt) / 1000).toFixed(2);
        error(
            `[MASTER] ════════════════════════════════════════════`,
            "send-sequence-test",
            "master",
        );
        error(
            `[MASTER] ❌ WORKFLOW ÉCHOUÉ après ${errorDuration}s`,
            "send-sequence-test",
            "master",
        );
        error(
            `[MASTER] Erreur: ${err.message}`,
            "send-sequence-test",
            "master",
        );
        error(`[MASTER] Stack: ${err.stack}`, "send-sequence-test", "master");
        error(
            `[MASTER] ════════════════════════════════════════════`,
            "send-sequence-test",
            "master",
        );
        throw err;
    }
});

info(
    "\n═════════════════════════════════════════════════════════════",
    "send-sequence-test",
    "master",
);
info(
    "✅ Cloud Function enregistrée avec succès" +
        "\n   - 00-master.js (pilote)" +
        "\n   - 01-fetchData.js (données Parse)" +
        "\n   - 03-generateContent.js (génération)" +
        "\n   - 04-sendEmails.js (envoi)",
    "send-sequence-test",
    "master",
);
info(
    "═════════════════════════════════════════════════════════════",
    "send-sequence-test",
    "master",
);

// Module export vide - Parse.Cloud.define gère l'enregistrement
module.exports = {};
