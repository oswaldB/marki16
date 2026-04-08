# Implementation Plan: Sequence Email Testing

**Branch**: `002-test-sequence-email` | **Date**: 2026-03-29 | **Spec**: [spec.md](./spec.md)

## Summary

Add a "Test Sequence" button to the sequence detail page that allows users to send test emails to a custom recipient address. The test emails will contain the sequence content populated for a selected late payer, but sent to the specified test email address instead of the payer's real email.

## Technical Context

**Framework**: Nuxt 3 (Vue 3, TypeScript)
**Primary Dependencies**: Parse JavaScript SDK, UI components library, Email service
**Target Platform**: Web application
**Project Type**: Frontend feature with backend email processing

## Project Structure

### Source Code (frontend)

```text
frontend/
├── app/
│   ├── pages/
│   │   └── sequences/
│   │       └── [id].vue              # MODIFIED: Add test button
│   ├── components/
│   │   └── SequenceTestDrawer.vue    # NEW: Test drawer component
│   ├── composables/
│   │   └── useSequenceTesting.js     # NEW: Testing logic
│   └── plugins/
│       └── parse.client.js           # EXISTING: Parse initialization
```

### Source Code (backend - if needed)

```text
backend/
└── cloud/
    └── main.js                       # MODIFIED: Add test email endpoint
```

## Implementation Details

### 1. Add Test Button to Sequence Detail Page

**File**: `frontend/app/pages/sequences/[id].vue`

Add a prominent "Test Sequence" button near the top of the page, next to existing action buttons. The button should:
- Be clearly labeled "Test Sequence" or "Send Test Email"
- Use a secondary color to distinguish from primary actions
- Open the test drawer when clicked

### 2. Create Sequence Test Drawer Component

**File**: `frontend/app/components/SequenceTestDrawer.vue`

This component will:
1. Display a form with two main fields:
   - Test email address input (with validation)
   - Late payer selector (dropdown with search)
2. Show a preview of what will be sent
3. Have a "Send Test" button that triggers the test email
4. Show loading states and success/error messages

### 3. Implement Testing Logic

**File**: `frontend/app/composables/useSequenceTesting.js`

This composable will handle:
- Fetching available late payers for the current sequence
- Validating test email addresses
- Sending test email requests to the backend
- Handling success/error responses
- Providing state management for the drawer

### 4. Backend Email Processing (if needed)

**File**: `backend/cloud/main.js`

Add a cloud function `sendTestSequenceEmail` that:
- Takes parameters: sequenceId, testEmail, payerId
- Generates the sequence content for the specified payer
- Sends it to the test email address
- Returns success/failure status

## Complexity Tracking

### Complexity Level: Medium

**Rationale**: 
- Frontend implementation is straightforward (button + drawer)
- Email template processing requires careful handling
- Need to ensure test emails never go to real payers
- May require backend modifications depending on current email system

### Risk Areas

1. **Email Template Safety**: Must ensure test emails cannot accidentally be sent to real payer addresses
2. **Data Privacy**: Test emails should not expose sensitive payer information inappropriate
3. **Rate Limiting**: Prevent abuse of test email functionality
4. **Template Rendering**: Ensure sequence templates render correctly with test data

### Mitigation Strategies

1. **Double-check recipient**: Always validate test email ≠ payer email before sending
2. **Audit logging**: Log all test emails with metadata for tracking
3. **Rate limiting**: Limit test emails to 5 per user per hour initially
4. **Template validation**: Verify templates render without errors before sending

## UI/UX Considerations

### Wireframe: Test Drawer

```
+-------------------------------------+
| Test Sequence Email                 |
+-------------------------------------+
|                                     |
| Test Email Address                  |
| [_______________________________]   |
|                                     |
| Select Late Payer                   |
| [_______________________________] ▼ |
|                                     |
| +---------------------------------+ |
| | Preview:                        | |
| | To: test@example.com            | |
| | Subject: Payment Reminder       | |
| | Body: [Preview of email...]     | |
| +---------------------------------+ |
|                                     |
| [Cancel]           [Send Test]     |
|                                     |
+-------------------------------------+
```

### User Flow

1. User navigates to sequence detail page
2. User clicks "Test Sequence" button
3. Drawer opens with empty form
4. User enters test email address
5. User selects a late payer from dropdown
6. Preview updates to show what will be sent
7. User clicks "Send Test"
8. System sends test email
9. User sees confirmation with option to send another test

## Technical Decisions

### Decision 1: Client-side vs Server-side Processing

**Decision**: Use server-side processing for email generation
**Rationale**: 
- Email templates may contain sensitive business logic
- Ensures consistent rendering with production emails
- Easier to maintain and update

### Decision 2: Real-time vs Batch Processing

**Decision**: Real-time processing for test emails
**Rationale**: 
- Users expect immediate feedback when testing
- Test volume should be low enough to handle synchronously
- Batch processing would add unnecessary complexity

### Decision 3: Storage of Test Emails

**Decision**: Store minimal metadata about test emails
**Rationale**: 
- Need history for debugging and compliance
- Don't store full email content to save space
- Store: timestamp, user, sequence, payer (reference only), status

## Future Considerations

1. **Test Email Customization**: Allow users to modify subject/body before sending test
2. **Batch Testing**: Send tests to multiple recipients at once
3. **Scheduled Tests**: Set up tests to run at specific times
4. **Test Analytics**: Track open rates, click rates on test emails
5. **Team Testing**: Share test emails with team members for review

## Implementation Phases

### Phase 1: Core Functionality (P1 - 2 days)
- Add test button to sequence page
- Create basic test drawer
- Implement backend test email endpoint
- Basic validation and error handling

### Phase 2: Enhancements (P2 - 1 day)
- Add email preview functionality
- Implement test history
- Add rate limiting
- Improve error messages

### Phase 3: Advanced Features (P3 - 2 days)
- Scheduled test emails
- Test email customization
- Team sharing features
- Analytics integration