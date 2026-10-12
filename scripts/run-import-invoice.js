#!/usr/bin/env node
/**
 * Exécute directement le workflow import-invoice sans passer par le serveur HTTP.
 * Charge les variables d'environnement depuis le .env racine.
 *
 * Usage: node scripts/run-import-invoice.js
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const importInvoicesMaster = require("../backend/cloud/workflows/import-invoice/00-master");

(async () => {
    console.log("🚀 Lancement direct du workflow import-invoice...");
    try {
        const result = await importInvoicesMaster({ trigger: "manual-cli" });
        console.log("\n✅ Workflow terminé avec succès");
        console.log(JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Erreur lors de l'exécution du workflow:", err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
