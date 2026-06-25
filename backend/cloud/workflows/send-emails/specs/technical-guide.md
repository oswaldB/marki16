# Objectifs
- Envoyer les emails de relance qui ont été générés et sont prêts à être envoyés
- Gérer la livraison des emails via SMTP
- Suivre l'état et journaliser les opérations

# Data Model

## Relance
- `objectId`: string - Identifiant unique
- `statut`: string - État actuel (ex: "pret pour envoi", "Envoyée", "Erreur d'envoi")
- `dateEnvoi`: Date - Date d'envoi
- `objet`: string - Sujet de l'email
- `corps`: string - Contenu HTML de l'email
- `emailSent`: boolean - Indique si l'email a été envoyé
- `lastError`: string - Dernière erreur rencontrée
- `contact`: Pointer<Contact> - Contact associé
- `sequence`: Pointer<Sequence> - Séquence de relance
- `impayes`: Pointer<Impaye>[] - Liste des impayés
- `smtpProfil`: Pointer<SmtpProfil> - Profil SMTP à utiliser

## Contact
- `objectId`: string - Identifiant unique
- `email`: string - Adresse email du contact

## SmtpProfil
- `objectId`: string - Identifiant unique
- `host`: string - Hôte SMTP
- `port`: number - Port SMTP
- `secure`: boolean - Utilise TLS/SSL
- `user`: string - Utilisateur SMTP
- `pass`: string - Mot de passe SMTP
- `fromEmail`: string - Adresse email de l'expéditeur
- `replyToEmail`: string - Adresse email pour la réponse

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

## 00-master.js (Mega fonction)
### input
- `options`: object with trigger and relanceIds

### operations
1. Initialize Parse SDK (if not already initialized)
2. If options.trigger !== "test": clearLogs()
3. Log workflow start with trigger type: "🚀 DÉBUT: send-emails (trigger: {options.trigger || 'manual'})"
4. Initialize stats object:
   ```javascript
   stats = { 
     result: null,
     errors: [], 
     total: { startedAt, finishedAt, durationMs }
   }
   ```
5. Execute sendEmailsMaster() function:
   a. Setup and Configuration:
      - TEMP_DIR = "/tmp/adti-invoices" +> on en a besoin?
      - Ensure TEMP_DIR exists (create if not)
      - SMTP configuration is retrieved from the relance's `smtpProfil` (included in query)

   b. Query Relance objects from Parse:
      - IF relanceIds provided: Query: `{ objectId IN relanceIds }`
      - ELSE: Query: `{ statut: "pret pour envoi", dateEnvoi: { $eq: today } }` (today = start of current day)
      - Common parameters:
        - limit: 9999
        - include: `["contact", "sequence", "impayes", "smtpProfil"]`

   c. Initialize result stats:
      ```javascript
      result = {
        relancesEnvoyees: 0,
        relancesErreurs: 0,
        erreurs: []
      }
      ```

   d. For each relance found:
      - Validation:
         - Get contact = relance.get("contact")
         - Get contactEmail = contact?.get("email")
         - Get impayes = relance.get("impayes") || []
         - IF !contact OR !contactEmail: log warning, add to result.erreurs, increment result.relancesErreurs, continue
         - IF impayes.length === 0: log warning, add to result.erreurs, increment result.relancesErreurs, continue
      
      - Get SMTP profile and prepare email data:
         - smtpProfil = relance.get("smtpProfil")
         - from = smtpProfil.get("fromEmail") || smtpProfil.get("user")
         - to = contactEmail
         - subject = relance.get("objet") || "Relance d'impayé"
         - html = relance.get("corps") || "<p>Contenu...</p>"
         - replyTo = smtpProfil.get("replyToEmail") || null
      
      - Initialize Nodemailer transporter for this relance:
        ```javascript
        transporter = nodemailer.createTransport({
          host: smtpProfil.get("host"),
          port: smtpProfil.get("port"),
          secure: smtpProfil.get("secure") === true,
          auth: {
            user: smtpProfil.get("user"),
            pass: smtpProfil.get("pass")
          }
        })
        ```
      
      - Build email options:
        ```javascript
        emailOptions = {
          from: from,
          to: to,
          subject: subject,
          html: html,
          replyTo: replyTo
        }
        ```
      
      - Send email:
         - Try:
           - info = await transporter.sendMail(emailOptions)
           - Log: "Email envoyé à {to} - Relance {relance.id}"
           - Copy email to Sent folder via IMAP (if configured in smtpProfil):
              - Connect to IMAP server using smtpProfil credentials
              - Append sent email to "Sent" folder
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

### output
- `{ stats }`

# end
## results
- All relances with statut="pret pour envoi" have been processed
- relancesEnvoyees emails sent successfully
- relancesErreurs emails failed (marked as "Erreur d'envoi")
- Temporary files cleaned up
- Return: `{ result: { relancesEnvoyees, relancesErreurs, erreurs }, errors, total }`
