# Objectifs
- Envoyer des emails de test pour vérifier les configurations de séquence
- Tester les modèles d'emails sans affecter les données de production
- Vérifier que les variables sont correctement remplacées
- Vérifier que la livraison des emails fonctionne comme prévu

# Start
## route
- Cloud Function: `Parse.Cloud.run("sendSequenceTest")`

## entry data
- Parameters:
  - `sequenceId`: string (required) - The sequence to test
  - `emailIndex`: number (required) - Which email in the sequence to test (0-indexed)
  - `contactId`: string (optional) - Specific contact to send to (overrides testEmail)
  - `testEmail`: string (optional) - Override email address for testing
- Requires: `masterKey` OR authenticated `user`

# Process

## node 0: Master/Cloud Function Registrar (00-master.js)
### input
- None (initialization only)

### operations
1. Load environment variables from .env
2. Initialize Parse SDK (if not already initialized)
3. Clear logs directory
4. Log workflow start: "DÉBUT: send-sequence-test - Enregistrement..."
5. Import sendSequenceTest function from 01-sendSequenceTest.js
6. Register Cloud Function: `Parse.Cloud.define("sendSequenceTest", sendSequenceTest)`
7. Log: "Cloud Function enregistrée avec succès"
8. Export sendSequenceTest function

### output
- Cloud Function registered and ready to receive requests

## node 1: Test Email Sender (01-sendSequenceTest.js)
### input
- `request`: object with params (sequenceId, emailIndex, contactId, testEmail) and authentication info

### operations
1. Validate request:
   - Check if request has params
   - Validate required parameters: sequenceId, emailIndex
   - Check authentication (master key or user)

2. Extract parameters:
   - sequenceId = request.params.sequenceId
   - emailIndex = request.params.emailIndex
   - contactId = request.params.contactId
   - testEmail = request.params.testEmail

3. Fetch sequence from Parse:
   - Query: Sequence where objectId = sequenceId
   - Include: ["emails"]
   - If NOT FOUND: return error "Séquence introuvable"

4. Fetch contact:
   - If contactId provided: Query Contact where objectId = contactId
   - If testEmail provided: Create temporary contact object: { email: testEmail }
   - If neither provided: return error "contactId ou testEmail requis"

5. Fetch sample Impayes for testing:
   - Query: Impaye where facture_soldee = false
   - Limit: 10

6. Get scenario from sequence:
   - Get emails = sequence.get("emails") || []
   - Find matchingScenario where email_index == emailIndex
   - Get activeScenario from matchingScenario.scenarios where active = true
   - If NOT FOUND: return error "Scénario introuvable" or "Aucun scénario actif"

7. Prepare data for variable replacement:
   - data = { contact, sequence, impayes, scenario, emailIndex, trigger, isTest: true }

8. Replace variables in template:
   - objet = replaceAllVariables(activeScenario.objet, data)
   - corps = replaceAllVariables(activeScenario.corps, data)

9. Check for unreplaced variables:
   - IF USE_OLLAMA = true AND hasUnreplacedVariables(objet || corps):
     - Try: buildPrompt(), generateEmailContent() with retry logic
     - Apply orthographic correction: correctOrthographe() for objet & corps
     - Catch: log warning, continue with template
   - ELSE: use objet and corps as-is

10. Setup Nodemailer transporter:
    - transporter = nodemailer.createTransport({ host, port, secure, auth })

11. Build email options:
    - from: process.env.SMTP_FROM || "test@adti.com"
    - to: testEmail || contact.get("email")
    - subject: objet
    - html: corps
    - replyTo: process.env.REPLY_TO_EMAIL

12. Send email:
    - Try: transporter.sendMail(emailOptions)
    - Log: "Email de test envoyé à {to}"
    - Return: { success: true, message: "Email de test envoyé avec succès", to, subject, preview, timestamp }
    - Catch: log error, return { success: false, message: "Échec de l'envoi", error, timestamp }

### output
- `{ success: boolean, message: string, to: string, subject: string, preview: string, timestamp: string }`

# end
## results
- Test email sent successfully or error returned
- No production data modified
- Email content verified

# Scenarios to test

## scenario1: Basic test with sequence and email index
### input data
- Valid sequenceId with emails array
- Valid emailIndex within bounds
- Valid testEmail address

### expecting console log output in the log file
- "DÉBUT: send-sequence-test"
- "Séquence [sequenceId] récupérée"
- "Scénario [emailIndex] trouvé"
- "Variables remplacées"
- "Email de test envoyé à [testEmail]"

### todo to run the tests
1. Create a test sequence in Parse with emails array
2. Call Cloud Function:
   ```javascript
   Parse.Cloud.run('sendSequenceTest', {
     sequenceId: 'testSequence123',
     emailIndex: 0,
     testEmail: 'test@example.com'
   }, { useMasterKey: true })
   ```
3. Verify email is received at testEmail
4. Verify email content matches template

## scenario2: Test with specific contact
### input data
- Valid sequenceId
- Valid emailIndex
- Valid contactId with email address

### expecting console log output in the log file
- "Contact [contactId] récupéré"
- "Email de test envoyé à [contact.email]"

### todo to run the tests
1. Create a test contact in Parse with email address
2. Call Cloud Function:
   ```javascript
   Parse.Cloud.run('sendSequenceTest', {
     sequenceId: 'testSequence123',
     emailIndex: 0,
     contactId: 'testContact456'
   }, { useMasterKey: true })
   ```
3. Verify email is sent to contact's email

## scenario3: Missing required parameters
### input data
- Missing sequenceId or emailIndex

### expecting console log output in the log file
- "Paramètres manquants" or "sequenceId requis" or "emailIndex requis"

### todo to run the tests
1. Call Cloud Function with missing parameters:
   ```javascript
   Parse.Cloud.run('sendSequenceTest', {
     emailIndex: 0,
     testEmail: 'test@example.com'
   }, { useMasterKey: true })
   ```
2. Verify appropriate error is returned

## scenario4: Invalid sequence or email index
### input data
- Invalid sequenceId or emailIndex out of bounds

### expecting console log output in the log file
- "Séquence introuvable" or "Scénario introuvable"

### todo to run the tests
1. Call Cloud Function with invalid sequenceId:
   ```javascript
   Parse.Cloud.run('sendSequenceTest', {
     sequenceId: 'invalid123',
     emailIndex: 0,
     testEmail: 'test@example.com'
   }, { useMasterKey: true })
   ```
2. Verify error is returned

## scenario5: LLM content generation
### input data
- Valid sequence with template containing unreplaced variables
- USE_OLLAMA=true

### expecting console log output in the log file
- "Génération LLM pour variables non remplacées"
- "Contenu généré avec LLM"
- "Correction orthographique appliquée"

### todo to run the tests
1. Create sequence with template containing complex variables
2. Set USE_OLLAMA=true
3. Set OLLAMA_API_URL and OLLAMA_API_KEY
4. Call Cloud Function with test parameters
5. Verify LLM generates appropriate content
