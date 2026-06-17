# Technical Guide: appliquer-regles-attribution Workflow

## Overview
This workflow is a **utility service** that applies automatic sequence assignment rules to unpaid invoices (`Impaye` objects). It is designed to be called by other workflows rather than being triggered directly.

## Purpose
Automatically assigns appropriate sequences to unpaid invoices based on predefined rules and conditions.

---

## Invocation Methods (Comment ce workflow est appelé)

### 1. Programmatic Import (Primary Method - Utility Function)
**Usage**:
```javascript
const { appliquerReglesAttributionAutomatique } = require('./appliquer-regles-attribution/00-master');

// In another workflow (e.g., import-invoice, verify-paid-invoices)
const sequence = await appliquerReglesAttributionAutomatique(impaye, { 
  logActivity: true 
});

if (sequence) {
  console.log(`Sequence ${sequence.id} assigned to impaye ${impaye.id}`);
} else {
  console.log(`No sequence found for impaye ${impaye.id}`);
}
```

**Parameters**:
- `impaye` (Parse.Object) - **Required**: The unpaid invoice to evaluate
- `options` (Object) - Optional:
  - `logActivity` (boolean, default: true) - Whether to log activity to Parse

**Returns**: Promise<Parse.Object|null>
- Resolves to the assigned Sequence object if a match is found
- Resolves to `null` if no match is found or if impaye already has a sequence

---

### 2. Direct Module Import
**Usage**:
```javascript
const workflow = require('./appliquer-regles-attribution/00-master');

// Access the function directly
const sequence = await workflow.appliquerReglesAttributionAutomatique(impaye);
```

---

