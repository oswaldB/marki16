# Technical Guide: send-emails Workflow

## Overview
This workflow orchestrates the sending of reminder emails that have been generated and are ready to be sent. It is a **single-step process** that handles email delivery with attachments.

## Purpose
Send reminder emails to contacts for unpaid invoices, including:
- Email delivery via SMTP
- PDF invoice attachments (downloaded from SFTP)
- ZIP creation for multiple attachments
- Status tracking and logging

---

## Invocation Methods (Comment ce workflow est appelé)

### 1. Direct CLI Execution (Primary Method)
**Command**: 
```bash
cd /home/ubuntu/prod/adti/backend/cloud/workflows/send-emails
node 00-master.js
```

**Trigger**: `"manual"` (default)

**Use Case**: Manual execution for sending queued emails

---

### 2. Programmatic Import
**Usage**:
```javascript
const sendEmailsMaster = require('./send-emails/00-master');

await sendEmailsMaster({ trigger: 'manual' });
```

**Use Case**: Can be called by other workflows or scripts

---

### 3. With Specific Relance IDs
**Usage**:
```javascript
const sendEmailsMaster = require('./send-emails/00-master');

await sendEmailsMaster({ 
  trigger: 'manual',
  relanceIds: ['relance1', 'relance2', ...] 
});
```

**Use Case**: Send only specific reminders

---

