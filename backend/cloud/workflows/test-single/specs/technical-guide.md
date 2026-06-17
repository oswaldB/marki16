# Objectifs
- Envoyer un email de test unique pour vérifier les configurations d'email
- Tester les modèles d'emails avec des données réelles de payeur
- Vérifier que le remplacement des variables fonctionne correctement
- Vérifier que la livraison des emails fonctionne comme prévu
- Appelé depuis le frontend (SingleEmailTestSlideover.vue)

# Start
## route
- Cloud Function: `Parse.Cloud.run("testSingleEmail")`

## entry data
- Required parameters:
  - `sequenceId`: string - The sequence to test (from props.sequence.id in frontend)
  - `testEmail`: string - Recipient email address for the test (entered manually by user)
  - `payeurId`: string - Contact ID of the payer to use for data (selected from payeurs list)
  - `emailIndex`: number - Index of the email in the sequence to test (from props.emailIndex in frontend)
  - `payeurData`: object - Payer data **preloaded from frontend** with: nom, email, impayesCount, impayesAmount
- Optional parameters (auto-extracted from currentUser):
  - `userId`: string - Current user ID
  - `userEmail`: string - Current user email
  - `userName`: string - Current user name
- Requires: Authenticated user session (user data extracted automatically)

# Process

## node 0: Master/Cloud Function Registrar (00-master.js)
### input
- None (initialization only)

### operations
1. Load environment variables from .env
2. Initialize Parse SDK (if not already initialized)
3. Clear logs directory
4. Log workflow start: "DÉBUT: test-single - Enregistrement..."
5. Import testSingleEmail function from 01-testSingleEmail.js
6. Register Cloud Function: `Parse.Cloud.define("testSingleEmail", testSingleEmail)`
   - Uses `Parse.Cloud.useMasterKey()` to allow client calls without explicit master key
7. Log: "Cloud Function testSingleEmail enregistrée avec succès"
8. Export testSingleEmail function

### output
- Cloud Function registered and ready to receive requests

## node 1: Single Email Tester (01-testSingleEmail.js)
### input
- `request`: object with all parameters (sequenceId, testEmail, payeurId, payeurData, emailIndex, userId, userEmail, userName)

### operations
1. Validate request:
   - IF !request.sequenceId: Throw: "sequenceId est requis"
   - IF !request.testEmail: Throw: "testEmail est requis"
   - IF !request.payeurId: Throw: "payeurId est requis"
   - IF !request.emailIndex: Throw: "emailIndex est requis"

2. Extract parameters:
   - sequenceId = request.sequenceId
   - testEmail = request.testEmail
   - payeurId = request.payeurId
   - payeurData = request.payeurData
   - userId = request.userId
   - userEmail = request.userEmail
   - userName = request.userName

3. Fetch sequence and email data:
   - Query Sequence by ID: Class: Sequence, where: { objectId: sequenceId }
   - IF NOT FOUND: Throw: "Séquence introuvable"
   - Get emails from sequence.emails[emailIndex]
   - IF emailIndex >= emails.length: Throw: "emailIndex hors limites"
   - **Note**: Uses payeurData from request (NO DB QUERY for Contact/Impaye)

4. Prepare template data:
   - Get active scenario from emailToTest: scenarioActif = emailToTest.activeScenario || "single"
   - scenario = emailToTest.scenarios.find(s => s.format === scenarioActif)
   - Build templateVars with:
     - Payer variables: payeur_nom, payeur_email (from payeurData.nom and payeurData.email)
     - Impaye variables: impayesCount (from payeurData.impayesCount), impayesAmount (from payeurData.impayesAmount)
     - User variables: user_nom, user_email (from request.userName and request.userEmail)
     - Sequence variables: sequence_nom (from fetched sequence)
     - Date variable: date_du_jour (current date)

5. FIRST PASS: Replace [[variable]] syntax only
   - Uses custom replaceVariables() function
   - Replaces ONLY [[variable]] syntax (NOT <%= variable %>)
   - Processes both subject (objet) and body (corps)

6. Check for remaining [[variable]] or <%= variable %>:
   - IF USE_OLLAMA = true AND hasUnreplacedVariables(newSubject || newBody):
     - Proceed to LLM generation (Phase 7)
   - ELSE: Skip LLM, proceed to orthographic correction (if enabled)

7. LLM GENERATION (if unreplaced variables remain):
   - Builds prompt with context (payeur, sequence, user data)
   - Calls Ollama API to generate complete content
   - Replaces BOTH [[variable]] AND <%= variable %> syntax
   - IF LLM fails: Log warning, use content from first pass

8. Apply orthographic correction (if USE_OLLAMA = true):
   - Calls correctOrthographe() for subject and body
   - IF correction fails: Log warning, use uncorrected content

9. Setup Nodemailer transporter:
   ```javascript
   transporter = nodemailer.createTransport({
     host: process.env.SMTP_HOST,
     port: process.env.SMTP_PORT,
     secure: process.env.SMTP_SECURE === 'true',
     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
   })
   ```

