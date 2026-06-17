# Technical Guide: test-single Workflow

## Overview
This workflow provides a **Cloud Function** (`testSingleEmail`) for testing a single email by sending it to a specified recipient. It is similar to `send-sequence-test` but focuses on testing **individual emails** rather than entire sequences.

## Purpose
Send a single test email to verify:
- Email template content (from sequence emails).
- Variable replacement (using preloaded `payeurData` from frontend).
- Email delivery (via SMTP).
- Attachments (if any, though not currently implemented in this workflow).

This is useful for **quick testing of email configurations** directly from the sequence page (`/sequences/relances/[id]`), without going through the full sequence workflow.

**Key Difference from `send-sequence-test`**:
- Tests **one email at a time** (selected via `emailIndex`).
- Uses **real payer data** (preloaded from frontend) instead of test data.
- Triggered from the **SingleEmailTestSlideover** component.

---

## Invocation Methods (Comment ce workflow est appelé)

### 1. Cloud Function Trigger (Primary Method)
**Endpoint**: `Parse.Cloud.run("testSingleEmail")`
**Triggered from**: `SingleEmailTestSlideover.vue` (frontend component).

**How to Call** (depuis le frontend - SingleEmailTestSlideover.vue):
```javascript
// Appel réel depuis le frontend
// Note: Les paramètres userId, userEmail, userName sont extraits automatiquement depuis currentUser.
// payeurData est préchargé depuis la liste des payeurs avec impayés actifs.
Parse.Cloud.run('testSingleEmail', {
  sequenceId: 'sequence123',
  testEmail: 'developer@example.com',
  payeurId: 'contact456',
  payeurData: {
    nom: 'Jean Dupont',
    email: 'jean@exemple.com',
    impayesCount: 3,
    impayesAmount: 1500
  },
  emailIndex: 0,
  userId: 'user789',
  userEmail: 'user@adti.com',
  userName: 'Admin'
})
  .then(result => {
    console.log('Test email sent:', result);
  })
  .catch(error => {
    console.error('Test error:', error);
  });
```

**Authentication**:
- No `masterKey` required in client call (Cloud Function uses `Parse.Cloud.useMasterKey()` in 00-master.js).
- Requires **authenticated user session** (user data is extracted automatically via `currentUser`).
- Throws: Error if user session is invalid or missing.

**Parameters** (all required except user info):
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sequenceId` | string | **Yes** | ID of the sequence containing the email to test. Source: `props.sequence.id` in frontend. |
| `testEmail` | string | **Yes** | Recipient email address for the test. Entered manually by user in the slideover. |
| `payeurId` | string | **Yes** | Contact ID of the payer to use for data. Selected from the list of payeurs with active impayés. |
| `payeurData` | object | **Yes** | Payer data object **preloaded from frontend** with: `nom`, `email`, `impayesCount`, `impayesAmount`. |
| `emailIndex` | number | **Yes** | Index of the email in the sequence to test. Source: `props.emailIndex` in frontend. |
| `userId` | string | No | Current user ID (extracted from `currentUser.id` in frontend, for logging). |
| `userEmail` | string | No | Current user email (extracted from `currentUser.get('email')` in frontend, for logging). |
| `userName` | string | No | Current user name (extracted from `currentUser.get('username')` in frontend, for logging). |

---

### 2. Programmatic Import
**Usage**:
```javascript
const { testSingleEmail } = require('./test-single/00-master');

// Request object (same parameters as Cloud Function call)
const request = {
  sequenceId: 'sequence123',
  testEmail: 'developer@example.com',
  payeurId: 'contact456',
  payeurData: { nom: 'Test Payeur', email: 'test@exemple.com' },
  emailIndex: 0
};

testSingleEmail(request)
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

**Use Case**: Called from frontend via "Tester cet email" button on /sequences/relances/[id] page

---

