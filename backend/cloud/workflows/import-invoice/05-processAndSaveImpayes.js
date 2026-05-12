// backend/cloud/workflows/import-invoice/05-processAndSaveImpayes.js
// Étape 5 : Traite et sauvegarde les impayés dans Parse
// Input: { pieces, statutsMap, employesMap, interlocuteursByDossier, state }
// Output: { stats, state }

const fs = require("fs");
const path = require("path");

const { info, warn, error, debug } = require("../../utils/logger");

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

const STATE_FILE = path.join(__dirname, "state", "sync-state.json");

// Month names in French for URL building
let MOIS_FR = [
    "janvier",
    "fevrier",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "aout",
    "septembre",
    "octobre",
    "novembre",
    "decembre",
];

function buildUrlPdf(refPiece, datePiece) {
    if (!refPiece || !datePiece) return null;
    let d = new Date(datePiece);
    if (isNaN(d.getTime())) return null;
    let year = d.getFullYear();
    let month = MOIS_FR[d.getMonth()];
    let refClean = String(refPiece).replace(/\s+/g, "_");
    return `/ADN/Reporting/Gco/Piece/${year}/${month}/${refClean}/standard/${refPiece} (GCO PI FA).pdf`;
}

function buildAdresse(row) {
    return (
        [row.numVoie, row.cptNumVoie, row.typeVoie, row.adresse, row.cptAdresse]
            .filter(Boolean)
            .join(" ")
            .trim() || null
    );
}

// Helper to get interlocuteur by role
function getInterlocuteurDataByRole(interlocuteurs, roleName) {
    const interloc = interlocuteurs.find((i) => i.role === roleName);
    return interloc || null;
}

function getInterlocuteurField(interlocuteurs, role, field) {
    const interloc = interlocuteurs.find((i) => i.role === role);
    return interloc ? interloc[field] : null;
}

function getInterlocuteurContactField(interlocuteurs, role, field) {
    const interloc = interlocuteurs.find((i) => i.role === role && i.idContact);
    return interloc ? interloc[field] : null;
}

// Fonction utilitaire pour comparer les changements
function hasChanges(oldValues, newValues) {
    if (!oldValues) return true;
    for (let key in newValues) {
        if (newValues[key] instanceof Date && oldValues[key] instanceof Date) {
            if (newValues[key].getTime() !== oldValues[key].getTime())
                return true;
        } else if (newValues[key] !== oldValues[key]) {
            return true;
        }
    }
    return false;
}

// Upsert Contact
async function upsertContact({
    externeId,
    nom,
    prenom,
    email,
    telephone,
    typePersonne,
}) {
    if (!externeId || !nom) return null;

    let Contact = Parse.Object.extend("Contact");
    let q = new Parse.Query(Contact);
    q.equalTo("externe_id", String(externeId));
    let contact = await q.first({ useMasterKey: true });

    if (!contact) {
        contact = new Contact();
        contact.set("externe_id", String(externeId));
        contact.set("source", "db_externe");
    }

    // Toujours mettre à jour tous les champs - SQLite est la source de vérité
    contact.set("nom", nom);
    contact.set("prenom", prenom || null);
    contact.set("type_personne", typePersonne || null);

    if (email) contact.set("email", email);
    if (telephone) contact.set("telephone", telephone);

    await contact.save(null, { useMasterKey: true });
    return contact;
}

// Ajoute une personne à la relation employes d'une entreprise
async function lierEmployeEntreprise(entreprise, personne) {
    if (!entreprise || !personne) return;
    let relation = entreprise.relation("employes");
    let existants = await relation
        .query()
        .equalTo("objectId", personne.id)
        .find({ useMasterKey: true });
    if (existants.length === 0) {
        relation.add(personne);
        await entreprise.save(null, { useMasterKey: true });
    }
}

