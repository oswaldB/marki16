// backend/cloud/jobs/syncImpayes.js
// Synchronise les impayés et leurs contacts depuis la DB PostgreSQL externe (Analyse immo).
// Retourne { impayes, contacts, errors }

const { Pool } = require('pg');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MOIS_FR = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

function buildUrlPdf(refPiece, datePiece) {
  if (!refPiece || !datePiece) return null;
  const d = new Date(datePiece);
  if (isNaN(d.getTime())) return null;
  const year  = d.getFullYear();
  const month = MOIS_FR[d.getMonth()];
  const refClean = String(refPiece).replace(/\s+/g, '_');
  return `/ADN/Reporting/Gco/Piece/${year}/${month}/${refClean}/standard/${refPiece} (GCO PI FA).pdf`;
}

function buildAdresse(row) {
  return [row.numVoie, row.cptNumVoie, row.typeVoie, row.adresse, row.cptAdresse]
    .filter(Boolean).join(' ').trim() || null;
}

// ─── Requête SQL ──────────────────────────────────────────────────────────────

const QUERY = `
  SELECT
    -- Pièce
    p."nfacture"                                        AS "nfacture",
    TO_CHAR(p."datepiece", 'YYYY-MM-DD HH24:MI:SS')    AS "datepiece",
    p."totalhtnet"                                      AS "totalhtnet",
    p."totalttcnet"                                     AS "totalttcnet",
    p."resteapayer"                                     AS "resteapayer",
    p."facturesoldee"                                   AS "facturesoldee",
    p."commentaire"                                     AS "commentaire_piece",
    p."refpiece"                                        AS "refpiece",

    -- Dossier
    d."idDossier"                                       AS "idDossier",
    d."idStatut"                                        AS "idStatut",
    s."intitule"                                        AS "statut_intitule",
    d."contactPlace"                                    AS "contactPlace",
    d."reference"                                       AS "reference",
    d."referenceExterne"                                AS "referenceExterne",
    d."numero"                                          AS "numero",
    d."idEmployeIntervention"                           AS "idEmployeIntervention",
    d."commentaire"                                     AS "commentaire_dossier",
    d."adresse"                                         AS "adresse",
    d."cptAdresse"                                      AS "cptAdresse",
    d."codePostal"                                      AS "codePostal",
    d."ville"                                           AS "ville",
    d."numeroLot"                                       AS "numeroLot",
    d."etage"                                           AS "etage",
    d."entree"                                          AS "entree",
    d."escalier"                                        AS "escalier",
    d."porte"                                           AS "porte",
    d."numVoie"                                         AS "numVoie",
    d."cptNumVoie"                                      AS "cptNumVoie",
    d."typeVoie"                                        AS "typeVoie",
    d."dateDebutMission"                                AS "dateDebutMission",
    COALESCE(e."prenom" || ' ' || e."nom", '')          AS "employe_intervention",

    -- IDs interlocuteurs (pour upsert Contact)
    MAX(CASE WHEN role."intitule" = 'Payeur'               THEN iloc."idInterlocuteur" END) AS "payeur_id_externe",
    MAX(CASE WHEN role."intitule" = 'Apporteur d''affaire' THEN iloc."idInterlocuteur" END) AS "apporteur_id_externe",

    -- IDs contacts de contact (personne physique d'une entreprise)
    MAX(CASE WHEN role."intitule" = 'Payeur'               THEN ilocContact."idInterlocuteur" END) AS "payeur_contact_id_externe",
    MAX(CASE WHEN role."intitule" = 'Apporteur d''affaire' THEN ilocContact."idInterlocuteur" END) AS "apporteur_contact_id_externe",

    -- Acquéreur
    MAX(CASE WHEN role."intitule" = 'Acquéreur' THEN iloc."nom" || ' ' || iloc."prenom" END) AS "acquereur_nom",
    MAX(CASE WHEN role."intitule" = 'Acquéreur' THEN iloc."email" END)                        AS "acquereur_email",
    MAX(CASE WHEN role."intitule" = 'Acquéreur' THEN iloc."telephoneMobile" END)              AS "acquereur_telephone",

    -- Apporteur d'affaire
    MAX(CASE WHEN role."intitule" = 'Apporteur d''affaire' THEN
      CASE WHEN iloc."typePersonne" = 'M' THEN iloc."nom"
           ELSE COALESCE(iloc."nom" || ' ' || iloc."prenom", iloc."nom", iloc."prenom") END
    END) AS "apporteur_nom",
    MAX(CASE WHEN role."intitule" = 'Apporteur d''affaire' THEN iloc."email" END)             AS "apporteur_email",
    MAX(CASE WHEN role."intitule" = 'Apporteur d''affaire' THEN iloc."telephoneMobile" END)   AS "apporteur_telephone",
    MAX(CASE WHEN role."intitule" = 'Apporteur d''affaire' THEN iloc."typePersonne" END)      AS "apporteur_typePersonne",
    MAX(CASE WHEN role."intitule" = 'Apporteur d''affaire' THEN
      CASE WHEN ilocContact."typePersonne" = 'M' THEN ilocContact."nom"
           ELSE COALESCE(ilocContact."nom" || ' ' || ilocContact."prenom", ilocContact."nom", ilocContact."prenom") END
    END) AS "apporteur_contact_nom",
    MAX(CASE WHEN role."intitule" = 'Apporteur d''affaire' THEN ilocContact."email" END)      AS "apporteur_contact_email",

    -- Donneur d'ordre
    MAX(CASE WHEN role."intitule" = 'Donneur d''ordre' THEN iloc."nom" || ' ' || iloc."prenom" END) AS "donneur_ordre_nom",
    MAX(CASE WHEN role."intitule" = 'Donneur d''ordre' THEN iloc."email" END)                        AS "donneur_ordre_email",
    MAX(CASE WHEN role."intitule" = 'Donneur d''ordre' THEN iloc."telephoneMobile" END)              AS "donneur_ordre_telephone",

    -- Locataire entrant
    MAX(CASE WHEN role."intitule" = 'Locataire entrant' THEN iloc."nom" || ' ' || iloc."prenom" END) AS "locataire_entrant_nom",
    MAX(CASE WHEN role."intitule" = 'Locataire entrant' THEN iloc."email" END)                        AS "locataire_entrant_email",
    MAX(CASE WHEN role."intitule" = 'Locataire entrant' THEN iloc."telephoneMobile" END)              AS "locataire_entrant_telephone",

    -- Locataire sortant
    MAX(CASE WHEN role."intitule" = 'Locataire sortant' THEN iloc."nom" || ' ' || iloc."prenom" END) AS "locataire_sortant_nom",
    MAX(CASE WHEN role."intitule" = 'Locataire sortant' THEN iloc."email" END)                        AS "locataire_sortant_email",
    MAX(CASE WHEN role."intitule" = 'Locataire sortant' THEN iloc."telephoneMobile" END)              AS "locataire_sortant_telephone",

    -- Notaire
    MAX(CASE WHEN role."intitule" = 'Notaire' THEN iloc."nom" || ' ' || iloc."prenom" END) AS "notaire_nom",
    MAX(CASE WHEN role."intitule" = 'Notaire' THEN iloc."email" END)                        AS "notaire_email",
    MAX(CASE WHEN role."intitule" = 'Notaire' THEN iloc."telephoneMobile" END)              AS "notaire_telephone",

    -- Payeur
    MAX(CASE WHEN role."intitule" = 'Payeur' THEN
      CASE WHEN iloc."typePersonne" = 'M' THEN iloc."nom"
           ELSE COALESCE(iloc."nom" || ' ' || iloc."prenom", iloc."nom", iloc."prenom") END
    END) AS "payeur_nom",
    MAX(CASE WHEN role."intitule" = 'Payeur' THEN iloc."email" END)           AS "payeur_email",
    MAX(CASE WHEN role."intitule" = 'Payeur' THEN iloc."telephoneMobile" END) AS "payeur_telephone",
    MAX(CASE WHEN role."intitule" = 'Payeur' THEN iloc."typePersonne" END)    AS "payeur_typePersonne",
    MAX(CASE WHEN role."intitule" = 'Payeur' THEN
      CASE WHEN ilocContact."typePersonne" = 'M' THEN ilocContact."nom"
           ELSE COALESCE(ilocContact."nom" || ' ' || ilocContact."prenom", ilocContact."nom", ilocContact."prenom") END
    END) AS "payeur_contact_nom",
    MAX(CASE WHEN role."intitule" = 'Payeur' THEN ilocContact."email" END)    AS "payeur_contact_email",

    -- Propriétaire
    MAX(CASE WHEN role."intitule" = 'Propriétaire' THEN
      CASE WHEN iloc."typePersonne" = 'M' THEN iloc."nom"
           ELSE COALESCE(iloc."nom" || ' ' || iloc."prenom", iloc."nom", iloc."prenom") END
    END) AS "proprietaire_nom",
    MAX(CASE WHEN role."intitule" = 'Propriétaire' THEN iloc."email" END)           AS "proprietaire_email",
    MAX(CASE WHEN role."intitule" = 'Propriétaire' THEN iloc."telephoneMobile" END) AS "proprietaire_telephone",
    MAX(CASE WHEN role."intitule" = 'Propriétaire' THEN iloc."typePersonne" END)    AS "proprietaire_typePersonne",
    MAX(CASE WHEN role."intitule" = 'Propriétaire' THEN
      CASE WHEN ilocContact."typePersonne" = 'M' THEN ilocContact."nom"
           ELSE COALESCE(ilocContact."nom" || ' ' || ilocContact."prenom", ilocContact."nom", ilocContact."prenom") END
    END) AS "proprietaire_contact_nom",
    MAX(CASE WHEN role."intitule" = 'Propriétaire' THEN ilocContact."email" END)    AS "proprietaire_contact_email",

    -- Syndic
    MAX(CASE WHEN role."intitule" = 'Syndic' THEN iloc."nom" || ' ' || iloc."prenom" END) AS "syndic_nom",
    MAX(CASE WHEN role."intitule" = 'Syndic' THEN iloc."email" END)                        AS "syndic_email",
    MAX(CASE WHEN role."intitule" = 'Syndic' THEN iloc."telephoneMobile" END)              AS "syndic_telephone",

    -- Type payeur calculé
    CASE
      WHEN MAX(CASE WHEN role."intitule" = 'Payeur' THEN
        CASE WHEN iloc."typePersonne" = 'M' THEN iloc."nom"
             ELSE COALESCE(iloc."nom" || ' ' || iloc."prenom", iloc."nom", iloc."prenom") END
      END) = MAX(CASE WHEN role."intitule" = 'Propriétaire' THEN
        CASE WHEN iloc."typePersonne" = 'M' THEN iloc."nom"
             ELSE COALESCE(iloc."nom" || ' ' || iloc."prenom", iloc."nom", iloc."prenom") END
      END) THEN 'Propriétaire'
      WHEN MAX(CASE WHEN role."intitule" = 'Payeur' THEN
        CASE WHEN iloc."typePersonne" = 'M' THEN iloc."nom"
             ELSE COALESCE(iloc."nom" || ' ' || iloc."prenom", iloc."nom", iloc."prenom") END
      END) = MAX(CASE WHEN role."intitule" = 'Apporteur d''affaire' THEN
        CASE WHEN iloc."typePersonne" = 'M' THEN iloc."nom"
             ELSE COALESCE(iloc."nom" || ' ' || iloc."prenom", iloc."nom", iloc."prenom") END
      END) THEN 'Apporteur d''affaire'
      ELSE 'Autre'
    END AS "payeur_type"

  FROM "public"."(GCO) GcoPiece" p
  LEFT JOIN "public"."(GCO) GcoPieceMetier"               pm   ON p."idpiece"         = pm."idpiece"
  LEFT JOIN "public"."(ADN_DIAG) Dossier"                  d    ON pm."idmetier"        = d."idDossier"
  LEFT JOIN "public"."(ADN_RG)Employe"                     e    ON d."idEmployeIntervention" = e."idEmploye"
  LEFT JOIN "public"."(ADN_DIAG) StatutDossier"            s    ON d."idStatut"         = s."idStatut"
  LEFT JOIN "public"."(ADN_DIAG) DossierInterlocuteur"     di   ON d."idDossier"        = di."idDossier"
  LEFT JOIN "public"."(ADN_RG)Interlocuteur"               iloc ON di."idInterlocuteur" = iloc."idInterlocuteur"
  LEFT JOIN "public"."(ADN_RG)Interlocuteur"          ilocContact ON di."idContact"     = ilocContact."idInterlocuteur"
  LEFT JOIN "public"."(ADN_DIAG) RoleInterlocuteurDossier" role ON di."idRole"          = role."idRole"

  WHERE
    (p."nfacture" IS NOT NULL)
    AND (p."datepiece" >= (CAST(CAST((NOW() + INTERVAL '-300000 day') AS date) AS timestamptz) + INTERVAL '-7 day'))
    AND (p."datepiece" < (CAST(CAST(NOW() AS date) AS timestamptz) + INTERVAL '-7 day'))
    AND (p."facturesoldee" = FALSE)
    AND (p."resteapayer" > 0)
    AND (p."valide" = TRUE)
    AND EXISTS (
      SELECT 1
      FROM "public"."(ADN_DIAG) DossierInterlocuteur" di2
      LEFT JOIN "public"."(ADN_DIAG) RoleInterlocuteurDossier" role2 ON di2."idRole" = role2."idRole"
      WHERE di2."idDossier" = d."idDossier" AND role2."intitule" = 'Payeur'
    )

  GROUP BY
    p."nfacture", p."datepiece", p."totalhtnet", p."totalttcnet", p."resteapayer",
    p."facturesoldee", p."commentaire", p."refpiece",
    d."idDossier", d."idStatut", s."intitule", d."contactPlace", d."reference",
    d."referenceExterne", d."numero", d."idEmployeIntervention", d."commentaire",
    d."adresse", d."cptAdresse", d."codePostal", d."ville", d."numeroLot",
    d."etage", d."entree", d."escalier", d."porte", d."numVoie", d."cptNumVoie",
    d."typeVoie", d."dateDebutMission", COALESCE(e."prenom" || ' ' || e."nom", '')

  ORDER BY p."datepiece" DESC
`;

