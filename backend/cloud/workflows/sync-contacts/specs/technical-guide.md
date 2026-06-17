# Technical Guide: sync-contacts Workflow

## Overview
This workflow is responsible for **synchronizing contacts** between the external database and Parse. Based on the directory structure, this appears to be a placeholder or work-in-progress workflow with no implementation files currently present.

## Purpose
Synchronize contact data from external sources (likely SQLite database) into Parse, ensuring:
- Contacts are created for all interlocutors
- Contact information is up-to-date
- Relationships between contacts and other entities are maintained

---

## Current State

**Status**: Not implemented or placeholder only

- Directory exists: `/home/ubuntu/prod/adti/backend/cloud/workflows/sync-contacts/`
- Contains only: `logs/` directory
- No JavaScript files present
- No master orchestrator
- No step implementations

---

## Expected Implementation

Based on the pattern of other workflows and the name "sync-contacts", the expected implementation would include:

### Expected Node Sequence

#### Node 0: Master Orchestrator (00-master.js)
**Expected File**: `00-master.js`

**Expected Actions**:
1. **Initialization**:
   - Load environment variables
   - Initialize Parse SDK
   - Clear logs directory

2. **Workflow Orchestration**:
   - Register Cloud Function (e.g., `syncContacts`)
   - Coordinate steps for contact synchronization

3. **Trigger Support**:
   - Cloud Function trigger
   - CLI execution
   - Cron trigger (optional)

#### Node 1: Contact Fetcher (01-fetchContacts.js)
**Expected File**: `01-fetchContacts.js`

**Expected Actions**:
1. **SQLite Query**:
   - Query interlocutor table for all contacts
   - Select fields: id, nom, prenom, email, telephone, etc.

2. **Data Transformation**:
   - Map SQLite fields to Parse Contact class fields
   - Handle null/empty values

3. **Return**: Array of contact data

#### Node 2: Contact Synchronizer (02-syncContacts.js)
**Expected File**: `02-syncContacts.js`

**Expected Actions**:
1. **For each contact from SQLite**:
   - Check if Contact exists in Parse (by email or external ID)
   - If exists:
     - Compare fields
     - Update if changed
   - If not exists:
     - Create new Contact
     - Set all fields

2. **Relationship Handling**:
   - Link contacts to dossiers (folders)
   - Link contacts to companies
   - Handle multiple contacts per dossier

3. **Activity Logging**:
   - Log synchronization operations
   - Track created/updated/skipped counts

---

## Expected States

### Workflow States
- **Initializing**: Loading configuration
- **Fetching**: Retrieving contacts from external DB
- **Synchronizing**: Creating/updating contacts in Parse
- **Completed**: Synchronization finished
- **Error**: Synchronization failed

### Contact States
- **New**: Contact exists in external DB but not in Parse
- **Existing**: Contact exists in both systems
- **Updated**: Contact was modified in external DB
- **Unchanged**: Contact data matches in both systems

---

## Expected Data Flow

```
Trigger (manual/cron/cloud-function)
       ↓
[Master: Clear logs]
       ↓
[Master: Initialize stats]
       ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: fetchContacts()                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Open SQLite database                                    │ │
│ │ Query interlocutor table                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ Return: { contacts: [...] }                                  │
└─────────────────────────────────────────────────────────────┘
       ↓
[Master: Collect etape1 stats]
       ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: syncContacts()                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ For each contact from SQLite:                            │ │
│ │   Query Parse: Contact with email or externalId          │ │
│ │   IF EXISTS:                                             │ │
│ │     Compare fields                                       │ │
│ │     Update if changed                                    │ │
│ │   ELSE:                                                 │ │
│ │     Create new Contact                                   │ │
│ │   Link to dossier/company                                │ │
│ │   Create Activite log                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ Return: { stats: { created, updated, skipped, errors } }     │
└─────────────────────────────────────────────────────────────┘
       ↓
[Master: Collect etape2 stats]
       ↓
[Master: Calculate total duration]
       ↓
Return aggregated statistics
```

---

## Expected Configuration

### Environment Variables

```bash
# Parse Configuration
PARSE_APP_ID=
PARSE_JAVASCRIPT_KEY=
PARSE_MASTER_KEY=
PARSE_SERVER_URL=

# Database Configuration
# SQLite path would be similar to other workflows
EXTERNAL_DB_URI=
TEST_DB_PATH=

# General
NODE_ENV=production
```

---

## Expected Dependencies

### Internal
- `../../utils/logger` - For logging

### External
- `parse/node` - Parse SDK
- `better-sqlite3` - SQLite operations
- `dotenv` - Environment variables

---

## Relationship to Other Workflows

This workflow would likely be **related to**:

1. **import-invoice**: Which already handles contact creation in step 4.5 (`04-createContactsWithRelations.js`)
2. **generate-suivi**: Which uses contacts for follow-up emails
3. **send-emails**: Which sends emails to contacts

**Possible Integration Scenarios**:

1. **Standalone Workflow**: Runs independently to sync all contacts
2. **Part of import-invoice**: Could be called by import-invoice instead of step 4.5
3. **Periodic Sync**: Runs on a schedule to keep contacts up-to-date
4. **On-demand Sync**: Triggered manually when needed

---

## Current Implementation Status

**Files Present**:
```
sync-contacts/
└── logs/  (empty directory)
```

**Files Missing** (Expected):
- `00-master.js` - Main orchestrator
- `01-fetchContacts.js` - Contact fetcher
- `02-syncContacts.js` - Contact synchronizer
- Possibly more steps depending on complexity

---

## Recommendations

1. **Implement the workflow** following the pattern of other workflows:
   - Create `00-master.js` with Cloud Function registration
   - Create step files for each phase of synchronization
   - Use consistent logging and error handling

2. **Reuse existing logic**:
   - The contact creation logic in `import-invoice/04-createContactsWithRelations.js` could be extracted and reused

3. **Consider integration**:
   - Decide if this should be standalone or integrated with import-invoice
   - Consider if it should be triggered automatically or manually

4. **Define scope**:
   - Full sync (all contacts) vs. incremental sync (changed contacts only)
   - Frequency of synchronization
   - Handling of deleted contacts

---

## File Structure

```
sync-contacts/
├── 00-master.js              # Main orchestrator (MISSING)
├── 01-fetchContacts.js      # Step 1: Contact fetcher (MISSING)
├── 02-syncContacts.js       # Step 2: Contact synchronizer (MISSING)
├── logs/                     # Runtime logs (exists, empty)
└── specs/
    └── technical-guide.md    # This file
```

---

## Notes

1. This workflow appears to be **not yet implemented** or is a placeholder.

2. The functionality for contact synchronization **already exists** in the `import-invoice` workflow (step 4.5).

3. This workflow could be:
   - A refactoring of the existing contact creation logic
   - A standalone sync process for contacts only
   - A complement to import-invoice for ongoing synchronization

4. Until implemented, contact synchronization is handled by the `import-invoice` workflow.
