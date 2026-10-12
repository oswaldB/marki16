require("dotenv").config({ path: "/home/ubuntu/prod/adti/backend/.env" });

const Parse = require("parse/node");

const APP_ID = process.env.PARSE_APP_ID || "adti-marki";
const MASTER_KEY = process.env.PARSE_MASTER_KEY;
const SERVER_URL = "http://localhost:1556/api/parse"; // Forcer localhost

Parse.initialize(APP_ID, null, MASTER_KEY);
Parse.serverURL = SERVER_URL;

async function cleanupDoublons() {
    const Relance = Parse.Object.extend("Relance");
    const q = new Parse.Query(Relance);
    q.equalTo("statut", "pret pour envoi");
    q.equalTo("manuelle", false);
    q.limit(99999);
    q.include("contact");
    q.include("sequence");

    const results = await q.find({ useMasterKey: true });
    console.log(`Total relances à analyser: ${results.length}`);

    // Grouper par contactId + sequenceId + email_index
    const map = new Map();
    for (const r of results) {
        const contact = r.get("contact");
        const sequence = r.get("sequence");
        const key = `${contact?.id || 'null'}_${sequence?.id || 'null'}_${r.get('email_index')}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(r);
    }

    let doublons = 0;
    let supprimees = 0;
    const aSupprimer = [];

    for (const [key, relances] of map) {
        if (relances.length > 1) {
            doublons++;
            // Trier par createdAt décroissant, garder la première (plus récente)
            relances.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const garder = relances[0];
            const jeter = relances.slice(1);
            console.log(`Doublon ${key}: ${relances.length} relances, garde ${garder.id}, supprime ${jeter.map(r => r.id).join(', ')}`);
            for (const r of jeter) {
                aSupprimer.push(r);
            }
        }
    }

    if (aSupprimer.length === 0) {
        console.log("✅ Aucun doublon à nettoyer");
        return;
    }

    console.log(`\nSuppression de ${aSupprimer.length} relances doublons...`);
    for (const r of aSupprimer) {
        try {
            await r.destroy({ useMasterKey: true });
            supprimees++;
        } catch (e) {
            console.error(`❌ Erreur suppression ${r.id}: ${e.message}`);
        }
    }
    console.log(`✅ ${supprimees}/${aSupprimer.length} doublons supprimés`);
}

cleanupDoublons().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
