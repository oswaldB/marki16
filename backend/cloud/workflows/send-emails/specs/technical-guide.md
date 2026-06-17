# Objectifs
- Envoyer les emails de relance qui ont été générés et sont prêts à être envoyés
- Gérer la livraison des emails via SMTP
- Joindre les factures en PDF (téléchargées depuis SFTP)
- Créer des archives ZIP pour les pièces jointes multiples
- Suivre l'état et journaliser les opérations

# Start
## route
- CLI: `node 00-master.js`
- Programmatic: `require('./send-emails/00-master')`
- With specific relance IDs: `sendEmailsMaster({ trigger: 'manual', relanceIds: ['relance1', 'relance2', ...] })`

## entry data
- Optional parameters:
  - `trigger`: string (default: "manual")
  - `relanceIds`: string[] (optional) - Specific relance IDs to send
- Requires: None (uses masterKey internally)

# Process

## node 0: Master Orchestrator (00-master.js)
### input
- `options`: object with trigger and relanceIds

### operations
1. Load environment variables from .env
2. Initialize Parse SDK (if not already initialized)
3. If options.trigger !== "test": clearLogs()
4. Log workflow start with trigger type: "🚀 DÉBUT: send-emails (trigger: {options.trigger || 'manual'})"
5. Initialize stats object:
   ```javascript
   stats = { 
     result: null,
     errors: [], 
     total: { startedAt, finishedAt, durationMs }
   }
   ```
6. Execute sendEmailsMaster() function

### output
- `{ stats }`

## node 1: Email Sending Engine (01-envoyerRelances.js)
### input
- `options`: object with trigger and relanceIds (from master)

### operations
1. Setup and Configuration:
   - MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 (10MB)
   - TEMP_DIR = "/tmp/adti-invoices"
   - PUBLIC_DOWNLOAD_URL = env.PUBLIC_DOWNLOAD_URL || "http://localhost:1555/download/invoices"
   - Ensure TEMP_DIR exists (create if not)
   - Initialize Nodemailer transporter:
     ```javascript
     transporter = nodemailer.createTransport({
       host: process.env.SMTP_HOST,
       port: process.env.SMTP_PORT,
       secure: process.env.SMTP_SECURE === 'true',
       auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
     })
     ```

2. Query Relance objects from Parse:
   - IF relanceIds provided: Query: `{ objectId IN relanceIds }`
   - ELSE: Query: `{ statut: "pret pour envoi" }`
   - Common parameters:
     - limit: 9999
     - include: `["contact", "sequence", "impayes"]`

3. Initialize result stats:
   ```javascript
   result = {
     relancesEnvoyees: 0,
     relancesErreurs: 0,
     erreurs: []
   }
   ```

4. For each relance found:
   a. Validation:
      - Get contact = relance.get("contact")
      - Get contactEmail = contact?.get("email")
      - Get impayes = relance.get("impayes") || []
      - IF !contact OR !contactEmail: log warning, add to result.erreurs, increment result.relancesErreurs, continue
      - IF impayes.length === 0: log warning, add to result.erreurs, increment result.relancesErreurs, continue
   
   b. Prepare email data:
      - from = process.env.SMTP_FROM || "noreply@adti.com"
      - to = contactEmail
      - subject = relance.get("objet") || "Relance d'impayé"
      - html = relance.get("corps") || "<p>Contenu...</p>"
      - replyTo = process.env.REPLY_TO_EMAIL (if set)
   
   c. Process PDF attachments:
      - pdfPaths = []
      - For each impayeId in impayes:
        - Get impaye = await Impaye.query.get(impayeId)
        - Get sftpPath = impaye.get("pdf_path") || impaye.get("chemin_pdf")
        - IF sftpPath:
          - Try: localPath = await downloadPdfFromSftp(sftpPath)
          - Catch: log warning, continue without this PDF
          - IF localPath: pdfPaths.push(localPath)
        - ELSE: log "Pas de PDF pour impayé [impayeId]"
      - IF pdfPaths.length === 0: attachments = []
      - ELSE IF pdfPaths.length === 1: attachments = [{ path: pdfPaths[0] }]
      - ELSE (multiple PDFs):
        1. Generate unique ZIP filename: zipFilename = `invoices_${contactEmail}_${Date.now()}.zip`
        2. Create ZIP: zipPath = await createZipFromPdfs(pdfPaths, path.join(TEMP_DIR, zipFilename))
        3. Generate download token: token = generateDownloadToken()
        4. Upload to SFTP (optional): remotePath = `/downloads/${token}/${zipFilename}`, await uploadToSftp(zipPath, remotePath)
        5. attachments = [{ path: zipPath }]
   
   d. Build email options:
     ```javascript
     emailOptions = {
       from: from,
       to: to,
       subject: subject,
       html: html,
       attachments: attachments,
       replyTo: replyTo
     }
     ```
   
   e. Send email:
      - Try:
        - info = await transporter.sendMail(emailOptions)
        - Log: "Email envoyé à {to} - Relance {relance.id}"
        - Update relance:
          - statut = "Envoyée"
          - dateEnvoi = new Date()
          - emailSent = true
        - Save to Parse: await relance.save(null, {useMasterKey:true})
        - Increment result.relancesEnvoyees
      - Catch (error):
        - Log error: "Erreur envoi email à {to}: {error.message}"
        - Update relance:
          - statut = "Erreur d'envoi"
          - lastError = error.message
        - Save to Parse
        - Add to result.erreurs: { relanceId, erreur: error.message }
        - Increment result.relancesErreurs
   
   f. Cleanup temporary files:
      - For each path in pdfPaths: Try: fs.unlinkSync(path), Catch: log warning
      - If zipPath exists: fs.unlinkSync(zipPath)

