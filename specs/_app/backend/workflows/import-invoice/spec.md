# Workflow Backend: import-invoice

**Feature** : F-001 Import des données depuis DB externe  
**Type** : Backend (Cloud Job / Cloud Function)  
**Fichier** : `backend/cloud/workflows/import-invoice/00-master.js`

## Description

Workflow backend complet d'import des impayés depuis la base SQLite externe (`sync.db`) vers Parse Server. Ce workflow est structuré comme une **méga-fonction** orchestrant 5 étapes distinctes qui récupèrent, transforment et stockent les données de facturation.

## Déclencheurs

- **CRON** : Toutes les heures (`0 * * * *`)
- **Manuel** : Via Cloud Function `importInvoice`

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MEGA-FONCTION: importImpayes()                      │
│                         (backend/cloud/workflows/                       │
│                           import-invoice/00-master.js)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌───────────┐ │
│  │  ÉTAPE 1    │───▶│  ÉTAPE 2    │───▶│  ÉTAPE 3    │───▶│ ÉTAPE 4   │ │
│  │ FetchPieces │    │ FetchStatuts│    │ FetchEmployes│   │ FetchInter│ │
│  │   + Dossiers│    │             │    │              │   │ locuteurs │ │
│  └─────────────┘    └─────────────┘    └─────────────┘    └───────────┘ │
│        │                                                           │     │
│        │                    ┌─────────────┐                       │     │
│        └───────────────────▶│  ÉTAPE 5    │◀──────────────────────┘     │
│                             │ Process &   │                              │
│                             │ SaveImpayes │                              │
│                             │  (BATCH)    │                              │
│                             └─────────────┘                              │
│                                    │                                     │
│                                    ▼                                     │
│                             ┌─────────────┐                              │
│                             │   OUTPUT    │                              │
│                             │   {stats}   │                              │
│                             └─────────────┘                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Input

```javascript
{
  force: Boolean,      // Force l'import même si déjà exécuté récemment
  dryRun: Boolean      // Mode simulation (ne sauvegarde pas)
}
```

---

## Méga-Fonction Principale

### `async function importImpayes({ force = false, dryRun = false })`

**Localisation** : `backend/cloud/workflows/import-invoice/00-master.js`

Cette fonction orchestre l'import complet en 5 étapes séquentielles avec gestion d'erreur et logging.

```javascript
async function importImpayes({ force = false, dryRun = false }) {
  const startTime = Date.now()
  
  // =========================================================================
  // CHECKPOINT INITIAL
  // =========================================================================
  logCheckpoint('import-invoice-started', { 
    timestamp: new Date().toISOString(),
    dryRun 
  })
  
  try {
    // ========================================================================
    // ÉTAPE 1: Récupération des Pièces + Dossiers (SQLite)
    // ========================================================================
    const { pieces } = await fetchPiecesAndDossiers()
    
    if (pieces.length === 0) {
      logCheckpoint('import-invoice-no-data')
      return { success: true, imported: 0, message: 'Aucune nouvelle pièce' }
    }
    
    // ========================================================================
    // ÉTAPE 2: Récupération des Statuts de Dossier (Parse)
    // ========================================================================
    const statutsMap = await fetchStatutsDossier()
    
    // ========================================================================
    // ÉTAPE 3: Récupération des Employés (Parse)
    // ========================================================================
    const employesMap = await fetchEmployes()
    
    // ========================================================================
    // ÉTAPE 4: Récupération des Interlocuteurs (SQLite)
    // ========================================================================
    const dossierIds = pieces.map(p => p.idDossier || p.dossier_id).filter(Boolean)
    const interlocuteursByDossier = await fetchInterlocuteurs(dossierIds)
    
    // ========================================================================
    // ÉTAPE 5: Traitement et Sauvegarde (Mode BATCH)
    // ========================================================================
    const { stats } = await processAndSaveImpayes({
      pieces,
      statutsMap,
      employesMap,
      interlocuteursByDossier,
      dryRun
    })
    
    // ========================================================================
    // CHECKPOINT FINAL
    // ========================================================================
    const duration = Date.now() - startTime
    logCheckpoint('import-invoice-completed', {
      ...stats,
      duration: `${duration}ms`,
      piecesProcessed: pieces.length
    })
    
    return {
      success: true,
      stats,
      duration
    }
    
  } catch (error) {
    logCheckpoint('import-invoice-failed', {
      error: error.message,
      stack: error.stack?.substring(0, 500)
    })
    throw error
  }
}
```

