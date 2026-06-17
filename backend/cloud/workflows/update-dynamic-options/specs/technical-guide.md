# Technical Guide: update-dynamic-options Workflow

## Overview
This workflow is responsible for **updating dynamic options** in the system. Based on the directory structure, this appears to be a placeholder or work-in-progress workflow with no implementation files currently present.

## Purpose
Manage dynamic configuration options that can be updated without code changes, potentially including:
- Dropdown options for various fields
- Configuration settings
- Business rules parameters
- System preferences

---

## Current State

**Status**: Not implemented or placeholder only

- Directory exists: `/home/ubuntu/prod/adti/backend/cloud/workflows/update-dynamic-options/`
- Contains only: `logs/` directory
- No JavaScript files present
- No master orchestrator
- No step implementations

---

## Expected Implementation

Based on the pattern of other workflows and the name "update-dynamic-options", the expected implementation would include:

### Expected Node Sequence

#### Node 0: Master Orchestrator (00-master.js)
**Expected File**: `00-master.js`

**Expected Actions**:
1. **Initialization**:
   - Load environment variables
   - Initialize Parse SDK
   - Clear logs directory

2. **Workflow Orchestration**:
   - Register Cloud Function (e.g., `updateDynamicOptions`)
   - Coordinate option update process

3. **Trigger Support**:
   - Cloud Function trigger
   - CLI execution
   - Scheduled trigger (for periodic updates)

#### Node 1: Option Fetcher (01-fetchOptions.js)
**Expected File**: `01-fetchOptions.js`

**Expected Actions**:
1. **Fetch from External Source**:
   - Query external database for dynamic options
   - Or read from configuration files
   - Or retrieve from API

2. **Data Transformation**:
   - Map external data to Parse format
   - Validate option values

3. **Return**: Dynamic options data

#### Node 2: Option Updater (02-updateOptions.js)
**Expected File**: `02-updateOptions.js`

**Expected Actions**:
1. **For each option**:
   - Check if option exists in Parse
   - If exists:
     - Compare values
     - Update if changed
   - If not exists:
     - Create new option

2. **Cache Management**:
   - Update application cache
   - Notify dependent systems

3. **Activity Logging**:
   - Log option changes
   - Track updated/created counts

---

## Expected States

### Workflow States
- **Initializing**: Loading configuration
- **Fetching**: Retrieving options from source
- **Updating**: Applying changes to Parse
- **Completed**: Update finished successfully
- **Error**: Update failed

### Option States
- **Current**: Option value is up-to-date
- **Updated**: Option value was changed
- **New**: Option was created
- **Deprecated**: Option is no longer used

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
│ STEP 1: fetchOptions()                                       │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Fetch options from external source                       │ │
│ │ - SQLite database                                        │ │
│ │ - Configuration files                                     │ │
│ │ - API endpoint                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
│         ↓                                                    │
│ Return: { options: {...} }                                  │
└─────────────────────────────────────────────────────────────┘
       ↓
[Master: Collect etape1 stats]
       ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: updateOptions()                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ For each option:                                         │ │
│ │   Query Parse for existing option                         │ │
│ │   IF EXISTS:                                             │ │
│ │     Compare values                                       │ │
│ │     Update if changed                                    │ │
│ │   ELSE:                                                 │ │
│ │     Create new option                                    │ │
│ │   Log change                                             │ │
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

## Possible Dynamic Options

Based on the application context (invoice management), possible dynamic options might include:

1. **Invoice Statuses**:
   - Paid, Unpaid, Partial, Cancelled, etc.

2. **Payment Methods**:
   - Credit Card, Bank Transfer, Check, Cash, etc.

3. **Sequence Types**:
   - Relance, Suivi, Notification, etc.

4. **Contact Types**:
   - Client, Supplier, Employee, etc.

5. **Priority Levels**:
   - Low, Medium, High, Urgent

6. **Categories**:
   - Various categorization options

7. **Templates**:
   - Email templates
   - Document templates

8. **System Settings**:
   - Default values
   - Thresholds
   - Timeouts

---

## Relationship to Other Workflows

This workflow would likely be **used by**:

1. **All workflows**: For accessing dynamic configuration
2. **import-invoice**: For invoice status options
3. **generate-relances**: For sequence configuration
4. **generate-suivi**: For follow-up configuration

**Possible Integration Scenarios**:

1. **Centralized Configuration**: All workflows read from dynamic options
2. **Caching**: Options cached for performance
3. **Hot Reload**: Options updated without restart
4. **Validation**: Options validated before use

---

## Current Implementation Status

**Files Present**:
```
update-dynamic-options/
└── logs/  (empty directory)
```

**Files Missing** (Expected):
- `00-master.js` - Main orchestrator
- `01-fetchOptions.js` - Option fetcher
- `02-updateOptions.js` - Option updater

---

## Existing Dynamic Data

In the current codebase, dynamic options appear to be handled by:

1. **Hardcoded Values**: Some values are hardcoded in workflows
2. **Database Fields**: Some options stored in Parse classes
3. **Configuration Files**: Some options in environment variables

**Example from import-invoice workflow**:
- Statuses are fetched from SQLite (`02-fetchStatuts.js`)
- Employees are fetched from SQLite (`03-fetchEmployes.js`)

---

## Recommendations

1. **Implement the workflow** following the pattern of other workflows:
   - Create `00-master.js` with Cloud Function registration
   - Create step files for each phase
   - Use consistent patterns

2. **Centralize dynamic data**:
   - Create a dedicated Parse class for dynamic options
   - Standardize option access
   - Implement caching for performance

3. **Consider needs**:
   - What options need to be dynamic?
   - Where should options be stored?
   - How often should options be updated?
   - Who can update options?

4. **Integrate with existing**:
   - Replace hardcoded values with dynamic options
   - Ensure backward compatibility
   - Maintain existing functionality

---

## Expected Configuration

### Environment Variables

```bash
# Parse Configuration
PARSE_APP_ID=
PARSE_JAVASCRIPT_KEY=
PARSE_MASTER_KEY=
PARSE_SERVER_URL=

# Options Source
OPTIONS_DB_URI=
OPTIONS_DB_TABLE=
OPTIONS_API_ENDPOINT=

# Update Settings
OPTIONS_UPDATE_INTERVAL=24h  # How often to check for updates
OPTIONS_CACHE_TTL=1h         # How long to cache options
```

---

## Expected Dependencies

### Internal
- `../../utils/logger` - For logging

### External
- `parse/node` - Parse SDK
- `better-sqlite3` - SQLite operations (if using SQLite)
- `axios` or similar - API calls (if using API)
- `dotenv` - Environment variables

---

## File Structure

```
update-dynamic-options/
├── 00-master.js              # Main orchestrator (MISSING)
├── 01-fetchOptions.js        # Option fetcher (MISSING)
├── 02-updateOptions.js       # Option updater (MISSING)
├── logs/                     # Runtime logs (exists, empty)
└── specs/
    └── technical-guide.md    # This file
```

---

## Notes

1. This workflow appears to be **not yet implemented** or is a placeholder.

2. Dynamic options in the current system are:
   - Fetched on-demand (e.g., statuses, employees in import-invoice)
   - Hardcoded in workflows
   - Stored in Parse classes

3. This workflow could provide:
   - Centralized dynamic option management
   - Periodic synchronization
   - Caching for performance
   - Standardized access patterns

4. Until implemented, dynamic options are handled by individual workflows as needed.
