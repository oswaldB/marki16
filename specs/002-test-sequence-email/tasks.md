# Tasks: Sequence Email Testing

**Input**: Design documents from `/specs/002-test-sequence-email/`
**Prerequisites**: spec.md, design.md

## Phase 1: Core Implementation (P1 - MVP)

### User Story 1 - Test Sequence with Custom Recipient 🎯

**Goal**: Add test button and drawer to send test emails to custom recipients

**Independent Test**: Navigate to sequence page, click test button, select email and payer, send test, verify email delivery

---

- [ ] T001 [US1] Investigate existing sequence detail page structure and UI components
- [ ] T002 [US1] Create SequenceTestDrawer.vue component with form fields
- [ ] T003 [US1] Add "Test Sequence" button to sequences/[id].vue page
- [ ] T004 [US1] Implement useSequenceTesting.js composable for test logic
- [ ] T005 [US1] Add backend cloud function for sending test emails (if needed)
- [ ] T006 [US1] Implement email validation and payer selection logic
- [ ] T007 [US1] Add success/error notifications and loading states
- [ ] T008 [US1] Test basic functionality manually:
  1. Go to any sequence detail page
  2. Click "Test Sequence" button
  3. Enter test email and select late payer
  4. Click "Send Test"
  5. Verify test email is received at specified address

---

## Phase 2: Enhancements (P2)

### User Story 2 - Test History and Management

**Goal**: Add test history tracking and resend capability

**Independent Test**: Send multiple tests, view history, resend a previous test

---

- [ ] T009 [US2] Create TestEmail model/table in database (if storing history)
- [ ] T010 [US2] Implement test history tracking in backend
- [ ] T011 [US2] Add test history section to sequence detail page
- [ ] T012 [US2] Implement resend functionality for past tests
- [ ] T013 [US2] Add filters and search to test history
- [ ] T014 [US2] Test history functionality:
  1. Send 3+ test emails
  2. View test history
  3. Resend a previous test
  4. Verify resend works correctly

---

## Phase 3: Advanced Features (P3)

### User Story 3 - Scheduled Test Sequences

**Goal**: Allow scheduling test emails for later delivery

**Independent Test**: Schedule a test, wait for scheduled time, verify delivery

---

- [ ] T015 [US3] Add scheduling UI to test drawer
- [ ] T016 [US3] Implement backend scheduled test processing
- [ ] T017 [US3] Add scheduled tests to history with status tracking
- [ ] T018 [US3] Test scheduling functionality:
  1. Schedule test for 2 minutes in future
  2. Wait for scheduled time
  3. Verify test email is sent

---

## Dependencies & Execution Order

### Critical Path (MVP)
- **T001** → **T002** → **T003** → **T004** → **T005** → **T006** → **T007** → **T008**

### Enhancements
- **T008** must complete before **T009** (need working tests to have history)
- **T009** → **T010** → **T011** → **T012** → **T013** → **T014**

### Advanced Features
- **T008** must complete before **T015** (need basic testing working)
- **T015** → **T016** → **T017** → **T018**

## Technical Notes

### Backend Considerations
- May need to modify existing email sending functions to support test mode
- Need to ensure test emails are clearly marked in logs/audit trails
- Consider adding rate limiting to prevent abuse

### Frontend Considerations
- Reuse existing UI components (buttons, inputs, drawers) for consistency
- Follow existing code patterns for API calls and error handling
- Ensure mobile responsiveness of test drawer

### Testing Strategy
- Manual testing of core user flow
- Verify test emails never go to real payer addresses
- Test with various sequence templates
- Test error cases (invalid emails, missing payers, etc.)

## Risk Mitigation

- **High Risk**: Test emails going to wrong addresses
  - Mitigation: Double-check recipient validation, add confirmation dialog
- **Medium Risk**: Email template rendering issues
  - Mitigation: Preview functionality before sending, template validation
- **Low Risk**: Performance issues with many tests
  - Mitigation: Rate limiting, async processing