## Complete Flow: From Invocation to Output

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVOCATION POINT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Programmatic Call from another workflow:                             │   │
│  │   const { appliquerReglesAttributionAutomatique } = require('./...')  │   │
│  │   await appliquerReglesAttributionAutomatique(impaye, options)        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTRY POINT: 00-master.js                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Load environment variables from .env                                     │
│  2. Initialize Parse SDK (if not already initialized)                         │
│  3. Clear logs directory (if trigger !== "test")                              │
│  4. Log workflow startup information                                        │
│  5. Import appliquerReglesAttributionAutomatique from 01-...js               │
│  6. Export the function for use by other workflows                           │
│  7. Log: "Module appliquer-regles-attribution prêt à être utilisé"            │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FUNCTION: appliquerReglesAttributionAutomatique(impaye, options)│
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: {                                                                  │
│    impaye: Parse.Object (required),                                        │
│    options: { logActivity: boolean } (optional, default: { logActivity: true })│
│  }                                                                     │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 1: Pre-validation                                                │   │
│  │  1.1 Check if Parse SDK is initialized:                                 │   │
│  │      IF typeof Parse === "undefined":                                │   │
│  │         Throw: "Parse SDK not initialized"                             │   │
│  │  1.2 Initialize timing: startedAt = new Date()                         │   │
│  │  1.3 Log start: "Traitement impayé {impaye.id}"                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 2: Check if already assigned                                     │   │
│  │  2.1 Check if impaye has sequence:                                     │   │
│  │      IF impaye.get("sequence") exists:                                │   │
│  │         Log: "Impayé {impaye.id} a déjà une séquence"                  │   │
│  │         Return: null                                                  │   │
│  │         (Early exit - no further processing)                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 3: Query active sequences from Parse                             │   │
│  │  3.1 Build query:                                                     │   │
│  │      - Class: Sequence                                                │   │
│  │      - where: { attribution_automatique: true, publiee: true }        │   │
│  │  3.2 Execute query: sequences = await query.find({ useMasterKey: true })│   │
│  │  3.3 Check results:                                                  │   │
│  │      IF sequences.length === 0:                                       │   │
│  │         Log: "Aucune séquence avec attribution automatique trouvée"   │   │
│  │         Return: null                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 4: Process each sequence (Main Loop)                            │   │
│  │  4.1 For EACH sequence in sequences:                                  │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. Get rule groups: groupesRegles = sequence.get("groupes_regles")│   │   │
│  │      │    || []                                                      │   │   │
│  │      │    Log: "Test séquence {sequence.id} ({groupesRegles.length} groupes)"│   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ b. Initialize validation: tousGroupesValides = true             │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ c. Process EACH group in groupesRegles:                         │   │   │
│  │      │    ┌─────────────────────────────────────────────────────┐   │   │   │
│  │      │    │ 4.c.1 Get group logic:                                   │   │   │   │
│  │      │    │    logiqueGroupe = groupe.logique || "ET"                 │   │   │   │
│  │      │    │    (Can be "ET" for AND or "OU" for OR)                   │   │   │   │
│  │      │    │    regles = groupe.regles || []                           │   │   │   │
│  │      │    │    Log: "Groupe {logiqueGroupe} avec {regles.length} règles"│   │   │   │
│  │      │    ├─────────────────────────────────────────────────────┤   │   │   │
│  │      │    │ 4.c.2 Initialize group validation:                        │   │   │   │
│  │      │    │    IF logiqueGroupe === "ET":                            │   │   │   │
│  │      │    │       groupeValide = true  (start true, any false makes invalid)│   │   │   │
│  │      │    │    ELSE (logiqueGroupe === "OU"):                         │   │   │   │
│  │      │    │       groupeValide = false (start false, any true makes valid)│   │   │   │
│  │      │    ├─────────────────────────────────────────────────────┤   │   │   │
│  │      │    │ 4.c.3 Process EACH rule in regles:                        │   │   │   │
│  │      │    │    ┌─────────────────────────────────────────────┐   │   │   │   │
│  │      │    │    │ For rule in regles:                              │   │   │   │   │
│  │      │    │    │   champ = rule.champ                              │   │   │   │   │
│  │      │    │    │   operateur = rule.operateur || "egal"            │   │   │   │   │
│  │      │    │    │   valeur = rule.valeur || []                      │   │   │   │   │
│  │      │    │    │   valeurImpaye = impaye.get(champ)                │   │   │   │   │
│  │      │    │    │   Log: "Règle: {champ} {operateur} {valeur} " +    │   │   │   │   │
│  │      │    │    │         "(valeur impayé: {valeurImpaye})"          │   │   │   │   │
│  │      │    │    │                                                   │   │   │   │   │
│  │      │    │    │   Apply operator:                                  │   │   │   │   │
│  │      │    │    │   IF operateur === "egal":                        │   │   │   │   │
│  │      │    │    │      regleValide = valeur.includes(valeurImpaye)   │   │   │   │   │
│  │      │    │    │   ELSE IF operateur === "different":              │   │   │   │   │
│  │      │    │    │      regleValide = !valeur.includes(valeurImpaye)   │   │   │   │   │
│  │      │    │    │   ELSE IF operateur === "supérieur":              │   │   │   │   │
│  │      │    │    │      regleValide = valeurImpaye > valeur[0]        │   │   │   │   │
│  │      │    │    │   ELSE IF operateur === "inférieur":               │   │   │   │   │
│  │      │    │    │      regleValide = valeurImpaye < valeur[0]        │   │   │   │   │
│  │      │    │    │                                                   │   │   │   │   │
│  │      │    │    │   IF !regleValide:                                 │   │   │   │   │
│  │      │    │    │      Log: "Règle non validée"                      │   │   │   │   │
│  │      │    │    │      IF logiqueGroupe === "ET":                   │   │   │   │   │
│  │      │    │    │         groupeValide = false                       │   │   │   │   │
│  │      │    │    │         Break (exit rule loop early)               │   │   │   │   │
│  │      │    │    │      ELSE (logiqueGroupe === "OU"):                │   │   │   │   │
│  │      │    │    │         Continue (try next rule)                    │   │   │   │   │
│  │      │    │    │   ELSE:                                               │   │   │   │   │
│  │      │    │    │      IF logiqueGroupe === "OU":                    │   │   │   │   │
│  │      │    │    │         groupeValide = true                         │   │   │   │   │
│  │      │    │    │         Break (exit rule loop early)                │   │   │   │   │
│  │      │    │    │      ELSE:                                            │   │   │   │   │
│  │      │    │    │         Continue (continue checking rules)           │   │   │   │   │
│  │      │    │    └─────────────────────────────────────────────┘   │   │   │
│  │      │    ├─────────────────────────────────────────────────────┤   │   │
│  │      │    │ 4.c.4 Update group validation:                         │   │   │   │
│  │      │    │    IF logiqueGroupe === "ET" AND !groupeValide:         │   │   │   │
│  │      │    │       tousGroupesValides = false                        │   │   │   │
│  │      │    │       Break (exit group loop early)                     │   │   │   │
│  │      │    │    ELSE IF logiqueGroupe === "OU" AND groupeValide:      │   │   │   │
│  │      │    │       tousGroupesValides = true                         │   │   │   │
│  │      │    │       Break (exit group loop early)                     │   │   │   │
│  │      │    └─────────────────────────────────────────────────────┘   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  │      ┌───────────────────────────────────────────────────────────┤   │   │
│  │      │ 4.2 After processing all groups:                               │   │   │
│  │      │    IF tousGroupesValides === true:                             │   │   │
│  │      │       GOTO PHASE 5 (Assign sequence)                           │   │   │
│  │      │    ELSE:                                                       │   │   │
│  │      │       Continue to next sequence                                │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 5: Assign sequence (if all groups valid)                          │   │
│  │  5.1 Log: "Tous les groupes validés - attribution séquence {sequence.id}"│   │
│  │  5.2 Assign sequence to impaye:                                        │   │
│  │      impaye.set("sequence", sequence)                                   │   │
│  │  5.3 Save impaye to Parse:                                             │   │
│  │      await impaye.save(null, { useMasterKey: true })                   │   │
│  │  5.4 Log activity (if logActivity && NODE_ENV !== "test"):              │   │
│  │      Try:                                                             │   │
│  │        finishedAt = new Date()                                         │   │
│  │        log = new Parse.Object("AppliquerReglesAttributionAutomatiqueLog")│   │
│  │        log.set("startedAt", startedAt)                                │   │
│  │        log.set("finishedAt", finishedAt)                               │   │
│  │        log.set("durationMs", finishedAt - startedAt)                  │   │
│  │        log.set("impayeId", impaye.id)                                  │   │
│  │        log.set("sequenceId", sequence.id)                              │   │
│  │        log.set("status", "success")                                    │   │
│  │        await log.save(null, { useMasterKey: true })                    │   │
│  │      Catch (logErr):                                                   │   │
│  │        Log error: "Impossible d'écrire le log: {logErr.message}"      │   │
│  │  5.5 Return: sequence                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ PHASE 6: No matching sequence found (if loop completed without match)  │   │
│  │  6.1 Log: "Aucune règle ne correspond pour l'impayé {impaye.id}"      │   │
│  │  6.2 Log failure (if logActivity && NODE_ENV !== "test"):              │   │
│  │      Try:                                                             │   │
│  │        finishedAt = new Date()                                         │   │
│  │        log = new Parse.Object("AppliquerReglesAttributionAutomatiqueLog")│   │
│  │        log.set("startedAt", startedAt)                                │   │
│  │        log.set("finishedAt", finishedAt)                               │   │
│  │        log.set("durationMs", finishedAt - startedAt)                  │   │
│  │        log.set("impayeId", impaye.id)                                  │   │
│  │        log.set("status", "failed")                                     │   │
│  │        log.set("message", "Aucune règle correspondante")               │   │
│  │        await log.save(null, { useMasterKey: true })                    │   │
│  │      Catch (logErr):                                                   │   │
│  │        Log error: "Impossible d'écrire le log: {logErr.message}"      │   │
│  │  6.3 Return: null                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FINAL OUTPUT                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Return: Promise<Parse.Object|null>                                        │
│                                                                             │
│  SUCCESS CASE:                                                             │
│    - Returns: Parse.Object (the assigned Sequence)                          │
│    - impaye.sequence is set to the matching sequence                        │
│    - Activity log created in Parse (if logActivity enabled)                 │
│    - impaye saved to Parse                                                  │
│                                                                             │
│  FAILURE CASES:                                                            │
│    - Returns: null                                                         │
│    - Possible reasons:                                                     │
│      1. Parse SDK not initialized (throws error)                          │
│      2. impaye already has a sequence (early return)                       │
│      3. No active sequences found (returns null)                           │
│      4. No matching rules for any sequence (returns null)                  │
│    - Activity log created for failure case (if logActivity enabled)        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## States

