# Technical Guide: verify-paid-invoices Workflow

## Overview
This workflow verifies which invoices have been paid in the external database and updates the Parse database accordingly. It is a **three-step process** that checks invoice status, cleans up related reminders, and triggers reminder generation.

## Purpose
Synchronize invoice payment status between the external SQLite database and Parse by:
1. Checking which unpaid invoices in Parse are actually paid in the external DB
2. Cleaning up reminders for newly paid invoices
3. Triggering generation of new reminders for remaining unpaid invoices

---

## Invocation Methods (Comment ce workflow est appelé)

### 1. Cloud Function Trigger (Primary Method)
**Endpoint**: `Parse.Cloud.run("verifyPaidInvoicesNow")`

**How to Call**:
```javascript
// From client-side JavaScript
Parse.Cloud.run('verifyPaidInvoicesNow', {}, { useMasterKey: true })
  .then(result => {
    console.log('Verification completed:', result.stats);
  })
  .catch(error => {
    console.error('Verification error:', error);
  });
```

**Authentication**:
- Requires `masterKey` OR authenticated `user`
- Throws: `"Non autorisé - nécessite authentification"`

**Parameters**: None (autonomous workflow)

---

### 2. Direct CLI Execution
**Command**: 
```bash
cd /home/ubuntu/prod/adti/backend/cloud/workflows/verify-paid-invoices
node 00-master.js
```

**Trigger**: `"manual"` (default)

**Use Case**: Manual execution for testing or maintenance

---

### 3. Programmatic Import
**Usage**:
```javascript
const verifyPaidInvoicesMaster = require('./verify-paid-invoices/00-master');

await verifyPaidInvoicesMaster({ trigger: 'manual' });
```

**Use Case**: Can be called by other workflows

---

