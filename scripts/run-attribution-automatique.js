#!/usr/bin/env node
/**
 * Lance l'attribution automatique des séquences sur tous les impayés sans séquence
 * Usage: node scripts/run-attribution-automatique.js
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

const { appliquerReglesAttributionAutomatique } = require("../backend/cloud/workflows/appliquer-regles-attribution/01-appliquerReglesAttributionAutomatique");

(async () => {
    console.log("🚀 Lancement de l'attribution automatique des séquences...");

    try {
        const Impaye = Parse.Object.extend("Impaye");
        const query = new Parse.Query(Impaye);
        query.equalTo("facture_soldee", false);
        query.greaterThan("reste_a_payer", 0);
        query.doesNotExist("sequence");
        query.limit(999999);

        const impayes = await query.find({ useMasterKey: true });
        console.log(`📋 ${impayes.length} impayés sans séquence trouvés`);

        if (impayes.length === 0) {
            console.log("✅ Aucun impayé à traiter.");
            process.exit(0);
        }

        let attribues = 0;
        let nonAttribues = 0;
        let erreurs = 0;

        for (let i = 0; i < impayes.length; i++) {
            const impaye = impayes[i];
            console.log(`[${i + 1}/${impayes.length}] Traitement impayé ${impaye.id}...`);

            try {
                const sequence = await appliquerReglesAttributionAutomatique(impaye);
                if (sequence) {
                    attribues++;
                    console.log(`  ✅ Séquence attribuée: ${sequence.id}`);
                } else {
                    nonAttribues++;
                    console.log(`  ❌ Aucune séquence correspondante`);
                }
            } catch (err) {
                erreurs++;
                console.error(`  💥 Erreur: ${err.message}`);
            }
        }

        console.log("\n═══════════════════════════════════════");
        console.log("📊 RÉSULTAT ATTRIBUTION AUTOMATIQUE");
        console.log(`   Total traités : ${impayes.length}`);
        console.log(`   ✅ Attribués   : ${attribues}`);
        console.log(`   ❌ Non trouvés : ${nonAttribues}`);
        console.log(`   💥 Erreurs     : ${erreurs}`);
        console.log("═══════════════════════════════════════");

        process.exit(0);
    } catch (err) {
        console.error("\n❌ Erreur fatale:", err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();