### Workflow States
- **Ready**: Module is initialized and ready to be used by other workflows
- **Processing**: Currently evaluating an unpaid invoice against sequence rules
- **Success**: Sequence successfully assigned to an unpaid invoice
- **Failed**: No matching sequence found for the unpaid invoice
- **Skipped**: Unpaid invoice already has a sequence assigned

### Data Object States
- **Impaye (Unpaid Invoice)**: Can be in states `without sequence` or `with sequence`
- **Sequence**: Can be `published` or `unpublished`, with `attribution_automatique` enabled or disabled

---

## Node Sequence

### Node 1: Master Module (00-master.js)
**File**: `00-master.js`

**Actions**:
1. **Initialization**:
   - Loads environment variables from `.env`
   - Initializes Parse SDK if not already done
   - Clears logs directory (if not test)

2. **Module Setup**:
   - Logs workflow startup information
   - Imports `appliquerReglesAttributionAutomatique` from `01-appliquerReglesAttributionAutomatique.js`
   - Exports the function for use by other workflows

3. **Characteristics**:
   - **No Cloud Function**: This is a utility module, not a standalone workflow
   - **No Cron Trigger**: Not designed for scheduled execution
   - **No Direct Execution**: Not meant to be run via CLI
   - **Pure Utility**: Designed to be called by other workflows

