// backend/cloud/workflows/test-single/00-master.js
// Cloud Function: Test single email workflow
// Enregistre la Cloud Function "testSingleEmail" pour tester un email individuel

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

// Initialiser Parse si nécessaire
if (typeof Parse === "undefined") {
    const Parse = require("parse/node");
    Parse.initialize(
        process.env.PARSE_APP_ID,
        process.env.PARSE_JAVASCRIPT_KEY,
        process.env.PARSE_MASTER_KEY,
    );
    Parse.serverURL = process.env.PARSE_SERVER_URL;
    Parse.Cloud.useMasterKey(); // Permet aux appels clients de ne pas nécessiter useMasterKey: true
    global.Parse = Parse;
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

// Importer la fonction principale (qui orchestrer les 3 noeuds)
const testSingleEmail = require("./01-testSingleEmail");

// Enregistrement de la Cloud Function Parse
info(
    "📧 Enregistrement Cloud Function: testSingleEmail",
    "test-single",
    "master",
);
Parse.Cloud.define("testSingleEmail", testSingleEmail);

info(
    "✅ Cloud Function testSingleEmail enregistrée avec succès",
    "test-single",
    "master",
);
info(
    "📌 Workflow structuré en 3 noeuds:",
    "test-single",
    "master",
);
info(
    "   1. 01-validateAndFetch.js    - Validation + récupération de la séquence",
    "test-single",
    "master",
);
info(
    "   2. 02-templateProcessing.js - Traitement du template (2 passes: [[variable]] → LLM)",
    "test-single",
    "master",
);
info(
    "   3. 03-sendEmail.js          - Envoi de l'email via Nodemailer",
    "test-single",
    "master",
);

// Séparateur visuel
info(
    "═════════════════════════════════════════════════════════════",
    "test-single",
    "master",
);

// Exporter la fonction pour une utilisation externe (ex: tests unitaires)
module.exports = { testSingleEmail };