// ─── Upsert Contact ───────────────────────────────────────────────────────────

async function upsertContact({ externeId, nom, email, telephone, typePersonne }) {
  if (!externeId || !nom) return null;

  const Contact = Parse.Object.extend('Contact');
  const q = new Parse.Query(Contact);
  q.equalTo('externe_id', String(externeId));
  let contact = await q.first({ useMasterKey: true });

  if (!contact) {
    contact = new Contact();
    contact.set('externe_id', String(externeId));
    contact.set('source', 'db_externe');
  }

  contact.set('nom', nom);
  contact.set('type_personne', typePersonne || null);

  // Ne pas écraser email/telephone si déjà renseignés
  if (email && !contact.get('email'))         contact.set('email', email);
  if (telephone && !contact.get('telephone')) contact.set('telephone', telephone);

  await contact.save(null, { useMasterKey: true });
  return contact;
}

// Ajoute une personne à la relation employes d'une entreprise (si pas déjà présente)
async function lierEmployeEntreprise(entreprise, personne) {
  if (!entreprise || !personne) return;
  const relation = entreprise.relation('employes');
  const existants = await relation.query().equalTo('objectId', personne.id).find({ useMasterKey: true });
  if (existants.length === 0) {
    relation.add(personne);
    await entreprise.save(null, { useMasterKey: true });
  }
}