---

## Étapes Détaillées

### ÉTAPE 1: `fetchPiecesAndDossiers()`

**Fichier** : `01-fetchPiecesAndDossiers.js`

Récupère les pièces (factures) modifiées dans les dernières 24h avec leurs dossiers associés et missions (JSON agrégé).

```javascript
const QUERY_PIECES = `
  SELECT
    p.idpiece,
    p.nfacture,
    p.datepiece,
    p.dateecheance,
    p.totalhtnet,
    p.totalttcnet,
    p.resteapayer,
    p.facturesoldee,
    p.commentaire as commentaire_piece,
    p.refpiece,
    pm.idmetier as dossier_id,
    d.idDossier,
    d.idStatut,
    d.contactPlace,
    d.reference,
    d.referenceExterne,
    d.numero,
    d.idEmployeIntervention,
    d.commentaire as commentaire_dossier,
    d.adresse, d.cptAdresse, d.codePostal, d.ville,
    d.numeroLot, d.etage, d.entree, d.escalier, d.porte,
    d.numVoie, d.cptNumVoie, d.typeVoie,
    d.dateDebutMission,
    d.idCadreMission,                    -- Contexte: AVV, LOC, AVTRAV...
    (
      SELECT json_group_array(
        json_object(
          'idMission', m.idMission,
          'idCategorieMission', m.idCategorieMission,  -- A, C, T, EDL...
          'idTypeMission', m.idTypeMission,              -- CA, D, ET, S...
          'intitule', m.intitule,
          'titreRapport', m.titreRapport,
          'dateDebut', m.dateDebut,
          'dateFin', m.dateFin,
          'conclusion', m.conclusion
        )
      )
      FROM _ADN_DIAG__Mission m
      WHERE m.idDossier = d.idDossier
    ) as missions_json
  FROM _GCO__GcoPiece p
  LEFT JOIN _GCO__GcoPieceMetier pm ON p.idpiece = pm.idpiece
  LEFT JOIN _ADN_DIAG__Dossier d ON pm.idmetier = d.idDossier
  WHERE p.nfacture IS NOT NULL
  AND p.datemaj >= datetime('now', '-24 hours')
  AND p.resteapayer >= 0
  AND p.valide = 1
  ORDER BY p.datepiece DESC
`
```

