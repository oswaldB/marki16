# Tasks: Verify Paid Invoices

## Implementation Tasks

### Phase 1: Setup and Configuration
- [ ] Add `verifyPaidInvoices` job to `backend/cloud/jobs/` directory
- [ ] Configure PostgreSQL connection using existing `EXTERNAL_DB_URI` env var
- [ ] Add cron job to `backend/server.js` with schedule `0 * * * *`

### Phase 2: Core Functionality
- [ ] Implement `verifyPaidInvoices()` function in new job file
- [ ] Use validated SQL query to find paid invoices
- [ ] Update Parse `Impaye` objects where `facture_soldee = FALSE`
- [ ] Add error handling with 3 retry attempts
- [ ] Implement transaction safety for Parse updates

### Phase 3: Logging and Monitoring
- [ ] Add console logging for job start/end
- [ ] Create `VerificationLog` Parse class for audit trail
- [ ] Log success counts and error details
- [ ] Follow existing logging pattern from `syncImpayes.js`

### Phase 4: Testing and Deployment
- [ ] Test with sample paid invoices in staging
- [ ] Verify Parse updates are accurate
- [ ] Check logging output
- [ ] Deploy to production after validation

### Phase 5: Documentation
- [ ] Update README with new cron job details
- [ ] Document SQL query in code comments
- [ ] Add operational notes for troubleshooting