## Complete Flow: From Invocation to Output

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVOCATION POINT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────┐                          │
│  │ CLI Execution        │  │ Programmatic Call   │                          │
│  │ node 00-master.js    │  │ require('./00-      │                          │
│  │                     │  │ master').default()  │                          │
│  └──────────┬──────────┘  └──────────┬──────────┘                          │
└─────────────┼──────────────────────────┼──────────────────────────┘          │
              └──────────────────────────┼──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTRY POINT: 00-master.js                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Load environment variables from .env                                     │
│  2. Initialize Parse SDK (if not already initialized)                         │
│  3. If options.trigger !== "test": clearLogs()                              │
│  4. Log workflow start with trigger type                                     │
│     Log: "🚀 DÉBUT: send-emails (trigger: {options.trigger || 'manual'})"       │
│  5. Initialize stats object                                                   │
│     └─ stats = {                                                             │
│           result: null,                                                     │
│           errors: [],                                                       │
│           total: { startedAt, finishedAt, durationMs }                      │
│         }                                                                   │
│  6. Execute sendEmailsMaster() function                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STEP 1: Send Emails (01-envoyerRelances.js)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: { trigger?: string, relanceIds?: string[] } (from master)             │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.1 Setup and Configuration:                                          │   │
│  │     - MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024 (10MB)                     │   │
│  │     - TEMP_DIR = "/tmp/adti-invoices"                                   │   │
│  │     - PUBLIC_DOWNLOAD_URL = env.PUBLIC_DOWNLOAD_URL ||                 │   │
│  │       "http://localhost:1555/download/invoices"                          │   │
│  │     - Ensure TEMP_DIR exists (create if not)                            │   │
│  │     - Initialize Nodemailer transporter:                               │   │
│  │         transporter = nodemailer.createTransport({                     │   │
│  │           host: process.env.SMTP_HOST,                                  │   │
│  │           port: process.env.SMTP_PORT,                                  │   │
│  │           secure: process.env.SMTP_SECURE === 'true',                   │   │
│  │           auth: {                                                      │   │
│  │             user: process.env.SMTP_USER,                               │   │
│  │             pass: process.env.SMTP_PASS                                │   │
│  │           }                                                            │   │
│  │         })                                                             │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.2 Query Relance objects from Parse:                                 │   │
│  │     IF relanceIds provided:                                           │   │
│  │        Query: { objectId IN relanceIds }                                │   │
│  │     ELSE:                                                             │   │
│  │        Query: { statut: "pret pour envoi" }                             │   │
│  │     Common parameters:                                                │   │
│  │        - limit: 9999                                                   │   │
│  │        - include: ["contact", "sequence", "impayes"]                   │   │
│  │     Log: "Étape 1: {relances.length} relances en attente de traitement"│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.3 Initialize result stats:                                          │   │
│  │     result = {                                                        │   │
│  │       relancesEnvoyees: 0,                                           │   │
│  │       relancesErreurs: 0,                                            │   │
│  │       erreurs: []                                                    │   │
│  │     }                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1.4 For EACH relance found:                                           │   │
│  │      ┌───────────────────────────────────────────────────────────┐   │   │
│  │      │ a. Validation:                                               │   │   │
│  │      │    - Get contact = relance.get("contact")                     │   │   │
│  │      │    - Get contactEmail = contact?.get("email")                 │   │   │
│  │      │    - Get impayes = relance.get("impayes") || []               │   │   │
│  │      │    IF !contact OR !contactEmail:                              │   │   │
│  │      │       Log warning: "Relance {id}: pas d'email de contact"      │   │   │
│  │      │       Add to result.erreurs: { relanceId, erreur: "..." }      │   │   │
│  │      │       Increment result.relancesErreurs                          │   │   │
│  │      │       Continue to next relance                                  │   │   │
│  │      │    IF impayes.length === 0:                                     │   │   │
│  │      │       Log warning: "Relance {id}: pas d'impayés"                │   │   │
│  │      │       Add to result.erreurs                                    │   │   │
│  │      │       Increment result.relancesErreurs                          │   │   │
│  │      │       Continue to next relance                                  │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ b. Prepare email data:                                        │   │   │
│  │      │    - from = process.env.SMTP_FROM || "noreply@adti.com"       │   │   │
│  │      │    - to = contactEmail                                         │   │   │
│  │      │    - subject = relance.get("objet") || "Relance d'impayé"       │   │   │
│  │      │    - html = relance.get("corps") || "<p>Contenu...</p>"        │   │   │
│  │      │    - replyTo = process.env.REPLY_TO_EMAIL (if set)            │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ c. Process PDF attachments:                                   │   │   │
│  │      │    - pdfPaths = []                                              │   │   │
│  │      │    - For EACH impayeId in impayes:                              │   │   │
│  │      │        Get impaye = await Impaye.query.get(impayeId)           │   │   │
│  │      │        Get sftpPath = impaye.get("pdf_path") || impaye.get("chemin_pdf")│   │   │
│  │      │        IF sftpPath:                                             │   │   │
│  │      │           Try: localPath = await downloadPdfFromSftp(sftpPath)│   │   │
│  │      │           Catch: log warning, continue without this PDF        │   │   │
│  │      │           IF localPath: pdfPaths.push(localPath)               │   │   │
│  │      │        ELSE:                                                   │   │   │
│  │      │           Log: "Pas de PDF pour impayé {impayeId}"              │   │   │
│  │      │    - IF pdfPaths.length === 0:                                  │   │   │
│  │      │         attachments = []                                         │   │   │
│  │      │      ELSE IF pdfPaths.length === 1:                             │   │   │
│  │      │         attachments = [{ path: pdfPaths[0] }]                   │   │   │
│  │      │      ELSE (multiple PDFs):                                      │   │   │
│  │      │         - Generate unique ZIP filename:                          │   │   │
│  │      │             zipFilename = `invoices_${contactEmail}_${Date.now()}.zip`│   │   │
│  │      │         - Create ZIP: zipPath = await createZipFromPdfs(pdfPaths,│   │   │
│  │      │                                          path.join(TEMP_DIR, zipFilename))│   │   │
│  │      │         - Generate download token: token = generateDownloadToken()│   │   │
│  │      │         - Upload to SFTP (optional):                            │   │   │
│  │      │             remotePath = `/downloads/${token}/${zipFilename}`   │   │   │
│  │      │             await uploadToSftp(zipPath, remotePath)              │   │   │
│  │      │         - attachments = [{ path: zipPath }]                     │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ d. Build email options:                                        │   │   │
│  │      │    emailOptions = {                                             │   │   │
│  │      │      from: from,                                               │   │   │
│  │      │      to: to,                                                   │   │   │
│  │      │      subject: subject,                                          │   │   │
│  │      │      html: html,                                                │   │   │
│  │      │      attachments: attachments,                                   │   │   │
│  │      │      replyTo: replyTo                                          │   │   │
│  │      │    }                                                                 │   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ e. Send email:                                                │   │   │
│  │      │    Try:                                                        │   │   │
│  │      │       info = await transporter.sendMail(emailOptions)        │   │   │
│  │      │       Log: "Email envoyé à {to} - Relance {relance.id}"         │   │   │
│  │      │       Update relance:                                          │   │   │
│  │      │         - statut = "Envoyée"                                    │   │   │
│  │      │         - dateEnvoi = new Date()                                │   │   │
│  │      │         - emailSent = true                                      │   │   │
│  │      │       Save to Parse: await relance.save(null, {useMasterKey:true})│   │   │
│  │      │       Increment result.relancesEnvoyees                         │   │   │
│  │      │    Catch (error):                                               │   │   │
│  │      │       Log error: "Erreur envoi email à {to}: {error.message}"│   │   │
│  │      │       Update relance:                                          │   │   │
│  │      │         - statut = "Erreur d'envoi"                             │   │   │
│  │      │         - lastError = error.message                              │   │   │
│  │      │       Save to Parse                                             │   │   │
│  │      │       Add to result.erreurs: { relanceId, erreur: error.message }│   │   │
│  │      │       Increment result.relancesErreurs                          │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  │      ├───────────────────────────────────────────────────────────┤   │   │
│  │      │ f. Cleanup temporary files:                                   │   │   │
│  │      │    - For EACH path in pdfPaths:                                  │   │   │
│  │      │        Try: fs.unlinkSync(path)                                 │   │   │
│  │      │        Catch: log warning (cleanup error)                       │   │   │
│  │      │    - If zipPath exists: fs.unlinkSync(zipPath)                 │   │   │
│  │      └───────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│  OUTPUT: { relancesEnvoyees: number, relancesErreurs: number, erreurs: [...] }│
└─────────────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FINAL OUTPUT                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Return: {                                                                  │
│    result: {    // From Step 1 (envoyerRelances)                            │
│      relancesEnvoyees: number,  // Successfully sent emails                 │
│      relancesErreurs: number,   // Failed to send                            │
│      erreurs: [                // Detailed errors                            │
│        { relanceId: string, erreur: string },                              │
│        ...                                                               │
│      ]                                                                     │
│    },                                                                     │
│    errors: [...],       // Errors from master workflow                     │
│    total: {             // From master workflow                            │
│      startedAt: Date,                                                     │
│      finishedAt: Date,                                                    │
│      durationMs: number                                                  │
│    }                                                                     │
│  }                                                                     │
│                                                                             │
│  SUCCESS: All relances with statut="pret pour envoi" have been processed:   │
│          - relancesEnvoyees emails sent successfully                       │
│          - relancesErreurs emails failed (marked as "Erreur d'envoi")        │
│          - Temporary files cleaned up                                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## States

### Workflow States
- **Initializing**: Loading configuration and clearing logs
- **Step 1 Running**: Email sending in progress
- **Completed**: All emails sent successfully
- **Error**: Workflow failed at some step

### Relance (Reminder) States
- **pret pour envoi** (Ready for sending): Initial state for this workflow
- **Envoyée** (Sent): Email has been successfully sent
- **Erreur d'envoi** (Sending error): Email sending failed

### Email Sending States
- **Queued**: Email is in the sending queue
- **Sending**: Email is being processed
- **Sent**: Email delivered successfully
- **Failed**: Email delivery failed
- **Skipped**: Email was bypassed

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
   - Executes single step

3. **Step Coordination**:
   - **Step 1**: Calls `envoyerRelances(options)` function
   - Collects statistics from step

4. **Result Handling**:
   - Logs success/failure
   - Calculates total duration
   - Returns aggregated statistics

5. **Trigger Support**:
   - **CLI Execution**: Direct execution via `node 00-master.js`
   - **Manual Trigger**: Can be called programmatically

---

### Node 1: Email Sending Engine (01-envoyerRelances.js)
**File**: `01-envoyerRelances.js`

**Actions**:

#### Phase 1: Setup and Configuration
1. **Initialization**:
   - Ensures Parse SDK is available
   - Loads configuration:
     - `MAX_ATTACHMENT_SIZE`: 10MB
     - `TEMP_DIR`: "/tmp/adti-invoices"
     - `PUBLIC_DOWNLOAD_URL`: Base URL for invoice downloads
   - Creates temp directory if it doesn't exist

2. **SMTP Transporter Setup**:
   - Creates Nodemailer transporter with configuration:
     - `SMTP_HOST`
     - `SMTP_PORT`
     - `SMTP_SECURE` (true/false)
     - `SMTP_USER`
     - `SMTP_PASS`
     - `SMTP_FROM` (default email address)

#### Phase 2: Query Relances
3. **Query Execution**:
   - Queries `Relance` class with filters:
     - `statut: "pret pour envoi"`
     - Limit: 9999
     - Includes: `["contact", "sequence", "impayes"]`
   - Optionally filters by specific relance IDs if provided

#### Phase 3: Process Each Relance
4. **For each relance found**:
   
   a. **Validation**:
      - Checks if relance has required fields
      - Checks if contact has email address
      - If invalid → skip with warning
   
   b. **Data Preparation**:
      - Gets contact email from relance
      - Gets impayes from relance
      - Gets sequence from relance
   
   c. **PDF Attachment Handling**:
      - For each impaye:
        - Checks if PDF path exists
        - If SFTP path provided:
          - Downloads PDF from SFTP using `downloadPdfFromSftp()`
          - Handles errors gracefully
        - Collects all PDF paths
   
   d. **ZIP Creation (if multiple PDFs)**:
      - If more than one PDF:
        - Creates ZIP archive using `archiver`
        - Generates unique filename with contact info
        - Saves to temp directory
        - Generates download token
        - Uploads to SFTP (optional)
        - Attaches ZIP to email
      - If single PDF:
        - Attaches PDF directly
   
   e. **Email Construction**:
      - Sets email options:
        - `from`: SMTP_FROM or sequence default
        - `to`: Contact email
        - `subject`: Relance objet
        - `html`: Relance corps
        - `attachments`: PDF(s) or ZIP
      - Adds reply-to if configured
   
   f. **Email Sending**:
      - Calls `transporter.sendMail()`
      - Handles success:
        - Updates relance `statut` to "Envoyée"
        - Sets `dateEnvoi` to current date
        - Sets `emailSent` to true
        - Saves to Parse
        - Increments `stats.relancesEnvoyees`
        - Logs success
      - Handles failure:
        - Updates relance `statut` to "Erreur d'envoi"
        - Adds error message to relance
        - Saves to Parse
        - Increments `stats.relancesErreurs`
        - Logs error
   
   g. **Cleanup**:
      - Removes temporary files (PDFs, ZIPs)
      - Handles cleanup errors gracefully

#### Phase 4: Helper Functions

**`generateDownloadToken()`**:
- Generates unique 32-byte hex token
- Used for secure download links

**`downloadPdfFromSftp(sftpPath)`**:
- Connects to SFTP server using credentials:
  - `FTP_HOST`
  - `FTP_PORT` (default: 2222)
  - `FTP_USERNAME`
  - `FTP_PASSWORD`
- Downloads file to temp directory
- Returns local path
- Handles errors and cleanup

**`createZipFromPdfs(pdfPaths, outputPath)`**:
- Creates ZIP archive from multiple PDFs
- Uses `archiver` library
- Returns path to ZIP file

**`uploadToSftp(localPath, remotePath)`**:
- Uploads file to SFTP server
- Returns remote path
- Handles errors

---

## Data Flow Diagram

```
Trigger (manual/cli)
       ↓
[Master: Clear logs]
       ↓
[Master: Initialize stats]
       ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: envoyerRelances()                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Setup:                                                   │ │
│ │ - Initialize Nodemailer transporter                       │ │
│ │ - Create temp directory if needed                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Query: Relance with statut="pret pour envoi"             │ │
│ │         include=[contact, sequence, impayes]              │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ [For each relance]                                          │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Validate relance has     │                                │
│ │ contact with email       │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Get contact email,       │                                │
│ │ impayes, sequence        │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ For each impaye:         │                                │
│ │   Download PDF from      │                                │
│ │   SFTP if needed         │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ If multiple PDFs:        │                                │
│ │   Create ZIP archive     │                                │
│ │   Upload to SFTP          │                                │
│ │ Else:                    │                                │
│ │   Use single PDF         │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Build email: from, to, subject, html, attachments        │ │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ Send email via           │                                │
│ │ Nodemailer               │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ ┌─────────────────────────┐                                │
│ │ IF SUCCESS:              │                                │
│ │   Update relance:        │                                │
│ │   statut="Envoyée",      │                                │
│ │   dateEnvoi=now,         │                                │
│ │   emailSent=true         │                                │
│ │   Increment success      │                                │
│ │ ELSE:                   │                                │
│ │   Update relance:        │                                │
│ │   statut="Erreur        │                                │
│ │   d'envoi",             │                                │
│ │   error=message          │                                │
│ │   Increment errors       │                                │
│ └─────────────────────────┘                                │
│         ↓                                                    │
│ Cleanup temp files                                          │
└─────────────────────────────────────────────────────────────┘
       ↓
[Master: Collect stats]
       ↓
[Master: Calculate total duration]
       ↓
Return aggregated statistics
```

---

## Key Functions

### Master Level
- `sendEmailsMaster(options)` - Main orchestrator
- Returns: `{ stats }`

### Step 1 Level
- `envoyerRelances(options)` - Main email sending function
- Returns: `{ relancesEnvoyees, relancesErreurs, erreurs }`

---

## Error Handling

### Validation Errors
- **No contact email**: Logged as warning, relance skipped
- **No impayes**: Logged as warning, relance skipped
- **Invalid data**: Logged as warning, relance skipped

### PDF Download Errors
- **SFTP connection failed**: Logged, continues with other attachments
- **File not found**: Logged, continues without that attachment
- **Download timeout**: Logged, continues without that attachment

### Email Sending Errors
- **SMTP connection failed**: Caught, logged, relance marked as error
- **Authentication failed**: Caught, logged, relance marked as error
- **Invalid email address**: Caught, logged, relance marked as error
- **Attachment too large**: Caught, logged, relance marked as error
- **Network errors**: Caught, logged, relance marked as error

### Cleanup Errors
- **File deletion failed**: Logged but doesn't prevent workflow completion

---

## Configuration

### Environment Variables

```bash
# Parse Configuration
PARSE_APP_ID=
PARSE_JAVASCRIPT_KEY=
PARSE_MASTER_KEY=
PARSE_SERVER_URL=

# SMTP Configuration
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=true/false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="noreply@adti.com"

# SFTP Configuration (for PDF downloads)
FTP_HOST=
FTP_PORT=2222
FTP_USERNAME=
FTP_PASSWORD=

# General Configuration
PUBLIC_DOWNLOAD_URL=http://localhost:1555/download/invoices
MAX_ATTACHMENT_SIZE=10485760  # 10MB in bytes
TEMP_DIR=/tmp/adti-invoices

# Optional
REPLY_TO_EMAIL=reply@adti.com
```

---

## Dependencies

### Internal
- `../../utils/logger` - For info, warn, error logging

### External
- `parse/node` - Parse SDK for database operations
- `nodemailer` - Email sending library
- `ssh2-sftp-client` - SFTP client for PDF downloads
- `archiver` - ZIP creation library
- `crypto` - For token generation
- `fs` - File system operations
- `path` - Path manipulation
- `dotenv` - Environment variable loading

---

## Performance Considerations

1. **Query Limits**: Uses limit 9999 (effectively unlimited)
2. **Batch Processing**: Processes relances sequentially
3. **Attachment Size**: Limited to 10MB per attachment
4. **Temp Files**: Created and cleaned up for each relance
5. **SFTP Connections**: New connection for each PDF download
6. **Memory**: All relances loaded into memory at once

---

## Security Considerations

1. **Credentials**: All credentials loaded from environment variables
2. **Temp Files**: Created with restricted permissions (0o777 for directory)
3. **Download Tokens**: Unique tokens generated for each download
4. **Cleanup**: Temporary files removed after use
5. **Error Handling**: Sensitive errors logged without exposing credentials

---

## Testing Notes

- Mock SMTP server for testing email sending
- Mock SFTP server for testing PDF downloads
- Test with various attachment scenarios (0, 1, multiple PDFs)
- Test error scenarios (invalid emails, missing PDFs, etc.)
- Verify temp file cleanup

---

## File Structure

```
send-emails/
├── 00-master.js              # Main orchestrator
├── 01-envoyerRelances.js     # Step 1: Email sending engine
├── logs/                     # Runtime logs
└── specs/
    └── technical-guide.md    # This file
```
