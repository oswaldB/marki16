# Technical Guide: generate-relances Workflow

## Overview
This workflow orchestrates the generation of reminder emails for unpaid invoices. It is a **two-step process** that first replaces variables in email templates, then generates the actual email content using LLM (Large Language Model) capabilities.

## Purpose
Automatically generate personalized reminder emails for unpaid invoices by:
1. Replacing known variables in email templates
2. Generating final email content using AI (Ollama API)

---

## Invocation Methods (Comment ce workflow est appelé)

### 1. Cloud Function Trigger (Primary Method)
**Endpoint**: `Parse.Cloud.run("generateRelances")`

**How to Call**:
```javascript
// From client-side JavaScript
Parse.Cloud.run('generateRelances', {}, { useMasterKey: true })
  .then(result => {
    console.log('Workflow completed:', result.stats);
  })
  .catch(error => {
    console.error('Workflow error:', error);
  });
```

**Authentication**:
- Requires `masterKey` OR authenticated `user`
- Throws error if neither is present

**Parameters**: None (autonomous workflow)

---

### 2. Direct CLI Execution
**Command**: 
```bash
cd /home/ubuntu/prod/adti/backend/cloud/workflows/generate-relances
node 00-master.js
```

**Trigger**: `"cli"`

**Use Case**: Manual execution for testing or maintenance

---

### 3. Programmatic Import
**Usage**:
```javascript
const generateRelancesMaster = require('./generate-relances/00-master');

await generateRelancesMaster({ trigger: 'manual' });
```

**Use Case**: Called by other workflows (e.g., `import-invoice`, `verify-paid-invoices`)

---

### 4. Cron Trigger (Expected)
**Configuration**: Would be set up in Parse Dashboard or external scheduler

**Trigger**: `"cron"`

**Use Case**: Scheduled automatic execution

---

