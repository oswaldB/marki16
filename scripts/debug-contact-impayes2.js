// Script debug 2 : cherche les factures par numéro et par email
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

async function debug() {
    const contactId = process.argv[2] || "Rev2j7FvL3";

    // 1. Récupérer le contact
    const Contact = Parse.Object.extend("Contact");
    const contact = await new Parse.Query(Contact).get(contactId, { useMasterKey: true });
    const email = contact.get("email");
    const nom = contact.get("nom");
    console.log("Contact:", contact.id, "| nom:", nom, "| email:", email);

    // 2. Chercher d'autres contacts avec le même email
    console.log("\n=== Contacts avec le même email ===");
    const qSameEmail = new Parse.Query(Contact);
    qSameEmail.equalTo("email", email);
    qSameEmail.limit(100);
    const sameEmailContacts = await qSameEmail.find({ useMasterKey: true });
    console.log(`Trouvé ${sameEmailContacts.length} contact(s) avec email ${email}:`);
    sameEmailContacts.forEach(c => {
        console.log(`  - ${c.id} | nom=${c.get("nom")} | type=${c.get("type")}`);
    });

    // 3. Chercher les impayés avec ces contacts comme payeur
    const Impaye = Parse.Object.extend("Impaye");
    for (const c of sameEmailContacts) {
        const qImp = new Parse.Query(Impaye);
        qImp.equalTo("payeur", c);
        qImp.notEqualTo("facture_soldee", true);
        qImp.greaterThan("reste_a_payer", 0);
        qImp.limit(100);
        const impayes = await qImp.find({ useMasterKey: true });
        console.log(`\n=== Impayés pour contact ${c.id} (${c.get("nom")}) ===`);
        console.log(`Count: ${impayes.length}`);
        impayes.forEach(i => {
            console.log(`  - ${i.id} | nfacture=${i.get("nfacture")} | ref=${i.get("ref_piece")} | reste=${i.get("reste_a_payer")}`);
        });
    }

    // 4. Chercher les impayés par numéro de facture
    const factureNums = ["51182","51156","51147","51190","51254","51323","51420"];
    console.log(`\n=== Recherche par numéros de facture ===`);
    for (const num of factureNums) {
        const q = new Parse.Query(Impaye);
        q.equalTo("nfacture", num);
        q.limit(10);
        const results = await q.find({ useMasterKey: true });
        if (results.length > 0) {
            results.forEach(i => {
                const payeurId = i.get("payeur")?.id;
                console.log(`  nfacture=${num} | id=${i.id} | ref=${i.get("ref_piece")} | reste=${i.get("reste_a_payer")} | payeur=${payeurId}`);
            });
        } else {
            console.log(`  nfacture=${num} : NON TROUVÉ`);
        }
    }

    // 5. Chercher par ref_piece
    const refPieces = ["FA260624 51182","FA260618 51156","FA260617 51147","FA260625 51190","FA260707 51254","FA260723 51323","FA260813 51420"];
    console.log(`\n=== Recherche par ref_piece ===`);
    for (const ref of refPieces) {
        const q = new Parse.Query(Impaye);
        q.equalTo("ref_piece", ref);
        q.limit(10);
        const results = await q.find({ useMasterKey: true });
        if (results.length > 0) {
            results.forEach(i => {
                const payeurId = i.get("payeur")?.id;
                console.log(`  ref=${ref} | id=${i.id} | reste=${i.get("reste_a_payer")} | payeur=${payeurId}`);
            });
        } else {
            console.log(`  ref=${ref} : NON TROUVÉ`);
        }
    }

    process.exit(0);
}

debug().catch(err => {
    console.error(err);
    process.exit(1);
});
