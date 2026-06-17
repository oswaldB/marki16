# Technical Guide: generate-suivi Workflow

## Overview
This workflow orchestrates the generation of follow-up emails (suivis) for unpaid invoices. It is a **three-step process** that creates follow-ups, replaces variables in templates, and generates the final email content using LLM capabilities.

## Purpose
Automatically generate personalized follow-up emails for unpaid invoices by:
1. Creating follow-up records for invoices that need them
2. Replacing known variables in email templates
3. Generating final email content using AI (Ollama API)

---

## Invocation Methods (Comment ce workflow est appelé)

### 1. Cloud Function Trigger (Primary Method)
**Endpoint**: `Parse.Cloud.run("generateSuivis")`

**How to Call**:
```javascript
// From client-side JavaScript
Parse.Cloud.run('generateSuivis', {}, { useMasterKey: true })
  .then(result => {
    console.log('Follow-up generation completed:', result.stats);
  })
  .catch(error => {
    console.error('Follow-up generation error:', error);
  });
```

**Authentication**:
- Requires `masterKey` OR authenticated `user`
- Throws: `"Non autorisé - cette fonction nécessite un utilisateur authentifié ou le master key"`

**Parameters**: None (autonomous workflow)

---

### 2. Direct CLI Execution
**Command**: 
```bash
cd /home/ubuntu/prod/adti/backend/cloud/workflows/generate-suivi
node 00-master.js
```

**Trigger**: `"cli"`

**Use Case**: Manual execution for testing or maintenance

---