---

### Node 2: Rule Application Engine (01-appliquerReglesAttributionAutomatique.js)
**File**: `01-appliquerReglesAttributionAutomatique.js`

**Main Function**: `appliquerReglesAttributionAutomatique(impaye, options)`

**Actions**:

#### Phase 1: Pre-validation
1. **Input Validation**: Checks if Parse SDK is initialized
2. **Logging Setup**: Records start time and logs the beginning of processing for the unpaid invoice
3. **Existing Sequence Check**: 
   - If `impaye.get("sequence")` exists → returns `null` (already assigned)

#### Phase 2: Sequence Retrieval
4. **Query Active Sequences**:
   - Queries `Sequence` class with filters:
     - `attribution_automatique: true`
     - `publiee: true` (only published sequences)
   - If no sequences found → returns `null`

#### Phase 3: Rule Evaluation (Main Processing Loop)
5. **Iterate Through Sequences**: For each sequence found:
   
   a. **Get Rule Groups**: Retrieves `groupes_regles` array from sequence
   
   b. **Initialize Validation**: Sets `tousGroupesValides = true`
   
   c. **Process Each Rule Group**: For each group in `groupes_regles`:
      
      **Group Logic Setup**:
      - Reads `logique` (default: "ET" / AND)
      - Can be "ET" (AND) or "OU" (OR)
      - Gets `regles` array from group
      
      **Rule Evaluation**:
      - For each rule in the group:
        - Extracts: `champ` (field), `operateur` (operator), `valeur` (value)
        - Gets actual value from impaye: `valeurImpaye = impaye.get(champ)`
        
        **Operator Application**:
        | Operator | Logic | Example |
        |----------|-------|---------|
        | `egal` | Value is in array | `valeur.includes(valeurImpaye)` |
        | `different` | Value is NOT in array | `!valeur.includes(valeurImpaye)` |
        | `supérieur` | Greater than | `valeurImpaye > valeur[0]` |
        | `inférieur` | Less than | `valeurImpaye < valeur[0]` |
      
      **Group Validation Logic**:
      - **ET (AND)**: All rules must be valid
        - Starts with `groupeValide = true`
        - If any rule fails → `groupeValide = false` and breaks
      - **OU (OR)**: At least one rule must be valid
        - Starts with `groupeValide = false`
        - If any rule passes → `groupeValide = true` and breaks
      
      **Update Global Validation**:
      - If group logic is "ET" and group is invalid → `tousGroupesValides = false`, break
      - If group logic is "OU" and group is valid → `tousGroupesValides = true`, break

