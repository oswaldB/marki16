// backend/cloud/workflows/test-single/00-master.js
// Cloud Function: Test single email workflow

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
    Parse.Cloud.useMasterKey();
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

const testSingleEmail = require("./01-testSingleEmail");

// Enregistrement de la Cloud Function Parse
info(
    "📧 Enregistrement Cloud Function: testSingleEmail",
    "test-single",
    "master",
);
Parse.Cloud.define("testSingleEmail", testSingleEmail);

info(
    "\n═════════════════════════════════════════════════════════════",
    "test-single",
    "master",
);
info(
    "✅ Cloud Function testSingleEmail enregistrée avec succès",
    "test-single",
    "master",
);
info(
    "═════════════════════════════════════════════════════════════",
    "test-single",
    "master",
);

module.exports = { testSingleEmail };
