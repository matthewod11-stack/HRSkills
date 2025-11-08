# Google Integration Tests

This directory contains test scripts for Google Workspace integrations (Docs, Drive, Auth).

## Test Files

- `test-google-auth.js` - Tests Google OAuth authentication flow
- `test-docs-api.js` - Tests Google Docs API operations
- `test-docs-via-drive.js` - Tests Google Docs access via Drive API
- `test-drive.js` - Tests Google Drive operations
- `test-create-and-share.js` - Tests document creation and sharing
- `test-create-in-shared.js` - Tests creating documents in shared folders
- `test-shared-folder.js` - Tests shared folder operations
- `test-export.ts` - Tests document export functionality

## Running Tests

```bash
# From the root directory
node tests/google-integration/test-google-auth.js
node tests/google-integration/test-docs-api.js
# etc.
```

## Prerequisites

- Google OAuth credentials configured
- `.env` file with required Google API keys
- Required npm packages installed

