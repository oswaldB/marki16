// backend/cloud/workflows/send-sequence-test/00-master.js
// Cloud Function: Envoie des emails de test

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

const sendSequenceTest = require("./01-sendSequenceTest");

// Enregistrement de la Cloud Function Parse
info(
    "📧 Enregistrement Cloud Function: sendSequenceTest",
    "send-sequence-test",
    "master",
);
Parse.Cloud.define("sendSequenceTest", sendSequenceTest);

info(
    "\n═════════════════════════════════════════════════════════════",
    "send-sequence-test",
    "master",
);
info(
    "✅ Cloud Function enregistrée avec succès",
    "send-sequence-test",
    "master",
);
info(
    "═════════════════════════════════════════════════════════════",
    "send-sequence-test",
    "master",
);

module.exports = { sendSequenceTest };