10. Build email options:
    ```javascript
    emailOptions = {
      from: process.env.SMTP_FROM || "test@adti.com",
      to: testEmail,
      subject: newSubject,
      html: newBody,
      replyTo: process.env.REPLY_TO_EMAIL
    }
    ```

11. Send email:
    - Try:
      - info = await transporter.sendMail(emailOptions)
      - Log: "Email de test envoyé à {testEmail}"
      - Return: { success: true, message: "Email de test envoyé avec succès", to: testEmail, subject: newSubject, preview: newBody.substring(0, 200) + "...", timestamp: new Date().toISOString() }
    - Catch (error):
      - Log error: "Erreur envoi email de test: {error.message}"
      - Return: { success: false, message: "Échec de l'envoi de l'email de test", error: error.message, timestamp: new Date().toISOString() }

### output
- `{ success: boolean, message: string, to: string, subject: string, preview: string, timestamp: string, error?: string }`

# end
## results
- Test email sent successfully or error returned
- No production data modified
- Email content verified with real payer data
- Return: success/failure response with preview

# Scenarios to test

## scenario1: Basic single email test
### input data
- Valid sequenceId with emails array
- Valid emailIndex within bounds
- Valid testEmail address
- Valid payeurId with preloaded payeurData (nom, email, impayesCount, impayesAmount)
- Authenticated user session

### expecting console log output in the log file
- "DÉBUT: test-single"
- "Séquence [sequenceId] récupérée"
- "Scénario [emailIndex] trouvé"
- "Variables remplacées"
- "Email de test envoyé à [testEmail]"

### todo to run the tests
1. From frontend (SingleEmailTestSlideover.vue):
   - Open the slideover on /sequences/relances/[id] page
   - Select a payeur with active impayés
   - Enter test email address
   - Click "Tester cet email" button
2. Verify email is received at testEmail
3. Verify email content matches template with payeurData variables

## scenario2: Test with different email indices
### input data
- Valid sequenceId with multiple emails
- Different emailIndex values (0, 1, 2, etc.)

### expecting console log output in the log file
- "Test de l'email [index] de la séquence [sequenceId]"

### todo to run the tests
1. From frontend:
   - Select different email indices in the sequence
   - Run test for each index
2. Verify each email template is tested correctly

## scenario3: Missing required parameters
### input data
- Missing sequenceId, testEmail, payeurId, or emailIndex

### expecting console log output in the log file
- "sequenceId est requis" or "testEmail est requis" or "payeurId est requis" or "emailIndex est requis"

### todo to run the tests
1. Call Cloud Function with missing parameters:
   ```javascript
   Parse.Cloud.run('testSingleEmail', {
     testEmail: 'test@example.com',
     payeurId: 'contact123',
     emailIndex: 0
     // Missing sequenceId
   })
   ```
2. Verify appropriate error is thrown

## scenario4: Invalid sequence or email index
### input data
- Invalid sequenceId or emailIndex out of bounds

### expecting console log output in the log file
- "Séquence introuvable" or "emailIndex hors limites"

### todo to run the tests
1. Call Cloud Function with invalid sequenceId:
   ```javascript
   Parse.Cloud.run('testSingleEmail', {
     sequenceId: 'invalid123',
     testEmail: 'test@example.com',
     payeurId: 'contact123',
     emailIndex: 0
   })
   ```
2. Verify error is thrown

## scenario5: Variable replacement with payeurData
### input data
- Sequence with template containing variables like [[payeur_nom]], [[impayesCount]], etc.
- payeurData with all required fields

### expecting console log output in the log file
- "Remplacement des variables: [[payeur_nom]] -> [value]"
- "Email généré avec les données du payeur"

### todo to run the tests
1. Create sequence with template containing payeur variables
2. Select payeur with impayesCount and impayesAmount
3. From frontend, run test
4. Verify variables are replaced with payeurData values

## scenario6: LLM content generation
### input data
- Sequence with template containing complex variables or <%= syntax
- USE_OLLAMA=true
- payeurData with all required fields

### expecting console log output in the log file
- "Génération LLM pour variables non remplacées"
- "Contenu généré avec LLM"
- "Correction orthographique appliquée"

### todo to run the tests
1. Create sequence with complex template
2. Set USE_OLLAMA=true
3. Set OLLAMA_API_URL and OLLAMA_API_KEY
4. From frontend, run test
5. Verify LLM generates appropriate content

## scenario7: Frontend integration test
### input data
- Authenticated user session
- Valid sequence page open
- Payeurs with active impayés loaded

### expecting console log output in the log file
- "Cloud Function testSingleEmail enregistrée avec succès"
- "Test déclenché depuis le frontend"

### todo to run the tests
1. Log in to frontend application
2. Navigate to /sequences/relances/[id] page
3. Click "Tester cet email" button
4. Select a payeur from the list
5. Enter test email address
6. Click submit
7. Verify email is sent and received
8. Verify no errors in browser console or server logs