## Complete Flow: From Invocation to Output

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVOCATION POINT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │ Cloud Function Call  │  │ CLI Execution        │  │ Programmatic Call   │  │
│  │ Parse.Cloud.run(     │  │ node 00-master.js    │  │ require('./00-      │  │
│  │  "verifyPaidInvoicesNow")│  │                     │  │ master').default()  │  │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘  │
└─────────────┼──────────────────────────┼──────────────────────────┼────────────┘
              └──────────────────────────┼──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTRY POINT: 00-master.js                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Load environment variables from .env                                     │
│  2. Log workflow start: "Début du processus de vérification des factures payées"│
│  3. Initialize stats object                                                   │
│     └─ stats = {                                                             │
│           result: null,                                                     │
│           cleanup: null,                                                    │
│           generation: null,                                                 │
│           errors: [],                                                      │
│           total: { startedAt, finishedAt, durationMs }                       │
│         }                                                                   │
│  4. Execute verifyPaidInvoicesMaster() function                              │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 1: Verify Paid Invoices (01-verifyPaidInvoices.js)     │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: { trigger: string } (from master, default: "manual")                 │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.1 Initialize:                                                        │   │
│  │     - Ensure Parse SDK is available                                    │   │
│  │     - Determine DB path:                                              │   │
│  │         IF NODE_ENV === "test" AND TEST_DB_PATH exists:                │   │
│  │            dbPath = TEST_DB_PATH                                        │   │
│  │         ELSE:                                                          │   │
│  │            dbPath = "/home/arthur/adti/sync.db"                         │   │
│  │     - Initialize stats: { updated: 0, errors: [], skipped: 0, ... }    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.2 Open SQLite database with retry logic:                           │   │
│  │     - Function: openDatabaseWithRetry(dbPath, maxRetries=3,          │   │
│  │                  retryDelayMs=60000)                                    │   │
│  │     - IF database disk image is malformed:                           │   │
│  │         Wait 1 minute, retry (up to 3 times)                            │   │
│  │     - IF connection fails after retries: throw error                 │   │
│  │     - Log: "Connexion DB SQLite réussie"                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.3 Query Parse for unpaid invoices:                                  │   │
│  │     - Class: Impaye                                                    │   │
│  │     - where: { facture_soldee: false }                                 │   │
│  │     - limit: 10000                                                     │   │
│  │     - Returns: array of Impaye objects                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.4 Extract externe_id from each impaye:                              │   │
│  │     unpaidInvoiceIds = impayes.map(i => i.get("externe_id"))           │   │
│  │        .filter(id => id !== undefined)                                │   │
│  │     IF unpaidInvoiceIds.length === 0:                                  │   │
│  │        Log: "Aucune facture impayée trouvée dans Parse"                 │   │
│  │        Return stats (empty)                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.5 Build SQL query for paid invoices:                                │   │
│  │     PAID_INVOICES_QUERY = (invoiceIds) => `                           │   │
│  │       SELECT p.nfacture, p.facturesoldee, p.resteapayer                │   │
│  │       FROM _GCO__GcoPiece p                                            │   │
│  │       WHERE p.facturesoldee = 1                                       │   │
│  │         AND p.resteapayer = 0                                         │   │
│  │         AND p.nfacture IN (${invoiceIds.join(",")})                  │   │
│  │     `                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.6 Execute SQL query: db.prepare(query).all()                          │   │
│  │     Returns: array of rows where:                                     │   │
│  │       - nfacture: invoice number                                       │   │
│  │       - facturesoldee: 1 (paid flag)                                   │   │
│  │       - resteapayer: 0 (no remaining amount)                           │   │
│  │     Log: "Trouvé {rows.length} facture(s) payée(s) à vérifier"          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.7 For EACH paid invoice row from SQLite:                            │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. Add to stats.invoiceNumbers: row.nfacture                  │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ b. Query Parse for matching unpaid Impaye:                    │   │   │
│  │      │    - Class: Impaye                                               │   │   │
│  │      │    - where: { externe_id: row.nfacture, facture_soldee: false }│   │   │
│  │      │    - Returns: first matching Impaye or null                    │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ c. IF impaye NOT FOUND:                                        │   │   │
│  │      │       Log: "Facture {row.nfacture} introuvable ou déjà marquée"│   │   │
│  │      │       Increment stats.skipped                                   │   │   │
│  │      │       Continue to next row                                      │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ d. IF impaye FOUND:                                            │   │   │
│  │      │       Update impaye fields:                                     │   │   │
│  │      │         - facture_soldee = true                                  │   │   │
│  │      │         - solde = true                                           │   │   │
│  │      │         - solde_le = new Date()                                  │   │   │
│  │      │       Save to Parse: impaye.save(null, { useMasterKey: true })  │   │   │
│  │      │       Increment stats.updated                                    │   │   │
│  │      │       Log: "Facture {row.nfacture} marquée comme payée"          │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ e. Create Activite log for payment:                            │   │   │
│  │      │       - Class: Activite                                          │   │   │
│  │      │       - type: "paiement"                                         │   │   │
│  │      │       - operation: "payment_received"                           │   │   │
│  │      │       - nfacture: row.nfacture                                   │   │   │
│  │      │       - impaye_id: impaye.id                                     │   │   │
│  │      │       - montant: Number(row.resteapayer) || 0                  │   │   │
│  │      │       - date_paiement: new Date()                                │   │   │
│  │      │       - trigger: trigger (from input)                            │   │   │
│  │      │       - timestamp: new Date()                                    │   │   │
│  │      │       - description: "Paiement reçu pour la facture {nfacture}"│   │   │
│  │      │       Save to Parse                                             │   │   │
│  │      │       IF ERROR: catch and log, but continue                     │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ f. IF ERROR during update:                                     │   │   │
│  │      │       Add to stats.errors: { nfacture, error, ... }           │   │   │
│  │      │       Create Activite log with operation: "error"              │   │   │
│  │      │       Continue to next row                                      │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { updated: number, errors: [...], skipped: number, invoiceNumbers: [...] }│
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    STEP 2: Cleanup Paid Invoices Relances                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  NOTE: File 02-cleanupPaidInvoicesRelances.js was referenced but not found.     │
│        Based on master code, this step should:                              │
│  INPUT: { trigger: string }                                                 │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2.1 Query Parse for recently paid invoices:                            │   │
│  │     - Class: Impaye                                                    │   │
│  │     - where: { facture_soldee: true, solde: true }                      │   │
│  │     - where: { solde_le: >= workflow start time }                       │   │
│  │     - Returns: array of paid Impaye objects                              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2.2 For EACH paid impaye:                                              │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. Query Relance for this impaye:                             │   │   │
│  │      │    - where: { impayes: contains impaye.id }                    │   │   │
│  │      │    - Returns: array of Relance objects                           │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ b. For EACH related relance:                                   │   │   │
│  │      │    IF relance.statut === "En attente de génération" OR        │   │   │
│  │      │       relance.statut === "pret pour envoi":                    │   │   │
│  │      │       Delete relance from Parse                                 │   │   │
│  │      │       Increment stats.deleted                                   │   │   │
│  │      │    ELSE IF relance.statut === "Envoyée":                       │   │   │
│  │      │       Update relance:                                          │   │   │
│  │      │         - statut = "Annulée - facture payée"                    │   │   │
│  │      │         - Add note: "Facture marquée comme payée le {date}"    │   │   │
│  │      │       Save to Parse                                             │   │   │
│  │      │       Increment stats.updated                                   │   │   │
│  │      │    ELSE:                                                       │   │   │
│  │      │       Increment stats.skipped                                   │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { deleted: number, updated: number, skipped: number }                │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 3: Generate Reminders (External Call)                │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: { trigger: string }                                                 │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3.1 Call generateRelancesMaster() from external workflow:             │   │
│  │     const generationResult = await generateRelancesMaster({ trigger });│   │
│  │     (imports from ../generate-relances/00-master)                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3.2 Handle result:                                                     │   │
│  │     IF SUCCESS:                                                        │   │
│  │       - stats.generation = generationResult.stats                     │   │
│  │       - Log: "Étape 3 terminée: {created} créées, {generated} générées"│   │
│  │     IF ERROR:                                                          │   │
│  │       - Catch error and add to stats.errors                            │   │
│  │       - Log error: "Erreur lors de l'appel à generateRelances"          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: stats.generation = { ... } (from generateRelancesMaster)             │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FINAL OUTPUT                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Return: {                                                                  │
│    result: {    // From Step 1                                             │
│      updated: number,    // Invoices marked as paid                         │
│      skipped: number,    // Invoices already marked as paid                  │
│      errors: [...],      // Errors during verification                       │
│      invoiceNumbers: [...] // List of processed invoice numbers              │
│    },                                                                     │
│    cleanup: {   // From Step 2                                             │
│      deleted: number,   // Reminders deleted for paid invoices              │
│      updated: number,   // Reminders updated for paid invoices              │
│      skipped: number    // Reminders skipped                                │
│    },                                                                     │
│    generation: { // From Step 3 (generateRelancesMaster)                   │
│      errors: [...],                                                      │
│      total: { startedAt, finishedAt, durationMs },                        │
│      etape1: { ... },    // From replaceVariables step                      │
│      etape2: { ... }     // From generateRelances step                      │
│    },                                                                     │
│    errors: [...],       // Errors from master workflow                     │
│    total: {             // From master workflow                            │
│      startedAt: Date,                                                     │
│      finishedAt: Date,                                                    │
│      durationMs: number                                                  │
│    }                                                                     │
│  }                                                                     │
│                                                                             │
│  SUCCESS: All unpaid invoices in Parse checked against SQLite,              │
│          paid invoices updated in Parse,                                   │
│          reminders for paid invoices cleaned up,                           │
│          new reminders generated for remaining unpaid invoices             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## States

### Workflow States
- **Initializing**: Loading configuration
- **Step 1 Running**: Invoice verification in progress
- **Step 2 Running**: Reminder cleanup in progress
- **Step 3 Running**: Reminder generation in progress
- **Completed**: All steps finished successfully
- **Error**: Workflow failed at some step

### Impaye (Invoice) States
- **facture_soldee: false, solde: false** - Unpaid (initial state)
- **facture_soldee: true, solde: true** - Paid (target state)
- **solde_le**: Date when invoice was marked as paid

### Relance (Reminder) States
- **Any state** - Can be cleaned up if associated impaye is paid
- **Annulée - facture payée** - Cancelled due to payment

---

## Node Sequence

### Node 0: Master Orchestrator (00-master.js)
**File**: `00-master.js`

**Actions**:
1. **Initialization**:
   - Loads environment variables from `.env`
   - Logs workflow start

2. **Workflow Orchestration**:
   - Initializes statistics object
   - Executes steps sequentially

3. **Step Coordination**:
   - **Step 1**: Calls `verifyPaidInvoices()` function
   - **Step 2**: Calls `cleanupPaidInvoicesRelances()` function
   - **Step 3**: Calls `generateRelancesMaster()` from generate-relances workflow
   - Collects statistics from each step

4. **Result Handling**:
   - Logs success/failure for each step
   - Calculates total duration
   - Returns aggregated statistics

5. **Trigger Support**:
   - **Cloud Function**: `Parse.Cloud.define("verifyPaidInvoicesNow")`
   - **CLI Execution**: Direct execution via `node 00-master.js`

---

### Node 1: Invoice Verification Engine (01-verifyPaidInvoices.js)
**File**: `01-verifyPaidInvoices.js`

**Actions**:

#### Phase 1: Setup
1. **Initialization**:
   - Ensures Parse SDK is available
   - Loads SQLite database path:
     - Production: `/home/arthur/adti/sync.db`
     - Test: From `TEST_DB_PATH` environment variable
   - Initializes statistics object

2. **Database Connection**:
   - Uses `better-sqlite3` for SQLite operations
   - Implements retry logic for database connection (max 3 retries)
   - Handles database corruption with 1-minute wait between retries

#### Phase 2: Query Unpaid Invoices from Parse
3. **Query Execution**:
   - Queries `Impaye` class with filters:
     - `facture_soldee: false`
     - Limit: 10000
   - Extracts `externe_id` (external invoice number) from each impaye
   - If no unpaid invoices → returns empty stats

#### Phase 3: Query Paid Invoices from SQLite
4. **SQL Query Construction**:
   ```sql
   SELECT p.nfacture, p.facturesoldee, p.resteapayer
   FROM _GCO__GcoPiece p
   WHERE p.facturesoldee = 1
     AND p.resteapayer = 0
     AND p.nfacture IN (comma-separated-list-of-externe_ids)
   ```
   - Executes query against SQLite database

#### Phase 4: Process Each Paid Invoice
5. **For each paid invoice found in SQLite**:
   
   a. **Validation**:
      - Checks if invoice exists in Parse as unpaid
      - Queries `Impaye` with filters:
        - `externe_id: row.nfacture`
        - `facture_soldee: false`
      - If not found → skip (already marked as paid or doesn't exist)
   
   b. **Update Impaye**:
      - Sets `facture_soldee: true`
      - Sets `solde: true`
      - Sets `solde_le: new Date()`
      - Saves to Parse
      - Increments `stats.updated`
   
   c. **Create Activity Log**:
      - Creates `Activite` object in Parse
      - Records payment details
      - If logging fails → catches error and continues

#### Phase 5: Error Handling
6. **Error Logging**:
   - For each error:
     - Creates `Activite` object with error details
     - Adds to `stats.errors`

---

## SQL Queries

### Main Verification Query
```sql
SELECT p.nfacture, p.facturesoldee, p.resteapayer
FROM _GCO__GcoPiece p
WHERE p.facturesoldee = 1
  AND p.resteapayer = 0
  AND p.nfacture IN ({comma_separated_externe_ids})
```

**Conditions**:
- `facturesoldee = 1`: Invoice is marked as paid
- `resteapayer = 0`: No remaining amount to pay
- `nfacture IN (...)`: Only check invoices that are unpaid in Parse

---

## Error Handling

### Database Errors
- **Connection failed**: Retried up to 3 times with 1-minute wait
- **Database corruption**: Detected by "database disk image is malformed" error
- **Query errors**: Caught and logged

### Parse Errors
- **Query errors**: Caught and logged
- **Save errors**: Caught and logged
- **Activity logging errors**: Caught but don't prevent main operation

### Cleanup Errors
- **Delete errors**: Caught and logged
- **Update errors**: Caught and logged

### External Workflow Errors
- **generateRelances failure**: Caught, logged, added to stats.errors

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
EXTERNAL_DB_URI=  # Not used, SQLite path is hardcoded
TEST_DB_PATH=     # For test environment

# Database Path
# Production: /home/arthur/adti/sync.db
# Test: From TEST_DB_PATH

# General
NODE_ENV=production  # Set to "test" to use test database
```

---

## Dependencies

### Internal
- `../../utils/logger` - For writeLog function
- `../generate-relances/00-master` - For reminder generation

### External
- `parse/node` - Parse SDK for database operations
- `better-sqlite3` - SQLite database operations
- `dotenv` - Environment variable loading

---

## Performance Considerations

1. **Query Limits**: Uses limit 10000 for Parse queries
2. **Batch Processing**: Processes invoices sequentially
3. **Database Connection**: Single connection for all SQLite operations
4. **Retry Logic**: 3 retries with 1-minute wait for database issues
5. **Memory**: All invoice IDs loaded into memory at once

---

## Security Considerations

1. **Database Path**: Hardcoded to `/home/arthur/adti/sync.db` in production
2. **Retry Logic**: Prevents infinite loops on database corruption
3. **Error Handling**: Sensitive errors logged without exposing database details

---

## Testing Notes

- Set `NODE_ENV=test` and `TEST_DB_PATH` for testing
- Mock SQLite database for unit testing
- Test with various invoice states (paid, unpaid, missing)
- Test database corruption scenarios
- Verify activity logging

---

## File Structure

```
verify-paid-invoices/
├── 00-master.js              # Main orchestrator
├── 01-verifyPaidInvoices.js # Step 1: Invoice verification
├── 02-cleanupPaidInvoicesRelances.js  # Step 2: Reminder cleanup (MISSING - referenced in master)
├── logs/                     # Runtime logs
└── specs/
    └── technical-guide.md    # This file
```

**Note**: The file `02-cleanupPaidInvoicesRelances.js` was referenced in the master but was not found in the directory. It should be created to complete the workflow.

---

## Notes

1. This workflow calls the `generate-relances` workflow as its final step.

2. The workflow is designed to run after invoice payments are recorded in the external database.

3. It ensures that:
   - Parse is updated with the latest payment status
   - Reminders are not sent for paid invoices
   - New reminders are generated for invoices that are still unpaid
