# Technical Guide: import-invoice Workflow

## Overview
This workflow orchestrates the complete import process for invoices from the external SQLite database into Parse. It is an **eight-step process** that fetches data, creates contacts, processes invoices, assigns sequences, and triggers reminder generation.

## Purpose
Import invoices and related data from the external database into Parse, including:
1. Fetching invoices and folders from SQLite
2. Fetching statuses, employees, and interlocutors
3. Creating contacts with proper relationships
4. Processing and saving invoices in Parse
5. Assigning sequences to invoices
6. Fetching invoices with sequences
7. Triggering reminder generation

---

## Invocation Methods (Comment ce workflow est appelé)

### 1. Cloud Function Trigger (Primary Method)
**Endpoint**: `Parse.Cloud.run("triggerImportInvoices")`

**How to Call**:
```javascript
// From client-side JavaScript
Parse.Cloud.run('triggerImportInvoices', {}, { useMasterKey: true })
  .then(result => {
    console.log('Import completed:', result.stats);
  })
  .catch(error => {
    console.error('Import error:', error);
  });
```

**Authentication**:
- Requires `masterKey` OR authenticated `user`
- Throws: `"Non autorisé - cette fonction nécessite un utilisateur authentifié"`

**Parameters**: None (autonomous workflow)

---

### 2. Direct CLI Execution
**Command**: 
```bash
cd /home/ubuntu/prod/adti/backend/cloud/workflows/import-invoice
node 00-master.js
```

**Trigger**: `"cli"`

**Use Case**: Manual execution for testing or maintenance

---

### 3. Programmatic Import
**Usage**:
```javascript
const importInvoicesMaster = require('./import-invoice/00-master');

await importInvoicesMaster({ trigger: 'manual' });
```

**Use Case**: Can be called by other scripts or workflows

---

### 4. Cron Trigger (Expected)
**Configuration**: Would be set up in Parse Dashboard or external scheduler

**Trigger**: `"cron"`

**Use Case**: Scheduled automatic execution (e.g., daily import)

---