## Complete Flow: From Invocation to Output

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVOCATION POINT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │ Cloud Function Call  │  │ CLI Execution        │  │ Programmatic Call   │  │
│  │ Parse.Cloud.run()     │  │ node 00-master.js    │  │ require('./00-      │  │
│  │                     │  │                     │  │ master').default()  │  │
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
│     └─ stats = { errors: [], total: { startedAt, finishedAt, durationMs },     │
│                etape1: {}, etape2: {} }                                        │
│  6. Execute generateRelancesMaster() function                                 │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 1: Variable Replacement (01-replaceVariables.js)     │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: None (queries Parse directly)                                         │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.1 Query Relance objects from Parse                                  │   │
│  │     Query: {                                                           │   │
│  │       class: "Relance",                                                │   │
│  │       where: { statut: "En attente de génération" },                   │   │
│  │       limit: 9999,                                                     │   │
│  │       include: ["sequence", "contact", "impayes"]                     │   │
│  │     }                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.2 For EACH relance found:                                           │   │
│  │     ┌───────────────────────────────────────────────────────────┐   │   │
│  │     │ a. Validate: has sequence?                                    │   │   │
│  │     │    If NO: log warning, skip to next                          │   │   │
│  │     │    If YES: continue                                           │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ b. Fetch impayes details from Parse                          │   │   │
│  │     │    Query: Impaye where objectId IN relance.impayes            │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ c. Fetch full sequence from Parse                            │   │   │
│  │     │    Query: Sequence where objectId = relance.sequence.id       │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ d. Match scenario:                                           │   │   │
│  │     │    - Get sequence.emails array                               │   │   │
│  │     │    - Find scenario where email_index == relance.email_index  │   │   │
│  │     │    - Get active scenario from matching scenario              │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ e. Replace variables:                                        │   │   │
│  │     │    - Call replaceAllVariables(objet, data)                    │   │   │
│  │     │    - Call replaceLoopVariables(corps, data)                  │   │   │
│  │     │    - Data includes: contact, sequence, impayes, scenario     │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ f. If hasChanges:                                            │   │   │
│  │     │    - Update relance.objet and relance.corps                  │   │   │
│  │     │    - Save to Parse: relance.save()                           │   │   │
│  │     │    - Increment stats.updated                                 │   │   │
│  │     │    If NO changes: just increment stats.processed            │   │   │
│  │     └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { stats: { processed, updated, errors, erreurs } }                 │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 2: Content Generation (02-generateRelances.js)       │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: None (queries Parse directly)                                         │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2.1 Query Relance objects from Parse                                  │   │
│  │     Query: {                                                           │   │
│  │       class: "Relance",                                                │   │
│  │       where: { statut: "En attente de génération" },                   │   │
│  │       limit: 9999,                                                     │   │
│  │       include: ["sequence", "contact"]                                │   │
│  │     }                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2.2 For EACH relance found:                                           │   │
│  │     ┌───────────────────────────────────────────────────────────┐   │   │
│  │     │ a. Validate: has sequence?                                    │   │   │
│  │     │    If NO: log warning, skip to next                          │   │   │
│  │     │    If YES: continue                                           │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ b. Fetch history:                                            │   │   │
│  │     │    Query: Relance where contact = relance.contact AND       │   │   │
│  │     │            impayes IN relance.impayes AND                      │   │   │
│  │     │            dateEnvoi EXISTS AND statut = "Envoyée"             │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ c. Fetch impayes details from Parse                          │   │   │
│  │     │    Query: Impaye where objectId IN relance.impayes            │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ d. Fetch full sequence from Parse                            │   │   │
│  │     │    Query: Sequence where objectId = relance.sequence.id       │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ e. Match scenario (same as Step 1)                            │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ f. Generate content:                                         │   │   │
│  │     │    IF USE_OLLAMA = true:                                      │   │   │
│  │     │       ┌───────────────────────────────────────────────┐   │   │   │
│  │     │       │ 1. Build prompt using buildPrompt()             │   │   │   │
│  │     │       │ 2. Call generateEmailContent() with retry logic   │   │   │   │
│  │     │       │    - Max 30 retries for LLM API calls           │   │   │   │
│  │     │       │    - 1 second delay between retries             │   │   │   │
│  │     │       │ 3. Check for unreplaced variables               │   │   │   │
│  │     │       │    - If found: retry up to 5 times               │   │   │   │
│  │     │       │ 4. Apply orthographic correction               │   │   │   │
│  │     │       │    - Call correctOrthographe() for objet & corps │   │   │   │
│  │     │       └───────────────────────────────────────────────┘   │   │   │
│  │     │    ELSE (USE_OLLAMA = false):                                   │   │   │
│  │     │       ┌───────────────────────────────────────────────┐   │   │   │
│  │     │       │ Use default values from active scenario:        │   │   │   │
│  │     │       │   objet = activeScenario.objet || "Relance..."   │   │   │   │
│  │     │       │   corps = activeScenario.corps || "Veuillez..."   │   │   │   │
│  │     │       └───────────────────────────────────────────────┘   │   │   │
│  │     ├───────────────────────────────────────────────────────────┤   │   │
│  │     │ g. Update relance:                                            │   │   │
│  │     │    - Set relance.objet = generated objet                      │   │   │
│  │     │    - Set relance.corps = generated corps                       │   │   │
│  │     │    - Set relance.statut = "pret pour envoi"                    │   │   │
│  │     │    - Save to Parse: relance.save()                           │   │   │
│  │     │    - Increment stats.processed                               │   │   │
│  │     └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { stats: { processed, errors, erreurs } }                         │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FINAL OUTPUT                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Return: {                                                                  │
│    stats: {                                                                │
│      errors: [                                                            │
│        { step: string, script: string, error: string, stack?: string }      │
│      ],                                                                   │
│      total: {                                                             │
│        startedAt: ISOString,                                              │
│        finishedAt: ISOString,                                             │
│        durationMs: number                                                 │
│      },                                                                   │
│      etape1: {                                                            │
│        processed: number,    // Relances processed in Step 1              │
│        updated: number,     // Relances updated in Step 1                 │
│        errors: number,      // Errors in Step 1                           │
│        erreurs: [          // Detailed errors                              │
│          { relanceId: string, erreur: string }                           │
│        ]                                                                   │
│      },                                                                   │
│      etape2: {                                                            │
│        processed: number,    // Relances processed in Step 2              │
│        errors: number       // Errors in Step 2                           │
│      }                                                                   │
│    }                                                                     │
│  }                                                                     │
│                                                                             │
│  SUCCESS: All relances with statut="En attente de génération" are now       │
│          either:                                                          │
│          - "pret pour envoi" (ready to send) with variables replaced       │
│          - "pret pour envoi" with LLM-generated content                    │
│          - Skipped due to missing data (logged as warning)                 │
│          - In error state (logged as error)                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## States

### Workflow States
- **Initializing**: Loading configuration and clearing logs
- **Step 1 Running**: Variable replacement in progress
- **Step 2 Running**: Content generation in progress
- **Completed**: All steps finished successfully
- **Error**: Workflow failed at some step

### Relance (Reminder) States
- **En attente de génération** (Waiting for generation): Initial state, ready for processing
- **pret pour envoi** (Ready for sending): Variables replaced, content generated, ready to send
- **Envoyée** (Sent): Email has been sent (managed by send-emails workflow)

### Process States
- **Processed**: Relance has been through the workflow
- **Updated**: Relance was modified (variables replaced or content generated)
- **Skipped**: Relance was bypassed due to missing data
- **Error**: Relance processing failed

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
   - **Step 1**: Calls `replaceVariables()` function
   - **Step 2**: Calls `generateRelances()` function
   - Collects statistics from each step

4. **Result Handling**:
   - Logs success/failure for each step
   - Calculates total duration
   - Returns aggregated statistics

5. **Trigger Support**:
   - **Cloud Function**: `Parse.Cloud.define("generateRelances")`
   - **CLI Execution**: Direct execution via `node 00-master.js`
   - **Cron Trigger**: Can be called with `trigger: "cron"`

---

## Data Flow Diagram

```
Trigger (cron/cloud-function/cli)
       ↓
[Master: Clear logs]
       ↓
[Master: Initialize stats]
       ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: replaceVariables()                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Query: Relance with statut="En attente de génération"    │ │
│ │         include=[sequence, contact, impayes]               │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ [For each relance]                                          │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Validate sequence exists │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Query impayes details    │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Query full sequence      │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Match scenario by        │                                │
│ │ email_index              │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ replaceAllVariables()   │ ← Replace known variables      │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ [If hasChanges]                                             │
│         ↓                                                    │
│ Update relance objet & corps                                │
│ Save to Parse                                               │
└─────────────────────────────────────────────────────────────┘
       ↓
[Master: Collect etape1 stats]
       ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: generateRelances()                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Query: Relance with statut="En attente de génération"    │ │
│ │         include=[sequence, contact]                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ [For each relance]                                          │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Validate sequence exists │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Query history            │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Query impayes details     │                                │
│ └─────────────────────────┘
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Query full sequence      │                                │
│ └─────────────────────────┘
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Match scenario by        │                                │
│ │ email_index              │                                │
│ └─────────────────────────┘
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ IF USE_OLLAMA:           │                                │
│ │   buildPrompt()          │                                │
│ │   generateEmailContent() │ ← Call Ollama API              │
│ │   [Retry if variables    │   remain]                      │
│ │   correctOrthographe()   │                                │
│ │ ELSE:                   │                                │
│ │   Use default scenario   │                                │
│ │   values                │                                │
│ └─────────────────────────┘
│         ↓                                                    │
│ Update relance objet & corps                                  │
│ Set statut = "pret pour envoi"                              │
│ Save to Parse                                               │
└─────────────────────────────────────────────────────────────┘
       ↓
[Master: Collect etape2 stats]
       ↓
[Master: Calculate total duration]
       ↓
Return aggregated statistics
```

---

## Key Functions

### Master Level
- `generateRelancesMaster({ trigger })` - Main orchestrator
- Returns: `{ stats }`

### Step 1 Level
- `replaceVariables()` - Main function for variable replacement
- Returns: `{ stats }` with processed, updated, errors counts

### Step 2 Level
- `generateRelances()` - Main function for content generation
- Returns: `{ stats }` with processed, errors counts

---

## Error Handling

### Step 1 Errors
- **No sequence**: Logged as warning, relance skipped
- **Sequence not found**: Logged as warning, relance skipped
- **No matching scenario**: Logged as warning, relance skipped
- **No active scenario**: Logged as warning, relance skipped
- **Processing errors**: Caught, logged, added to stats.errors

### Step 2 Errors
- **No sequence**: Logged as warning, relance skipped
- **Sequence not found**: Logged as warning, relance skipped
- **No matching scenario**: Logged as warning, relance skipped
- **No active scenario**: Logged as warning, relance skipped
- **LLM API errors**: Retried up to 30 times with 1-second delays
- **Generation failures**: Retried up to 5 times
- **Orthography correction failures**: Logged as warning, continues
- **Processing errors**: Caught, logged, added to stats.errors

---

## Configuration

### Environment Variables
```bash
# Parse Configuration
PARSE_APP_ID=
PARSE_JAVASCRIPT_KEY=
PARSE_MASTER_KEY=
PARSE_SERVER_URL=

# Ollama Configuration
OLLAMA_API_URL=https://ollama.com/api
OLLAMA_API_KEY=your-api-key
OLLAMA_MODEL=mistral
USE_OLLAMA=true  # Set to "false" to disable

# General
NODE_ENV=production  # Set to "test" to disable some features
```

### Feature Flags
- `USE_OLLAMA`: Controls whether to use LLM for generation
  - `true` (default if OLLAMA_API_KEY exists): Use Ollama API
  - `false`: Use default template values

---

## Dependencies

### Internal
- `../../utils/logger` - For info, warn, error logging

### External
- `parse/node` - Parse SDK for database operations
- `dotenv` - Environment variable loading
- `better-sqlite3` - (Indirect, via verify-paid-invoices)

### API Dependencies
- Ollama API - For LLM-based content generation (optional)

---

## Performance Considerations

1. **Query Limits**: Both steps use limit 9999 (effectively unlimited)
2. **Batch Processing**: Processes relances sequentially (not in parallel)
3. **LLM Timeout**: 120 seconds per generation request
4. **Retry Logic**: Up to 30 retries for LLM API, 1-second delay between retries
5. **Variable Replacement**: Up to 5 regeneration attempts if variables remain
6. **Memory**: All relances loaded into memory at once

---

## Testing Notes

- Set `USE_OLLAMA=false` to test without API calls
- Set `NODE_ENV=test` to modify behavior
- Mock Parse queries for unit testing
- Test with various template configurations
- Test edge cases: empty relances, missing sequences, invalid templates

---

## File Structure

```
generate-relances/
├── 00-master.js              # Main orchestrator
├── 01-replaceVariables.js   # Step 1: Variable replacement
├── 02-generateRelances.js    # Step 2: Content generation
├── logs/                     # Runtime logs
└── specs/
    └── technical-guide.md    # This file
```
