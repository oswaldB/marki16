require("dotenv").config({ path: "/home/ubuntu/prod/adti/backend/.env" });

const Parse = require("parse/node");

const APP_ID = process.env.PARSE_APP_ID || "adti-marki";
const MASTER_KEY = process.env.PARSE_MASTER_KEY;
const SERVER_URL = "http://localhost:1556/api/parse";

Parse.initialize(APP_ID, null, MASTER_KEY);
Parse.serverURL = SERVER_URL;

async function cleanup() {
    const Relance = Parse.Object.extend("Relance");
    const q = new Parse.Query(Relance);
    q.equalTo("statut", "pret pour envoi");
    q.equalTo("manuelle", false);
    q.limit(99999);

    const results = await q.find({ useMasterKey: true });
    console.log(`Suppression de ${results.length} relances "pret pour envoi"...`);

    let supprimees = 0;
    for (const r of results) {
        try {
            await r.destroy({ useMasterKey: true });
            supprimees++;
        } catch (e) {
            console.error(`Erreur suppression ${r.id}: ${e.message}`);
        }
    }
    console.log(`✅ ${supprimees}/${results.length} relances supprimées`);
}

cleanup().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
});