// ─── syncImpayes ──────────────────────────────────────────────────────────────

async function syncImpayes({ trigger = 'cron' } = {}) {
  const startedAt = new Date();
  const stats = { impayes_created: 0, impayes_updated: 0, contacts_created: 0, contacts_updated: 0, errors: [] };

  const pool = new Pool({
    connectionString: process.env.EXTERNAL_DB_URI,
    connectionTimeoutMillis: 10000,
  });

  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query(QUERY);

    for (const row of rows) {
      try {
        // ── 1. Upsert personne physique du payeur (si entreprise)
        let payeurPersonne = null;
        if (row.payeur_contact_id_externe && row.payeur_contact_nom) {
          const isNew = !(await new Parse.Query(Parse.Object.extend('Contact'))
            .equalTo('externe_id', String(row.payeur_contact_id_externe))
            .first({ useMasterKey: true }));
          payeurPersonne = await upsertContact({
            externeId:   row.payeur_contact_id_externe,
            nom:         row.payeur_contact_nom,
            email:       row.payeur_contact_email,
            typePersonne: null,
          });
          if (isNew) stats.contacts_created++; else stats.contacts_updated++;
        }

        // ── 2. Upsert Contact payeur + lier l'employé
        let payeurContact = null;
        if (row.payeur_id_externe) {
          const isNew = !(await new Parse.Query(Parse.Object.extend('Contact'))
            .equalTo('externe_id', String(row.payeur_id_externe))
            .first({ useMasterKey: true }));
          payeurContact = await upsertContact({
            externeId:    row.payeur_id_externe,
            nom:          row.payeur_nom,
            email:        row.payeur_email,
            telephone:    row.payeur_telephone,
            typePersonne: row.payeur_typePersonne,
          });
          if (isNew) stats.contacts_created++; else stats.contacts_updated++;
          // Lier la personne à la relation employes de l'entreprise
          await lierEmployeEntreprise(payeurContact, payeurPersonne);
        }

        // ── 3. Upsert personne physique de l'apporteur (si entreprise)
        let apporteurPersonne = null;
        if (row.apporteur_contact_id_externe && row.apporteur_contact_nom) {
          const isNew = !(await new Parse.Query(Parse.Object.extend('Contact'))
            .equalTo('externe_id', String(row.apporteur_contact_id_externe))
            .first({ useMasterKey: true }));
          apporteurPersonne = await upsertContact({
            externeId:   row.apporteur_contact_id_externe,
            nom:         row.apporteur_contact_nom,
            email:       row.apporteur_contact_email,
            typePersonne: null,
          });
          if (isNew) stats.contacts_created++; else stats.contacts_updated++;
        }

        // ── 4. Upsert Contact apporteur + lier l'employé
        let apporteurContact = null;
        if (row.apporteur_id_externe) {
          const isNew = !(await new Parse.Query(Parse.Object.extend('Contact'))
            .equalTo('externe_id', String(row.apporteur_id_externe))
            .first({ useMasterKey: true }));
          apporteurContact = await upsertContact({
            externeId:    row.apporteur_id_externe,
            nom:          row.apporteur_nom,
            email:        row.apporteur_email,
            telephone:    row.apporteur_telephone,
            typePersonne: row.apporteur_typePersonne,
          });
          if (isNew) stats.contacts_created++; else stats.contacts_updated++;
          await lierEmployeEntreprise(apporteurContact, apporteurPersonne);
        }

        // ── 3. Upsert Impayé ─────────────────────────────────────────────────
        const Impaye = Parse.Object.extend('Impaye');
        const qi = new Parse.Query(Impaye);
        qi.equalTo('externe_id', row.nfacture);
        let impaye = await qi.first({ useMasterKey: true });
        const isNewImpaye = !impaye;

        if (!impaye) {
          impaye = new Impaye();
          impaye.set('externe_id',  row.nfacture);
          impaye.set('source',      'db_externe');
          impaye.set('statut',      'impaye');
        }

        // Champs toujours mis à jour
        impaye.set('nfacture',          row.nfacture);
        impaye.set('date_piece',        row.datepiece  ? new Date(row.datepiece)       : null);
        impaye.set('date_debut_mission',row.dateDebutMission ? new Date(row.dateDebutMission) : null);
        impaye.set('total_ht',          row.totalhtnet  != null ? Number(row.totalhtnet)  : null);
        impaye.set('total_ttc',         row.totalttcnet != null ? Number(row.totalttcnet) : null);
        impaye.set('reste_a_payer',     row.resteapayer != null ? Number(row.resteapayer) : null);
        impaye.set('facture_soldee',    row.facturesoldee);
        impaye.set('commentaire_piece', row.commentaire_piece || null);
        impaye.set('ref_piece',         row.refpiece || null);
        impaye.set('url_pdf',           buildUrlPdf(row.refpiece, row.datepiece));
        impaye.set('id_dossier',        row.idDossier   ? String(row.idDossier)   : null);
        impaye.set('numero_dossier',    row.numero      || null);
        impaye.set('reference',         row.reference   || null);
        impaye.set('reference_externe', row.referenceExterne || null);
        impaye.set('statut_dossier',    row.statut_intitule  || null);
        impaye.set('commentaire_dossier', row.commentaire_dossier || null);
        impaye.set('employe_intervention', row.employe_intervention || null);
        impaye.set('adresse_bien',      buildAdresse(row));
        impaye.set('code_postal',       row.codePostal  || null);
        impaye.set('ville',             row.ville       || null);
        impaye.set('numero_lot',        row.numeroLot   || null);
        impaye.set('etage',             row.etage       || null);
        impaye.set('entree',            row.entree      || null);
        impaye.set('escalier',          row.escalier    || null);
        impaye.set('porte',             row.porte       || null);

        // Interlocuteurs à plat
        impaye.set('payeur_nom',              row.payeur_nom || null);
        impaye.set('payeur_email',            row.payeur_email || null);
        impaye.set('payeur_telephone',        row.payeur_telephone || null);
        impaye.set('payeur_type_personne',    row.payeur_typePersonne || null);
        impaye.set('payeur_type',             row.payeur_type || null);
        impaye.set('payeur_contact_nom',      row.payeur_contact_nom || null);
        impaye.set('payeur_contact_email',    row.payeur_contact_email || null);
        impaye.set('apporteur_nom',           row.apporteur_nom || null);
        impaye.set('apporteur_email',         row.apporteur_email || null);
        impaye.set('apporteur_telephone',     row.apporteur_telephone || null);
        impaye.set('apporteur_contact_nom',   row.apporteur_contact_nom || null);
        impaye.set('apporteur_contact_email', row.apporteur_contact_email || null);
        impaye.set('acquereur_nom',           row.acquereur_nom || null);
        impaye.set('acquereur_email',         row.acquereur_email || null);
        impaye.set('acquereur_telephone',     row.acquereur_telephone || null);
        impaye.set('donneur_ordre_nom',       row.donneur_ordre_nom || null);
        impaye.set('donneur_ordre_email',     row.donneur_ordre_email || null);
        impaye.set('donneur_ordre_telephone', row.donneur_ordre_telephone || null);
        impaye.set('locataire_entrant_nom',   row.locataire_entrant_nom || null);
        impaye.set('locataire_entrant_email', row.locataire_entrant_email || null);
        impaye.set('locataire_entrant_telephone', row.locataire_entrant_telephone || null);
        impaye.set('locataire_sortant_nom',   row.locataire_sortant_nom || null);
        impaye.set('locataire_sortant_email', row.locataire_sortant_email || null);
        impaye.set('locataire_sortant_telephone', row.locataire_sortant_telephone || null);
        impaye.set('notaire_nom',             row.notaire_nom || null);
        impaye.set('notaire_email',           row.notaire_email || null);
        impaye.set('notaire_telephone',       row.notaire_telephone || null);
        impaye.set('proprietaire_nom',        row.proprietaire_nom || null);
        impaye.set('proprietaire_email',      row.proprietaire_email || null);
        impaye.set('proprietaire_telephone',  row.proprietaire_telephone || null);
        impaye.set('proprietaire_type_personne', row.proprietaire_typePersonne || null);
        impaye.set('proprietaire_contact_nom',   row.proprietaire_contact_nom || null);
        impaye.set('proprietaire_contact_email', row.proprietaire_contact_email || null);
        impaye.set('syndic_nom',              row.syndic_nom || null);
        impaye.set('syndic_email',            row.syndic_email || null);
        impaye.set('syndic_telephone',        row.syndic_telephone || null);

        // Pointers vers les Contacts
        if (payeurContact)    impaye.set('payeur',    payeurContact);
        if (apporteurContact) impaye.set('apporteur', apporteurContact);

        // contact_relance : défini uniquement à la création (l'utilisateur peut le modifier)
        // Priorité : personne physique du payeur > payeur lui-même
        if (isNewImpaye) {
          const defaultRelance = payeurPersonne || payeurContact;
          if (defaultRelance) impaye.set('contact_relance', defaultRelance);
        }

        // Ne pas écraser statut si modifié manuellement
        if (!isNewImpaye && impaye.get('statut') !== 'impaye') {
          impaye.unset('statut'); // conserve la valeur existante
        }

        await impaye.save(null, { useMasterKey: true });
        if (isNewImpaye) stats.impayes_created++; else stats.impayes_updated++;

        // Log individuel pour cet impayé
        try {
          const activite = new Parse.Object('Activite');
          activite.set('type', 'sync_impaye');
          activite.set('operation', isNewImpaye ? 'created' : 'updated');
          activite.set('nfacture', row.nfacture);
          activite.set('impaye_id', impaye.id);
          activite.set('montant', row.resteapayer != null ? Number(row.resteapayer) : null);
          activite.set('payeur_nom', row.payeur_nom || null);
          activite.set('date_piece', row.datepiece ? new Date(row.datepiece) : null);
          activite.set('trigger', trigger);
          activite.set('timestamp', new Date());
          await activite.save(null, { useMasterKey: true });
        } catch (logErr) {
          console.error(`[syncImpayes] Erreur log activite pour ${row.nfacture}:`, logErr.message);
        }

      } catch (err) {
        console.error(`[syncImpayes] Erreur nfacture=${row.nfacture}:`, err.message);
        stats.errors.push({ nfacture: row.nfacture, error: err.message });

        // Log individuel pour l'erreur
        try {
          const activite = new Parse.Object('Activite');
          activite.set('type', 'sync_impaye');
          activite.set('operation', 'error');
          activite.set('nfacture', row.nfacture);
          activite.set('error_message', err.message);
          activite.set('trigger', trigger);
          activite.set('timestamp', new Date());
          await activite.save(null, { useMasterKey: true });
        } catch (logErr) {
          console.error(`[syncImpayes] Erreur log activite erreur pour ${row.nfacture}:`, logErr.message);
        }
      }
    }

    console.log(`[syncImpayes] Terminé — ${stats.impayes_created} créés, ${stats.impayes_updated} MàJ, ${stats.contacts_created} contacts créés, ${stats.errors.length} erreurs`);

  } catch (err) {
    console.error('[syncImpayes] Erreur connexion PostgreSQL:', err.message);
    stats.errors.push({ error: err.message });
  } finally {
    if (client) client.release();
    await pool.end();

    // Persistance du log d'exécution
    try {
      const finishedAt = new Date();
      const total = stats.impayes_created + stats.impayes_updated;
      const log = new Parse.Object('SyncLog');
      log.set('startedAt', startedAt);
      log.set('finishedAt', finishedAt);
      log.set('durationMs', finishedAt - startedAt);
      log.set('trigger', trigger);
      log.set('status', stats.errors.length === 0 ? 'success' : (total > 0 ? 'partial' : 'error'));
      log.set('impayes_created', stats.impayes_created);
      log.set('impayes_updated', stats.impayes_updated);
      log.set('contacts_created', stats.contacts_created);
      log.set('contacts_updated', stats.contacts_updated);
      log.set('errors', stats.errors.map(e => JSON.stringify(e)));
      await log.save(null, { useMasterKey: true });
    } catch (logErr) {
      console.error('[syncImpayes] Impossible d\'écrire le SyncLog:', logErr.message);
    }
  }

  return stats;
}

module.exports = syncImpayes;
