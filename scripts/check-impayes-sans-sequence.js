const Parse = require("parse/node");

Parse.initialize("adti-marki", null, "e2f4e4e89056af61dd95a71226fa0e51917313e09b68aca8bf434e5eb9bd8aa9");
Parse.serverURL = "https://dev.markidiags.com/api/parse";

async function main() {
    // 1. Compter les impayés sans séquence, non soldés, reste > 0
    const Impaye = Parse.Object.extend("Impaye");
    const querySansSeq = new Parse.Query(Impaye);
    querySansSeq.doesNotExist("sequence");
    querySansSeq.equalTo("facture_soldee", false);
    querySansSeq.greaterThan("reste_a_payer", 0);
    const countSansSeq = await querySansSeq.count({ useMasterKey: true });

    // 2. Compter les impayés avec séquence, non soldés, reste > 0
    const queryAvecSeq = new Parse.Query(Impaye);
    queryAvecSeq.exists("sequence");
    queryAvecSeq.equalTo("facture_soldee", false);
    queryAvecSeq.greaterThan("reste_a_payer", 0);
    const countAvecSeq = await queryAvecSeq.count({ useMasterKey: true });

    // 3. Séquences avec attribution automatique
    const Sequence = Parse.Object.extend("Sequence");
    const seqQuery = new Parse.Query(Sequence);
    seqQuery.equalTo("attribution_automatique", true);
    seqQuery.equalTo("publiee", true);
    const sequences = await seqQuery.find({ useMasterKey: true });

    console.log("=== IMPAYÉS ===");
    console.log(`Sans séquence (actifs)  : ${countSansSeq}`);
    console.log(`Avec séquence (actifs)  : ${countAvecSeq}`);
    console.log(`Total actifs            : ${countSansSeq + countAvecSeq}`);

    console.log("\n=== SÉQUENCES AUTO ===");
    console.log(`Séquences publiées avec attribution auto : ${sequences.length}`);
    for (const seq of sequences) {
        const emails = seq.get("emails") || [];
        console.log(`  - ${seq.id}: "${seq.get("nom")}" | ${emails.length} email(s) | groupes: ${(seq.get("groupes_regles") || []).length}`);
    }

    // 4. Échantillon d'impayés sans séquence
    if (countSansSeq > 0) {
        const sampleQuery = new Parse.Query(Impaye);
        sampleQuery.doesNotExist("sequence");
        sampleQuery.equalTo("facture_soldee", false);
        sampleQuery.greaterThan("reste_a_payer", 0);
        sampleQuery.include("contact_relance");
        sampleQuery.limit(20);
        sampleQuery.descending("createdAt");
        const sample = await sampleQuery.find({ useMasterKey: true });
        console.log("\n=== ÉCHANTILLON IMPAYÉS SANS SÉQUENCE (20 derniers) ===");
        for (const imp of sample) {
            const contact = imp.get("contact_relance");
            console.log(`  ${imp.id} | nfacture=${imp.get("nfacture")} | ref=${imp.get("reference")} | reste=${imp.get("reste_a_payer")} | contact=${contact ? contact.get("email") : "N/A"} | type=${contact ? contact.get("type_personne") : "N/A"}`);
        }
    }

    // 5. Vérifier les logs d'attribution récents
    const Log = Parse.Object.extend("AppliquerReglesAttributionAutomatiqueLog");
    const logQuery = new Parse.Query(Log);
    logQuery.descending("createdAt");
    logQuery.limit(50);
    const logs = await logQuery.find({ useMasterKey: true });
    console.log("\n=== 50 DERNIERS LOGS D'ATTRIBUTION AUTO ===");
    const stats = { success: 0, failed: 0 };
    for (const log of logs) {
        const status = log.get("status");
        stats[status] = (stats[status] || 0) + 1;
    }
    console.log(`Succès: ${stats.success || 0}, Échecs: ${stats.failed || 0}`);
}

main().catch(console.error);
