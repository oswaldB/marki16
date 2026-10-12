// Script debug : vérifie les impayés liés à un contact
require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const Parse = require("../backend/node_modules/parse/node");

Parse.initialize(
    process.env.PARSE_APP_ID,
    process.env.PARSE_JAVASCRIPT_KEY,
    process.env.PARSE_MASTER_KEY
);
Parse.serverURL = "http://localhost:1556/api/parse";
Parse.Cloud.useMasterKey();
global.Parse = Parse;

async function debugContactImpayes(contactId) {
    try {
        // 1. Récupérer le contact
        const Contact = Parse.Object.extend("Contact");
        const contact = await new Parse.Query(Contact).get(contactId, { useMasterKey: true });
        console.log("=== CONTACT ===");
        console.log("ID:", contact.id);
        console.log("Nom:", contact.get("nom"));
        console.log("Email:", contact.get("email"));
        console.log("Type:", contact.get("type"));
        console.log("");

        // 2. Impayés avec pointeur 'payeur' vers ce contact
        const Impaye = Parse.Object.extend("Impaye");
        const qPayeur = new Parse.Query(Impaye);
        qPayeur.equalTo("payeur", contact);
        qPayeur.limit(1000);
        const payeurImpayes = await qPayeur.find({ useMasterKey: true });
        console.log(`=== IMPAYÉS avec payeur=${contactId} ===`);
        console.log(`Count: ${payeurImpayes.length}`);
        payeurImpayes.forEach(i => {
            console.log(`  - ${i.id} | nfacture=${i.get("nfacture")} | ref_piece=${i.get("ref_piece")} | reste=${i.get("reste_a_payer")} | soldee=${i.get("facture_soldee")}`);
        });
        console.log("");

        // 3. Impayés avec pointeur 'proprietaire' vers ce contact
        const qProp = new Parse.Query(Impaye);
        qProp.equalTo("proprietaire", contact);
        qProp.limit(1000);
        const propImpayes = await qProp.find({ useMasterKey: true });
        console.log(`=== IMPAYÉS avec proprietaire=${contactId} ===`);
        console.log(`Count: ${propImpayes.length}`);
        propImpayes.forEach(i => {
            console.log(`  - ${i.id} | nfacture=${i.get("nfacture")} | ref_piece=${i.get("ref_piece")} | reste=${i.get("reste_a_payer")} | soldee=${i.get("facture_soldee")}`);
        });
        console.log("");

        // 4. Impayés avec pointeur 'locataire' vers ce contact
        const qLoc = new Parse.Query(Impaye);
        qLoc.equalTo("locataire", contact);
        qLoc.limit(1000);
        const locImpayes = await qLoc.find({ useMasterKey: true });
        console.log(`=== IMPAYÉS avec locataire=${contactId} ===`);
        console.log(`Count: ${locImpayes.length}`);
        locImpayes.forEach(i => {
            console.log(`  - ${i.id} | nfacture=${i.get("nfacture")} | ref_piece=${i.get("ref_piece")} | reste=${i.get("reste_a_payer")} | soldee=${i.get("facture_soldee")}`);
        });
        console.log("");

        // 5. Impayés avec n'importe quel pointeur vers ce contact (OR query)
        const qOr = Parse.Query.or(qPayeur, qProp, qLoc);
        qOr.limit(1000);
        const orImpayes = await qOr.find({ useMasterKey: true });
        console.log(`=== IMPAYÉS avec payeur OU proprietaire OU locataire=${contactId} ===`);
        console.log(`Count: ${orImpayes.length}`);
        orImpayes.forEach(i => {
            const payeurId = i.get("payeur")?.id;
            const propId = i.get("proprietaire")?.id;
            const locId = i.get("locataire")?.id;
            console.log(`  - ${i.id} | nfacture=${i.get("nfacture")} | ref_piece=${i.get("ref_piece")} | reste=${i.get("reste_a_payer")} | soldee=${i.get("facture_soldee")} | payeur=${payeurId} | prop=${propId} | loc=${locId}`);
        });
        console.log("");

        // 6. Tous les impayés non soldés sans filtre contact
        const qAll = new Parse.Query(Impaye);
        qAll.notEqualTo("facture_soldee", true);
        qAll.greaterThan("reste_a_payer", 0);
        qAll.limit(20);
        qAll.descending("createdAt");
        const allImpayes = await qAll.find({ useMasterKey: true });
        console.log(`=== ÉCHANTILLON impayés non soldés (total > 20) ===`);
        console.log(`Count sample: ${allImpayes.length}`);
        allImpayes.forEach(i => {
            const payeurId = i.get("payeur")?.id;
            console.log(`  - ${i.id} | nfacture=${i.get("nfacture")} | ref_piece=${i.get("ref_piece")} | reste=${i.get("reste_a_payer")} | payeur=${payeurId}`);
        });

    } catch (err) {
        console.error("❌ Erreur:", err.message);
        console.error(err.stack);
    }
    process.exit(0);
}

const contactId = process.argv[2] || "Rev2j7FvL3";
debugContactImpayes(contactId);