**CHECKPOINT**: `fetch-pieces-completed`
```json
{
  "count": 156,
  "dbPath": "/home/arthur/adti/sync.db",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### ÉTAPE 2: `fetchStatutsDossier()`

**Fichier** : `02-fetchStatutsDossier.js`

Charge les statuts depuis Parse pour mapping ID → Intitulé.

```javascript
async function fetchStatutsDossier() {
  const StatutDossier = Parse.Object.extend('StatutDossier')
  const query = new Parse.Query(StatutDossier)
  query.limit(1000)
  
  const statuts = await query.find({ useMasterKey: true })
  const statutsMap = {}
  
  statuts.forEach(statut => {
    const idExterne = statut.get('externe_id')
    const intitule = statut.get('intitule')
    if (idExterne && intitule) {
      statutsMap[idExterne] = intitule
    }
  })
  
  return statutsMap  // { 1: "En cours", 2: "Terminé", ... }
}
```

**CHECKPOINT**: `fetch-statuts-completed`
```json
{ "count": 12 }
```

---

### ÉTAPE 3: `fetchEmployes()`

**Fichier** : `03-fetchEmployes.js`

Charge les employés depuis Parse pour mapping ID → Nom/Prénom.

```javascript
async function fetchEmployes() {
  const Employe = Parse.Object.extend('Employe')
  const query = new Parse.Query(Employe)
  query.limit(1000)
  
  const employes = await query.find({ useMasterKey: true })
  const employesMap = {}
  
  employes.forEach(emp => {
    const idExterne = emp.get('externe_id')
    if (idExterne) {
      employesMap[idExterne] = {
        nom: emp.get('nom'),
        prenom: emp.get('prenom')
      }
    }
  })
  
  return employesMap  // { 35: { nom: "DUPONT", prenom: "Jean" }, ... }
}
```

**CHECKPOINT**: `fetch-employes-completed`
```json
{ "count": 45 }
```

---

### ÉTAPE 4: `fetchInterlocuteurs(dossierIds)`

**Fichier** : `04-fetchInterlocuteurs.js`

Récupère tous les interlocuteurs par dossier (avec leurs contacts associés).

```javascript
const QUERY_INTERLOCUTEURS = `
  SELECT
    di.idDossier,
    di.idInterlocuteur,
    di.idRole,
    r.intitule as role,
    di.typePersonne,
    di.qualite,
    di.titre,
    di.nom,
    di.prenom,
    di.idContact,
    c.nom as contact_nom,
    c.prenom as contact_prenom,
    c.email as contact_email,
    c.telephone as contact_telephone,
    c.typePersonne as contact_typePersonne
  FROM _ADN_DIAG__DossierInterlocuteur di
  LEFT JOIN _ADN_DIAG__Role r ON di.idRole = r.idRole
  LEFT JOIN _ADN_RG_Contact c ON di.idContact = c.idContact
  WHERE di.idDossier IN (${placeholders})
  ORDER BY di.idDossier, di.ordre
`
```

**Structure retournée** : `{ [dossierId]: [{ role, nom, prenom, email, ... }] }`

**Rôles mappés** :
- Payeur
- Apporteur d'affaire
- Acquéreur
- Donneur d'ordre
- Locataire entrant/sortant
- Notaire
- Propriétaire
- Syndic

**CHECKPOINT**: `fetch-interlocuteurs-completed`
```json
{ 
  "dossierCount": 89,
  "totalInterlocuteurs": 234
}
```

---

### ÉTAPE 5: `processAndSaveImpayes({ pieces, statutsMap, employesMap, interlocuteursByDossier, dryRun })`

**Fichier** : `05-processAndSaveImpayes.js`

**Méga-fonction de traitement** - Ordonnancement optimal : Contacts → Impayés → Activités.

#### Phase 1: Collecte des IDs de contacts à vérifier

```javascript
const contactIdsToCheck = new Set()

for (const pieceRow of pieces) {
  const interlocuteurs = interlocuteursByDossier[dossierId] || []
  
  // Extraire IDs des payeurs et apporteurs
  const payeurData = interlocuteurs.find(i => i.role === "Payeur")
  const apporteurData = interlocuteurs.find(i => i.role === "Apporteur d'affaire")
  
  if (payeurData?.idInterlocuteur) {
    contactIdsToCheck.add(String(payeurData.idInterlocuteur))
  }
  if (apporteurData?.idInterlocuteur) {
    contactIdsToCheck.add(String(apporteurData.idInterlocuteur))
  }
}
```

#### Phase 2: Récupération des contacts existants (une requête)

```javascript
const existingContactsMap = new Map()

const Contact = Parse.Object.extend('Contact')
const query = new Parse.Query(Contact)
query.containedIn('externe_id', Array.from(contactIdsToCheck))
query.limit(10000)

const existingContacts = await query.find({ useMasterKey: true })
existingContacts.forEach(contact => {
  existingContactsMap.set(contact.get('externe_id'), contact)
})
```

#### Phase 3: Préparation des objets (sans save)

Pour chaque pièce, on prépare :
- **Contact Payeur** (entreprise)
- **Contact Payeur Personne** (si entreprise)
- **Contact Apporteur** (entreprise)
- **Contact Apporteur Personne** (si entreprise)
- **Impayé** (facture)
- **Activité** (log)

```javascript
const contactsToSave = []
const impayesToSave = []
const activitesToSave = []