## Complete Flow: From Invocation to Output

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVOCATION POINT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │ Cloud Function Call  │  │ CLI Execution        │  │ Programmatic Call   │  │
│  │ Parse.Cloud.run(     │  │ node 00-master.js    │  │ require('./00-      │  │
│  │  "triggerImportInvoices")│  │                     │  │ master').default()  │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘  │
└─────────────┼──────────────────────────┼──────────────────────────┼────────────┘
              └──────────────────────────┼──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTRY POINT: 00-master.js                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Load environment variables from .env                                     │
│  2. Initialize Parse SDK (if not already initialized)                         │
│  3. If trigger !== "test": clearLogs()                                        │
│  4. Log workflow start with trigger type                                     │
│  5. Initialize stats object                                                   │
│     └─ stats = { errors: [], total: { startedAt, finishedAt, durationMs } }    │
│  6. Execute importInvoicesMaster() function                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 1: Fetch Invoices & Folders (01-fetchPiecesAndDossiers.js)│
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: None                                                                │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.1 Open SQLite database at /home/arthur/adti/sync.db                 │   │
│  │     (or TEST_DB_PATH if NODE_ENV=test)                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.2 Query _GCO__GcoPiece table:                                        │   │
│  │     SELECT * FROM _GCO__GcoPiece                                       │   │
│  │     WHERE facturesoldee = 0 OR resteapayer > 0                         │   │
│  │     (unpaid invoices)                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.3 Query _GCO__GcoDossier table:                                      │   │
│  │     SELECT * FROM _GCO__GcoDossier                                      │   │
│  │     (all folders)                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.4 Map data: pieces array, dossiers array                            │   │
│  │     Link invoices to folders                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { pieces: [...], dossiers: [...] }                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 2: Fetch Statuses (02-fetchStatuts.js)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: None                                                                │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2.1 Query status table from SQLite:                                    │   │
│  │     SELECT code, libelle FROM [status_table]                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2.2 Create statutsMap: { code1: libelle1, code2: libelle2, ... }       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { statutsMap: {...} }                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 3: Fetch Employees (03-fetchEmployes.js)             │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: None                                                                │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3.1 Query employee table from SQLite:                                  │   │
│  │     SELECT id, nom, prenom, email, ... FROM [employee_table]            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3.2 Create employesMap: { id1: {nom, prenom, email, ...}, ... }        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { employesMap: {...} }                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 4: Fetch Interlocutors (04-fetchInterlocuteurs.js)    │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: { pieces: [...] } (from Step 1)                                     │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4.1 Query interlocutor table from SQLite:                              │   │
│  │     SELECT * FROM [interlocutor_table]                                 │   │
│  │     WHERE ndossier IN (dossier_ids_from_pieces)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4.2 Group interlocutors by dossier:                                   │   │
│  │     interlocuteursByDossier = {                                       │   │
│  │       dossierId1: [{interlocutor1}, {interlocutor2}, ...],            │   │
│  │       dossierId2: [{interlocutor1}, ...],                             │   │
│  │       ...                                                             │   │
│  │     }                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { interlocuteursByDossier: {...} }                                │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 STEP 4.5: Create Contacts (04-createContactsWithRelations.js)     │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: { interlocuteursByDossier: {...} } (from Step 4)                     │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4.5.1 For each dossier and its interlocutors:                          │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. For each interlocutor:                                    │   │   │
│  │      │    Query Parse: Contact where email = interlocutor.email     │   │   │
│  │      │    IF EXISTS: use existing contact                           │   │   │
│  │      │    IF NOT EXISTS: create new Contact                          │   │   │
│  │      │       - Set: nom, prenom, email, telephone, etc.             │   │   │
│  │      │       - Save to Parse                                         │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ b. Link contact to dossier:                                   │   │   │
│  │      │    Query/Update Dossier in Parse                               │   │   │
│  │      │    Add contact to dossier.contacts or similar relation       │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4.5.2 Link employees to companies (if applicable)                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { contactsMap: {contactId: contactObject, ...}, stats: {...} }    │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 5: Process & Save Invoices (05-processAndSaveImpayes.js)│
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: {                                                                  │
│    pieces: [...],                                                         │
│    statutsMap: {...},                                                    │
│    employesMap: {...},                                                   │
│    interlocuteursByDossier: {...},                                        │
│    contactsMap: {...}                                                    │
│  }                                                                     │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 5.1 For each invoice in pieces:                                       │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. Query Parse: Impaye where externe_id = invoice.nfacture    │   │   │
│  │      │    IF EXISTS: existingImpaye = result                         │   │   │
│  │      │    IF NOT EXISTS: existingImpaye = null                        │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ b. Transform SQLite data to Parse format:                    │   │   │
│  │      │    - Map fields: nfacture -> numero, ndossier -> dossier, etc.│   │   │
│  │      │    - Convert dates to Date objects                             │   │   │
│  │      │    - Convert amounts to numbers                                │   │   │
│  │      │    - Map status using statutsMap                               │   │   │
│  │      │    - Link to contact from contactsMap                          │   │   │
│  │      │    - Link to dossier                                           │   │   │
│  │      │    - Link to employee from employesMap (if applicable)          │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ c. Set payment status:                                        │   │   │
│  │      │    - facture_soldee = (invoice.facturesoldee === 1)            │   │   │
│  │      │    - solde = (invoice.resteapayer === 0)                       │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ d. IF existingImpaye:                                         │   │   │
│  │      │       Update fields if changed                                 │   │   │
│  │      │       Save to Parse: impaye.save()                             │   │   │
│  │      │       Increment stats.impayes_updated                          │   │   │
│  │      │    ELSE:                                                      │   │   │
│  │      │       Create new Impaye with transformed data                  │   │   │
│  │      │       Save to Parse: impaye.save()                             │   │   │
│  │      │       Increment stats.impayes_created                          │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ e. Create Activite log:                                       │   │   │
│  │      │    - type: "import" or "update"                                 │   │   │
│  │      │    - operation: "invoice_imported" or "invoice_updated"        │   │   │
│  │      │    - nfacture: invoice.nfacture                                 │   │   │
│  │      │    - impaye_id: impaye.id                                      │   │   │
│  │      │    - timestamp: new Date()                                     │   │   │
│  │      │    Save to Parse                                               │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { stats: { impayes_created, impayes_updated, impayes_skipped, errors } }│
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 6: Assign Sequences (06-assignSequences.js)            │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: None (queries Parse directly)                                         │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 6.1 Query Impaye from Parse:                                           │   │
│  │     - where: { sequence: null OR undefined }                           │   │
│  │     - where: { facture_soldee: false, solde: false }                   │   │
│  │     - limit: high (all unassigned unpaid invoices)                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 6.2 For each unassigned impaye:                                        │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. Call appliquerReglesAttributionAutomatique(impaye)         │   │   │
│  │      │    (from appliquer-regles-attribution workflow)               │   │   │
│  │      │    IF returns sequence:                                        │   │   │
│  │      │       - Set impaye.sequence = sequence                         │   │   │
│  │      │       - Save to Parse: impaye.save()                           │   │   │
│  │      │       - Increment stats.sequencesAttribuees                    │   │   │
│  │      │    ELSE:                                                       │   │   │
│  │      │       - Increment stats.impayesTraites (but no sequence)      │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { stats: { impayesTraites, sequencesAttribuees, erreurs } }          │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 STEP 7: Fetch Invoices with Sequence (07-fetchImpayesWithSequence.js)│
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: None (queries Parse directly)                                         │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 7.1 Query Impaye from Parse:                                           │   │
│  │     - where: { sequence: exists (not null) }                          │   │
│  │     - where: { facture_soldee: false, solde: false }                   │   │
│  │     - include: ["sequence"]                                             │   │
│  │     - limit: high                                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 7.2 For each impaye with sequence:                                    │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. Query Relance for this impaye:                             │   │   │
│  │      │    - where: { impayes: contains impaye.id }                    │   │   │
│  │      │    IF EXISTS: hasRelance = true                                 │   │   │
│  │      │    IF NOT EXISTS: hasRelance = false                            │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ b. Categorize:                                                  │   │   │
│  │      │    IF hasRelance: add to avecRelance array                      │   │   │
│  │      │    ELSE: add to sansRelance array                               │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: {                                                                  │
│    stats: { sansRelance: number, avecRelance: number },                    │
│    sansRelance: [impaye1, impaye2, ...],                                   │
│    avecRelance: [                                                          │
│      { impaye: impayeObject, relance: relanceObject },                    │
│      ...                                                                   │
│    ]                                                                     │
│  }                                                                     │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 8: Generate Reminders (External Call)                │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: {                                                                  │
│    sansRelance: [impaye1, impaye2, ...],                                   │
│    avecRelance: [                                                          │
│      { impaye: impayeObject, relance: relanceObject },                    │
│      ...                                                                   │
│    ]                                                                     │
│  }                                                                     │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 8.1 Call Parse.Cloud.run("generateRelances", params, {useMasterKey: true})│   │
│  │     params = {                                                          │   │
│  │       sansRelanceIds: sansRelance.map(i => i.id),                      │   │
│  │       avecRelance: avecRelance.map(r => ({                             │   │
│  │         impayeId: r.impaye?.id || r.impaye,                             │   │
│  │         relanceId: r.relance?.id                                         │   │
│  │       }))                                                               │   │
│  │     }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 8.2 Handle result:                                                     │   │
│  │     IF SUCCESS:                                                        │   │
│  │       - stats.generateRelances = result.stats                         │   │
│  │       - Log success with created/generated counts                     │   │
│  │     IF ERROR:                                                          │   │
│  │       - Catch error and add to stats.errors                            │   │
│  │       - Log error details                                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: stats.generateRelances = { ... }                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FINAL OUTPUT                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Return: {                                                                  │
│    stats: {                                                                │
│      errors: [ { step: string, script: string, error: string, stack?: string } ],│
│      total: {                                                             │
│        startedAt: ISOString,                                              │
│        finishedAt: ISOString,                                             │
│        durationMs: number                                                 │
│      },                                                                   │
│      etape1: { piecesCount: number },                                      │
│      etape2: { statutsCount: number },                                    │
│      etape3: { employesCount: number },                                   │
│      etape4: { interlocuteursCount: number },                            │
│      etape5: { impayes_created: number, impayes_updated: number },          │
│      etape6: { impayesTraites: number, sequencesAttribuees: number },        │
│      etape7: { sansRelance: number, avecRelance: number },                  │
│      generateRelances: { ... }  // From external workflow call              │
│    }                                                                     │
│  }                                                                     │
│                                                                             │
│  SUCCESS: All invoices imported from SQLite to Parse,                       │
│          contacts created/updated,                                         │
│          sequences assigned,                                               │
│          reminders generated for invoices without them                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## States

### Workflow States
- **Initializing**: Loading configuration and clearing logs
- **Step 1-7 Running**: Various data fetching and processing steps
- **Step 8 Running**: Reminder generation (external workflow)
- **Completed**: All steps finished successfully
- **Error**: Workflow failed at some step

### Data Object States
- **Impaye (Invoice)**: Created or updated in Parse
- **Contact**: Created or linked to existing
- **Dossier (Folder)**: Linked to invoices
- **Sequence**: Assigned to invoices
- **Relance (Reminder)**: Generated for invoices with sequences

---

## Node Sequence

### Node 0: Master Orchestrator (00-master.js)
**File**: `00-master.js`

**Actions**:
1. **Initialization**:
   - Loads environment variables from `.env`
   - Initializes Parse SDK if not already done
   - Clears logs directory (unless trigger is "test")

2. **Workflow Orchestration**:
   - Logs workflow start with trigger type
   - Initializes statistics object
   - Executes steps sequentially

3. **Step Coordination**:
   - **Step 1**: Calls `fetchPiecesAndDossiers()` function
   - **Step 2**: Calls `fetchStatuts()` function
   - **Step 3**: Calls `fetchEmployes()` function
   - **Step 4**: Calls `fetchInterlocuteurs()` function
   - **Step 4.5**: Calls `createContactsWithRelations()` function
   - **Step 5**: Calls `processAndSaveImpayes()` function
   - **Step 6**: Calls `assignSequences()` function
   - **Step 7**: Calls `fetchImpayesWithSequence()` function
   - **Step 8**: Calls `generateRelances` Cloud Function
   - Collects statistics from each step

4. **Result Handling**:
   - Logs success/failure for each step
   - Calculates total duration
   - Returns aggregated statistics

5. **Trigger Support**:
   - **Cloud Function**: `Parse.Cloud.define("triggerImportInvoices")`
   - **CLI Execution**: Direct execution via `node 00-master.js`

---

## SQL Queries

### Invoices Query (Step 1)
```sql
SELECT * FROM _GCO__GcoPiece
WHERE facturesoldee = 0 OR resteapayer > 0
```

### Folders Query (Step 1)
```sql
SELECT * FROM _GCO__GcoDossier
```

### Statuses Query (Step 2)
```sql
SELECT code, libelle FROM [status_table]
```

### Employees Query (Step 3)
```sql
SELECT id, nom, prenom, email, ... FROM [employee_table]
```

### Interlocutors Query (Step 4)
```sql
SELECT * FROM [interlocutor_table]
WHERE ndossier IN (dossier_ids_from_pieces)
```

---

## Error Handling

### Database Errors
- **SQLite connection failed**: Caught and logged
- **Query errors**: Caught and logged
- **Data transformation errors**: Caught and logged

### Parse Errors
- **Query errors**: Caught and logged
- **Save errors**: Caught and logged
- **Linking errors**: Caught and logged

### Processing Errors
- **Missing data**: Handled gracefully, skips or uses defaults
- **Duplicate data**: Detected and handled appropriately
- **Invalid data**: Validated and logged

### External Workflow Errors
- **generateRelances failure**: Caught, logged, added to stats.errors
- **Network errors**: Caught and logged

---

## Configuration

### Environment Variables

```bash
# Parse Configuration
PARSE_APP_ID=
PARSE_JAVASCRIPT_KEY=
PARSE_MASTER_KEY=
PARSE_SERVER_URL=

# Database Configuration
# SQLite path is hardcoded or from environment
EXTERNAL_DB_URI=

# General
NODE_ENV=production
```

---

## Dependencies

### Internal
- `../../utils/logger` - For info, warn, error logging
- `../appliquer-regles-attribution/00-master` - For sequence assignment
- `../generate-relances/00-master` - For reminder generation

### External
- `parse/node` - Parse SDK for database operations
- `better-sqlite3` - SQLite database operations
- `dotenv` - Environment variable loading

---

## Performance Considerations

1. **Query Limits**: High limits used throughout (10000+)
2. **Batch Processing**: Processes data sequentially
3. **Database Connections**: Multiple SQLite queries in sequence
4. **Memory**: All data loaded into memory during processing
5. **External Calls**: Calls to other workflows (sequence assignment, reminder generation)

---

## Testing Notes

- Mock SQLite database for unit testing
- Mock Parse queries for unit testing
- Test with various data scenarios (new, updated, missing data)
- Test error scenarios (database errors, Parse errors)
- Verify data transformation accuracy

---

## File Structure

```
import-invoice/
├── 00-master.js                      # Main orchestrator
├── 01-fetchPiecesAndDossiers.js     # Step 1: Invoice and folder fetcher
├── 02-fetchStatuts.js                # Step 2: Status fetcher
├── 03-fetchEmployes.js               # Step 3: Employee fetcher
├── 04-fetchInterlocuteurs.js          # Step 4: Interlocutor fetcher
├── 04-createContactsWithRelations.js # Step 4.5: Contact creation
├── 05-processAndSaveImpayes.js       # Step 5: Invoice processor
├── 06-assignSequences.js             # Step 6: Sequence assignment
├── 07-fetchImpayesWithSequence.js    # Step 7: Invoice with sequence fetcher
├── FONCTIONNEMENT_SYNC_IMPAYES.md     # Existing documentation
├── logs/                             # Runtime logs
└── specs/
    └── technical-guide.md            # This file
```

---

## Notes

1. This workflow has an existing documentation file `FONCTIONNEMENT_SYNC_IMPAYES.md` that may contain additional details.

2. The workflow calls external workflows:
   - `appliquer-regles-attribution` for sequence assignment
   - `generate-relances` for reminder generation

3. The workflow is designed to be idempotent - running it multiple times should not create duplicates.
