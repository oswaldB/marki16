# Technical Guide: send-sequence-test Workflow

## Overview
This workflow provides a **Cloud Function** for sending test emails to verify sequence configurations. It is a **single-function workflow** that can be triggered manually to test email sequences without affecting production data.

## Purpose
Send test emails to verify:
- Sequence configurations are correct
- Email templates render properly
- Variables are replaced correctly
- Email delivery works as expected

---

## Invocation Methods (Comment ce workflow est appelé)

### 1. Cloud Function Trigger (Primary Method)
**Endpoint**: `Parse.Cloud.run("sendSequenceTest")`

**How to Call**:
```javascript
// From client-side JavaScript
Parse.Cloud.run('sendSequenceTest', {
  sequenceId: 'abc123',
  emailIndex: 0,
  testEmail: 'developer@example.com'
}, { useMasterKey: true })
  .then(result => {
    console.log('Test email sent:', result);
  })
  .catch(error => {
    console.error('Test error:', error);
  });
```

**Authentication**:
- Requires `masterKey` OR authenticated `user`
- Throws: Error if neither is present

**Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sequenceId` | string | **Yes** | The sequence to test |
| `emailIndex` | number | **Yes** | Which email in the sequence to test (0-indexed) |
| `contactId` | string | No | Specific contact to send to (overrides testEmail) |
| `testEmail` | string | No | Override email address for testing |

---

### 2. Programmatic Import
**Usage**:
```javascript
const { sendSequenceTest } = require('./send-sequence-test/00-master');

// Mock request object
const request = {
  params: {
    sequenceId: 'abc123',
    emailIndex: 0,
    testEmail: 'developer@example.com'
  },
  master: true
};

sendSequenceTest(request)
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

**Use Case**: Can be called from other scripts for testing

---