/**
 * Étape 5 : Traite et sauvegarde les impayés dans Parse
 * @param {Object} param0 - { pieces, statutsMap, employesMap, interlocuteursByDossier, state }
 * @returns {Promise<Object>} { stats, state }
 */
async function processAndSaveImpayes({
    pieces,
    statutsMap,
    employesMap,
    interlocuteursByDossier,
    state,
}) {
    const stats = {
        impayes_created: 0,
        impayes_updated: 0,
        contacts_created: 0,
        contacts_updated: 0,
        errors: [],
    };

    info(
        "Étape 5: Début du traitement des impayés",
        "import-invoice",
        "processAndSaveImpayes",
        { pieceCount: pieces.length },
    );

    try {
        for (const pieceRow of pieces) {
            try {
                debug(
                    `Traitement de l'impayé nfacture=${pieceRow.nfacture}`,
                    "import-invoice",
                    "processAndSaveImpayes",
                    { nfacture: pieceRow.nfacture },
                );

                // Récupérer les interlocuteurs pour ce dossier
                const dossierId = pieceRow.dossier_id || pieceRow.idDossier;
                const interlocuteurs = interlocuteursByDossier[dossierId] || [];

                // Récupérer le statut du dossier
                const statutIntitule = pieceRow.idStatut
                    ? statutsMap[pieceRow.idStatut]
                    : null;

                // Récupérer l'employé intervention
                const employe = pieceRow.idEmployeIntervention
                    ? employesMap[pieceRow.idEmployeIntervention]
                    : null;
                const employeIntervention = employe
                    ? `${employe.prenom || ""} ${employe.nom || ""}`.trim()
                    : "";

                // Extraire les interlocuteurs par rôle
                const payeurContactData = getInterlocuteurDataByRole(
                    interlocuteurs,
                    "Payeur",
                );
                const payeurPersonneData = interlocuteurs.find(
                    (i) => i.role === "Payeur" && i.idContact,
                );
                const apporteurContactData = getInterlocuteurDataByRole(
                    interlocuteurs,
                    "Apporteur d'affaire",
                );
                const apporteurPersonneData = interlocuteurs.find(
                    (i) => i.role === "Apporteur d'affaire" && i.idContact,
                );

                // ── 1. Upsert personne physique du payeur (si entreprise)
                let payeurPersonne = null;
                if (
                    payeurPersonneData &&
                    payeurPersonneData.contact_interlocuteur_id &&
                    payeurPersonneData.contact_nom
                ) {
                    let isNew = !(await new Parse.Query(
                        Parse.Object.extend("Contact"),
                    )
                        .equalTo(
                            "externe_id",
                            String(payeurPersonneData.contact_interlocuteur_id),
                        )
                        .first({ useMasterKey: true }));
                    payeurPersonne = await upsertContact({
                        externeId: payeurPersonneData.contact_interlocuteur_id,
                        nom: payeurPersonneData.contact_nom || null,
                        prenom: payeurPersonneData.contact_prenom || null,
                        email: payeurPersonneData.contact_email,
                        typePersonne: payeurPersonneData.contact_typePersonne,
                    });
                    if (isNew) stats.contacts_created++;
                    else stats.contacts_updated++;
                }

                // ── 2. Upsert Contact payeur + lier l'employé
                let payeurContact = null;
                if (payeurContactData && payeurContactData.idInterlocuteur) {
                    let isNew = !(await new Parse.Query(
                        Parse.Object.extend("Contact"),
                    )
                        .equalTo(
                            "externe_id",
                            String(payeurContactData.idInterlocuteur),
                        )
                        .first({ useMasterKey: true }));
                    payeurContact = await upsertContact({
                        externeId: payeurContactData.idInterlocuteur,
                        nom: payeurContactData.nom || null,
                        prenom: payeurContactData.prenom || null,
                        email: payeurContactData.email,
                        telephone: payeurContactData.telephone,
                        typePersonne: payeurContactData.typePersonne,
                    });
                    if (isNew) stats.contacts_created++;
                    else stats.contacts_updated++;
                    await lierEmployeEntreprise(payeurContact, payeurPersonne);
                }

                // ── 3. Upsert personne physique de l'apporteur
                let apporteurPersonne = null;
                if (
                    apporteurPersonneData &&
                    apporteurPersonneData.contact_interlocuteur_id &&
                    apporteurPersonneData.contact_nom
                ) {
                    let isNew = !(await new Parse.Query(
                        Parse.Object.extend("Contact"),
                    )
                        .equalTo(
                            "externe_id",
                            String(
                                apporteurPersonneData.contact_interlocuteur_id,
                            ),
                        )
                        .first({ useMasterKey: true }));
                    apporteurPersonne = await upsertContact({
                        externeId:
                            apporteurPersonneData.contact_interlocuteur_id,
                        nom: apporteurPersonneData.contact_nom || null,
                        prenom: apporteurPersonneData.contact_prenom || null,
                        email: apporteurPersonneData.contact_email,
                        typePersonne:
                            apporteurPersonneData.contact_typePersonne,
                    });
                    if (isNew) stats.contacts_created++;
                    else stats.contacts_updated++;
                }

                // ── 4. Upsert Contact apporteur + lier l'employé
                let apporteurContact = null;
                if (
                    apporteurContactData &&
                    apporteurContactData.idInterlocuteur
                ) {
                    let isNew = !(await new Parse.Query(
                        Parse.Object.extend("Contact"),
                    )
                        .equalTo(
                            "externe_id",
                            String(apporteurContactData.idInterlocuteur),
                        )
                        .first({ useMasterKey: true }));
                    apporteurContact = await upsertContact({
                        externeId: apporteurContactData.idInterlocuteur,
                        nom: apporteurContactData.nom || null,
                        prenom: apporteurContactData.prenom || null,
                        email: apporteurContactData.email,
                        telephone: apporteurContactData.telephone,
                        typePersonne: apporteurContactData.typePersonne,
                    });
                    if (isNew) stats.contacts_created++;
                    else stats.contacts_updated++;
                    await lierEmployeEntreprise(
                        apporteurContact,
                        apporteurPersonne,
                    );
                }

                // ── 5. Upsert Impayé ─────────────────────────────────────────
                const externeId = Number(pieceRow.nfacture);
                const dossierNum =
                    pieceRow.numero ||
                    pieceRow.idDossier ||
                    pieceRow.dossier_id;

                // Utiliser nfacture + dossier comme clé composite pour gérer plusieurs dossiers par facture
                let Impaye = Parse.Object.extend("Impaye");
                let qi = new Parse.Query(Impaye);
                qi.equalTo("nfacture", externeId);
                if (dossierNum) {
                    qi.equalTo("numero_dossier", String(dossierNum));
                }
                let impaye = await qi.first({ useMasterKey: true });
                let isNewImpaye = !impaye;

                if (!impaye) {
                    impaye = new Impaye();
                    // Clé composite : nfacture + dossier
                    impaye.set(
                        "externe_id",
                        dossierNum
                            ? `${externeId}_${dossierNum}`
                            : String(externeId),
                    );
                    impaye.set("source", "db_externe");
                }

                // Champs toujours mis à jour
                impaye.set("nfacture", Number(pieceRow.nfacture));
                impaye.set(
                    "date_piece",
                    pieceRow.datepiece ? new Date(pieceRow.datepiece) : null,
                );
                impaye.set(
                    "date_echeance",
                    pieceRow.dateecheance
                        ? new Date(pieceRow.dateecheance)
                        : null,
                );
                impaye.set(
                    "date_debut_mission",
                    pieceRow.dateDebutMission
                        ? new Date(pieceRow.dateDebutMission)
                        : null,
                );
                impaye.set(
                    "total_ht",
                    pieceRow.totalhtnet != null
                        ? Number(pieceRow.totalhtnet)
                        : null,
                );
                impaye.set(
                    "total_ttc",
                    pieceRow.totalttcnet != null
                        ? Number(pieceRow.totalttcnet)
                        : null,
                );
                impaye.set(
                    "reste_a_payer",
                    pieceRow.resteapayer != null
                        ? Number(pieceRow.resteapayer)
                        : null,
                );
                impaye.set("facture_soldee", Boolean(pieceRow.facturesoldee));
                impaye.set(
                    "commentaire_piece",
                    pieceRow.commentaire_piece || null,
                );
                impaye.set("ref_piece", pieceRow.refpiece || null);
                impaye.set(
                    "url_pdf",
                    buildUrlPdf(pieceRow.refpiece, pieceRow.datepiece),
                );
                impaye.set(
                    "id_dossier",
                    pieceRow.idDossier ? String(pieceRow.idDossier) : null,
                );
                impaye.set("numero_dossier", pieceRow.numero || null);

                // Gestion de la reference
                if (isNewImpaye && pieceRow.reference) {
                    let existingImpayeQuery = new Parse.Query(Impaye);
                    existingImpayeQuery.equalTo(
                        "reference",
                        pieceRow.reference,
                    );
                    let existingImpaye = await existingImpayeQuery.first({
                        useMasterKey: true,
                    });
                    if (existingImpaye) {
                        impaye = existingImpaye;
                        isNewImpaye = false;
                    }
                }
                impaye.set("reference", pieceRow.reference || null);
                impaye.set(
                    "reference_externe",
                    pieceRow.referenceExterne || null,
                );
                impaye.set("statut_dossier", statutIntitule || null);
                impaye.set(
                    "commentaire_dossier",
                    pieceRow.commentaire_dossier || null,
                );
                impaye.set("employe_intervention", employeIntervention || null);
                impaye.set("adresse_bien", buildAdresse(pieceRow));
                impaye.set("code_postal", pieceRow.codePostal || null);
                impaye.set("ville", pieceRow.ville || null);
                impaye.set("numero_lot", pieceRow.numeroLot || null);
                impaye.set("etage", pieceRow.etage || null);
                impaye.set("entree", pieceRow.entree || null);
                impaye.set("escalier", pieceRow.escalier || null);
                impaye.set("porte", pieceRow.porte || null);

                // Interlocuteurs à plat
                impaye.set(
                    "payeur_nom",
                    getInterlocuteurField(interlocuteurs, "Payeur", "nom") ||
                        null,
                );
                impaye.set(
                    "payeur_prenom",
                    getInterlocuteurField(interlocuteurs, "Payeur", "prenom") ||
                        null,
                );
                impaye.set(
                    "payeur_email",
                    getInterlocuteurField(interlocuteurs, "Payeur", "email") ||
                        null,
                );
                impaye.set(
                    "payeur_telephone",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Payeur",
                        "telephone",
                    ) || null,
                );
                impaye.set(
                    "payeur_type_personne",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Payeur",
                        "typePersonne",
                    ) || null,
                );
                impaye.set(
                    "payeur_contact_nom",
                    getInterlocuteurContactField(
                        interlocuteurs,
                        "Payeur",
                        "contact_nom",
                    ) || null,
                );
                impaye.set(
                    "payeur_contact_prenom",
                    getInterlocuteurContactField(
                        interlocuteurs,
                        "Payeur",
                        "contact_prenom",
                    ) || null,
                );
                impaye.set(
                    "payeur_contact_email",
                    getInterlocuteurContactField(
                        interlocuteurs,
                        "Payeur",
                        "contact_email",
                    ) || null,
                );

                impaye.set(
                    "apporteur_nom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Apporteur d'affaire",
                        "nom",
                    ) || null,
                );
                impaye.set(
                    "apporteur_prenom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Apporteur d'affaire",
                        "prenom",
                    ) || null,
                );
                impaye.set(
                    "apporteur_email",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Apporteur d'affaire",
                        "email",
                    ) || null,
                );
                impaye.set(
                    "apporteur_telephone",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Apporteur d'affaire",
                        "telephone",
                    ) || null,
                );
                impaye.set(
                    "apporteur_contact_nom",
                    getInterlocuteurContactField(
                        interlocuteurs,
                        "Apporteur d'affaire",
                        "contact_nom",
                    ) || null,
                );
                impaye.set(
                    "apporteur_contact_prenom",
                    getInterlocuteurContactField(
                        interlocuteurs,
                        "Apporteur d'affaire",
                        "contact_prenom",
                    ) || null,
                );
                impaye.set(
                    "apporteur_contact_email",
                    getInterlocuteurContactField(
                        interlocuteurs,
                        "Apporteur d'affaire",
                        "contact_email",
                    ) || null,
                );

                impaye.set(
                    "acquereur_nom",
                    getInterlocuteurField(interlocuteurs, "Acquéreur", "nom") ||
                        null,
                );
                impaye.set(
                    "acquereur_prenom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Acquéreur",
                        "prenom",
                    ) || null,
                );
                impaye.set(
                    "acquereur_email",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Acquéreur",
                        "email",
                    ) || null,
                );
                impaye.set(
                    "acquereur_telephone",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Acquéreur",
                        "telephone",
                    ) || null,
                );

                impaye.set(
                    "donneur_ordre_nom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Donneur d'ordre",
                        "nom",
                    ) || null,
                );
                impaye.set(
                    "donneur_ordre_prenom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Donneur d'ordre",
                        "prenom",
                    ) || null,
                );
                impaye.set(
                    "donneur_ordre_email",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Donneur d'ordre",
                        "email",
                    ) || null,
                );
                impaye.set(
                    "donneur_ordre_telephone",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Donneur d'ordre",
                        "telephone",
                    ) || null,
                );

                impaye.set(
                    "locataire_entrant_nom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Locataire entrant",
                        "nom",
                    ) || null,
                );
                impaye.set(
                    "locataire_entrant_prenom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Locataire entrant",
                        "prenom",
                    ) || null,
                );
                impaye.set(
                    "locataire_entrant_email",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Locataire entrant",
                        "email",
                    ) || null,
                );
                impaye.set(
                    "locataire_entrant_telephone",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Locataire entrant",
                        "telephone",
                    ) || null,
                );

                impaye.set(
                    "locataire_sortant_nom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Locataire sortant",
                        "nom",
                    ) || null,
                );
                impaye.set(
                    "locataire_sortant_prenom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Locataire sortant",
                        "prenom",
                    ) || null,
                );
                impaye.set(
                    "locataire_sortant_email",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Locataire sortant",
                        "email",
                    ) || null,
                );
                impaye.set(
                    "locataire_sortant_telephone",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Locataire sortant",
                        "telephone",
                    ) || null,
                );

                impaye.set(
                    "notaire_nom",
                    getInterlocuteurField(interlocuteurs, "Notaire", "nom") ||
                        null,
                );
                impaye.set(
                    "notaire_prenom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Notaire",
                        "prenom",
                    ) || null,
                );
                impaye.set(
                    "notaire_email",
                    getInterlocuteurField(interlocuteurs, "Notaire", "email") ||
                        null,
                );
                impaye.set(
                    "notaire_telephone",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Notaire",
                        "telephone",
                    ) || null,
                );

                impaye.set(
                    "proprietaire_nom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Propriétaire",
                        "nom",
                    ) || null,
                );
                impaye.set(
                    "proprietaire_prenom",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Propriétaire",
                        "prenom",
                    ) || null,
                );
                impaye.set(
                    "proprietaire_email",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Propriétaire",
                        "email",
                    ) || null,
                );
                impaye.set(
                    "proprietaire_telephone",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Propriétaire",
                        "telephone",
                    ) || null,
                );
                impaye.set(
                    "proprietaire_type_personne",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Propriétaire",
                        "typePersonne",
                    ) || null,
                );
                impaye.set(
                    "proprietaire_contact_nom",
                    getInterlocuteurContactField(
                        interlocuteurs,
                        "Propriétaire",
                        "contact_nom",
                    ) || null,
                );
                impaye.set(
                    "proprietaire_contact_prenom",
                    getInterlocuteurContactField(
                        interlocuteurs,
                        "Propriétaire",
                        "contact_prenom",
                    ) || null,
                );
                impaye.set(
                    "proprietaire_contact_email",
                    getInterlocuteurContactField(
                        interlocuteurs,
                        "Propriétaire",
                        "contact_email",
                    ) || null,
                );

                impaye.set(
                    "syndic_nom",
                    getInterlocuteurField(interlocuteurs, "Syndic", "nom") ||
                        null,
                );
                impaye.set(
                    "syndic_prenom",
                    getInterlocuteurField(interlocuteurs, "Syndic", "prenom") ||
                        null,
                );
                impaye.set(
                    "syndic_email",
                    getInterlocuteurField(interlocuteurs, "Syndic", "email") ||
                        null,
                );
                impaye.set(
                    "syndic_telephone",
                    getInterlocuteurField(
                        interlocuteurs,
                        "Syndic",
                        "telephone",
                    ) || null,
                );

                // Pointers vers les Contacts
                if (payeurContact) impaye.set("payeur", payeurContact);
                if (apporteurContact) impaye.set("apporteur", apporteurContact);

                // contact_relance : défini uniquement à la création
                if (isNewImpaye) {
                    let defaultRelance = payeurPersonne || payeurContact;
                    if (defaultRelance)
                        impaye.set("contact_relance", defaultRelance);
                }

                // Calcul du type payeur
                const payeurNom = getInterlocuteurField(
                    interlocuteurs,
                    "Payeur",
                    "nom",
                );
                const proprietaireNom = getInterlocuteurField(
                    interlocuteurs,
                    "Propriétaire",
                    "nom",
                );
                const apporteurNom = getInterlocuteurField(
                    interlocuteurs,
                    "Apporteur d'affaire",
                    "nom",
                );
                let payeurType = "Autre";
                if (
                    payeurNom &&
                    proprietaireNom &&
                    payeurNom === proprietaireNom
                ) {
                    payeurType = "Propriétaire";
                } else if (
                    payeurNom &&
                    apporteurNom &&
                    payeurNom === apporteurNom
                ) {
                    payeurType = "Apporteur d'affaire";
                }
                impaye.set("payeur_type", payeurType);

                // Sauvegarde
                debug(
                    `Sauvegarde de l'impayé nfacture=${pieceRow.nfacture}`,
                    "import-invoice",
                    "processAndSaveImpayes",
                    { nfacture: pieceRow.nfacture, isNew: isNewImpaye },
                );
                await impaye.save(null, { useMasterKey: true });
                info(
                    `Impayé sauvegardé avec succès (nfacture=${pieceRow.nfacture})`,
                    "import-invoice",
                    "processAndSaveImpayes",
                    { nfacture: pieceRow.nfacture, isNew: isNewImpaye },
                );

                if (isNewImpaye) stats.impayes_created++;
                else stats.impayes_updated++;

                // Log d'activité
                try {
                    let oldValues = isNewImpaye
                        ? null
                        : {
                              nfacture: impaye.get("nfacture"),
                              date_piece: impaye.get("date_piece"),
                              date_echeance: impaye.get("date_echeance"),
                              date_debut_mission:
                                  impaye.get("date_debut_mission"),
                              total_ht: impaye.get("total_ht"),
                              total_ttc: impaye.get("total_ttc"),
                              reste_a_payer: impaye.get("reste_a_payer"),
                              facture_soldee: impaye.get("facture_soldee"),
                              commentaire_piece:
                                  impaye.get("commentaire_piece"),
                              ref_piece: impaye.get("ref_piece"),
                              url_pdf: impaye.get("url_pdf"),
                              id_dossier: impaye.get("id_dossier"),
                              numero_dossier: impaye.get("numero_dossier"),
                              reference: impaye.get("reference"),
                              reference_externe:
                                  impaye.get("reference_externe"),
                              statut_dossier: impaye.get("statut_dossier"),
                              commentaire_dossier: impaye.get(
                                  "commentaire_dossier",
                              ),
                              employe_intervention: impaye.get(
                                  "employe_intervention",
                              ),
                              adresse_bien: impaye.get("adresse_bien"),
                              code_postal: impaye.get("code_postal"),
                              ville: impaye.get("ville"),
                              numero_lot: impaye.get("numero_lot"),
                              etage: impaye.get("etage"),
                              entree: impaye.get("entree"),
                              escalier: impaye.get("escalier"),
                              porte: impaye.get("porte"),
                              payeur: impaye.get("payeur")
                                  ? impaye.get("payeur").id
                                  : null,
                              apporteur: impaye.get("apporteur")
                                  ? impaye.get("apporteur").id
                                  : null,
                              contact_relance: impaye.get("contact_relance")
                                  ? impaye.get("contact_relance").id
                                  : null,
                          };

                    let newValues = {
                        nfacture: pieceRow.nfacture,
                        date_piece: pieceRow.datepiece
                            ? new Date(pieceRow.datepiece)
                            : null,
                        date_echeance: pieceRow.dateecheance
                            ? new Date(pieceRow.dateecheance)
                            : null,
                        date_debut_mission: pieceRow.dateDebutMission
                            ? new Date(pieceRow.dateDebutMission)
                            : null,
                        total_ht:
                            pieceRow.totalhtnet != null
                                ? Number(pieceRow.totalhtnet)
                                : null,
                        total_ttc:
                            pieceRow.totalttcnet != null
                                ? Number(pieceRow.totalttcnet)
                                : null,
                        reste_a_payer:
                            pieceRow.resteapayer != null
                                ? Number(pieceRow.resteapayer)
                                : null,
                        facture_soldee: pieceRow.facturesoldee,
                        commentaire_piece: pieceRow.commentaire_piece || null,
                        ref_piece: pieceRow.refpiece || null,
                        url_pdf: buildUrlPdf(
                            pieceRow.refpiece,
                            pieceRow.datepiece,
                        ),
                        id_dossier: pieceRow.idDossier
                            ? String(pieceRow.idDossier)
                            : null,
                        numero_dossier: pieceRow.numero || null,
                        reference: pieceRow.reference || null,
                        reference_externe: pieceRow.referenceExterne || null,
                        statut_dossier: statutIntitule || null,
                        commentaire_dossier:
                            pieceRow.commentaire_dossier || null,
                        employe_intervention: employeIntervention || null,
                        adresse_bien: buildAdresse(pieceRow),
                        code_postal: pieceRow.codePostal || null,
                        ville: pieceRow.ville || null,
                        numero_lot: pieceRow.numeroLot || null,
                        etage: pieceRow.etage || null,
                        entree: pieceRow.entree || null,
                        escalier: pieceRow.escalier || null,
                        porte: pieceRow.porte || null,
                        payeur: payeurContact ? payeurContact.id : null,
                        apporteur: apporteurContact
                            ? apporteurContact.id
                            : null,
                        contact_relance:
                            isNewImpaye && (payeurPersonne || payeurContact)
                                ? (payeurPersonne || payeurContact).id
                                : impaye.get("contact_relance")
                                  ? impaye.get("contact_relance").id
                                  : null,
                    };

                    let shouldLogActivity =
                        isNewImpaye || hasChanges(oldValues, newValues);

                    if (shouldLogActivity) {
                        let activite = new Parse.Object("Activite");
                        activite.set("type", "sync_impaye");
                        activite.set(
                            "operation",
                            isNewImpaye ? "created" : "updated",
                        );
                        activite.set("nfacture", pieceRow.nfacture);
                        activite.set("impaye_id", impaye.id);
                        activite.set(
                            "montant",
                            pieceRow.resteapayer != null
                                ? Number(pieceRow.resteapayer)
                                : null,
                        );
                        activite.set(
                            "payeur_nom",
                            getInterlocuteurField(
                                interlocuteurs,
                                "Payeur",
                                "nom",
                            ) || null,
                        );
                        activite.set(
                            "date_piece",
                            pieceRow.datepiece
                                ? new Date(pieceRow.datepiece)
                                : null,
                        );
                        activite.set("trigger", "workflow");
                        activite.set("timestamp", new Date());
                        await activite.save(null, { useMasterKey: true });
                    }
                } catch (logErr) {
                    error(
                        `Erreur log activite pour ${pieceRow.nfacture}: ${logErr.message}`,
                        "import-invoice",
                        "processAndSaveImpayes",
                        { nfacture: pieceRow.nfacture, error: logErr.message },
                    );
                }
            } catch (err) {
                error(
                    `Erreur nfacture=${pieceRow.nfacture}: ${err.message}`,
                    "import-invoice",
                    "processAndSaveImpayes",
                    {
                        nfacture: pieceRow.nfacture,
                        error: err.message,
                        stack: err.stack?.substring(0, 500),
                    },
                );
                stats.errors.push({
                    nfacture: pieceRow.nfacture,
                    error: err.message,
                });

                // Log d'erreur
                try {
                    let activite = new Parse.Object("Activite");
                    activite.set("type", "sync_impaye");
                    activite.set("operation", "error");
                    activite.set("nfacture", pieceRow.nfacture);
                    activite.set("error_message", err.message);
                    activite.set("trigger", "workflow");
                    activite.set("timestamp", new Date());
                    await activite.save(null, { useMasterKey: true });
                } catch (logErr) {
                    error(
                        `Erreur log activite erreur pour ${pieceRow.nfacture}: ${logErr.message}`,
                        "import-invoice",
                        "processAndSaveImpayes",
                        { nfacture: pieceRow.nfacture, error: logErr.message },
                    );
                }
            }
        }

        info(
            `Étape 5 terminée — ${stats.impayes_created} créés, ${stats.impayes_updated} MàJ, ${stats.contacts_created} contacts créés, ${stats.errors.length} erreurs`,
            "import-invoice",
            "processAndSaveImpayes",
            {
                created: stats.impayes_created,
                updated: stats.impayes_updated,
                contactsCreated: stats.contacts_created,
                errors: stats.errors.length,
            },
        );

        const newState = {
            ...state,
            currentStep: "06-assignSequences",
            steps: {
                ...state.steps,
                "05-processAndSaveImpayes": {
                    status: "completed",
                    impayes_created: stats.impayes_created,
                    impayes_updated: stats.impayes_updated,
                    contacts_created: stats.contacts_created,
                    contacts_updated: stats.contacts_updated,
                    errors: stats.errors.length,
                    completedAt: new Date().toISOString(),
                },
            },
            updatedAt: new Date().toISOString(),
        };

        fs.writeFileSync(STATE_FILE, JSON.stringify(newState, null, 2));

        return {
            stats,
            state: newState,
        };
    } catch (err) {
        error(
            `Erreur Étape 5: ${err.message}`,
            "import-invoice",
            "processAndSaveImpayes",
            { error: err.message, stack: err.stack?.substring(0, 500) },
        );
        throw err;
    }
}

module.exports = processAndSaveImpayes;
