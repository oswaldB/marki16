// Configuration des tâches cron pour l'exécution automatique des workflows
// Heure de Paris (CET/CEST) = UTC+1 ou UTC+2 selon l'heure d'été

const cron = require("node-cron");
const path = require("path");

// Initialiser Parse si nécessaire
if (typeof Parse === "undefined") {
    const Parse = require("parse/node");
    Parse.initialize(
        process.env.PARSE_APP_ID || "marki15-app-id",
        process.env.PARSE_JAVASCRIPT_KEY || "",
        process.env.PARSE_MASTER_KEY || "marki15-master-key",
    );
    Parse.serverURL =
        process.env.PARSE_SERVER_URL || "http://localhost:1555/parse";
    Parse.Cloud.useMasterKey();
    global.Parse = Parse;
}

// Charger les masters des workflows
const importInvoicesMaster = require("./cloud/workflows/import-invoice/00-master");
const sendEmailsMaster = require("./cloud/workflows/send-emails/00-master");
const verifyPaidInvoicesMaster = require("./cloud/workflows/verify-paid-invoices/00-master");
const generateSuivisMaster = require("./cloud/workflows/generate-suivi/00-master");

// Utilitaires pour le nettoyage des fichiers temporaires
const fs = require("fs");
const TEMP_DIR = "/tmp/adti-invoices";
const FILE_RETENTION_HOURS = 24; // Garder les fichiers 24h

/**
 * Nettoie les fichiers temporaires trop anciens
 */
function cleanupTempFiles() {
    try {
        if (!fs.existsSync(TEMP_DIR)) return;
        const now = Date.now();
        const retentionMs = FILE_RETENTION_HOURS * 60 * 60 * 1000;
        const files = fs.readdirSync(TEMP_DIR);
        let deletedCount = 0;
        for (const file of files) {
            const filePath = path.join(TEMP_DIR, file);
            try {
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > retentionMs) {
                    fs.unlinkSync(filePath);
                    deletedCount++;
                    console.log(`[cleanupTempFiles] Supprimé: ${file}`);
                }
            } catch (err) {
                console.warn(
                    `[cleanupTempFiles] Erreur avec ${file}:`,
                    err.message,
                );
            }
        }
        console.log(
            `[cleanupTempFiles] Nettoyage terminé: ${deletedCount} fichiers supprimés`,
        );
        return deletedCount;
    } catch (err) {
        console.error("[cleanupTempFiles] Erreur:", err.message);
        return 0;
    }
}

console.log("📅 Configuration des tâches cron...");

// 1. IMPORT INVOICE : Tous les jours à minuit
cron.schedule(
    "0 0 * * *",
    () => {
        console.log("⏰ [CRON] Déclenchement: import-invoice (minuit)");
        importInvoicesMaster({ trigger: "cron" })
            .then(() => console.log("✅ [CRON] import-invoice terminé"))
            .catch((error) =>
                console.error(
                    "❌ [CRON] Erreur import-invoice:",
                    error.message,
                ),
            );
    },
    { scheduled: true, timezone: "Europe/Paris" },
);

// 2. SEND EMAILS : Tous les jours à 18h
cron.schedule(
    "0 18 * * *",
    () => {
        console.log("⏰ [CRON] Déclenchement: send-emails (18h)");
        sendEmailsMaster({ trigger: "cron" })
            .then(() => console.log("✅ [CRON] send-emails terminé"))
            .catch((error) =>
                console.error("❌ [CRON] Erreur send-emails:", error.message),
            );
    },
    { scheduled: true, timezone: "Europe/Paris" },
);

// 3. VERIFY PAID INVOICES : Toutes les heures à hh:50
cron.schedule(
    "50 * * * *",
    () => {
        console.log("⏰ [CRON] Déclenchement: verify-paid-invoices (hh:50)");
        verifyPaidInvoicesMaster({ trigger: "cron" })
            .then(() => console.log("✅ [CRON] verify-paid-invoices terminé"))
            .catch((error) =>
                console.error(
                    "❌ [CRON] Erreur verify-paid-invoices:",
                    error.message,
                ),
            );
    },
    { scheduled: true, timezone: "Europe/Paris" },
);

// 4. GENERATE SUIVI : Tous les jours à 1h
cron.schedule(
    "0 1 * * *",
    () => {
        console.log("⏰ [CRON] Déclenchement: generate-suivi (1h)");
        generateSuivisMaster({ trigger: "cron" })
            .then(() => console.log("✅ [CRON] generate-suivi terminé"))
            .catch((error) =>
                console.error(
                    "❌ [CRON] Erreur generate-suivi:",
                    error.message,
                ),
            );
    },
    { scheduled: true, timezone: "Europe/Paris" },
);

// 5. CLEANUP TEMP FILES : Tous les jours à 2h
cron.schedule(
    "0 2 * * *",
    () => {
        console.log("⏰ [CRON] Déclenchement: cleanup-temp-files (2h)");
        cleanupTempFiles();
    },
    { scheduled: true, timezone: "Europe/Paris" },
);

function setupCronJobs() {
    console.log("✅ Tâches cron initialisées");
}

module.exports = { setupCronJobs };
console.log("✅ Fichier cron.js chargé - tâches planifiées activées");
