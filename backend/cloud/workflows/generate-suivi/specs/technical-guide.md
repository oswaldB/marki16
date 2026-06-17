# Objectifs
- Orchestrer la génération des emails de suivi pour les factures impayées
- Créer des enregistrements de suivi pour les factures qui en ont besoin
- Remplacer les variables connues dans les modèles d'emails
- Générer le contenu final des emails en utilisant l'IA (API Ollama)

# Start
## route
- Cloud Function: `Parse.Cloud.run("generateSuivis")`
- CLI: `node 00-master.js`
- Programmatic: `require('./generate-suivi/00-master')`

## entry data
- None (autonomous workflow)
- Requires: `masterKey` OR authenticated `user`

# Process

## node 0: Master Orchestrator (00-master.js)
### input
- `trigger`: string (default: "manual")

### operations
1. Load environment variables from .env
2. Initialize Parse SDK (if not already initialized)
3. If trigger !== "test": clearLogs()
4. Log workflow start with trigger type: "🚀 DÉBUT: generate-suivi (trigger: {trigger})"
5. Initialize stats object:
   ```javascript
   stats = { 
     errors: [], 
     total: { startedAt, finishedAt, durationMs }, 
     etape1: {}, etape2: {}, etape3: {}
   }
   ```
6. Execute generateSuivisMaster() function
7. Register Cloud Function: `Parse.Cloud.define("generateSuivis")`

### output
- `{ stats }`

## node 1: Create Follow-ups (01-createSuivis.js)
### input
- None (queries Parse directly)

### operations
1. Query Impaye from Parse:
   - where: `{ facture_soldee: false, solde: false }`
   - where: `{ sequence: exists (not null) }`
   - include: `["sequence", "contact", "dossier"]`
   - limit: 10000

2. For each impaye found:
   a. Check if Suivi already exists for this impaye:
      - Query: Suivi where impaye = current impaye AND sequence = impaye.sequence AND email_index = calculatedEmailIndex
      - IF EXISTS: existingSuivi = result
      - ELSE: existingSuivi = null
   b. Calculate email_index:
      - Get sequence = impaye.get("sequence")
      - Get emails = sequence.get("emails") || []
      - Get today = new Date()
      - Get dueDate = impaye.get("dateEcheance")
      - Calculate daysSinceDue = today - dueDate (in days)
      - Find matching email in sequence.emails where email.daysAfterDue <= daysSinceDue
      - IF no matching email found: use first email (index 0)
   c. IF existingSuivi:
      - IF existingSuivi.email_index !== emailIndex:
        - Update suivi: email_index = emailIndex
        - Save to Parse
        - Increment stats.suivisUpdated
      - ELSE: increment stats.skipped
   d. ELSE (no existing suivi):
      - Create new Suivi:
        - impaye: impaye
        - sequence: sequence
        - email_index: emailIndex
        - statut: "En attente de génération"
        - dateCreation: new Date()
      - Save to Parse
      - Increment stats.suivisCreated

### output
- `{ stats: { suivisCreated, suivisUpdated, skipped } }`

## node 2: Variable Replacement (02-replaceVariables.js)
### input
- None (queries Parse directly)

### operations
1. Query Suivi from Parse:
   - where: `{ statut: "En attente de génération" }`
   - include: `["sequence", "contact", "impaye"]`
   - limit: 9999

2. For each suivi found:
   a. Validate: has sequence? If NO: log warning, skip to next
   b. Get impaye from suivi: impaye = suivi.get("impaye")
      - IF impaye is a reference: fetch full impaye object
   c. Get emailIndex from suivi: emailIndex = suivi.get("email_index")
   d. Fetch full sequence:
      - Query: Sequence where objectId = suivi.sequence.id
   e. Match scenario:
      - emails = sequence.get("emails") || []
      - matchingScenario = emails.find(s => s.email_index === emailIndex)
      - activeScenario = matchingScenario.scenarios.find(s => s.active)
      - IF NOT FOUND: log warning, skip to next
   f. Prepare data for variable replacement:
      - data = { suivi, contact: suivi.contact || suivi.get("contact"), sequence, impaye, scenario: activeScenario }
   g. Replace variables:
      - newObjet = replaceAllVariables(activeScenario.objet, data)
      - newCorps = replaceAllVariables(activeScenario.corps, data)
   h. Check if hasChanges:
      - IF newObjet !== suivi.objet OR newCorps !== suivi.corps:
        - Update suivi: objet = newObjet, corps = newCorps
        - Save to Parse: suivi.save()
        - Increment stats.updated
      - ELSE: increment stats.processed (no changes)

### output
- `{ stats: { processed, updated, errors, erreurs } }`

## node 3: Content Generation (03-generateSuivis.js)
### input
- None (queries Parse directly)

### operations
1. Query Suivi from Parse:
   - where: `{ statut: "En attente de génération" }`
   - include: `["sequence", "contact", "impaye"]`
   - limit: 9999