## Complete Flow: From Invocation to Output

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVOCATION POINT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Cloud Function Call: Parse.Cloud.run("testSingleEmail", {           │   │
│  │   sequenceId: 'seq123',                                             │   │
│  │   testEmail: 'dev@example.com',                                     │   │
│  │   payeurId: 'contact456',                                           │   │
│  │   payeurData: {...},                                               │   │
│  │   emailIndex: 0                                                    │   │
│  │ })                                                                 │                                                  │
│  └──────────┬──────────┘                                                  │
└─────────────┼──────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ENTRY POINT: 00-master.js                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Load environment variables from .env                                     │
│  2. Initialize Parse SDK (if not already initialized)                         │
│  3. Clear logs directory                                                     │
│  4. Log workflow start: "DÉBUT: test-single - Enregistrement..."              │
│  5. Import testSingleEmail function from 01-testSingleEmail.js               │
│  6. Register Cloud Function: Parse.Cloud.define("testSingleEmail", ...)     │
│  7. Log: "Cloud Function testSingleEmail enregistrée avec succès"             │
│  8. Export testSingleEmail function                                         │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLOUD FUNCTION: testSingleEmail(request)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: request = { sequenceId, testEmail, payeurId, payeurData, emailIndex, ... }│
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Validate request:                                                   │   │
│  │     IF !request.sequenceId:                                           │   │
│  │        Throw: "sequenceId est requis"                                  │   │
│  │     IF !request.testEmail:                                            │   │
│  │        Throw: "testEmail est requis"                                   │   │
│  │     IF !request.payeurId:                                             │   │
│  │        Throw: "payeurId est requis"                                    │   │
│  │     IF !request.emailIndex:                                           │   │
│  │        Throw: "emailIndex est requis"                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2. Extract parameters:                                                │   │
│  │     - sequenceId = request.sequenceId                                 │   │
│  │     - testEmail = request.testEmail                                   │   │
│  │     - payeurId = request.payeurId                                     │   │
│  │     - payeurData = request.payeurData                                 │   │
│  │     - userId = request.userId                                         │   │
│  │     - userEmail = request.userEmail                                   │   │
│  │     - userName = request.userName                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3. Fetch sequence and email data:                                   │   │
│  │     Query Sequence by ID:                                             │   │
│  │       - Class: Sequence                                                │   │
│  │       - where: { objectId: sequenceId }                             │   │   │
│  │       IF NOT FOUND:                                                  │   │
│  │         Throw: "Séquence introuvable"                                  │   │
│  │     Get emails from sequence.emails[emailIndex]                      │   │
│  │     IF emailIndex >= emails.length:                  │   │   │
│  │         Throw: "emailIndex hors limites"                               │   │
│  │     Use payeurData from request (NO DB QUERY for Contact/Impaye)      │   │                     │   │   │
│  │        └─────────────────────────────────────────────────────────┘   │   │                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4. Prepare template data:                                             │   │
│  │     Get active scenario from emailToTest:                             │   │
│  │       scenarioActif = emailToTest.activeScenario || "single"           │   │
│  │       scenario = emailToTest.scenarios.find(s => s.format === scenarioActif)│   │
│  │     Build template variables from:                                    │   │
│  │       - payeur data (nom, email, impayesCount, impayesAmount)          │   │
│  │       - user data (nom, email)                                        │   │
│  │       - sequence data (nom)                                           │   │
│  │       - current date                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 5. FIRST PASS: Replace [[variable]] syntax only                        │   │
│  │     Uses custom replaceVariables() function                           │   │
│  │     Replaces ONLY [[variable]] syntax (NOT <%= variable %>)           │   │
│  │     Processes both subject (objet) and body (corps)                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 6. Check for remaining [[variable]] or <%= variable %>:               │   │
│  │     IF USE_OLLAMA = true AND hasUnreplacedVariables(newSubject || newBody):│   │
│  │        Proceed to LLM generation (Phase 4)                           │   │
│  │     ELSE:                                                             │   │
│  │        Skip LLM, proceed to orthographic correction (if enabled)      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 7. LLM GENERATION (if unreplaced variables remain):                  │   │
│  │     Builds prompt with context (payeur, sequence, user data)          │   │
│  │     Calls Ollama API to generate complete content                     │   │
│  │     Replaces BOTH [[variable]] AND <%= variable %> syntax              │   │
│  │     IF LLM fails: Log warning, use content from first pass            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 8. Apply orthographic correction (if USE_OLLAMA = true):             │   │
│  │     Calls correctOrthographe() for subject and body                  │   │
│  │     IF correction fails: Log warning, use uncorrected content        │                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 9. Setup Nodemailer transporter:                                     │   │
│  │      transporter = nodemailer.createTransport({                       │   │
│  │        host: process.env.SMTP_HOST,                                    │   │
│  │        port: process.env.SMTP_PORT,                                    │   │
│  │        secure: process.env.SMTP_SECURE === 'true',                     │   │
│  │        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }│   │
│  │      })                                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 10. Build email options:                                              │   │
│  │      emailOptions = {                                                 │   │
│  │        from: process.env.SMTP_FROM || "test@adti.com",                │   │
│  │        to: email,                                                     │   │
│  │        subject: newSubject,                                           │   │
│  │        html: newBody,                                                │   │
│  │        replyTo: process.env.REPLY_TO_EMAIL                           │   │
│  │      }                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 11. Send email:                                                       │   │
│  │      Try:                                                             │   │
│  │        info = await transporter.sendMail(emailOptions)                │   │
│  │        Log: "Email de test envoyé à {email}"                          │   │
│  │        Return: {                                                      │   │
│  │          success: true,                                               │   │
│  │          message: "Email de test envoyé avec succès",                 │   │
│  │          to: email,                                                  │   │
│  │          subject: newSubject,                                         │   │
│  │          preview: newBody.substring(0, 200) + "...",                 │   │
│  │          timestamp: new Date().toISOString()                          │   │
│  │        }                                                               │   │
│  │      Catch (error):                                                   │   │
│  │        Log error: "Erreur envoi email de test: {error.message}"        │   │
│  │        Return: {                                                      │   │
│  │          success: false,                                              │   │
│  │          message: "Échec de l'envoi de l'email de test",              │   │
│  │          error: error.message,                                        │   │
│  │          timestamp: new Date().toISOString()                          │   │
│  │        }                                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## States

