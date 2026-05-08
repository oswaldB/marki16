// backend/cloud/workflows/import-invoice/01-syncImpayes-bis.js
// Synchronise les impayés avec nfacture > 44332 depuis la DB SQLite externe (Analyse immo).
// Retourne { impayes, contacts, errors }

// Charger les variables d'environnement depuis .env
require('dotenv').config({ path: '/home/ubuntu/prod/adti/.env' });

const Database = require('better-sqlite3');

// Initialiser le logger
const { info, warn, error, debug } = require('../../utils/logger');

// Initialiser Parse
if (typeof Parse === 'undefined') {
  const Parse = require('parse/node');
  Parse.initialize(
    process.env.PARSE_APP_ID,
    process.env.PARSE_JAVASCRIPT_KEY,
    process.env.PARSE_MASTER_KEY
  );
  Parse.serverURL = process.env.PARSE_SERVER_URL;
  Parse.Cloud.useMasterKey();
  global.Parse = Parse;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let MOIS_FR = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

function buildUrlPdf(refPiece, datePiece) {
  if (!refPiece || !datePiece) return null;
  let d = new Date(datePiece);
  if (isNaN(d.getTime())) return null;
  let year  = d.getFullYear();
  let month = MOIS_FR[d.getMonth()];
  let refClean = String(refPiece).replace(/\s+/g, '_');
  return `/ADN/Reporting/Gco/Piece/${year}/${month}/${refClean}/standard/${refPiece} (GCO PI FA).pdf`;
}

function buildAdresse(row) {
  return [row.numVoie, row.cptNumVoie, row.typeVoie, row.adresse, row.cptAdresse]
    .filter(Boolean).join(' ').trim() || null;
}

// ─── Requêtes SQL simplifiées (sans jointures complexes ni GROUP BY) ───────────

// Requête 1a : Pièces > 44332 (sans les champs dossier)
let QUERY_PIECES = `
  SELECT
    p.idpiece,
    p.nfacture,
    p.datepiece,
    p.valide,
    p.dateecheance,
    p.totalhtnet,
    p.totalttcnet,
    p.resteapayer,
    p.facturesoldee,
    p.commentaire as commentaire_piece,
    p.refpiece,
    pm.idmetier as dossier_id
  FROM _GCO__GcoPiece p
  LEFT JOIN _GCO__GcoPieceMetier pm ON p.idpiece = pm.idpiece
  WHERE p.nfacture IS NOT NULL
    AND p.nfacture > 44332
    AND p.valide = 1
`;

// Requête 1b : Dossiers correspondants aux pieces
let QUERY_DOSSIERS = `
  SELECT
    d.idDossier,
    d.idStatut,
    d.contactPlace,
    d.reference,
    d.referenceExterne,
    d.numero,
    d.idEmployeIntervention,
    d.commentaire as commentaire_dossier,
    d.adresse,
    d.cptAdresse,
    d.codePostal,
    d.ville,
    d.numeroLot,
    d.etage,
    d.entree,
    d.escalier,
    d.porte,
    d.numVoie,
    d.cptNumVoie,
    d.typeVoie,
    d.dateDebutMission
  FROM _ADN_DIAG__Dossier d
`;

// Requête 2 : Statuts des dossiers
let QUERY_STATUTS = `
  SELECT idStatut, intitule FROM _ADN_DIAG__StatutDossier
`;

// Requête 3 : Employés
let QUERY_EMPLOYES = `
  SELECT idEmploye, prenom, nom FROM _ADN_RG_Employe
`;

// Requête 4 : Interlocuteurs par dossier (tous les rôles)
let QUERY_INTERLOCUTEURS = `
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
  WHERE d.idDossier IN (SELECT DISTINCT d2.idDossier FROM _ADN_DIAG__Dossier d2 JOIN _GCO__GcoPieceMetier pm2 ON d2.idDossier = pm2.idmetier JOIN _GCO__GcoPiece p2 ON pm2.idpiece = p2.idpiece WHERE p2.nfacture IS NOT NULL AND p2.nfacture > 44332 AND p2.valide = 1)
`;

// ─── Upsert Contact ───────────────────────────────────────────────────────────

async function upsertContact({ externeId, nom, prenom, email, telephone, typePersonne }) {
  if (!externeId || !nom) return null;

  let Contact = Parse.Object.extend('Contact');
  let q = new Parse.Query(Contact);
  q.equalTo('externe_id', String(externeId));
  let contact = await q.first({ useMasterKey: true });

  if (!contact) {
    contact = new Contact();
    contact.set('externe_id', String(externeId));
    contact.set('source', 'db_externe');
  }

  contact.set('nom', nom);
  contact.set('prenom', prenom || null);
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
  let relation = entreprise.relation('employes');
  let existants = await relation.query().equalTo('objectId', personne.id).find({ useMasterKey: true });
  if (existants.length === 0) {
    relation.add(personne);
    await entreprise.save(null, { useMasterKey: true });
  }
}

// Fonction utilitaire pour comparer les changements
function hasChanges(oldValues, newValues) {
  if (!oldValues) return true;
  for (let key in newValues) {
    if (newValues[key] instanceof Date && oldValues[key] instanceof Date) {
      if (newValues[key].getTime() !== oldValues[key].getTime()) return true;
    }
    else if (newValues[key] !== oldValues[key]) {
      return true;
    }
  }
  return false;
}

// ─── Helper pour extraire les interlocuteurs par rôle ─────────────────────────
function getInterlocuteurByRole(interlocuteurs, roleName, field = 'id') {
  const interloc = interlocuteurs.find(i => i.role === roleName);
  return interloc ? interloc[field] : null;
}

function getInterlocuteurDataByRole(interlocuteurs, roleName) {
  const interloc = interlocuteurs.find(i => i.role === roleName);
  return interloc || null;
}

// ─── syncImpayes ──────────────────────────────────────────────────────────────

async function syncImpayesBis({ trigger = 'cron' } = {}) {
  const startedAt = new Date();
  const stats = { impayes_created: 0, impayes_updated: 0, contacts_created: 0, contacts_updated: 0, errors: [] };
  info('Début de la synchronisation des impayés', 'import-invoice', 'syncImpayesBis', { trigger });
  debug('Initialisation des statistiques', 'import-invoice', 'syncImpayesBis', { stats });

  // En mode test, utiliser la copie locale de la DB pour éviter les problèmes de permissions
  const dbPath = process.env.NODE_ENV === 'test' && process.env.TEST_DB_PATH
    ? process.env.TEST_DB_PATH
    : '/home/arthur/adti/sync.db';
  
  debug(`Chemin DB: ${dbPath}`, 'import-invoice', 'syncImpayesBis', { dbPath });
  
  // Fonction utilitaire pour ouvrir la DB SQLite avec retry en cas de corruption
  async function openDatabaseWithRetry(path, maxRetries = 3, retryDelayMs = 60000) {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const db = new Database(path);
        // Tester la connexion avec une requête simple
        db.prepare('SELECT 1').get();
        info(`Connexion DB SQLite réussie (${path})`, 'import-invoice', 'syncImpayesBis', { path, attempt: retries + 1 });
        return db;
      } catch (err) {
        retries++;
        error(`Erreur DB SQLite (attempt ${retries}/${maxRetries}): ${err.message}`, 'import-invoice', 'syncImpayesBis', { error: err.message, attempt: retries, maxRetries });
        if (err.message.includes('database disk image is malformed') && retries < maxRetries) {
          warn(`Attente de 1 minute avant retry...`, 'import-invoice', 'syncImpayesBis', { retryDelayMs });
          await new Promise(resolve => setTimeout(resolve, retryDelayMs));
        } else {
          throw err;
        }
      }
    }
    throw new Error(`Impossible d'ouvrir la DB après ${maxRetries} tentatives`);
  }
  
  debug('Ouverture de la base de données', 'import-invoice', 'syncImpayesBis');
  const db = await openDatabaseWithRetry(dbPath);
  
  try {
    debug('Étape 1a: Récupération des pièces > 44332', 'import-invoice', 'syncImpayesBis');
    // Étape 1a : Récupérer toutes les pièces > 44332
    const piecesRows = db.prepare(QUERY_PIECES).all();
    info(`${piecesRows.length} pièces récupérées depuis la base externe`, 'import-invoice', 'syncImpayesBis', { count: piecesRows.length });

    debug('Étape 1b: Récupération des dossiers', 'import-invoice', 'syncImpayesBis');
    // Étape 1b : Récupérer les dossiers correspondants
    const dossierIds = [...new Set(piecesRows
      .map(r => r.dossier_id)
      .filter(id => id != null))];
    
    let dossiersRows = [];
    if (dossierIds.length > 0) {
      const queryDossiersWithIds = `${QUERY_DOSSIERS} WHERE d.idDossier IN (${dossierIds.join(',')})`;
      dossiersRows = db.prepare(queryDossiersWithIds).all();
    }
    info(`${dossiersRows.length} dossiers récupérés`, 'import-invoice', 'syncImpayesBis', { count: dossiersRows.length });
    
    // --- DIAGNOSTIC : Compter les pièces selon les critères ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const piecesWithEcheanceTodayOrLater = piecesRows.filter(p => p.dateecheance && new Date(p.dateecheance) >= today).length;
    const piecesWithResteAPayerStrictlyPositive = piecesRows.filter(p => p.resteapayer > 0).length;
    const piecesWithBothCriteria = piecesRows.filter(p => p.dateecheance && new Date(p.dateecheance) >= today && p.resteapayer > 0).length;
    info(`DIAGNOSTIC - Pièces totales: ${piecesRows.length}`, 'import-invoice', 'syncImpayesBis');
    info(`DIAGNOSTIC - Pièces avec dateecheance >= aujourd'hui: ${piecesWithEcheanceTodayOrLater}`, 'import-invoice', 'syncImpayesBis');
    info(`DIAGNOSTIC - Pièces avec resteapayer > 0: ${piecesWithResteAPayerStrictlyPositive}`, 'import-invoice', 'syncImpayesBis');
    info(`DIAGNOSTIC - Pièces avec dateecheance >= aujourd'hui ET resteapayer > 0: ${piecesWithBothCriteria}`, 'import-invoice', 'syncImpayesBis');

    // Fusionner les données : ajouter les champs dossier à chaque pièce
    const mergedPiecesRows = piecesRows.map(piece => {
      const dossier = dossiersRows.find(d => d.idDossier === piece.dossier_id) || null;
      return {
        ...piece,
        dossier_id: piece.dossier_id,
        idDossier: dossier?.idDossier,
        idStatut: dossier?.idStatut,
        contactPlace: dossier?.contactPlace,
        reference: dossier?.reference,
        referenceExterne: dossier?.referenceExterne,
        numero: dossier?.numero,
        idEmployeIntervention: dossier?.idEmployeIntervention,
        commentaire_dossier: dossier?.commentaire_dossier,
        adresse: dossier?.adresse,
        cptAdresse: dossier?.cptAdresse,
        codePostal: dossier?.codePostal,
        ville: dossier?.ville,
        numeroLot: dossier?.numeroLot,
        etage: dossier?.etage,
        entree: dossier?.entree,
        escalier: dossier?.escalier,
        porte: dossier?.porte,
        numVoie: dossier?.numVoie,
        cptNumVoie: dossier?.cptNumVoie,
        typeVoie: dossier?.typeVoie,
        dateDebutMission: dossier?.dateDebutMission
      };
    });
    
    debug('Étape 2: Récupération des statuts', 'import-invoice', 'syncImpayesBis');
    // Étape 2 : Récupérer tous les statuts
    const statutsMap = {};
    try {
      const statutsRows = db.prepare(QUERY_STATUTS).all();
      statutsRows.forEach(s => { statutsMap[s.idStatut] = s.intitule; });
      debug(`Statuts chargés: ${Object.keys(statutsMap).length}`, 'import-invoice', 'syncImpayesBis', { statutsCount: Object.keys(statutsMap).length });
    } catch(e) { 
      warn(`Erreur statuts: ${e.message}`, 'import-invoice', 'syncImpayesBis', { error: e.message }); 
    }
    
    debug('Étape 3: Récupération des employés', 'import-invoice', 'syncImpayesBis');
    // Étape 3 : Récupérer tous les employés
    const employesMap = {};
    try {
      const employesRows = db.prepare(QUERY_EMPLOYES).all();
      employesRows.forEach(e => { employesMap[e.idEmploye] = e; });
      debug(`Employés chargés: ${Object.keys(employesMap).length}`, 'import-invoice', 'syncImpayesBis', { employesCount: Object.keys(employesMap).length });
    } catch(e) { 
      warn(`Erreur employés: ${e.message}`, 'import-invoice', 'syncImpayesBis', { error: e.message }); 
    }
    
    debug('Étape 4: Récupération des interlocuteurs par dossier', 'import-invoice', 'syncImpayesBis');
    // Étape 4 : Récupérer tous les interlocuteurs par dossier
    const interlocuteursByDossier = {};
    try {
      const interlocuteursRows = db.prepare(QUERY_INTERLOCUTEURS).all();
      interlocuteursRows.forEach(i => {
        if (!interlocuteursByDossier[i.idDossier]) {
          interlocuteursByDossier[i.idDossier] = [];
        }
        interlocuteursByDossier[i.idDossier].push(i);
      });
      debug(`Interlocuteurs chargés: ${Object.keys(interlocuteursByDossier).length} dossiers`, 'import-invoice', 'syncImpayesBis', { dossiersCount: Object.keys(interlocuteursByDossier).length });
    } catch(e) { 
      warn(`Erreur interlocuteurs: ${e.message}`, 'import-invoice', 'syncImpayesBis', { error: e.message }); 
    }

    info('Début du traitement des impayés', 'import-invoice', 'syncImpayesBis');

    for (const pieceRow of mergedPiecesRows) {
      try {
        debug(`Traitement de l'impayé nfacture=${pieceRow.nfacture}`, 'import-invoice', 'syncImpayesBis', { nfacture: pieceRow.nfacture });
        
        // Récupérer les interlocuteurs pour ce dossier
        const dossierId = pieceRow.dossier_id || pieceRow.idDossier;
        const interlocuteurs = interlocuteursByDossier[dossierId] || [];
        
        // Récupérer le statut du dossier
        const statutIntitule = pieceRow.idStatut ? statutsMap[pieceRow.idStatut] : null;
        
        // Récupérer l'employé intervention
        const employe = pieceRow.idEmployeIntervention ? employesMap[pieceRow.idEmployeIntervention] : null;
        const employeIntervention = employe ? `${employe.prenom || ''} ${employe.nom || ''}`.trim() : '';
        
        // Extraire les interlocuteurs par rôle
        const payeurContactData = getInterlocuteurDataByRole(interlocuteurs, 'Payeur');
        const payeurPersonneData = interlocuteurs.find(i => i.role === 'Payeur' && i.idContact);
        const apporteurContactData = getInterlocuteurDataByRole(interlocuteurs, 'Apporteur d\'affaire');
        const apporteurPersonneData = interlocuteurs.find(i => i.role === 'Apporteur d\'affaire' && i.idContact);
        
        // ── 1. Upsert personne physique du payeur (si entreprise)
        let payeurPersonne = null;
        if (payeurPersonneData && payeurPersonneData.contact_interlocuteur_id && payeurPersonneData.contact_nom) {
          let isNew = !(await new Parse.Query(Parse.Object.extend('Contact'))
            .equalTo('externe_id', String(payeurPersonneData.contact_interlocuteur_id))
            .first({ useMasterKey: true }));
          payeurPersonne = await upsertContact({
            externeId:   payeurPersonneData.contact_interlocuteur_id,
            nom:         payeurPersonneData.contact_nom || null,
            prenom:      payeurPersonneData.contact_prenom || null,
            email:       payeurPersonneData.contact_email,
            typePersonne: payeurPersonneData.contact_typePersonne,
          });
          if (isNew) stats.contacts_created++; else stats.contacts_updated++;
        }

        // ── 2. Upsert Contact payeur + lier l'employé
        let payeurContact = null;
        if (payeurContactData && payeurContactData.idInterlocuteur) {
          let isNew = !(await new Parse.Query(Parse.Object.extend('Contact'))
            .equalTo('externe_id', String(payeurContactData.idInterlocuteur))
            .first({ useMasterKey: true }));
          payeurContact = await upsertContact({
            externeId:    payeurContactData.idInterlocuteur,
            nom:          payeurContactData.nom || null,
            prenom:       payeurContactData.prenom || null,
            email:        payeurContactData.email,
            telephone:    payeurContactData.telephone,
            typePersonne: payeurContactData.typePersonne,
          });
          if (isNew) stats.contacts_created++; else stats.contacts_updated++;
          await lierEmployeEntreprise(payeurContact, payeurPersonne);
        }

        // ── 3. Upsert personne physique de l'apporteur
        let apporteurPersonne = null;
        if (apporteurPersonneData && apporteurPersonneData.contact_interlocuteur_id && apporteurPersonneData.contact_nom) {
          let isNew = !(await new Parse.Query(Parse.Object.extend('Contact'))
            .equalTo('externe_id', String(apporteurPersonneData.contact_interlocuteur_id))
            .first({ useMasterKey: true }));
          apporteurPersonne = await upsertContact({
            externeId:   apporteurPersonneData.contact_interlocuteur_id,
            nom:         apporteurPersonneData.contact_nom || null,
            prenom:      apporteurPersonneData.contact_prenom || null,
            email:       apporteurPersonneData.contact_email,
            typePersonne: apporteurPersonneData.contact_typePersonne,
          });
          if (isNew) stats.contacts_created++; else stats.contacts_updated++;
        }

        // ── 4. Upsert Contact apporteur + lier l'employé
        let apporteurContact = null;
        if (apporteurContactData && apporteurContactData.idInterlocuteur) {
          let isNew = !(await new Parse.Query(Parse.Object.extend('Contact'))
            .equalTo('externe_id', String(apporteurContactData.idInterlocuteur))
            .first({ useMasterKey: true }));
          apporteurContact = await upsertContact({
            externeId:    apporteurContactData.idInterlocuteur,
            nom:          apporteurContactData.nom || null,
            prenom:       apporteurContactData.prenom || null,
            email:        apporteurContactData.email,
            telephone:    apporteurContactData.telephone,
            typePersonne: apporteurContactData.typePersonne,
          });
          if (isNew) stats.contacts_created++; else stats.contacts_updated++;
          await lierEmployeEntreprise(apporteurContact, apporteurPersonne);
        }

        // ── 5. Upsert Impayé ─────────────────────────────────────────
        // Convertir nfacture en Number pour externe_id (Parse attend Number, SQLite retourne String/Number)
        const externeId = Number(pieceRow.nfacture);
        let Impaye = Parse.Object.extend('Impaye');
        let qi = new Parse.Query(Impaye);
        qi.equalTo('externe_id', externeId);
        let impaye = await qi.first({ useMasterKey: true });
        let isNewImpaye = !impaye;

        if (!impaye) {
          impaye = new Impaye();
          impaye.set('externe_id',  externeId);
          impaye.set('source',      'db_externe');
        }

        // Champs toujours mis à jour
        impaye.set('nfacture',          Number(pieceRow.nfacture));
        impaye.set('date_piece',        pieceRow.datepiece  ? new Date(pieceRow.datepiece)       : null);
        impaye.set('date_echeance',     pieceRow.dateecheance ? new Date(pieceRow.dateecheance)   : null);
        impaye.set('date_debut_mission', pieceRow.dateDebutMission ? new Date(pieceRow.dateDebutMission) : null);
        impaye.set('total_ht',          pieceRow.totalhtnet  != null ? Number(pieceRow.totalhtnet)  : null);
        impaye.set('total_ttc',         pieceRow.totalttcnet != null ? Number(pieceRow.totalttcnet) : null);
        impaye.set('reste_a_payer',     pieceRow.resteapayer != null ? Number(pieceRow.resteapayer) : null);
        impaye.set('facture_soldee',    Boolean(pieceRow.facturesoldee));
        impaye.set('commentaire_piece', pieceRow.commentaire_piece || null);
        impaye.set('ref_piece',         pieceRow.refpiece || null);
        impaye.set('url_pdf',           buildUrlPdf(pieceRow.refpiece, pieceRow.datepiece));
        impaye.set('id_dossier',        pieceRow.idDossier   ? String(pieceRow.idDossier)   : null);
        impaye.set('numero_dossier',    pieceRow.numero      || null);
        
        // Gestion de la reference
        if (isNewImpaye && pieceRow.reference) {
          let existingImpayeQuery = new Parse.Query(Impaye);
          existingImpayeQuery.equalTo('reference', pieceRow.reference);
          let existingImpaye = await existingImpayeQuery.first({ useMasterKey: true });
          if (existingImpaye) {
            impaye = existingImpaye;
            isNewImpaye = false;
          }
        }
        impaye.set('reference',         pieceRow.reference   || null);
        impaye.set('reference_externe', pieceRow.referenceExterne || null);
        impaye.set('statut_dossier',    statutIntitule  || null);
        impaye.set('commentaire_dossier', pieceRow.commentaire_dossier || null);
        impaye.set('employe_intervention', employeIntervention || null);
        impaye.set('adresse_bien',      buildAdresse(pieceRow));
        impaye.set('code_postal',       pieceRow.codePostal  || null);
        impaye.set('ville',             pieceRow.ville       || null);
        impaye.set('numero_lot',        pieceRow.numeroLot   || null);
        impaye.set('etage',             pieceRow.etage       || null);
        impaye.set('entree',            pieceRow.entree      || null);
        impaye.set('escalier',          pieceRow.escalier    || null);
        impaye.set('porte',             pieceRow.porte       || null);

        // Extraire les données des interlocuteurs pour les champs à plat
        const getInterlocuteurField = (role, field) => {
          const interloc = interlocuteurs.find(i => i.role === role);
          return interloc ? interloc[field] : null;
        };
        
        const getInterlocuteurContactField = (role, field) => {
          const interloc = interlocuteurs.find(i => i.role === role && i.idContact);
          return interloc ? interloc[field] : null;
        };

        // Interlocuteurs à plat
        impaye.set('payeur_nom',              getInterlocuteurField('Payeur', 'nom') || null);
        impaye.set('payeur_prenom',          getInterlocuteurField('Payeur', 'prenom') || null);
        impaye.set('payeur_email',            getInterlocuteurField('Payeur', 'email') || null);
        impaye.set('payeur_telephone',        getInterlocuteurField('Payeur', 'telephone') || null);
        impaye.set('payeur_type_personne',    getInterlocuteurField('Payeur', 'typePersonne') || null);
        impaye.set('payeur_contact_nom',      getInterlocuteurContactField('Payeur', 'contact_nom') || null);
        impaye.set('payeur_contact_prenom',  getInterlocuteurContactField('Payeur', 'contact_prenom') || null);
        impaye.set('payeur_contact_email',    getInterlocuteurContactField('Payeur', 'contact_email') || null);
        
        impaye.set('apporteur_nom',           getInterlocuteurField('Apporteur d\'affaire', 'nom') || null);
        impaye.set('apporteur_prenom',       getInterlocuteurField('Apporteur d\'affaire', 'prenom') || null);
        impaye.set('apporteur_email',         getInterlocuteurField('Apporteur d\'affaire', 'email') || null);
        impaye.set('apporteur_telephone',     getInterlocuteurField('Apporteur d\'affaire', 'telephone') || null);
        impaye.set('apporteur_contact_nom',   getInterlocuteurContactField('Apporteur d\'affaire', 'contact_nom') || null);
        impaye.set('apporteur_contact_prenom', getInterlocuteurContactField('Apporteur d\'affaire', 'contact_prenom') || null);
        impaye.set('apporteur_contact_email', getInterlocuteurContactField('Apporteur d\'affaire', 'contact_email') || null);
        
        impaye.set('acquereur_nom',           getInterlocuteurField('Acquéreur', 'nom') || null);
        impaye.set('acquereur_prenom',       getInterlocuteurField('Acquéreur', 'prenom') || null);
        impaye.set('acquereur_email',         getInterlocuteurField('Acquéreur', 'email') || null);
        impaye.set('acquereur_telephone',     getInterlocuteurField('Acquéreur', 'telephone') || null);
        
        impaye.set('donneur_ordre_nom',       getInterlocuteurField('Donneur d\'ordre', 'nom') || null);
        impaye.set('donneur_ordre_prenom',   getInterlocuteurField('Donneur d\'ordre', 'prenom') || null);
        impaye.set('donneur_ordre_email',     getInterlocuteurField('Donneur d\'ordre', 'email') || null);
        impaye.set('donneur_ordre_telephone', getInterlocuteurField('Donneur d\'ordre', 'telephone') || null);
        
        impaye.set('locataire_entrant_nom',   getInterlocuteurField('Locataire entrant', 'nom') || null);
        impaye.set('locataire_entrant_prenom', getInterlocuteurField('Locataire entrant', 'prenom') || null);
        impaye.set('locataire_entrant_email', getInterlocuteurField('Locataire entrant', 'email') || null);
        impaye.set('locataire_entrant_telephone', getInterlocuteurField('Locataire entrant', 'telephone') || null);
        
        impaye.set('locataire_sortant_nom',   getInterlocuteurField('Locataire sortant', 'nom') || null);
        impaye.set('locataire_sortant_prenom', getInterlocuteurField('Locataire sortant', 'prenom') || null);
        impaye.set('locataire_sortant_email', getInterlocuteurField('Locataire sortant', 'email') || null);
        impaye.set('locataire_sortant_telephone', getInterlocuteurField('Locataire sortant', 'telephone') || null);
        
        impaye.set('notaire_nom',             getInterlocuteurField('Notaire', 'nom') || null);
        impaye.set('notaire_prenom',         getInterlocuteurField('Notaire', 'prenom') || null);
        impaye.set('notaire_email',           getInterlocuteurField('Notaire', 'email') || null);
        impaye.set('notaire_telephone',       getInterlocuteurField('Notaire', 'telephone') || null);
        
        impaye.set('proprietaire_nom',        getInterlocuteurField('Propriétaire', 'nom') || null);
        impaye.set('proprietaire_prenom',    getInterlocuteurField('Propriétaire', 'prenom') || null);
        impaye.set('proprietaire_email',      getInterlocuteurField('Propriétaire', 'email') || null);
        impaye.set('proprietaire_telephone',  getInterlocuteurField('Propriétaire', 'telephone') || null);
        impaye.set('proprietaire_type_personne', getInterlocuteurField('Propriétaire', 'typePersonne') || null);
        impaye.set('proprietaire_contact_nom',   getInterlocuteurContactField('Propriétaire', 'contact_nom') || null);
        impaye.set('proprietaire_contact_prenom', getInterlocuteurContactField('Propriétaire', 'contact_prenom') || null);
        impaye.set('proprietaire_contact_email', getInterlocuteurContactField('Propriétaire', 'contact_email') || null);
        
        impaye.set('syndic_nom',              getInterlocuteurField('Syndic', 'nom') || null);
        impaye.set('syndic_prenom',          getInterlocuteurField('Syndic', 'prenom') || null);
        impaye.set('syndic_email',            getInterlocuteurField('Syndic', 'email') || null);
        impaye.set('syndic_telephone',        getInterlocuteurField('Syndic', 'telephone') || null);

        // Pointers vers les Contacts
        if (payeurContact)    impaye.set('payeur',    payeurContact);
        if (apporteurContact) impaye.set('apporteur', apporteurContact);

        // contact_relance : défini uniquement à la création
        if (isNewImpaye) {
          let defaultRelance = payeurPersonne || payeurContact;
          if (defaultRelance) impaye.set('contact_relance', defaultRelance);
        }

        // Calcul du type payeur
        const payeurNom = getInterlocuteurField('Payeur', 'nom');
        const proprietaireNom = getInterlocuteurField('Propriétaire', 'nom');
        const apporteurNom = getInterlocuteurField('Apporteur d\'affaire', 'nom');
        let payeurType = 'Autre';
        if (payeurNom && proprietaireNom && payeurNom === proprietaireNom) {
          payeurType = 'Propriétaire';
        } else if (payeurNom && apporteurNom && payeurNom === apporteurNom) {
          payeurType = 'Apporteur d\'affaire';
        }
        impaye.set('payeur_type', payeurType);

        // Stocker les oldValues pour la comparaison
        let oldValues = isNewImpaye ? null : {
          nfacture: impaye.get('nfacture'),
          date_piece: impaye.get('date_piece'),
          date_echeance: impaye.get('date_echeance'),
          date_debut_mission: impaye.get('date_debut_mission'),
          total_ht: impaye.get('total_ht'),
          total_ttc: impaye.get('total_ttc'),
          reste_a_payer: impaye.get('reste_a_payer'),
          facture_soldee: impaye.get('facture_soldee'),
          commentaire_piece: impaye.get('commentaire_piece'),
          ref_piece: impaye.get('ref_piece'),
          url_pdf: impaye.get('url_pdf'),
          id_dossier: impaye.get('id_dossier'),
          numero_dossier: impaye.get('numero_dossier'),
          reference: impaye.get('reference'),
          reference_externe: impaye.get('reference_externe'),
          statut_dossier: impaye.get('statut_dossier'),
          commentaire_dossier: impaye.get('commentaire_dossier'),
          employe_intervention: impaye.get('employe_intervention'),
          adresse_bien: impaye.get('adresse_bien'),
          code_postal: impaye.get('code_postal'),
          ville: impaye.get('ville'),
          numero_lot: impaye.get('numero_lot'),
          etage: impaye.get('etage'),
          entree: impaye.get('entree'),
          escalier: impaye.get('escalier'),
          porte: impaye.get('porte'),
          payeur: impaye.get('payeur') ? impaye.get('payeur').id : null,
          apporteur: impaye.get('apporteur') ? impaye.get('apporteur').id : null,
          contact_relance: impaye.get('contact_relance') ? impaye.get('contact_relance').id : null
        };

        // Sauvegarde
        debug(`Sauvegarde de l'impayé nfacture=${pieceRow.nfacture}`, 'import-invoice', 'syncImpayesBis', { nfacture: pieceRow.nfacture, isNew: isNewImpaye });
        await impaye.save(null, { useMasterKey: true });
        info(`Impayé sauvegardé avec succès (nfacture=${pieceRow.nfacture})`, 'import-invoice', 'syncImpayesBis', { nfacture: pieceRow.nfacture, isNew: isNewImpaye });
        if (isNewImpaye) stats.impayes_created++; else stats.impayes_updated++;

        // Log d'activité
        try {
          let newValues = {
            nfacture: pieceRow.nfacture,
            date_piece: pieceRow.datepiece ? new Date(pieceRow.datepiece) : null,
            date_echeance: pieceRow.dateecheance ? new Date(pieceRow.dateecheance) : null,
            date_debut_mission: pieceRow.dateDebutMission ? new Date(pieceRow.dateDebutMission) : null,
            total_ht: pieceRow.totalhtnet != null ? Number(pieceRow.totalhtnet) : null,
            total_ttc: pieceRow.totalttcnet != null ? Number(pieceRow.totalttcnet) : null,
            reste_a_payer: pieceRow.resteapayer != null ? Number(pieceRow.resteapayer) : null,
            facture_soldee: pieceRow.facturesoldee,
            commentaire_piece: pieceRow.commentaire_piece || null,
            ref_piece: pieceRow.refpiece || null,
            url_pdf: buildUrlPdf(pieceRow.refpiece, pieceRow.datepiece),
            id_dossier: pieceRow.idDossier ? String(pieceRow.idDossier) : null,
            numero_dossier: pieceRow.numero || null,
            reference: pieceRow.reference || null,
            reference_externe: pieceRow.referenceExterne || null,
            statut_dossier: statutIntitule || null,
            commentaire_dossier: pieceRow.commentaire_dossier || null,
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
            apporteur: apporteurContact ? apporteurContact.id : null,
            contact_relance: isNewImpaye && (payeurPersonne || payeurContact) ? (payeurPersonne || payeurContact).id : (impaye.get('contact_relance') ? impaye.get('contact_relance').id : null)
          };

          let shouldLogActivity = isNewImpaye || hasChanges(oldValues, newValues);

          if (shouldLogActivity) {
            let activite = new Parse.Object('Activite');
            activite.set('type', 'sync_impaye');
            activite.set('operation', isNewImpaye ? 'created' : 'updated');
            activite.set('nfacture', pieceRow.nfacture);
            activite.set('impaye_id', impaye.id);
            activite.set('montant', pieceRow.resteapayer != null ? Number(pieceRow.resteapayer) : null);
            activite.set('payeur_nom', getInterlocuteurField('Payeur', 'nom') || null);
            activite.set('date_piece', pieceRow.datepiece ? new Date(pieceRow.datepiece) : null);
            activite.set('trigger', trigger);
            activite.set('timestamp', new Date());
            await activite.save(null, { useMasterKey: true });
          }
        } catch (logErr) {
          error(`Erreur log activite pour ${pieceRow.nfacture}: ${logErr.message}`, 'import-invoice', 'syncImpayesBis', { nfacture: pieceRow.nfacture, error: logErr.message });
        }

      } catch (err) {
        error(`Erreur nfacture=${pieceRow.nfacture}: ${err.message}`, 'import-invoice', 'syncImpayesBis', { nfacture: pieceRow.nfacture, error: err.message, stack: err.stack?.substring(0, 500) });
        debug(`Stack trace: ${err.stack?.substring(0, 1000)}`, 'import-invoice', 'syncImpayesBis', { nfacture: pieceRow.nfacture });
        stats.errors.push({ nfacture: pieceRow.nfacture, error: err.message });

        // Log d'erreur
        try {
          let activite = new Parse.Object('Activite');
          activite.set('type', 'sync_impaye');
          activite.set('operation', 'error');
          activite.set('nfacture', pieceRow.nfacture);
          activite.set('error_message', err.message);
          activite.set('trigger', trigger);
          activite.set('timestamp', new Date());
          await activite.save(null, { useMasterKey: true });
        } catch (logErr) {
          error(`Erreur log activite erreur pour ${pieceRow.nfacture}: ${logErr.message}`, 'import-invoice', 'syncImpayesBis', { nfacture: pieceRow.nfacture, error: logErr.message });
        }
      }
    }

    info(`Terminé — ${stats.impayes_created} créés, ${stats.impayes_updated} MàJ, ${stats.contacts_created} contacts créés, ${stats.errors.length} erreurs`, 'import-invoice', 'syncImpayesBis', { 
      created: stats.impayes_created, 
      updated: stats.impayes_updated, 
      contactsCreated: stats.contacts_created,
      errors: stats.errors.length 
    });

  } catch (err) {
    error(`Erreur base de données SQLite: ${err.message}`, 'import-invoice', 'syncImpayesBis', { error: err.message, stack: err.stack?.substring(0, 500) });
    stats.errors.push({ error: err.message });
  } finally {
    db.close();

    // Persistance du log d'exécution dans Parse
    debug('Écriture du log dans Parse (SyncLog)', 'import-invoice', 'syncImpayesBis');
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
      info('Log Parse sauvegardé avec succès', 'import-invoice', 'syncImpayesBis');
    } catch (logErr) {
      error(`Impossible d'écrire le SyncLog: ${logErr.message}`, 'import-invoice', 'syncImpayesBis', { error: logErr.message, stack: logErr.stack?.substring(0, 500) });
    }
  }

  return stats;
}

module.exports = syncImpayesBis;