2. For each suivi found:
   a. Validate: has sequence? If NO: log warning, skip to next
   b. Get impaye from suivi: impaye = suivi.get("impaye")
      - IF impaye is a reference: fetch full impaye object
   c. Get contact from suivi: contact = suivi.get("contact")
      - IF contact is a reference: fetch full contact object
   d. Get emailIndex from suivi: emailIndex = suivi.get("email_index")
   e. Fetch history:
      - Query: Suivi where contact = suivi.contact AND impaye = suivi.impaye AND dateEnvoi EXISTS AND statut = "Envoyée"
   f. Fetch full sequence:
      - Query: Sequence where objectId = suivi.sequence.id
   g. Match scenario (same as node 2)
   h. Generate content:
      - IF USE_OLLAMA = true:
        1. Build prompt using buildPrompt()
        2. Call generateEmailContent() with retry logic (max 30 retries, 1-second delay)
        3. Check for unreplaced variables (retry up to 5 times if found)
        4. Apply orthographic correction: correctOrthographe() for objet & corps
      - ELSE (USE_OLLAMA = false):
        1. Use default values from active scenario:
           - objet = activeScenario.objet || "Suivi..."
           - corps = activeScenario.corps || "Veuillez..."
   i. Update suivi:
      - objet = generated objet
      - corps = generated corps
      - statut = "pret pour envoi"
      - Save to Parse: suivi.save()
      - Increment stats.processed

### output
- `{ stats: { processed, errors, erreurs } }`

# end
## results
- All unpaid invoices with sequences have follow-ups created
- Variables replaced in follow-up templates
- Content generated for follow-ups
- All follow-ups ready to send (statut = "pret pour envoi")
- Return: `{ stats: { errors, total, etape1, etape2, etape3 } }`

# Scenarios to test

## scenario1: Basic follow-up creation and processing
### input data
- Parse with Impaye objects that have sequences and are unpaid
- Sequences with valid email templates

### expecting console log output in the log file
- "Étape 1: X impayés à traiter"
- "Y suivis créés, Z suivis mis à jour"
- "Étape 2: A suivis en attente de traitement"
- "Variables remplacées pour suivi [id]"
- "Étape 2 terminée: B traitée, C mises à jour"
- "Étape 3: D suivis en attente de génération"
- "Contenu généré pour suivi [id]"
- "Étape 3 terminée: E traitée"

### todo to run the tests
1. Create test Impaye objects in Parse with sequences
2. Ensure Impaye objects are unpaid (facture_soldee=false, solde=false)
3. Set USE_OLLAMA=false
4. Run: `node 00-master.js`
5. Verify follow-ups are created with correct email_index
6. Verify variables are replaced correctly
7. Verify follow-up statut changes to "pret pour envoi"

## scenario2: LLM content generation
### input data
- Parse with Impaye objects with sequences
- Templates contain complex variables or missing data
- USE_OLLAMA=true

### expecting console log output in the log file
- "Étape 3: X suivis en attente de génération"
- "Génération LLM pour suivi [id]"
- "Contenu généré avec LLM pour suivi [id]"
- "Correction orthographique appliquée"

### todo to run the tests
1. Create test Impaye objects with complex templates
2. Set USE_OLLAMA=true
3. Set OLLAMA_API_URL and OLLAMA_API_KEY
4. Run: `node 00-master.js`
5. Verify LLM generates appropriate content
6. Verify orthographic corrections are applied

## scenario3: No follow-ups to create
### input data
- Parse with no Impaye objects that need follow-ups
- Or all Impaye objects already have follow-ups

### expecting console log output in the log file
- "Étape 1: 0 impayés à traiter"
- "Étape 2: 0 suivis en attente de traitement"
- "Étape 3: 0 suivis en attente de génération"

### todo to run the tests
1. Ensure no Impaye objects need follow-ups
2. Run: `node 00-master.js`
3. Verify workflow completes with 0 processed

## scenario4: Missing sequence
### input data
- Parse with Impaye objects that have no sequence

### expecting console log output in the log file
- "Impayé [id]: pas de séquence, ignoré"

### todo to run the tests
1. Create Impaye objects without valid sequence
2. Run: `node 00-master.js`
3. Verify impayes are skipped with appropriate warnings

## scenario5: Cloud Function call
### input data
- Valid Parse Cloud Function call with masterKey

### expecting console log output in the log file
- "🚀 DÉBUT: generate-suivi (trigger: cloud-function)"
- Same logs as CLI execution

### todo to run the tests
1. Call from client-side JavaScript:
   ```javascript
   Parse.Cloud.run('generateSuivis', {}, { useMasterKey: true })
     .then(result => console.log('Follow-up generation completed:', result.stats))
     .catch(error => console.error('Follow-up generation error:', error));
   ```
2. Verify Cloud Function executes successfully
