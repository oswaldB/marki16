#!/usr/bin/env node
// Backfill du « contact par défaut » (ERP) sur les Contact Parse.
//
// Source de vérité : _ADN_RG_Contact.isDefaut = 1 (une seule ligne par
// interlocuteur). L'email/téléphone est résolu sur la ligne _ADN_RG_Contact,
// puis en repli sur l'interlocuteur lié via idMigrationInterlocuteur.
//
// Champs écrits sur Contact :
//   a_contact_defaut            (Boolean)
//   contact_defaut_externe_id   (String)
//   contact_defaut_nom          (String)
//   contact_defaut_prenom       (String)
//   contact_defaut_email        (String)
//   contact_defaut_telephone    (String)
//
// Usage:
//   node backfill-contact-defaut.js [--dry-run] [--all] [--limit=N]
//   (par défaut : uniquement les contacts référencés comme apporteur)

require("dotenv").config({ path: "/home/ubuntu/prod/adti/.env" });

const Database = require("better-sqlite3");
const Parse = require("parse/node");

const DB_PATH = process.env.SYNC_DB_PATH || "/home/arthur/adti/sync.db";

Parse.initialize(
    process.env.PARSE_APP_ID,
    process.env.PARSE_JAVASCRIPT_KEY,
    process.env.PARSE_MASTER_KEY,
);
// PARSE_SERVER_URL du .env pointe vers dev.markidiags.com/api/parse, qui n'est
// pas exposé publiquement. Ce script tourne sur l'hôte du backend : on utilise
// l'API locale (surchargeable via PARSE_SCRIPT_SERVER_URL).
Parse.serverURL =
    process.env.PARSE_SCRIPT_SERVER_URL || "http://localhost:1556/api/parse";
Parse.Cloud.useMasterKey();

const DEFAULT_CONTACTS_QUERY = `
  SELECT
    c.idInterlocuteur,
    c.idContact,
    c.nomContact,
    c.prenomContact,
    c.email,
    c.telephoneFixe,
    c.telephonePortable,
    c.idMigrationInterlocuteur,
    iloc.nom AS interlocuteur_nom,
    iloc.prenom AS interlocuteur_prenom,
    iloc.email AS interlocuteur_email,
    iloc.telephoneMobile AS interlocuteur_telephone_mobile,
    iloc.telephoneFixe AS interlocuteur_telephone_fixe
  FROM _ADN_RG_Contact c
  LEFT JOIN _ADN_RG_Interlocuteur iloc
    ON iloc.idInterlocuteur = c.idMigrationInterlocuteur
  WHERE c.isDefaut = 1
    AND (c.dateFin IS NULL OR c.dateFin = '')
`;

async function openDatabaseWithRetry(
    path,
    maxRetries = 5,
    retryDelayMs = 60000,
) {
    let attempt = 0;
    // sync.db est réécrite par la synchro ERP : elle peut être temporairement
    // « malformed ». On retente comme le fait l'import.
    // eslint-disable-next-line no-constant-condition
    while (true) {
        attempt++;
        try {
            const db = new Database(path);
            db.prepare("SELECT 1").get();
            return db;
        } catch (err) {
            if (
                attempt < maxRetries &&
                /malformed|disk image|locked|busy/i.test(err.message)
            ) {
                console.warn(
                    `sync.db indisponible (${err.message}) — nouvelle tentative dans ${retryDelayMs / 1000}s (${attempt}/${maxRetries})`,
                );
                await new Promise((r) => setTimeout(r, retryDelayMs));
                continue;
            }
            throw err;
        }
    }
}

async function fetchContactsDefautMap() {
    const db = await openDatabaseWithRetry(DB_PATH);
    try {
        const rows = db.prepare(DEFAULT_CONTACTS_QUERY).all();
        const map = {};
        for (const row of rows) {
            map[String(row.idInterlocuteur)] = {
                externe_id: String(
                    row.idMigrationInterlocuteur || row.idContact,
                ),
                nom: row.nomContact || row.interlocuteur_nom || null,
                prenom: row.prenomContact || row.interlocuteur_prenom || null,
                email: row.email || row.interlocuteur_email || null,
                telephone:
                    row.telephonePortable ||
                    row.telephoneFixe ||
                    row.interlocuteur_telephone_mobile ||
                    row.interlocuteur_telephone_fixe ||
                    null,
            };
        }
        return map;
    } finally {
        db.close();
    }
}