### Workflow States
- **Initializing**: Loading configuration and registering Cloud Function
- **Ready**: Cloud Function registered and ready to receive requests
- **Processing**: Test email sending in progress
- **Completed**: Test email sent successfully
- **Error**: Test email sending failed

### Test Email States
- **Queued**: Test request received
- **Preparing**: Data being fetched and processed
- **Sending**: Email is being sent
- **Sent**: Test email delivered successfully
- **Failed**: Test email delivery failed

---

## Node Sequence

### Node 0: Master/Cloud Function Registrar (00-master.js)
**File**: `00-master.js`

**Actions**:
1. **Initialization**:
   - Loads environment variables from `.env`
   - Initializes Parse SDK if not already done
   - Clears logs directory

2. **Cloud Function Registration**:
   - Registers `testSingleEmail` Cloud Function with Parse
   - Uses `Parse.Cloud.useMasterKey()` to allow client calls without explicit master key.
   - Logs registration success

3. **Module Export**:
   - Exports `testSingleEmail` function for external use

**Key Characteristics**:
- This is a **passive** workflow - it only registers the Cloud Function.
- The actual logic is in `01-testSingleEmail.js`.
- No automatic execution - must be triggered via Cloud Function call from frontend (`SingleEmailTestSlideover.vue`).
- **Important**: Client calls (from frontend) do **not** need `useMasterKey: true` because it is already set in this file.

---

### Node 1: Single Email Tester (01-testSingleEmail.js)
**File**: `01-testSingleEmail.js`

**Actions**:

#### Phase 1: Input Validation
1. **Request Validation**:
   - Validates all required parameters are present:
     - `sequenceId` (required, from frontend `props.sequence.id`).
     - `testEmail` (required, entered manually by user).
     - `payeurId` (required, selected from payeurs list).
     - `emailIndex` (required, from frontend `props.emailIndex`).
     - `payeurData` (required, preloaded from frontend).

2. **Authentication Check**:
   - Relies on Parse Cloud Function authentication (master key already set in 00-master.js).
   - Requires authenticated user session (user data is passed from frontend).

#### Phase 2: Data Retrieval
3. **Fetch Sequence**:
   - Queries `Sequence` class by `sequenceId` (from `request.sequenceId`).
   - Gets all emails from sequence.
   - Validates `emailIndex` is within bounds (throws error if `emailIndex >= emails.length`).

4. **Use Preloaded Payer Data**:
   - **Does not query `Contact` or `Impaye` classes** (unlike backend workflows).
   - Uses `payeurData` **preloaded from frontend** (via `chargerPayeursAvecImpayes()` in `SingleEmailTestSlideover.vue`).
   - `payeurData` includes: `nom`, `email`, `impayesCount`, `impayesAmount`.

