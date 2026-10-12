// Script temporaire pour lancer manuellement le workflow send-emails
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const Parse = require("parse/node");

Parse.initialize(
    process.env.PARSE_APP_ID || "adti-marki",
    process.env.PARSE_JAVASCRIPT_KEY || "",
    process.env.PARSE_MASTER_KEY || "e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9"
);
Parse.serverURL = "http://localhost:1556/api/parse";

global.Parse = Parse;

const sendEmailsMaster = require("../backend/cloud/workflows/send-emails/00-master");

console.log("🚀 Lancement manuel de send-emails...");
sendEmailsMaster({ trigger: "manual" })
    .then((result) => {
        console.log("✅ send-emails terminé:", JSON.stringify(result, null, 2));
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Erreur send-emails:", error.message);
        console.error(error.stack);
        process.exit(1);
    });