for (const pieceRow of pieces) {
  // Préparation contact Payeur
  const payeurContact = prepareContactUpsert({
    externeId: payeurData.idInterlocuteur,
    nom: payeurData.nom,
    prenom: payeurData.prenom,
    email: payeurData.email,
    existingContact: existingContactsMap.get(String(payeurData.idInterlocuteur))
  })
  if (payeurContact) contactsToSave.push(payeurContact)
  
  // Préparation Impayé avec toutes les données
  const { impaye, isNew } = prepareImpayeUpsert({
    pieceRow,
    statutsMap,
    employesMap,
    interlocuteurs,
    payeurContact,
    apporteurContact
  })
  impayesToSave.push(impaye)
  
  // Préparation Activité
  const activite = prepareActiviteLog({
    operation: isNew ? 'created' : 'updated',
    nfacture: pieceRow.nfacture,
    montant: pieceRow.resteapayer
  })
  activitesToSave.push(activite)
}
```

#### Phase 4: Sauvegarde par BATCH (ordre crucial)

```javascript
// 1. Contacts d'abord (références nécessaires)
if (contactsToSave.length > 0) {
  await batchSave(contactsToSave, { useMasterKey: true }, 50)
}

// 2. Impayés ensuite (pointeurs vers contacts)
if (impayesToSave.length > 0) {
  await batchSave(impayesToSave, { useMasterKey: true }, 50)
}

