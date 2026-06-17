// backend/cloud/workflows/generate-relances/01-replaceVariables.js
// Étape 1 : Remplace les variables [[var]] par les valeurs connues avant génération LLM
// ⚠️ ÉTAPE DÉSACTIVÉE

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
 * Étape 1 : Désactivée - ne traite aucune relance
 * @returns {Promise<Object>} { stats }
 */
async function replaceVariables() {
    const stats = {
        processed: 0,
        updated: 0,
        errors: 0,
        erreurs: [],
    };

    info("⚠️ ÉTAPE 1 EN PAUSE : Le remplacement des variables est temporairement désactivé.", "generate-relances", "replaceVariables");
    info("Aucune relance ne sera traitée. Pour réactiver, modifiez le code.", "generate-relances", "replaceVariables");

    return { stats };
}

module.exports = replaceVariables;