### 3. Programmatic Import
**Usage**:
```javascript
const generateSuivisMaster = require('./generate-suivi/00-master');

await generateSuivisMaster({ trigger: 'manual' });
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
│  │  "generateSuivis")  │  │                     │  │ master').default()  │  │
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
│     Log: "🚀 DÉBUT: generate-suivi (trigger: {trigger})"                      │
│  5. Initialize stats object                                                   │
│     └─ stats = { errors: [], total: { startedAt, finishedAt, durationMs },     │
│                etape1: {}, etape2: {}, etape3: {} }                          │
│  6. Execute generateSuivisMaster() function                                   │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 1: Create Follow-ups (01-createSuivis.js)             │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: None (queries Parse directly)                                         │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.1 Query Impaye from Parse:                                           │   │
│  │     - where: { facture_soldee: false, solde: false }                   │   │
│  │     - where: { sequence: exists (not null) }                            │   │
│  │     - include: ["sequence", "contact", "dossier"]                      │   │
│  │     - limit: 10000                                                     │   │
│  │     Log: "Étape 1: {impayes.length} impayés à traiter"                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.2 For EACH impaye found:                                             │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. Check if Suivi already exists for this impaye:             │   │   │
│  │      │    Query: Suivi where impaye = current impaye AND             │   │   │
│  │      │            sequence = impaye.sequence AND                       │   │   │
│  │      │            email_index = calculatedEmailIndex                   │   │   │
│  │      │    IF EXISTS: existingSuivi = result                            │   │   │
│  │      │    ELSE: existingSuivi = null                                   │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ b. Calculate email_index:                                       │   │   │
│  │      │    - Get sequence = impaye.get("sequence")                      │   │   │
│  │      │    - Get emails = sequence.get("emails") || []                 │   │   │
│  │      │    - Get today = new Date()                                     │   │   │
│  │      │    - Get dueDate = impaye.get("dateEcheance")                  │   │   │
│  │      │    - Calculate daysSinceDue = today - dueDate (in days)          │   │   │
│  │      │    - Find matching email in sequence.emails:                    │   │   │
│  │      │        For each email in emails:                                 │   │   │
│  │      │          IF email.daysAfterDue <= daysSinceDue AND              │   │   │
│  │      │             (previous emails sent OR first email):               │   │   │
│  │      │             emailIndex = email.email_index                       │   │   │
│  │      │             Break                                               │   │   │
│  │      │    - IF no matching email found: use first email (index 0)      │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ c. IF existingSuivi:                                           │   │   │
│  │      │       IF existingSuivi.email_index !== emailIndex:             │   │   │
│  │      │          Update suivi: email_index = emailIndex                  │   │   │
│  │      │          Save to Parse                                           │   │   │
│  │      │          Increment stats.suivisUpdated                          │   │   │
│  │      │       ELSE:                                                     │   │   │
│  │      │          Increment stats.skipped                                │   │   │
│  │      │    ELSE: (no existing suivi)                                    │   │   │
│  │      │       Create new Suivi:                                         │   │   │
│  │      │         - impaye: impaye                                          │   │   │
│  │      │         - sequence: sequence                                      │   │   │
│  │      │         - email_index: emailIndex                                │   │   │
│  │      │         - statut: "En attente de génération"                      │   │   │
│  │      │         - dateCreation: new Date()                                │   │   │
│  │      │       Save to Parse                                             │   │   │
│  │      │       Increment stats.suivisCreated                             │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { stats: { suivisCreated, suivisUpdated, skipped } }                │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 2: Variable Replacement (02-replaceVariables.js)    │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: None (queries Parse directly)                                         │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2.1 Query Suivi from Parse:                                           │   │
│  │     - where: { statut: "En attente de génération" }                     │   │
│  │     - include: ["sequence", "contact", "impaye"]                        │   │
│  │     - limit: 9999                                                      │   │
│  │     Log: "Étape 2: {suivis.length} suivis en attente de traitement"     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2.2 For EACH suivi found:                                             │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. Validate: has sequence?                                     │   │   │
│  │      │    IF NO: log warning, skip to next                           │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ b. Get impaye from suivi: impaye = suivi.get("impaye")          │   │   │
│  │      │    IF impaye is a reference: fetch full impaye object           │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ c. Get emailIndex from suivi: emailIndex = suivi.get("email_index")│   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ d. Fetch full sequence:                                        │   │   │
│  │      │    Query: Sequence where objectId = suivi.sequence.id          │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ e. Match scenario:                                            │   │   │
│  │      │    - emails = sequence.get("emails") || []                     │   │   │
│  │      │    - matchingScenario = emails.find(s => s.email_index === emailIndex)│   │   │
│  │      │    - activeScenario = matchingScenario.scenarios.find(s => s.active)│   │   │
│  │      │    IF NOT FOUND: log warning, skip to next                      │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ f. Prepare data for variable replacement:                      │   │   │
│  │      │    data = {                                                   │   │   │
│  │      │      suivi: suivi,                                            │   │   │
│  │      │      contact: suivi.contact || suivi.get("contact"),          │   │   │
│  │      │      sequence: sequence,                                       │   │   │
│  │      │      impaye: impaye,                                           │   │   │
│  │      │      scenario: activeScenario                                  │   │   │
│  │      │    }                                                                 │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ g. Replace variables:                                         │   │   │
│  │      │    - newObjet = replaceAllVariables(activeScenario.objet, data)│   │   │
│  │      │    - newCorps = replaceAllVariables(activeScenario.corps, data)│   │   │
│  │      │    (Same variable replacement logic as generate-relances)       │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ h. Check if hasChanges:                                       │   │   │
│  │      │    IF newObjet !== suivi.objet OR newCorps !== suivi.corps:   │   │   │
│  │      │       Update suivi:                                           │   │   │
│  │      │         - objet = newObjet                                     │   │   │
│  │      │         - corps = newCorps                                      │   │   │
│  │      │       Save to Parse: suivi.save()                              │   │   │
│  │      │       Increment stats.updated                                  │   │   │
│  │      │    ELSE:                                                       │   │   │
│  │      │       Increment stats.processed (no changes)                 │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { stats: { processed, updated, errors, erreurs } }                 │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 3: Content Generation (03-generateSuivis.js)        │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: None (queries Parse directly)                                         │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3.1 Query Suivi from Parse:                                           │   │
│  │     - where: { statut: "En attente de génération" }                     │   │
│  │     - include: ["sequence", "contact", "impaye"]                        │   │
│  │     - limit: 9999                                                      │   │
│  │     Log: "Étape 3: {suivis.length} suivis en attente de génération"    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3.2 For EACH suivi found:                                             │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. Validate: has sequence?                                     │   │   │
│  │      │    IF NO: log warning, skip to next                           │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ b. Get impaye from suivi: impaye = suivi.get("impaye")          │   │   │
│  │      │    IF impaye is a reference: fetch full impaye object           │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ c. Get contact from suivi: contact = suivi.get("contact")       │   │   │
│  │      │    IF contact is a reference: fetch full contact object        │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ d. Get emailIndex from suivi: emailIndex = suivi.get("email_index")│   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ e. Fetch history:                                             │   │   │
│  │      │    Query: Suivi where contact = suivi.contact AND              │   │   │
│  │      │            impaye = suivi.impaye AND                            │   │   │
│  │      │            dateEnvoi EXISTS AND statut = "Envoyée"              │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ f. Fetch full sequence:                                       │   │   │
│  │      │    Query: Sequence where objectId = suivi.sequence.id          │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ g. Match scenario (same as Step 2)                             │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ h. Generate content:                                          │   │   │
│  │      │    IF USE_OLLAMA = true:                                       │   │   │
│  │      │       ┌───────────────────────────────────────────────┐   │   │   │
│  │      │       │ 1. Build prompt using buildPrompt()             │   │   │   │
│  │      │       │ 2. Call generateEmailContent() with retry logic   │   │   │   │
│  │      │       │    - Max 30 retries for LLM API calls           │   │   │   │
│  │      │       │    - 1 second delay between retries             │   │   │   │
│  │      │       │ 3. Check for unreplaced variables               │   │   │   │
│  │      │       │    - If found: retry up to 5 times               │   │   │   │
│  │      │       │ 4. Apply orthographic correction               │   │   │   │
│  │      │       │    - Call correctOrthographe() for objet & corps │   │   │   │
│  │      │       └───────────────────────────────────────────────┘   │   │   │
│  │      │    ELSE (USE_OLLAMA = false):                                   │   │   │
│  │      │       ┌───────────────────────────────────────────────┐   │   │   │
│  │      │       │ Use default values from active scenario:        │   │   │   │
│  │      │       │   objet = activeScenario.objet || "Suivi..."    │   │   │   │
│  │      │       │   corps = activeScenario.corps || "Veuillez..."   │   │   │   │
│  │      │       └───────────────────────────────────────────────┘   │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ i. Update suivi:                                             │   │   │
│  │      │    - objet = generated objet                                   │   │   │
│  │      │    - corps = generated corps                                    │   │   │
│  │      │    - statut = "pret pour envoi"                                 │   │   │
│  │      │    Save to Parse: suivi.save()                                  │   │   │
│  │      │    Increment stats.processed                                   │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
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
│      errors: [ { step: string, script: string, error: string, stack?: string } ],│
│      total: {                                                             │
│        startedAt: ISOString,                                              │
│        finishedAt: ISOString,                                             │
│        durationMs: number                                                 │
│      },                                                                   │
│      etape1: {                                                            │
│        suivisCreated: number,    // New follow-ups created                 │
│        suivisUpdated: number,    // Existing follow-ups updated              │
│        skipped: number           // Follow-ups skipped                      │
│      },                                                                   │
│      etape2: {                                                            │
│        processed: number,    // Follow-ups processed in Step 2            │
│        updated: number,     // Follow-ups updated in Step 2                │
│        errors: number,      // Errors in Step 2                             │
│        erreurs: [...]        // Detailed errors                              │
│      },                                                                   │
│      etape3: {                                                            │
│        processed: number,    // Follow-ups processed in Step 3            │
│        errors: number       // Errors in Step 3                             │
│      }                                                                   │
│    }                                                                     │
│  }                                                                     │
│                                                                             │
│  SUCCESS: All unpaid invoices with sequences have follow-ups created,        │
│          variables replaced, content generated, and ready to send          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## States

### Workflow States
- **Initializing**: Loading configuration and clearing logs
- **Step 1 Running**: Follow-up creation in progress
- **Step 2 Running**: Variable replacement in progress
- **Step 3 Running**: Content generation in progress
- **Completed**: All steps finished successfully
- **Error**: Workflow failed at some step

### Suivi (Follow-up) States
- **Created**: Suivi record has been created
- **En attente de génération** (Waiting for generation): Ready for variable replacement and content generation
- **pret pour envoi** (Ready for sending): Variables replaced, content generated, ready to send
- **Envoyée** (Sent): Email has been sent (managed by send-emails workflow)

### Process States
- **Processed**: Suivi has been through the workflow
- **Updated**: Suivi was modified (variables replaced or content generated)
- **Created**: New suivi record created
- **Skipped**: Suivi was bypassed due to conditions
- **Error**: Suivi processing failed

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
   - **Step 1**: Calls `createSuivis()` function
   - **Step 2**: Calls `replaceVariables()` function
   - **Step 3**: Calls `generateSuivis()` function
   - Collects statistics from each step

4. **Result Handling**:
   - Logs success/failure for each step
   - Calculates total duration
   - Returns aggregated statistics

5. **Trigger Support**:
   - **Cloud Function**: `Parse.Cloud.define("generateSuivis")`
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
│ STEP 1: createSuivis()                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Query: Impaye with facture_soldee=false, solde=false,   │ │
│ │         has sequence, include=[sequence, contact, dossier]│ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ [For each impaye]                                           │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Check if Suivi exists   │                                │
│ │ for this impaye+sequence│                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Calculate email_index    │ ← Based on due date & sequence│
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Create or update Suivi   │                                │
│ │ statut="En attente de    │                                │
│ │ génération"             │                                │
│ └─────────────────────────┘                                │
└─────────────────────────────────────────────────────────────┘
       ↓
[Master: Collect etape1 stats]
       ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: replaceVariables()                                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Query: Suivi with statut="En attente de génération"      │ │
│ │         include=[sequence, contact, impaye]                │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ [For each suivi]                                            │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Validate sequence exists │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Query impaye details     │                                │
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
│ Update suivi objet & corps                                  │
│ Save to Parse                                               │
└─────────────────────────────────────────────────────────────┘
       ↓
[Master: Collect etape2 stats]
       ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: generateSuivis()                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Query: Suivi with statut="En attente de génération"      │ │
│ │         include=[sequence, contact, impaye]                │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ [For each suivi]                                            │
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
│ │ Query impaye details     │                                │
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
│ │ IF USE_OLLAMA:           │                                │
│ │   buildPrompt()          │                                │
│ │   generateEmailContent() │ ← Call Ollama API              │
│ │   [Retry if variables    │   remain]                      │
│ │   correctOrthographe()   │                                │
│ │ ELSE:                   │                                │
│ │   Use default scenario   │                                │
│ │   values                │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ Update suivi objet & corps                                  │
│ Set statut = "pret pour envoi"                              │
│ Save to Parse                                               │
└─────────────────────────────────────────────────────────────┘
       ↓
[Master: Collect etape3 stats]
       ↓
[Master: Calculate total duration]
       ↓
Return aggregated statistics
```