### output
- `{ relancesEnvoyees: number, relancesErreurs: number, erreurs: [...] }`

# end
## results
- All relances with statut="pret pour envoi" have been processed
- relancesEnvoyees emails sent successfully
- relancesErreurs emails failed (marked as "Erreur d'envoi")
- Temporary files cleaned up
- Return: `{ result: { relancesEnvoyees, relancesErreurs, erreurs }, errors, total }`

# Scenarios to test

## scenario1: Basic email sending with single PDF
### input data
- Parse with Relance objects in "pret pour envoi" state
- Relance objects have valid contact with email
- Relance objects have impayes with valid PDF paths
- SFTP server accessible with PDF files

### expecting console log output in the log file
- "Étape 1: X relances en attente de traitement"
- "Email envoyé à [email] - Relance [id]"
- "Relance [id] marquée comme Envoyée"

### todo to run the tests
1. Create test Relance objects in Parse with statut="pret pour envoi"
2. Ensure Relance objects have valid contact with email
3. Ensure Relance objects have impayes with pdf_path or chemin_pdf
4. Set up mock SFTP server with test PDF files
5. Set SMTP configuration
6. Run: `node 00-master.js`
7. Verify emails are sent successfully
8. Verify relance statut changes to "Envoyée"

## scenario2: Email sending with multiple PDFs (ZIP)
### input data
- Parse with Relance objects with multiple impayes
- Each impaye has valid PDF path

### expecting console log output in the log file
- "Création de l'archive ZIP pour [X] PDFs"
- "Archive ZIP créée: [path]"
- "Email envoyé avec pièce jointe ZIP"

### todo to run the tests
1. Create test Relance objects with multiple impayes
2. Ensure each impaye has valid PDF path
3. Set up mock SFTP server with multiple PDF files
4. Run: `node 00-master.js`
5. Verify ZIP archive is created
6. Verify email is sent with ZIP attachment

## scenario3: Email sending failure
### input data
- Parse with Relance objects
- Invalid SMTP configuration or unreachable SMTP server

### expecting console log output in the log file
- "Erreur envoi email à [email]: [error message]"
- "Relance [id] marquée comme Erreur d'envoi"

### todo to run the tests
1. Create test Relance objects
2. Set invalid SMTP configuration
3. Run: `node 00-master.js`
4. Verify emails fail to send
5. Verify relance statut changes to "Erreur d'envoi"
6. Verify error is logged

## scenario4: Missing contact or email
### input data
- Parse with Relance objects without valid contact or email

### expecting console log output in the log file
- "Relance [id]: pas d'email de contact"

### todo to run the tests
1. Create test Relance objects without contact or with contact without email
2. Run: `node 00-master.js`
3. Verify relances are skipped with appropriate warnings

## scenario5: No PDF attachments
### input data
- Parse with Relance objects with impayes that have no PDF paths

### expecting console log output in the log file
- "Pas de PDF pour impayé [id]"
- "Email envoyé sans pièce jointe"

### todo to run the tests
1. Create test Relance objects with impayes without pdf_path or chemin_pdf
2. Run: `node 00-master.js`
3. Verify emails are sent without attachments

## scenario6: Specific relance IDs
### input data
- Valid relanceIds array

### expecting console log output in the log file
- "Traitement des relances spécifiques: [ids]"
- Same logs as basic email sending

### todo to run the tests
1. Create test Relance objects
2. Run with specific IDs:
   ```javascript
   const sendEmailsMaster = require('./send-emails/00-master');
   await sendEmailsMaster({ 
     trigger: 'manual',
     relanceIds: ['relance1', 'relance2'] 
   });
   ```
3. Verify only specified relances are processed