5. **Get Email Template**:
   - Extracts email at `emailIndex` from sequence.
   - Gets active scenario from email (`email.activeScenario || 'single'`).
   - Validates scenario exists in `email.scenarios`.

#### Phase 3: Variable Replacement
5. **Prepare Template Variables**:
   - Creates `templateVars` object with:
     - Payer variables: `payeur_nom`, `payeur_email` (from `payeurData.nom` and `payeurData.email`).
     - Impaye variables: `impayesCount` (from `payeurData.impayesCount`), `impayesAmount` (from `payeurData.impayesAmount`).
     - User variables: `user_nom`, `user_email` (from `request.userName` and `request.userEmail`).
     - Sequence variables: `sequence_nom` (from fetched sequence).
     - Date variable: `date_du_jour` (current date).

6. **First Pass: Replace [[variable]] Syntax**:
   - Uses custom `replaceVariables()` function.
   - **Only replaces `[[variable]]` syntax** in this first pass.
   - Processes both subject (`objet`) and body (`corps`).
   - **Note**: `<%= variable %>` syntax is **intentionally left untouched** for now.

7. **Check for Remaining Variables**:
   - After the first pass, checks if any `[[variable]]` or `<%= variable %>` remain in the template.
   - If **no unreplaced variables** remain:
     - Proceeds directly to **Phase 5: Orthographic Correction** (if `USE_OLLAMA=true`).
   - If **unreplaced variables** remain:
     - Proceeds to **Phase 4: LLM Content Generation**.

#### Phase 4: LLM Content Generation (Second Pass)
8. **Generate Content with LLM**:
   - **Only executed if `USE_OLLAMA=true` AND unreplaced variables remain** after Phase 3.
   - Builds a **detailed prompt** for the LLM including:
     - Payer context: `payeur_nom`, `payeur_email`, `impayesCount`, `impayesAmount`.
     - Sequence context: `sequence_nom`, `emailIndex`.
     - User context: `user_nom`, `user_email`.
     - Original template content (subject and body).
   - Calls **Ollama API** (`/generate` endpoint) with:
     - `model`: `process.env.OLLAMA_MODEL` (default: `mistral`).
     - `prompt`: Structured request to complete the email content.
   - **Expected LLM Output Format**:
     ```
     Objet: [completed subject]
     
     Corps:
     [completed body]
     ```
   - Replaces **both subject and body** with the LLM-generated content.
   - **Note**: The LLM is expected to handle **both `[[variable]]` and `<%= variable %>`** syntax in this pass.

9. **Fallback if LLM Fails**:
   - If LLM generation fails (network error, API error, etc.):
     - Logs a warning: `"Génération LLM échouée"`.
     - **Uses the content from Phase 3** (with unreplaced variables).

#### Phase 5: Orthographic Correction
10. **Apply Orthographic Correction**:
    - If `USE_OLLAMA=true`:
      - Calls `correctOrthographe()` for both subject and body.
      - Uses the same Ollama API endpoint with a **spelling/grammar correction prompt**.
    - If correction fails:
      - Logs a warning: `"Correction orthographique échouée"`.
      - Uses the uncorrected content.

#### Phase 6: Email Sending
11. **Email Construction**:
   - Sets email options:
     - `from`: Test sender address (from `SMTP_FROM`)
     - `to`: Recipient email (from `request.testEmail`)
     - `subject`: Processed subject (from Phase 4 or Phase 3)
     - `html`: Processed body (from Phase 4 or Phase 3)
     - `replyTo`: Optional reply-to address (from `REPLY_TO_EMAIL`)

12. **SMTP Configuration**:
    - Uses same SMTP settings as send-emails workflow
    - Creates Nodemailer transporter with:
      - `host`: `SMTP_HOST`
      - `port`: `SMTP_PORT`
      - `secure`: `SMTP_SECURE`
      - `auth`: `{ user: SMTP_USER, pass: SMTP_PASS }`

13. **Send Email**:
    - Calls `transporter.sendMail(emailOptions)`
    - Handles success:
      - Logs success with email details
      - Returns success response with preview info
    - Handles failure:
      - Logs error
      - Returns error response

---

## Data Flow Diagram