---

## Key Functions

### Master Level
- `generateSuivisMaster({ trigger })` - Main orchestrator
- Returns: `{ stats }`

### Step 1 Level
- `createSuivis()` - Main function for follow-up creation
- Returns: `{ stats }` with suivisCreated, suivisUpdated, skipped counts

### Step 2 Level
- `replaceVariables()` - Main function for variable replacement
- Returns: `{ stats }` with processed, updated, errors counts

### Step 3 Level
- `generateSuivis()` - Main function for content generation
- Returns: `{ stats }` with processed, errors counts

---

## Error Handling

### Step 1 Errors
- **Query errors**: Caught and logged
- **Suivi creation errors**: Caught, logged, added to stats
- **Validation errors**: Logged as warnings, suivi skipped

### Step 2 Errors
- **No sequence**: Logged as warning, suivi skipped
- **Sequence not found**: Logged as warning, suivi skipped
- **No matching scenario**: Logged as warning, suivi skipped
- **No active scenario**: Logged as warning, suivi skipped
- **Processing errors**: Caught, logged, added to stats.errors

### Step 3 Errors
- Same error handling as Step 2
- **LLM API errors**: Retried up to 30 times
- **Generation failures**: Retried up to 5 times

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
USE_OLLAMA=true

# General
NODE_ENV=production
```

---

## Dependencies

### Internal
- `../../utils/logger` - For info, warn, error logging
- `./01-createSuivis` - Step 1 implementation
- `./02-replaceVariables` - Step 2 implementation
- `./03-generateSuivis` - Step 3 implementation

### External
- `parse/node` - Parse SDK for database operations
- `dotenv` - Environment variable loading

### API Dependencies
- Ollama API - For LLM-based content generation (optional)

---

## Performance Considerations

1. **Query Limits**: All steps use high limits (9999-10000)
2. **Batch Processing**: Processes suivis sequentially
3. **LLM Timeout**: 120 seconds per generation request
4. **Retry Logic**: Up to 30 retries for LLM API
5. **Memory**: All suivis loaded into memory at once

---

## Testing Notes

- Set `USE_OLLAMA=false` to test without API calls
- Set `NODE_ENV=test` to modify behavior
- Mock Parse queries for unit testing
- Test with various sequence configurations
- Test edge cases: empty impayes, missing sequences, invalid templates

---

## File Structure

```
generate-suivi/
├── 00-master.js              # Main orchestrator
├── 01-createSuivis.js       # Step 1: Follow-up creation
├── 02-replaceVariables.js   # Step 2: Variable replacement
├── 03-generateSuivis.js     # Step 3: Content generation
├── FONCTIONNEMENT.md         # Existing functional documentation
├── logs/                     # Runtime logs
└── specs/
    └── technical-guide.md    # This file
```
