# Technical Guide: users Workflow

## Overview
This workflow is responsible for **user-related operations**. Based on the directory structure, this appears to be a placeholder or work-in-progress workflow with no implementation files currently present.

## Purpose
Manage user data and operations in Parse, potentially including:
- User synchronization
- User role management
- User authentication
- User activity tracking

---

## Current State

**Status**: Not implemented or placeholder only

- Directory exists: `/home/ubuntu/prod/adti/backend/cloud/workflows/users/`
- Contains only: `logs/` directory
- No JavaScript files present
- No master orchestrator
- No step implementations

---

## Expected Implementation

Based on the pattern of other workflows and the name "users", the expected implementation would include:

### Expected Node Sequence

#### Node 0: Master Orchestrator (00-master.js)
**Expected File**: `00-master.js`

**Expected Actions**:
1. **Initialization**:
   - Load environment variables
   - Initialize Parse SDK
   - Clear logs directory

2. **Workflow Orchestration**:
   - Register Cloud Functions for user operations
   - Coordinate user-related tasks

3. **Trigger Support**:
   - Cloud Function triggers
   - CLI execution
   - Scheduled triggers (optional)

#### Possible Cloud Functions

Based on common user management needs:

1. **createUser**: Create a new user with specific roles
2. **updateUser**: Update user information
3. **deleteUser**: Remove a user
4. **syncUsers**: Synchronize users from external source
5. **getUserInfo**: Retrieve user information
6. **setUserRole**: Change user role/permissions

#### Node 1: User Synchronizer (01-syncUsers.js)
**Expected File**: `01-syncUsers.js`

**Expected Actions**:
1. **Fetch Users**:
   - Query external database for users
   - Or query Parse for existing users

2. **Synchronize**:
   - Create missing users
   - Update changed users
   - Deactivate removed users

3. **Role Management**:
   - Assign appropriate roles
   - Set permissions

---

## Expected States

### Workflow States
- **Initializing**: Loading configuration
- **Processing**: User operations in progress
- **Completed**: Operations finished successfully
- **Error**: Operations failed

### User States
- **Active**: User can log in and perform actions
- **Inactive**: User cannot log in
- **Pending**: User created but not yet activated
- **Suspended**: User temporarily disabled

---

## Relationship to Other Workflows

This workflow would likely be **used by**:

1. **All workflows**: For authentication and authorization
2. **import-invoice**: May need user context for imports
3. **generate-relances**: May need user context for generation
4. **send-emails**: May need user context for sending

**Possible Integration Scenarios**:

1. **Authentication Middleware**: User validation for Cloud Functions
2. **Audit Logging**: Track which user performed which actions
3. **Permission Checking**: Verify user has rights to perform operations
4. **User Context**: Provide user information to other workflows

---

## Current Implementation Status

**Files Present**:
```
users/
└── logs/  (empty directory)
```

**Files Missing** (Expected):
- `00-master.js` - Main orchestrator
- Cloud Function implementations
- User management logic

---

## Existing User Management

In the current codebase, user management appears to be handled by:

1. **Parse User Class**: Built-in Parse user management
2. **Cloud Function Authentication**: Each Cloud Function checks `request.master` or `request.user`
3. **Master Key Usage**: Most workflows use master key for operations

**Example Authentication Pattern** (from other workflows):
```javascript
Parse.Cloud.define("someFunction", async (request) => {
    if (!request.master && !request.user) {
        throw new Error("Non autorisé - cette fonction nécessite un utilisateur authentifié ou le master key");
    }
    // Function logic
});
```

---

## Recommendations

1. **Implement the workflow** following the pattern of other workflows:
   - Create `00-master.js` with Cloud Function registration
   - Create functions for user operations
   - Use consistent authentication patterns

2. **Centralize user management**:
   - Create reusable functions for user operations
   - Standardize authentication checks
   - Centralize role/permission management

3. **Consider needs**:
   - What user operations are needed?
   - Should users be synchronized from external source?
   - What roles/permissions are required?
   - How should user activity be tracked?

4. **Integrate with existing**:
   - Ensure compatibility with existing authentication patterns
   - Don't break existing Cloud Functions
   - Maintain master key functionality

---

## Expected Configuration

### Environment Variables

```bash
# Parse Configuration
PARSE_APP_ID=
PARSE_JAVASCRIPT_KEY=
PARSE_MASTER_KEY=
PARSE_SERVER_URL=

# User Management
ADMIN_ROLE_NAME=admin
USER_ROLE_NAME=user
DEFAULT_USER_ROLE=user

# External User Source (if applicable)
EXTERNAL_USER_DB_URI=
EXTERNAL_USER_DB_TABLE=
```

---

## Expected Dependencies

### Internal
- `../../utils/logger` - For logging

### External
- `parse/node` - Parse SDK (includes User class)
- `dotenv` - Environment variables

---

## File Structure

```
users/
├── 00-master.js              # Main orchestrator (MISSING)
├── 01-syncUsers.js           # User synchronizer (MISSING)
├── 02-manageRoles.js         # Role management (MISSING)
├── ...                       # Other user-related files
├── logs/                     # Runtime logs (exists, empty)
└── specs/
    └── technical-guide.md    # This file
```

---

## Notes

1. This workflow appears to be **not yet implemented** or is a placeholder.

2. User management in the current system relies on:
   - Parse's built-in User class
   - Master key for administrative operations
   - Individual authentication checks in each Cloud Function

3. This workflow could provide:
   - Centralized user management
   - Standardized authentication
   - User synchronization
   - Role/permission management

4. Until implemented, user management is handled by Parse's built-in functionality and individual Cloud Function checks.