```
Cloud Function Call: testSingleEmail
       ↓
[Parse.Cloud.define("testSingleEmail", testSingleEmail)]
       ↓
┌─────────────────────────────────────────────────────────────┐
│ testSingleEmail(request)                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PHASE 1: Validate request params                         │ │
│ │ - sequenceId (required)                                  │ │
│ │ - testEmail (required)                                  │ │
│ │ - payeurId (required)                                   │ │
│ │ - emailIndex (required)                                 │ │
│ │ - payeurData (required)                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PHASE 2: Fetch sequence and email template               │ │
│ │ - Query Sequence by ID                                  │ │
│ │ - Get email at emailIndex                               │ │
│ │ - Use payeurData from request (NO DB QUERY)              │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PHASE 3: First Pass - Replace [[variable]] syntax         │ │
│ │ - Build templateVars from payeurData, userData, etc.     │ │
│ │ - Replace ONLY [[variable]] in subject and body          │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PHASE 4: Check for remaining variables                   │ │
│ │ - If USE_OLLAMA=true AND unreplaced variables exist:     │ │
│ │   → LLM Content Generation (Second Pass)               │ │
│ │ - Else: Skip LLM                                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PHASE 5: LLM Content Generation (if needed)             │ │
│ │ - Build prompt with context (payeur, sequence, user)     │ │
│ │ - Call Ollama API to generate complete content            │ │
│ │ - Replace BOTH [[variable]] AND <%= variable %>           │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PHASE 6: Orthographic Correction (if USE_OLLAMA=true)     │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PHASE 7: Build email: from, to, subject, html              | │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PHASE 8: Send email via Nodemailer                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ Return: { success, message, to, subject, preview, timestamp }│
└─────────────────────────────────────────────────────────────┘
       ↓
Response to Cloud Function caller
```

---

## Key Functions

### Cloud Function
- `testSingleEmail(request)` - Main single email test function
- Registered as: `Parse.Cloud.define("testSingleEmail", testSingleEmail)`

---

## Error Handling

### Validation Errors
- **Missing sequenceId**: Throws error "sequenceId est requis"
- **Missing testEmail**: Throws error "testEmail est requis"
- **Missing payeurId**: Throws error "payeurId est requis"
- **Missing emailIndex**: Throws error "emailIndex est requis"
- **Invalid emailIndex**: Throws error if emailIndex >= emails.length

### Authentication Errors
- **Unauthorized**: Relies on Parse authentication (master key set in 00-master.js)

### Data Fetching Errors
- **Sequence not found**: Throws error "Séquence introuvable"
- **Payeur not found**: Throws error when Contact query fails
- **No active impaye**: Warning logged but continues with available data

### Email Sending Errors
- **SMTP errors**: Caught and returned in response
- **Invalid email address**: Caught and returned in response
- **Network errors**: Caught and returned in response

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
SMTP_FROM="test@adti.com"

# Ollama Configuration (optional)
OLLAMA_API_URL=https://ollama.com/api
OLLAMA_API_KEY=your-api-key
OLLAMA_MODEL=mistral
USE_OLLAMA=false

# Test Configuration
REPLY_TO_EMAIL=reply@adti.com
```

---

## Dependencies

### Internal
- `../../utils/logger` - For info, warn, error logging

### External
- `parse/node` - Parse SDK for database operations
- `nodemailer` - Email sending library
- `dotenv` - Environment variable loading

### Optional Dependencies
- Libraries for variable replacement (likely shared with other workflows)

---

## Usage Examples

### Test Specific Email in Sequence (Frontend Call)
```javascript
// Appel réel depuis SingleEmailTestSlideover.vue
// Note: payeurData est préchargé via chargerPayeursAvecImpayes()
//       userId/userEmail/userName sont extraits de currentUser
Parse.Cloud.run('testSingleEmail', {
  sequenceId: 'sequence123',          // props.sequence.id
  testEmail: 'developer@example.com', // Champ saisi par l'utilisateur
  payeurId: 'contact456',             // selectedPayeur.value
  payeurData: {                      // selectedPayeurData.value (préchargé)
    nom: 'Jean Dupont',
    email: 'jean@exemple.com',
    impayesCount: 3,                 // Nombre d'impayés actifs
    impayesAmount: 1500              // Montant total des impayés (en euros)
  },
  emailIndex: 0,                     // props.emailIndex (index dans la séquence)
  userId: 'user789',                 // currentUser.id (automatique)
  userEmail: 'admin@adti.com',      // currentUser.get('email') (automatique)
  userName: 'Administrateur'        // currentUser.get('username') (automatique)
}).then(result => {
  console.log('Test email sent:', result);
}).catch(error => {
  console.error('Test error:', error);
});
```

### Test Second Email in Sequence
```javascript
Parse.Cloud.run('testSingleEmail', {
  sequenceId: 'sequence123',
  testEmail: 'test@example.com',
  payeurId: 'contact789',
  payeurData: { 
    nom: 'Marie Martin', 
    email: 'marie@test.com',
    impayesCount: 2,
    impayesAmount: 2500 
  },
  emailIndex: 1  // Deuxième email de la séquence
}).then(...);
```

### Direct Module Usage
```javascript
const { testSingleEmail } = require('./test-single/00-master');

