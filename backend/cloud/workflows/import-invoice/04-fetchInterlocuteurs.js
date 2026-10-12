// backend/cloud/workflows/import-invoice/04-fetchInterlocuteurs.js
// Étape 4 : Récupère les interlocuteurs par dossier
// Retourne : { interlocuteursByDossier: {} }

const Database = require("better-sqlite3");

const { info, warn, error } = require("../../utils/logger");

// Initialiser Parse si nécessaire
if (typeof Parse === "undefined") {
    const Parse = require("parse/node");
    Parse.initialize(
        process.env.PARSE_APP_ID,
        process.env.PARSE_JAVASCRIPT_KEY,
        process.env.PARSE_MASTER_KEY,
    );
    Parse.serverURL = process.env.PARSE_SERVER_URL;
    Parse.Cloud.useMasterKey();
    global.Parse = Parse;
}

/**
 * Étape 4 : Récupère les interlocuteurs pour tous les dossiers
 * @param {Object} param0 - { pieces: [] }
 * @returns {Promise<Object>} { interlocuteursByDossier: {} }
 */
async function fetchInterlocuteurs({ pieces }) {
    const dbPath =
        process.env.NODE_ENV === "test" && process.env.TEST_DB_PATH
            ? process.env.TEST_DB_PATH
            : "/home/arthur/adti/sync.db";

    const db = new Database(dbPath);

    try {
        info(
            "Étape 4: Récupération des interlocuteurs par dossier",
            "import-invoice",
            "fetchInterlocuteurs",
        );

        // Extraire les dossierIds uniques des pièces
        const dossierIds = [
            ...new Set(
                pieces
                    .map((r) => r.dossier_id || r.idDossier)
                    .filter((id) => id != null),
            ),
        ];

        const interlocuteursByDossier = {};

        if (dossierIds.length > 0) {
            const interlocuteursRows = db
                .prepare(
                    `
        SELECT
          d.idDossier,
          di.idRole,
          di.idInterlocuteur as interlocuteur_id,
          di.idContact as contact_id,
          iloc.idInterlocuteur,
          iloc.typePersonne,
          iloc.nom,
          iloc.prenom,
          iloc.email,
          iloc.telephoneMobile as telephone,
          ilocContact.idInterlocuteur as contact_interlocuteur_id,
          ilocContact.typePersonne as contact_typePersonne,
          ilocContact.nom as contact_nom,
          ilocContact.prenom as contact_prenom,
          ilocContact.email as contact_email,
          role.intitule as role
        FROM _ADN_DIAG__Dossier d
        LEFT JOIN _ADN_DIAG__DossierInterlocuteur di ON d.idDossier = di.idDossier
        LEFT JOIN _ADN_RG_Interlocuteur iloc ON di.idInterlocuteur = iloc.idInterlocuteur
        LEFT JOIN _ADN_RG_Interlocuteur ilocContact ON di.idContact = ilocContact.idInterlocuteur
        LEFT JOIN _ADN_DIAG__RoleInterlocuteurDossier role ON di.idRole = role.idRole
        WHERE d.idDossier IN (${dossierIds.join(",")})
      `,
                )
                .all();

            interlocuteursRows.forEach((i) => {
                if (!interlocuteursByDossier[i.idDossier]) {
                    interlocuteursByDossier[i.idDossier] = [];
                }
                interlocuteursByDossier[i.idDossier].push(i);
            });
        }

        // ── Contacts par défaut (ERP) ─────────────────────────────────────
        // Source de vérité : _ADN_RG_Contact.isDefaut = 1, c.-à-d. le contact
        // « par défaut » d'un interlocuteur (une seule ligne par interlocuteur).
        // On résout l'email/téléphone sur la ligne _ADN_RG_Contact, puis en
        // repli sur l'interlocuteur lié via idMigrationInterlocuteur (l'email
        // de la ligne Contact est souvent vide alors que l'interlocuteur l'a).
        const contactsDefautInterlocuteur = {};
        const contactsDefautRows = db
            .prepare(
                `
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
      `,
            )
            .all();

        contactsDefautRows.forEach((row) => {
            contactsDefautInterlocuteur[String(row.idInterlocuteur)] = {
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
        });

        info(
            `Interlocuteurs chargés: ${Object.keys(interlocuteursByDossier).length} dossiers`,
            "import-invoice",
            "fetchInterlocuteurs",
            { dossiersCount: Object.keys(interlocuteursByDossier).length },
        );
        info(
            `Contacts par défaut chargés: ${Object.keys(contactsDefautInterlocuteur).length}`,
            "import-invoice",
            "fetchInterlocuteurs",
            { contactsDefautCount: Object.keys(contactsDefautInterlocuteur).length },
        );

        return {
            interlocuteursByDossier,
            contactsDefautInterlocuteur,
        };
    } catch (err) {
        error(
            `Erreur Étape 4: ${err.message}`,
            "import-invoice",
            "fetchInterlocuteurs",
            { error: err.message },
        );
        throw err;
    } finally {
        db.close();
    }
}

module.exports = fetchInterlocuteurs;
