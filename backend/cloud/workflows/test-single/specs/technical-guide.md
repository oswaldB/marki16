# Technical Guide: test-single Workflow

## Overview
This workflow provides a **Cloud Function** for testing a single email by sending it to a specified recipient. It is similar to `send-sequence-test` but focuses on testing individual emails rather than entire sequences.

## Purpose
Send a single test email to verify:
- Email template content
- Variable replacement
- Email delivery
- Attachments (if any)

This is useful for quick testing of email configurations without going through the full sequence workflow.

---

## Invocation Methods (Comment ce workflow est appelé)

### 1. Cloud Function Trigger (Primary Method)
**Endpoint**: `Parse.Cloud.run("testSingleEmail")`

**How to Call** (depuis le frontend - SingleEmailTestSlideover.vue):
```javascript
// Appel réel depuis le frontend
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
- No `masterKey` required in client call (Cloud Function uses `Parse.Cloud.useMasterKey()`)
- Requires authenticated user session
- Throws: Error if neither is present

**Parameters** (all required except user info):
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sequenceId` | string | **Yes** | ID of the sequence containing the email to test |
| `testEmail` | string | **Yes** | Recipient email address for the test |
| `payeurId` | string | **Yes** | Contact ID of the payer to use for data |
| `payeurData` | object | **Yes** | Payer data object with nom, email, impayesCount, impayesAmount |
| `emailIndex` | number | **Yes** | Index of the email in the sequence to test |
| `userId` | string | No | Current user ID (for logging) |
| `userEmail` | string | No | Current user email (for logging) |
| `userName` | string | No | Current user name (for logging) |

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
│  │     Query Contact (payeur) by ID:                                      │   │
│  │       - Class: Contact                                             │   │   │
│  │       - where: { objectId: payeurId }                                  │   │
│  │     Query Impaye for payeur:                                          │   │
│  │       - where: { payeur: payeur, facture_soldee: false }                     │   │   │
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
│  │       - payeur data (nom, email, telephone, adresse)                  │   │
│  │       - impaye data (nfacture, date_piece, montant_ttc, etc.)          │   │
│  │       - user data (nom, email)                                        │   │
│  │       - sequence data (nom)                                           │   │
│  │       - current date                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 5. Replace variables in subject and body:                             │   │
│  │     Uses custom replaceVariables() function                           │   │
│  │     Replaces [[variable]] and <%= variable %> syntax                   │   │
│  │     Processes both subject (objet) and body (corps)                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 7. Check for unreplaced variables:                                    │   │
│  │     IF USE_OLLAMA = true AND hasUnreplacedVariables(newSubject || newBody):│   │
│  │        Try:                                                           │   │
│  │          prompt = buildPrompt(activeScenario, data.impayes, [], {})   │   │
│  │          result = await generateEmailContent(prompt)                   │   │
│  │          newSubject = result.objet                                     │   │
│  │          newBody = result.corps                                        │   │
│  │        Catch (error):                                                 │   │
│  │          Log warning: "Génération LLM échouée"                          │   │
│  │     ELSE:                                                             │   │
│  │        Use newSubject and newBody as-is                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 8. Apply orthographic correction (if USE_OLLAMA = true):             │   │
│  │      Try:                                                             │   │
│  │        newSubject = await correctOrthographe(newSubject)              │   │
│  │        newBody = await correctOrthographe(newBody)                      │   │
│  │      Catch (error):                                                   │   │
│  │        Log warning: "Correction orthographique échouée"                │   │
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
   - Logs registration success

3. **Module Export**:
   - Exports `testSingleEmail` function for external use

**Key Characteristics**:
- This is a **passive** workflow - it only registers the Cloud Function
- The actual logic is in `01-testSingleEmail.js`
- No automatic execution - must be triggered via Cloud Function call
- **Important**: Uses `Parse.Cloud.useMasterKey()` so client calls don't need `useMasterKey: true`

---

### Node 1: Single Email Tester (01-testSingleEmail.js)
**File**: `01-testSingleEmail.js`

**Actions**:

#### Phase 1: Input Validation
1. **Request Validation**:
   - Validates all required parameters are present:
     - `sequenceId` (required)
     - `testEmail` (required)
     - `payeurId` (required)
     - `emailIndex` (required)

2. **Authentication Check**:
   - Relies on Parse Cloud Function authentication (master key already set in 00-master.js)
   - Requires authenticated user session

#### Phase 2: Data Retrieval
3. **Fetch Sequence**:
   - Queries `Sequence` class by sequenceId
   - Gets all emails from sequence
   - Validates emailIndex is within bounds

4. **Fetch Payer Data**:
   - Queries `Contact` class by payeurId
   - Gets payer information (nom, email, telephone, adresse)

5. **Fetch Impaye Data**:
   - Queries `Impaye` class for payer
   - Filters by `facture_soldee: false`
   - Gets first active impaye for variable replacement

6. **Get Email Template**:
   - Extracts email at emailIndex from sequence
   - Gets active scenario from email
   - Validates scenario exists
   - If sequenceId provided:
     - Queries `Sequence` class
     - Gets sequence by ID
     - Includes: `["emails"]`
   
   - If emailIndex provided:
     - Gets specific email template from sequence
     - Uses template's objet and corps if not overridden

