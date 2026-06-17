# Objectifs
- Vérifier quelles factures ont été payées dans la base de données externe (SQLite)
- Mettre à jour la base de données Parse en conséquence
- Nettoyer les relances pour les factures nouvellement payées
- Déclencher la génération de nouvelles relances pour les factures impayées restantes

# Start
## route
- Cloud Function: `Parse.Cloud.run("verifyPaidInvoicesNow")`
- CLI: `node 00-master.js`
- Programmatic: `require('./verify-paid-invoices/00-master')`

## entry data
- None (autonomous workflow)
- Requires: `masterKey` OR authenticated `user`

# Process

## node 0: Master Orchestrator (00-master.js)
### input
- `trigger`: string (default: "manual")

### operations
1. Load environment variables from .env
2. Initialize Parse SDK
3. Clear logs directory (unless trigger is "test")
4. Log workflow start
5. Initialize stats object
6. Execute verifyPaidInvoicesMaster() function
7. Register Cloud Function: `Parse.Cloud.define("verifyPaidInvoicesNow")`

### output
- `{ result, cleanup, generation, errors, total }`

## node 1: Invoice Verification Engine (01-verifyPaidInvoices.js)
### input
- `trigger`: string (from master)

### operations
1. Initialize:
   - Ensure Parse SDK is available
   - Determine DB path (test or production)
   - Initialize stats object

2. Open SQLite database with retry logic (max 3 retries, 1-minute delay)

3. Query Parse for unpaid invoices:
   - Class: `Impaye`
   - where: `{ facture_soldee: false }`
   - limit: 10000

4. Extract `externe_id` from each impaye

5. Build SQL query for paid invoices:
   ```sql
   SELECT p.nfacture, p.facturesoldee, p.resteapayer
   FROM _GCO__GcoPiece p
   WHERE p.facturesoldee = 1 AND p.resteapayer = 0
   AND p.nfacture IN (comma-separated-externe_ids)
   ```

6. Execute SQL query

7. For each paid invoice row from SQLite:
   a. Add to stats.invoiceNumbers
   b. Query Parse for matching unpaid Impaye
   c. If impaye NOT FOUND: log warning, increment stats.skipped
   d. If impaye FOUND:
      - Update impaye: `facture_soldee = true`, `solde = true`, `solde_le = new Date()`
      - Save to Parse
      - Increment stats.updated
      - Create Activite log for payment
   e. If ERROR during update: add to stats.errors, create Activite log with operation: "error"

### output
- `{ updated: number, errors: [...], skipped: number, invoiceNumbers: [...] }`

## node 2: Cleanup Paid Invoices Relances
### input
- `trigger`: string (from master)

### operations
1. Query Parse for recently paid invoices:
   - Class: `Impaye`
   - where: `{ facture_soldee: true, solde: true }`
   - where: `{ solde_le: >= workflow start time }`

2. For each paid impaye:
   a. Query Relance for this impaye
   b. For each related relance:
      - If relance.statut === "En attente de génération" OR "pret pour envoi": delete relance, increment stats.deleted
      - Else if relance.statut === "Envoyée": update relance statut to "Annulée - facture payée", increment stats.updated
      - Else: increment stats.skipped

### output
- `{ deleted: number, updated: number, skipped: number }`

## node 3: Generate Reminders (External Call)
### input
- `trigger`: string (from master)

### operations
1. Call `generateRelancesMaster()` from external workflow
2. Handle result:
   - If SUCCESS: stats.generation = generationResult.stats
   - If ERROR: catch error and add to stats.errors

### output
- `stats.generation = { ... }` (from generateRelancesMaster)

# end
## results
- All unpaid invoices in Parse checked against SQLite
- Paid invoices updated in Parse
- Reminders for paid invoices cleaned up
- New reminders generated for remaining unpaid invoices
- Return: `{ result, cleanup, generation, errors, total }`

# Scenarios to test

## scenario1: Basic verification with paid invoices
### input data
- SQLite DB with some invoices marked as paid (facturesoldee=1, resteapayer=0)
- Parse with corresponding Impaye objects marked as unpaid (facture_soldee=false)

### expecting console log output in the log file
- "Connexion DB SQLite réussie"
- "Trouvé X facture(s) payée(s) à vérifier"
- "Facture [nfacture] marquée comme payée"
- "Étape 1 terminée: X mises à jour, Y ignorées, Z erreurs"
- "Étape 2 terminée: A supprimées, B mises à jour, C ignorées"
- "Étape 3 terminée: D créées, E générées"

### todo to run the tests
1. Set up test SQLite database with known paid invoices
2. Set up test Parse database with corresponding unpaid Impaye objects
3. Set NODE_ENV=test and TEST_DB_PATH environment variables
4. Run: `node 00-master.js`
5. Verify logs in logs/ directory
6. Verify Parse database updates

## scenario2: No paid invoices to verify
### input data
- SQLite DB with no paid invoices
- Parse with some unpaid Impaye objects

### expecting console log output in the log file
- "Connexion DB SQLite réussie"
- "Aucune facture payée trouvée à vérifier"
- "Étape 1 terminée: 0 mises à jour, 0 ignorées, 0 erreurs"

### todo to run the tests
1. Set up test SQLite database with no paid invoices
2. Set up test Parse database with unpaid Impaye objects
3. Run: `node 00-master.js`
4. Verify no updates were made to Parse

## scenario3: Database connection failure
### input data
- SQLite DB path is invalid or database is corrupted

### expecting console log output in the log file
- "Erreur de connexion à la base de données SQLite"
- "Tentative X de reconnexion..."
- After 3 attempts: "Échec de la connexion après X tentatives"

### todo to run the tests
1. Set TEST_DB_PATH to an invalid path
2. Run: `node 00-master.js`
3. Verify error handling and retry logic

## scenario4: Cloud Function call
### input data
- Valid Parse Cloud Function call with masterKey

### expecting console log output in the log file
- "Début du processus de vérification des factures payées"
- Same logs as CLI execution

### todo to run the tests
1. Call from client-side JavaScript:
   ```javascript
   Parse.Cloud.run('verifyPaidInvoicesNow', {}, { useMasterKey: true })
     .then(result => console.log('Verification completed:', result.stats))
     .catch(error => console.error('Verification error:', error));
   ```
2. Verify Cloud Function executes successfully