// Request object with all required parameters
// Note: payeurData doit inclure impayesCount et impayesAmount pour un test réaliste
const request = {
  sequenceId: 'sequence123',
  testEmail: 'test@example.com',
  payeurId: 'contact456',
  payeurData: { 
    nom: 'Test Payeur', 
    email: 'test@exemple.com',
    impayesCount: 1,
    impayesAmount: 1000 
  },
  emailIndex: 0
};

testSingleEmail(request).then(...);
```

---

## Testing Notes

- Use `testEmail` parameter to specify recipient address (entered manually in the slideover).
- Use `emailIndex` to select which email in the sequence to test (passed from the sequence page).
- Select a `payeurId` with active impayés for realistic data (preloaded from `chargerPayeursAvecImpayes()`).
- **Frontend Flow**: The slideover automatically loads payeurs with active impayés on open (via `chargerPayeursAvecImpayes()`).
- **User Data**: `userId`, `userEmail`, and `userName` are automatically extracted from the current user session.
- Set `USE_OLLAMA=false` to avoid LLM API calls (not currently used in this workflow).
- Mock SMTP server for development testing.
- Test with various email indices in the sequence.
- Verify variable replacement works with `payeurData` (nom, email, impayesCount, impayesAmount).
- Test error scenarios (invalid sequenceId, payeurId, emailIndex out of bounds).

---

## Comparison with send-sequence-test

| Feature | send-sequence-test | test-single |
|---------|-------------------|-------------|
| **Purpose** | Test entire sequence | Test single email |
| **Input** | `sequenceId` + `emailIndex` | `sequenceId` + `emailIndex` + `payeurId` + `testEmail` + `payeurData` |
| **Template Source** | Sequence templates | Sequence email templates |
| **Data Source** | Uses test data (manually entered) | Uses **real payer data** (preloaded from frontend via `chargerPayeursAvecImpayes()`) |
| **Flexibility** | Sequence-level (tests all emails) | Single email with real payer context |
| **Use Case** | Testing sequence flow (e.g., delays, order) | Testing individual emails with **realistic payer data** (e.g., variable replacement, content) |
| **Frontend Component** | `SequenceTestSlideover` | `SingleEmailTestSlideover` |
| **User Data** | Manual input | **Automatically extracted** from `currentUser` |
| **Payer Data** | Manual input | **Preloaded** from active impayés list |

---

## File Structure

```
test-single/
├── 00-master.js                  # Cloud Function registration
├── 01-testSingleEmail.js        # Main single email test logic
├── logs/                         # Runtime logs
└── specs/
    └── technical-guide.md        # This file
```

---

## Notes

1. This workflow is designed for **testing individual emails** rather than full sequences.

2. **Data Flow**:
   - The frontend (`SingleEmailTestSlideover.vue`) **preloads payeurs with active impayés** via `chargerPayeursAvecImpayes()`.
   - The selected `payeurData` (including `impayesCount` and `impayesAmount`) is passed directly to the Cloud Function.
   - **No additional queries** are made for `Contact` or `Impaye` in the backend (unlike other workflows).

3. **User Context**:
   - `userId`, `userEmail`, and `userName` are **automatically extracted** from the current user session in the frontend.

4. The workflow uses a **custom variable replacement function** (not LLM-based by default).
   - If `USE_OLLAMA=true`, unreplaced variables are handled by LLM (see Phase 4 in the flow).

5. **No database modifications** are made - this is purely for testing email delivery.

6. **Frontend Integration**:
   - Triggered from the **"Tester cet email"** button on `/sequences/relances/[id]`.
   - Requires an **authenticated user** to extract user data.