#### Phase 4: Sequence Assignment
6. **Final Validation Check**:
   - If `tousGroupesValides === true`:
     - Assigns sequence to impaye: `impaye.set("sequence", sequence)`
     - Saves impaye: `await impaye.save(null, { useMasterKey: true })`
     - Creates activity log in Parse (if enabled)
     - Returns the assigned `sequence` object
   
   - If no sequence matches:
     - Creates error log with status "failed"
     - Returns `null`

---

## Data Flow

```
Input: impaye (Parse.Object), options { logActivity: boolean }
       ↓
[Check if Parse SDK is initialized]
       ↓ (yes)
[Check if impaye has sequence]
       ↓ (no sequence)
[Query active sequences with attribution_automatique=true]
       ↓
[For each sequence]
       ↓
[Get groupes_regles from sequence]
       ↓
[For each group]
       ↓
[Apply group logic (ET/OU)]
       ↓
[For each rule in group]
       ↓
[Apply operator (egal/different/supérieur/inférieur)]
       ↓
[Determine rule validity]
       ↓
[Update group validity based on logic]
       ↓
[Update global validity]
       ↓
[If all groups valid]
       ↓
[Assign sequence to impaye]
       ↓
[Save impaye]
       ↓
[Create success log]
       ↓
Output: sequence (Parse.Object) or null
```

---

## Key Functions

### Main Function
- `appliquerReglesAttributionAutomatique(impaye, options)`
  - **Parameters**:
    - `impaye` (Parse.Object): The unpaid invoice to evaluate
    - `options.logActivity` (boolean, default: true): Whether to log activity to Parse
  - **Returns**: Promise<Parse.Object|null>
  - **Throws**: Error if Parse SDK is not initialized

---

## Error Handling

1. **Parse SDK Not Initialized**: Throws error immediately
2. **No Active Sequences**: Returns null with appropriate log
3. **Rule Evaluation Errors**: Caught and logged, continues to next sequence
4. **Save Errors**: Would propagate as unhandled promise rejection
5. **Log Creation Errors**: Caught and logged, does not prevent main operation

---

## Configuration

### Environment Variables
- `PARSE_APP_ID`
- `PARSE_JAVASCRIPT_KEY`
- `PARSE_MASTER_KEY`
- `PARSE_SERVER_URL`
- `NODE_ENV` (affects logging behavior)

---

## Dependencies

### Internal
- `../../utils/logger` - For info, warn, error logging

### External
- `parse/node` - Parse SDK for database operations
- `dotenv` - Environment variable loading

---

## Performance Considerations

1. **Query Optimization**: Single query for all active sequences at start
2. **Early Exit**: Returns immediately if impaye already has a sequence
3. **Batch Processing**: Processes one impaye at a time (not designed for bulk)
4. **Logging Overhead**: Activity logging adds database writes

---

## Testing Notes

- Set `NODE_ENV=test` to disable activity logging
- Mock Parse objects for unit testing
- Test with various rule combinations (ET/OU logic)
- Test edge cases: empty sequences, null values, missing fields

---

## Usage Example

```javascript
const { appliquerReglesAttributionAutomatique } = require('./appliquer-regles-attribution/00-master');

// In another workflow
const sequence = await appliquerReglesAttributionAutomatique(impaye, { logActivity: true });
if (sequence) {
    console.log(`Sequence ${sequence.id} assigned to impaye ${impaye.id}`);
} else {
    console.log(`No sequence found for impaye ${impaye.id}`);
}
```

---

## File Structure

```
appliquer-regles-attribution/
├── 00-master.js              # Main entry point, utility module
├── 01-appliquerReglesAttributionAutomatique.js  # Core logic
├── logs/                     # Runtime logs
└── specs/
    └── technical-guide.md    # This file
```
