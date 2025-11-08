# Scripts Directory

This directory contains utility scripts organized by purpose.

## Directory Structure

### `/deployment`
Scripts for deploying and managing the application in production.

- `deploy.sh` - Main deployment script
- `rollback.sh` - Rollback to previous version

### `/migration`
Data migration and transformation scripts.

- `migrate-data-sources.js` - Migrates data source configurations
- `migrate-reviews.js` - Migrates review data

### `/google-integration`
Scripts for managing Google Workspace integrations.

- `setup-hr-drive-folder.md` - Guide for setting up HR Drive folder structure
- `sync-templates-to-drive.ts` - Syncs document templates to Google Drive

### `/utilities`
General-purpose utility scripts.

- `check-quota.js` - Checks Google API quota usage
- `cleanup-drive.js` - Cleans up old files from Google Drive
- `list-all-accessible.js` - Lists accessible Google Drive files

## Usage

### Deployment
```bash
./scripts/deployment/deploy.sh
./scripts/deployment/rollback.sh
```

### Migrations
```bash
node scripts/migration/migrate-data-sources.js
node scripts/migration/migrate-reviews.js
```

### Google Integration
```bash
npx ts-node scripts/google-integration/sync-templates-to-drive.ts
```

### Utilities
```bash
node scripts/utilities/check-quota.js
node scripts/utilities/cleanup-drive.js
node scripts/utilities/list-all-accessible.js
```

## Environment Variables

Most scripts require environment variables to be set. See `.env.example` for required variables.