// 3. Activités en dernier
if (activitesToSave.length > 0) {
  await batchSave(activitesToSave, { useMasterKey: true }, 50)
}
```

#### Structure de `prepareImpayeUpsert()`

```javascript
function prepareImpayeUpsert(pieceRow, existingImpaye, statutsMap, employesMap, interlocuteurs) {
  const impaye = existingImpaye || new Impaye()
  
  // === IDENTIFICATION ===
  impaye.set('externe_id', pieceRow.nfacture)
  impaye.set('nfacture', pieceRow.nfacture)
  impaye.set('ref_piece', pieceRow.refpiece)
  
  // === DATES ===
  impaye.set('date_piece', pieceRow.datepiece ? new Date(pieceRow.datepiece) : null)
  impaye.set('date_echeance', pieceRow.dateecheance ? new Date(pieceRow.dateecheance) : null)
  
  // === MONTANTS ===
  impaye.set('total_ht', Number(pieceRow.totalhtnet))
  impaye.set('total_ttc', Number(pieceRow.totalttcnet))
  impaye.set('reste_a_payer', Number(pieceRow.resteapayer))
  impaye.set('facture_soldee', Boolean(pieceRow.facturesoldee))
  
  // === DOSSIER ===
  impaye.set('id_dossier', String(pieceRow.idDossier))
  impaye.set('numero_dossier', pieceRow.numero)
  impaye.set('statut_dossier', statutsMap[pieceRow.idStatut])
  
  // === MISSION & CONTEXTE (NOUVEAU) ===
  impaye.set('cadre_mission', pieceRow.idCadreMission)  // AVV, LOC, AVTRAV...
  
  // Tableau de toutes les missions
  let missions = []
  if (pieceRow.missions_json) {
    try {
      const parsed = JSON.parse(pieceRow.missions_json)
      missions = parsed.filter(m => m && m.idMission)
    } catch (e) { missions = [] }
  }
  impaye.set('missions', missions)
  
  // === CONTACTS (dénormalisés) ===
  // payeur_nom, payeur_prenom, payeur_email, payeur_telephone...
  // apporteur_nom, apporteur_prenom...
  // proprietaire_nom, acquereur_nom, notaire_nom...
  
  // === POINTERS ===
  impaye.set('payeur', payeurContact)
  impaye.set('apporteur', apporteurContact)
  impaye.set('contact_relance', payeurContact)  // Par défaut
  
  // === CALCULÉS ===
  impaye.set('payeur_type', calculatePayeurType(interlocuteurs))
  impaye.set('url_pdf', buildUrlPdf(pieceRow.refpiece, pieceRow.datepiece))
  
  return { impaye, isNew: !existingImpaye }
}
```

**CHECKPOINT**: `process-impayes-completed`
```json
{
  "impayes_created": 45,
  "impayes_updated": 111,
  "contacts_created": 23,
  "contacts_updated": 67,
  "activites_created": 156,
  "errors": [],
  "duration": "2.4s"
}
```

---

## Output Global

```javascript
{
  success: true,
  stats: {
    impayes_created: 45,
    impayes_updated: 111,
    contacts_created: 23,
    contacts_updated: 67,
    errors: []
  },
  duration: 2450  // ms
}
```

---

## Gestion des Erreurs

### CHECKPOINT: `import-invoice-failed`

```json
{
  "error": "database disk image is malformed",
  "step": "fetch-pieces",
  "stack": "Error: database disk image is malformed\n    at ...",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Retry automatique (SQLite)

```javascript
async function openDatabaseWithRetry(path, maxRetries = 3, retryDelayMs = 60000) {
  let retries = 0
  while (retries < maxRetries) {
    try {
      const db = new Database(path)
      db.prepare("SELECT 1").get()
      return db
    } catch (err) {
      retries++
      if (err.message.includes("database disk image is malformed") && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs))
      } else {
        throw err
      }
    }
  }
}
```

---

## Métriques et Monitoring

| Métrique | Description |
|----------|-------------|
| `import_duration_ms` | Temps total d'exécution |
| `pieces_processed` | Nombre de pièces traitées |
| `impayes_created_rate` | Taux de création vs mise à jour |
| `contacts_synced` | Nombre de contacts synchronisés |
| `errors_count` | Nombre d'erreurs par exécution |
| `batch_size_avg` | Taille moyenne des batchs |

---

## Fichiers du Workflow

```
backend/cloud/workflows/import-invoice/
├── 00-master.js                    # Mega-fonction orchestratrice
├── 01-fetchPiecesAndDossiers.js    # Étape 1: Pièces + Dossiers + Missions
├── 02-fetchStatutsDossier.js       # Étape 2: Statuts
├── 03-fetchEmployes.js             # Étape 3: Employés
├── 04-fetchInterlocuteurs.js         # Étape 4: Interlocuteurs
├── 05-processAndSaveImpayes.js     # Étape 5: Traitement BATCH
└── __tests__/
    └── import-invoice.test.js      # Tests unitaires
```

---

## Variables d'Environnement

```bash
# Parse Server
PARSE_APP_ID=xxx
PARSE_JAVASCRIPT_KEY=xxx
PARSE_MASTER_KEY=xxx
PARSE_SERVER_URL=https://parse.example.com/parse

# Base externe
DB_PATH=/home/arthur/adti/sync.db  # Fallback si TEST_DB_PATH non défini
TEST_DB_PATH=/path/to/test.db      # En mode test
```

---

## Notes Techniques

### Ordre de sauvegarde critique

1. **Contacts** en premier (car référencés par pointeurs)
2. **Impayés** ensuite (pointeurs vers contacts sauvegardés)
3. **Activités** en dernier (pointeurs optionnels vers impayés)

### Batch Size

- Par défaut : **50 objets** par batch
- Parse limite : 50 objets max par `saveAll()`
- Réseau optimisé : réduction des allers-retours HTTP

### Concurrency

- Pas de parallélisme entre étapes (dépendances séquentielles)
- Parallélisme interne dans `processAndSaveImpayes` pour la préparation
- Sauvegarde séquentielle des batches (respect des dépendances)

### Idempotence

Le workflow est **idempotent** : réexécution possible sans doublons grâce à :
- `externe_id` comme clé unique
- Upsert (update si existe, create si nouveau)
- Logs traçables par `nfacture`