## Complete Flow: From Invocation to Output

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INVOCATION POINT                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐                                                  │
│  │ Cloud Function Call  │                                                  │
│  │ Parse.Cloud.run(     │                                                  │
│  │  "sendSequenceTest", │                                                  │
│  │  { sequenceId,       │                                                  │
│  │    emailIndex,      │                                                  │
│  │    contactId?,      │                                                  │
│  │    testEmail? }      │                                                  │
│  │ )                   │                                                  │
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
│  4. Log workflow start: "DÉBUT: send-sequence-test - Enregistrement..."        │
│  5. Import sendSequenceTest function from 01-sendSequenceTest.js              │
│  6. Register Cloud Function: Parse.Cloud.define("sendSequenceTest", ...)    │
│  7. Log: "Cloud Function enregistrée avec succès"                             │
│  8. Export sendSequenceTest function                                         │
└─────────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CLOUD FUNCTION: sendSequenceTest(request)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  INPUT: request = { params: {...}, user?: {...}, master: boolean }            │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 1. Validate request:                                                   │   │
│  │     IF !request.params:                                               │   │
│  │        Return: { success: false, message: "Paramètres manquants" }      │   │
│  │     IF !request.params.sequenceId:                                   │   │
│  │        Return: { success: false, message: "sequenceId requis" }        │   │
│  │     IF !request.params.emailIndex:                                    │   │
│  │        Return: { success: false, message: "emailIndex requis" }       │   │
│  │     IF !request.master && !request.user:                              │   │
│  │        Throw: "Non autorisé"                                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 2. Extract parameters:                                                │   │
│  │     - sequenceId = request.params.sequenceId                          │   │
│  │     - emailIndex = request.params.emailIndex                           │   │
│  │     - contactId = request.params.contactId                            │   │
│  │     - testEmail = request.params.testEmail                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 3. Fetch sequence from Parse:                                         │   │
│  │     Query: Sequence where objectId = sequenceId                        │   │
│  │     Include: ["emails"]                                                │   │
│  │     IF NOT FOUND:                                                    │   │
│  │        Return: { success: false, message: "Séquence introuvable" }    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 4. Fetch contact:                                                     │   │
│  │     IF contactId provided:                                           │   │
│  │        Query: Contact where objectId = contactId                       │   │
│  │        IF FOUND: use this contact                                     │   │
│  │        IF NOT FOUND: use testEmail or default                          │   │
│  │     ELSE IF testEmail provided:                                      │   │
│  │        Create temporary contact object: { email: testEmail }          │   │
│  │     ELSE:                                                             │   │
│  │        Return: { success: false, message: "contactId ou testEmail requis" }│   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 5. Fetch sample impayes for testing:                                  │   │
│  │     Query: Impaye where facture_soldee = false                         │   │
│  │     Limit: 10 (reasonable number for testing)                          │   │
│  │     IF NO IMPAYES FOUND:                                              │   │
│  │        Use empty array (no impayes in template)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 6. Get scenario from sequence:                                        │   │
│  │     - emails = sequence.get("emails") || []                            │   │
│  │     - matchingScenario = emails.find(s => s.email_index === emailIndex)│   │
│  │     IF NOT FOUND:                                                    │   │
│  │        Return: { success: false, message: "Scénario introuvable" }     │   │
│  │     - activeScenario = matchingScenario.scenarios.find(s => s.active)│   │
│  │     IF NOT FOUND:                                                    │   │
│  │        Return: { success: false, message: "Aucun scénario actif" }    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 7. Prepare data for variable replacement:                             │   │
│  │     data = {                                                          │   │
│  │       contact: contactObject,                                         │   │
│  │       sequence: sequenceObject,                                       │   │
│  │       impayes: impayesArray,                                         │   │
│  │       scenario: activeScenario,                                       │   │
│  │       emailIndex: emailIndex,                                         │   │
│  │       isTest: true                                                   │   │
│  │     }                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 8. Replace variables in template:                                     │   │
│  │     - objet = replaceAllVariables(activeScenario.objet, data)          │   │
│  │     - corps = replaceAllVariables(activeScenario.corps, data)          │   │
│  │     (Uses same variable replacement as generate-relances workflow)    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 9. Check for unreplaced variables:                                    │   │
│  │     IF USE_OLLAMA = true AND hasUnreplacedVariables(objet || corps):   │   │
│  │        Try:                                                           │   │
│  │          prompt = buildPrompt(activeScenario, impayes, [], relance)    │   │
│  │          result = await generateEmailContent(prompt)                   │   │
│  │          objet = result.objet                                         │   │
│  │          corps = result.corps                                          │   │
│  │        Catch (error):                                                 │   │
│  │          Log warning: "LLM generation failed, using template"           │   │
│  │     ELSE:                                                             │   │
│  │        Use objet and corps as-is                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 10. Apply orthographic correction (if USE_OLLAMA = true):             │   │
│  │      Try:                                                             │   │
│  │        objet = await correctOrthographe(objet)                         │   │
│  │        corps = await correctOrthographe(corps)                         │   │
│  │      Catch (error):                                                   │   │
│  │        Log warning: "Correction orthographique échouée"                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 11. Setup Nodemailer transporter:                                     │   │
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
│  │ 12. Build email options:                                              │   │
│  │      emailOptions = {                                                 │   │
│  │        from: process.env.SMTP_FROM || "test@adti.com",                │   │
│  │        to: testEmail || contact.get("email"),                         │   │
│  │        subject: objet,                                                 │   │
│  │        html: corps,                                                   │   │
│  │        replyTo: process.env.REPLY_TO_EMAIL                           │   │
│  │      }                                                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                     │
│         ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ 13. Send email:                                                       │   │
│  │      Try:                                                             │   │
│  │        info = await transporter.sendMail(emailOptions)                │   │
│  │        Log: "Email de test envoyé à {to}"                             │   │
│  │        Return: {                                                      │   │
│  │          success: true,                                               │   │
│  │          message: "Email de test envoyé avec succès",                 │   │
│  │          to: to,                                                     │   │
│  │          subject: subject,                                            │   │
│  │          preview: corps.substring(0, 200) + "...",                     │   │
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
   - Registers `sendSequenceTest` Cloud Function with Parse
   - Logs registration success

3. **Module Export**:
   - Exports `sendSequenceTest` function for external use

**Key Characteristics**:
- This is a **passive** workflow - it only registers the Cloud Function
- The actual logic is in `01-sendSequenceTest.js`
- No automatic execution - must be triggered via Cloud Function call

---

### Node 1: Test Email Sender (01-sendSequenceTest.js)
**File**: `01-sendSequenceTest.js`

**Actions**:

#### Phase 1: Input Validation
1. **Request Validation**:
   - Checks if request has `params`
   - Validates required parameters:
     - `sequenceId` (required)
     - `emailIndex` (required)
     - `contactId` (optional)
     - `testEmail` (optional)

2. **Authentication Check**:
   - Verifies request has master key or authenticated user
   - If not authorized → throws error

#### Phase 2: Data Retrieval
3. **Fetch Sequence**:
   - Queries `Sequence` class in Parse
   - Gets sequence by `sequenceId`
   - Includes: `["emails"]`
   - Verifies sequence exists and is valid

4. **Fetch Contact**:
   - If `contactId` provided:
     - Queries `Contact` class
     - Gets contact by ID
   - If `testEmail` provided:
     - Creates temporary contact object with test email
   - If neither provided:
     - Returns error

5. **Fetch Sample Impayes**:
   - Queries `Impaye` class for unpaid invoices
   - Limit: 10 (for testing)

#### Phase 3: Test Email Preparation
6. **Scenario Selection**:
   - Gets `emails` array from sequence
   - Finds scenario matching `emailIndex`
   - Finds active scenario within matching scenario

7. **Variable Replacement**:
   - Creates test data object with:
     - contact information
     - sequence information
     - impayes information
     - test flags
   - Calls variable replacement functions
   - Replaces all `[[variable]]` placeholders with test values

8. **Content Generation**:
   - If `USE_OLLAMA=true` and unreplaced variables exist:
     - Builds prompt for LLM
     - Calls Ollama API to replace remaining variables
     - Validates output
   - If no unreplaced variables or LLM disabled:
     - Uses content as-is

9. **Orthographic Correction**:
   - If `USE_OLLAMA=true`:
     - Applies spelling/grammar correction

#### Phase 4: Email Sending
10. **Email Construction**:
    - Sets email options:
      - `from`: Test sender address
      - `to`: Recipient email (from params.email or contact)
      - `subject`: Processed subject
      - `html`: Processed body
      - `replyTo`: Optional reply-to address

11. **SMTP Configuration**:
    - Uses same SMTP settings as send-emails workflow
    - Creates Nodemailer transporter

12. **Send Email**:
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
Cloud Function Call: sendSequenceTest
       ↓
[Parse.Cloud.define("sendSequenceTest", sendSequenceTest)]
       ↓
┌─────────────────────────────────────────────────────────────┐
│ sendSequenceTest(request)                                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Validate request params                                  │ │
│ │ - sequenceId (required)                                   │ │
│ │ - emailIndex (required)                                  │ │
│ │ - contactId (optional)                                  │ │
│ │ - testEmail (optional)                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Check authentication (master key or user)               │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Fetch Sequence by sequenceId                             │ │
│ │ Include: ["emails"]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Fetch Contact:                                           │ │
│ │ - If contactId: by ID                                    │ │
│ │ - If testEmail: create temp contact                      │ │
│ │ - Else: use default                                      │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Fetch sample Impayes for testing                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Get scenario by emailIndex from sequence.emails          │ │
│ │ Get active scenario                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Replace variables in template:                           │ │
│ │ - Contact variables                                      │ │
│ │ - Sequence variables                                      │ │
│ │ - Impaye variables                                        │ │
│ │ - Test-specific variables                                 │ │
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
- `sendSequenceTest(request)` - Main test email sending function
- Registered as: `Parse.Cloud.define("sendSequenceTest", sendSequenceTest)`

### Helper Functions
- Functions in `01-fetchData.js` for data retrieval
- Functions in `02-sendEmails.js` for email sending

---

## Error Handling

### Validation Errors
- **Missing parameters**: Returns error response with missing parameter details
- **Invalid sequenceId**: Returns error response
- **Invalid emailIndex**: Returns error response
- **No contact or testEmail**: Returns error response

### Authentication Errors
- **Unauthorized**: Throws error if no master key or authenticated user

### Data Fetching Errors
- **Sequence not found**: Returns error response
- **Contact not found**: Uses test email or returns error
- **No impayes found**: Uses sample data or returns warning

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

# SMTP Configuration (same as send-emails)
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
USE_OLLAMA=false  # Typically false for testing

# Test Configuration
TEST_EMAIL=test@example.com  # Default test email
REPLY_TO_EMAIL=reply@adti.com
```

---

## Dependencies

### Internal
- `../../utils/logger` - For info, warn, error logging
- `./01-fetchData` - For fetching test data
- `./02-sendEmails` - For sending test emails

### External
- `parse/node` - Parse SDK for database operations
- `nodemailer` - Email sending library
- `dotenv` - Environment variable loading

### Optional Dependencies
- `ssh2-sftp-client` - If PDF attachments are tested
- `archiver` - If ZIP attachments are tested

---

## Usage Examples

### Test with Sequence ID and Email Index
```javascript
// Send test email using sequence template
Parse.Cloud.run('sendSequenceTest', {
  sequenceId: 'abc123',
  emailIndex: 0,
  testEmail: 'developer@example.com'
}).then(result => {
  console.log('Test email sent:', result);
}).catch(error => {
  console.error('Error:', error);
});
```

### Test with Contact ID
```javascript
// Send test email using specific contact
Parse.Cloud.run('sendSequenceTest', {
  sequenceId: 'abc123',
  emailIndex: 1,
  contactId: 'contact456'
}).then(...);
```

### Direct Module Usage
```javascript
const { sendSequenceTest } = require('./send-sequence-test/00-master');

// Mock request object
const request = {
  params: {
    sequenceId: 'abc123',
    emailIndex: 0,
    testEmail: 'test@example.com'
  },
  master: true
};

sendSequenceTest(request).then(...);
```

---

## Testing Notes

- Use `testEmail` parameter to send to specific test addresses
- Set `USE_OLLAMA=false` to avoid LLM API calls during testing
- Mock SMTP server for development testing
- Test with various sequence configurations
- Verify variable replacement works correctly
- Test error scenarios (invalid IDs, missing data)

---

## Comparison with test-single

| Feature | send-sequence-test | test-single |
|---------|-------------------|-------------|
| Purpose | Test entire sequence | Test single email |
| Input | sequenceId + emailIndex | relanceId OR suiviId OR custom content |
| Template Source | Sequence templates | Relance/Suivi content or custom |
| Flexibility | Sequence-level | Email-level |
| Use Case | Testing sequence flow | Testing individual emails |

---

## File Structure

```
send-sequence-test/
├── 00-master.js                  # Cloud Function registration
├── 01-fetchData.js               # Data fetching helpers
├── 01-sendSequenceTest.js        # Main test email logic
├── 02-sendEmails.js              # Email sending helpers
├── FONCTIONNEMENT_TEST_SEQUENCE.md  # Existing functional documentation
├── logs/                         # Runtime logs
└── specs/
    └── technical-guide.md        # This file
```

---

## Notes

1. This workflow has an existing documentation file `FONCTIONNEMENT_TEST_SEQUENCE.md` that may contain additional implementation details.

2. The workflow is designed for **testing only** and should not modify production data.

3. Test emails can be sent to arbitrary email addresses using the `testEmail` parameter, which is useful for development and debugging.

4. The workflow can use either template content directly or generate content via LLM, depending on configuration.
