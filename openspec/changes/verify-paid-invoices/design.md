# Design: Verify Paid Invoices

## Architecture
```
Express Cron → PostgreSQL Query → Parse Update → Logging
```

## Components

### 1. Express Cron Job Configuration
- Uses `node-cron` library with syntax: `0 * * * *` (every hour at minute 0)
- Integrated in `backend/server.js` with other scheduled jobs
- Logs execution start/end times to console

### 2. PostgreSQL Query Module
- Connects to external database using `pg` library
- Executes validated SQL query to find paid invoices
- Handles connection errors with retries (3 attempts)

### 3. Parse Status Update Module
- Updates Parse `Impaye` objects where `facture_soldee = FALSE`
- Sets `facture_soldee = TRUE` for paid invoices
- Uses master key for elevated permissions
- Implements transaction safety

### 4. Logging Module
- Logs successful verifications with counts
- Logs errors with invoice numbers and error messages
- Creates `VerificationLog` entries in Parse for audit trail

## Data Flow
1. Express cron triggers job execution hourly
2. Job connects to PostgreSQL external database
3. Query finds invoices marked as paid in external system
4. Parse database updated for matching unpaid invoices
5. Results logged to console and Parse database

## SQL Query (Validated)
```sql
SELECT p."nfacture", p."facturesoldee", p."resteapayer"
FROM "GcoPiece" p
WHERE p."facturesoldee" = TRUE
  AND p."resteapayer" = 0
  AND p."nfacture" IN (
    SELECT i."externe_id"
    FROM "Impaye" i
    WHERE i."facture_soldee" = FALSE
  )
```

## Error Handling
- PostgreSQL connection timeout: 3 retries with exponential backoff
- Query failure: detailed logging with invoice numbers
- Parse update failure: rollback and error logging
- Critical failures: console error + Parse log entry

## Integration Pattern
Follows existing cron job pattern in `backend/server.js`:
```javascript
cron.schedule('0 * * * *', async () => {
  console.log('[cron] Starting paid invoice verification...');
  const stats = await verifyPaidInvoices();
  console.log(`[cron] Verification complete:`, stats);
});
```