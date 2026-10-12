#!/usr/bin/env node
/**
 * Script autonome : suppression de TOUTES les relances non envoyées dans Parse.
 *
 * Ce script est conçu pour être exécuté une fois (ou ponctuellement) avant
 * la mise en place du nouveau système "juste-à-temps".
 *
 * Critère de suppression : statut != "Envoyé"
 *
 * Usage :
 *   node cleanup-relances-non-envoyees.js [--dry-run]
 *
 * Options :
 *   --dry-run    Affiche le nombre de relances concernées sans les supprimer.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const Parse = require("parse/node");

// ─── Configuration Parse ──────────────────────────────────────────────────────
const APP_ID = process.env.PARSE_APP_ID || "adti-marki";
const MASTER_KEY = process.env.PARSE_MASTER_KEY;
const SERVER_URL = process.env.PARSE_SERVER_URL || "http://localhost:1556/api/parse";

Parse.initialize(APP_ID, null, MASTER_KEY);
Parse.serverURL = SERVER_URL;
Parse.Cloud.useMasterKey();

// ─── Arguments ────────────────────────────────────────────────────────────────
const DRY_RUN = process.argv.includes("--dry-run");

// ─── Fonction principale ──────────────────────────────────────────────────────
async function cleanupRelancesNonEnvoyees() {
    const startedAt = new Date();
    console.log(`🗑️  DÉBUT : suppression des relances non envoyées`);
    console.log(`   Mode dry-run : ${DRY_RUN ? "OUI (pas de suppression)" : "NON"}`);
    console.log(`   Parse Server : ${SERVER_URL}`);
    console.log(`   Heure        : ${startedAt.toISOString()}`);
    console.log("".padStart(60, "─"));

    try {
        // ─── Étape 1 : compter toutes les relances non envoyées ───────────────────
        const Relance = Parse.Object.extend("Relance");
        const countQuery = new Parse.Query(Relance);
        countQuery.notEqualTo("statut", "Envoyée");
        const totalCount = await countQuery.count({ useMasterKey: true });

        console.log(`📊 Relances non envoyées trouvées : ${totalCount}`);

        if (totalCount === 0) {
            console.log("✅ Aucune relance à supprimer.");
            process.exit(0);
        }

        if (DRY_RUN) {
            console.log("🚫 DRY-RUN activé — aucune suppression effectuée.");
            console.log(`   → Pour supprimer réellement, relancez sans --dry-run`);
            process.exit(0);
        }

        // ─── Confirmation utilisateur ───────────────────────────────────────────
        console.log("⚠️  Vous allez SUPPRIMER définitivement les relances non envoyées.");
        console.log(`   Cette opération est irréversible.`);

        // En mode non-interactif (CI, cron), on suppose que l'utilisateur
        // sait ce qu'il fait. On saute la confirmation.
        if (process.stdin.isTTY) {
            const readline = require("readline");
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            const answer = await new Promise((resolve) => {
                rl.question("Confirmer la suppression (oui/NON) : ", (a) => {
                    rl.close();
                    resolve(a.trim().toLowerCase());
                });
            });
            if (answer !== "oui") {
                console.log("❌ Suppression annulée.");
                process.exit(0);
            }
        } else {
            console.log("   (mode non-interactif — confirmation automatique)");
        }

        // ─── Étape 2 : suppression par lots ──────────────────────────────────────
        console.log("🔄 Suppression en cours...");
        let deletedCount = 0;
        let batchCount = 0;
        const BATCH_SIZE = 100;

        while (true) {
            const query = new Parse.Query(Relance);
            query.notEqualTo("statut", "Envoyée");
            query.limit(BATCH_SIZE);

            const relances = await query.find({ useMasterKey: true });

            if (relances.length === 0) break;

            // Parse ne supporte pas destroyAll en batch natif → boucle
            for (const relance of relances) {
                try {
                    await relance.destroy({ useMasterKey: true });
                    deletedCount++;
                } catch (destroyErr) {
                    console.error(`   ❌ Erreur suppression ${relance.id} : ${destroyErr.message}`);
                }
            }

            batchCount++;
            console.log(`   Lot ${batchCount} : ${relances.length} relances supprimées (total : ${deletedCount}/${totalCount})`);
        }

        // ─── Récapitulatif ───────────────────────────────────────────────────────
        const finishedAt = new Date();
        const durationMs = finishedAt - startedAt;

        console.log("".padStart(60, "─"));
        console.log("✅ OPÉRATION TERMINÉE");
        console.log(`   Relances supprimées : ${deletedCount} / ${totalCount}`);
        console.log(`   Durée              : ${durationMs} ms`);
        console.log(`   Terminé à          : ${finishedAt.toISOString()}`);

    } catch (error) {
        console.error("❌ Erreur fatale :", error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// ─── Exécution ─────────────────────────────────────────────────────────────────
cleanupRelancesNonEnvoyees().then(() => process.exit(0));
