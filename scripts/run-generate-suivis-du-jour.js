#!/usr/bin/env node
/**
 * Exécute directement le workflow generate-suivis-du-jour sans passer par le serveur HTTP.
 * Charge les variables d'environnement depuis le .env racine.
 *
 * Usage: node scripts/run-generate-suivis-du-jour.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Parse = require(path.join(__dirname, "..", "backend", "node_modules", "parse", "node"));

Parse.initialize(
    process.env.PARSE_APP_ID || "adti-marki",
    process.env.PARSE_JAVASCRIPT_KEY || "",
    process.env.PARSE_MASTER_KEY || ""
);
Parse.serverURL = "http://localhost:1556/api/parse";
global.Parse = Parse;

const generateSuivisDuJour = require("../backend/cloud/workflows/generate-suivis-du-jour/index");

(async () => {
    console.log("🚀 Lancement direct du workflow generate-suivis-du-jour...");
    try {
        const result = await generateSuivisDuJour();
        console.log("\n✅ Workflow terminé avec succès");
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Erreur lors de l'exécution du workflow:", err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