#### Phase 3: Variable Replacement
5. **Prepare Template Variables**:
   - Creates templateVars object with:
     - Payer variables: `payeur_nom`, `payeur_email`, `payeur_telephone`, `payeur_adresse`
     - Impaye variables: `nfacture`, `date_piece`, `date_echeance`, `montant_ttc`, `reste_a_payer`
     - User variables: `user_nom`, `user_email`
     - Sequence variables: `sequence_nom`
     - Date variable: `date_du_jour`

6. **Replace Variables**:
   - Uses custom `replaceVariables()` function
   - Replaces `[[variable]]` and `<%= variable %>` syntax
   - Processes both subject (objet) and body (corps)

#### Phase 4: Content Generation
7. **Check for Unreplaced Variables**:
   - If `USE_OLLAMA=true` and unreplaced variables exist:
     - Builds prompt for LLM
     - Calls Ollama API to replace remaining variables
     - Validates output
   
   - If no unreplaced variables or LLM disabled:
     - Uses content as-is

8. **Orthographic Correction**:
   - If `USE_OLLAMA=true`:
     - Applies spelling/grammar correction

#### Phase 5: Email Sending
9. **Email Construction**:
   - Sets email options:
     - `from`: Test sender address (from SMTP_FROM)
     - `to`: Recipient email (from params.email or contact)
     - `subject`: Processed subject
     - `html`: Processed body
     - `replyTo`: Optional reply-to address

10. **SMTP Configuration**:
    - Uses same SMTP settings as send-emails workflow
    - Creates Nodemailer transporter

11. **Send Email**:
    - Calls `transporter.sendMail()`
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
│ │ Validate request params                                  │ │
│ │ - relanceId OR suiviId OR (email + subject + body)       │ │
│ │ - sequenceId (optional)                                   │ │
│ │ - emailIndex (optional)                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Check authentication (master key or user)               │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ IF relanceId:                                           │ │
│ │   Query Relance by ID                                    │ │
│ │   Include: [contact, sequence, impayes]                   │ │
│ │ ELSE IF suiviId:                                        │ │
│ │   Query Suivi by ID                                      │ │
│ │   Include: [contact, sequence, impaye]                    │ │
│ │ ELSE:                                                   │ │
│ │   Use provided email, subject, body                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ IF sequenceId:                                          │ │
│ │   Query Sequence by ID                                   │ │
│ │   Include: [emails]                                      │ │
│ │ IF emailIndex:                                          │ │
│ │   Get specific email from sequence                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Prepare data for variable replacement                    │ │
│ │ Replace variables in subject and body                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ IF USE_OLLAMA && unreplaced variables:                   │ │
│ │   Generate content via LLM                               │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ IF USE_OLLAMA:                                           │ │
│ │   Apply orthographic correction                          │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Build email: from, to, subject, html                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Send email via Nodemailer                                │ │
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
- **Missing parameters**: Returns error response with details
- **Invalid relanceId**: Returns error response
- **Invalid suiviId**: Returns error response
- **No email provided**: Returns error response

### Authentication Errors
- **Unauthorized**: Throws error if no master key or authenticated user

### Data Fetching Errors
- **Relance not found**: Returns error response
- **Suivi not found**: Returns error response
- **Sequence not found**: Uses provided content or returns warning

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
  emailIndex: 0,  // Premier email de la séquence
  userId: 'user789',
  userEmail: 'admin@adti.com',
  userName: 'Administrateur'
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
  payeurData: { nom: 'Marie Martin', email: 'marie@test.com' },
  emailIndex: 1  // Deuxième email de la séquence
}).then(...);
```

### Direct Module Usage
```javascript
const { testSingleEmail } = require('./test-single/00-master');

// Request object with all required parameters
const request = {
  sequenceId: 'sequence123',
  testEmail: 'test@example.com',
  payeurId: 'contact456',
  payeurData: { nom: 'Test Payeur', email: 'test@exemple.com' },
  emailIndex: 0
};

testSingleEmail(request).then(...);
```

---

## Testing Notes

- Use `testEmail` parameter to specify recipient address
- Use `emailIndex` to select which email in the sequence to test
- Select a `payeurId` with active impayés for realistic data
- Set `USE_OLLAMA=false` to avoid LLM API calls (not currently used in this workflow)
- Mock SMTP server for development testing
- Test with various email indices in the sequence
- Verify variable replacement works with payer and impaye data
- Test error scenarios (invalid sequenceId, payeurId, emailIndex out of bounds)

---

## Comparison with send-sequence-test

| Feature | send-sequence-test | test-single |
|---------|-------------------|-------------|
| Purpose | Test entire sequence | Test single email |
| Input | sequenceId + emailIndex | sequenceId + emailIndex + payeurId + testEmail |
| Template Source | Sequence templates | Sequence email templates |
| Data Source | Uses test data | Uses real payer and impaye data |
| Flexibility | Sequence-level | Single email with real data |
| Use Case | Testing sequence flow | Testing individual emails with real payer context |
| Frontend Component | SequenceTestSlideover | SingleEmailTestSlideover |

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

2. It uses real payer and impaye data for realistic testing:
   - Fetches actual payer information from Contact class
   - Uses real impaye data for variable replacement
   - Tests with actual email templates from sequences

3. The workflow currently uses a custom variable replacement function (not LLM-based).

4. No database modifications are made - this is purely for testing email delivery.