function applyContactDefaut(contact, contactDefaut) {
    contact.set("a_contact_defaut", Boolean(contactDefaut));
    if (contactDefaut) {
        contact.set(
            "contact_defaut_externe_id",
            contactDefaut.externe_id || null,
        );
        contact.set("contact_defaut_nom", contactDefaut.nom || null);
        contact.set("contact_defaut_prenom", contactDefaut.prenom || null);
        contact.set("contact_defaut_email", contactDefaut.email || null);
        contact.set(
            "contact_defaut_telephone",
            contactDefaut.telephone || null,
        );
    } else {
        contact.unset("contact_defaut_externe_id");
        contact.unset("contact_defaut_nom");
        contact.unset("contact_defaut_prenom");
        contact.unset("contact_defaut_email");
        contact.unset("contact_defaut_telephone");
    }
}

async function fetchContactsToBackfill({ all, limit }) {
    const Contact = Parse.Object.extend("Contact");
    const query = new Parse.Query(Contact);
    query.equalTo("source", "db_externe");
    query.exists("externe_id");
    query.limit(limit || 10000);
    query.select(["externe_id", "nom", "prenom", "type_personne"]);

    if (!all) {
        // Par défaut : ne traiter que les contacts référencés comme apporteur
        // d'au moins un impayé. Suffisant pour l'onglet et bien moins lourd.
        const Impaye = Parse.Object.extend("Impaye");
        const impayeQuery = new Parse.Query(Impaye);
        impayeQuery.exists("apporteur");
        impayeQuery.limit(10000);
        impayeQuery.select(["apporteur"]);

        const impayes = await impayeQuery.find({ useMasterKey: true });
        const apporteurIds = [
            ...new Set(
                impayes
                    .map((i) => i.get("apporteur") && i.get("apporteur").id)
                    .filter(Boolean),
            ),
        ];
        query.containedIn("objectId", apporteurIds);
        query.limit(apporteurIds.length || 1);
    }

    return query.find({ useMasterKey: true });
}

async function main() {
    const dryRun = process.argv.includes("--dry-run");
    const all = process.argv.includes("--all");
    const limitArg = process.argv.find((a) => a.startsWith("--limit="));
    const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : null;

    console.log(
        `Backfill contact par défaut — dryRun=${dryRun} perimetre=${all ? "tous les contacts db_externe" : "apporteurs uniquement"} limit=${limit || "∞"}`,
    );

    const defautMap = await fetchContactsDefautMap();
    console.log(
        `${Object.keys(defautMap).length} contacts par défaut trouvés dans sync.db`,
    );

    const contacts = await fetchContactsToBackfill({ all, limit });
    console.log(`${contacts.length} contacts Parse à traiter`);

    const stats = { avecDefaut: 0, sansDefaut: 0, erreurs: 0 };

    const toSave = [];
    for (const contact of contacts) {
        const externeId = contact.get("externe_id");
        const contactDefaut = defautMap[String(externeId)] || null;
        if (contactDefaut) stats.avecDefaut++;
        else stats.sansDefaut++;
        applyContactDefaut(contact, contactDefaut);
        toSave.push(contact);
    }

    if (dryRun) {
        console.log("Mode dry-run : aucune écriture.", stats);
        return;
    }

    const batchSize = 100;
    for (let i = 0; i < toSave.length; i += batchSize) {
        const batch = toSave.slice(i, i + batchSize);
        try {
            await Parse.Object.saveAll(batch, {
                useMasterKey: true,
                batchSize: 50,
            });
        } catch (err) {
            stats.erreurs += batch.length;
            console.error(
                `Erreur batch ${i / batchSize + 1}: ${err.message}`,
            );
        }
        console.log(
            `Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toSave.length / batchSize)} traité`,
        );
    }

    console.log("Backfill terminé.", stats);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("Erreur fatale:", err.message);
        process.exit(1);
    });
