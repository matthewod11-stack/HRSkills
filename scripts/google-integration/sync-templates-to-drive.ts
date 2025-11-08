#!/usr/bin/env tsx
/**
 * Sync Template Files to Google Drive (OAuth Version)
 *
 * This script uploads all skill reference templates from the filesystem
 * to Google Drive for easy editing and customization using OAuth authentication.
 *
 * Prerequisites:
 * - You must authenticate first via the webapp (/api/auth/google)
 * - OAuth token must exist at .google-oauth-token.json
 *
 * Usage: npx tsx scripts/sync-templates-to-drive.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { googleOAuthClient } from '../integrations/google/oauth-client';
import { docsOAuthService } from '../integrations/google/docs-oauth';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TemplateFile {
  skillName: string;
  fileName: string;
  filePath: string;
  content: string;
}

// Get all template files from skills/*/references/
function getAllTemplates(): TemplateFile[] {
  const skillsDir = path.join(__dirname, '../skills');
  const templates: TemplateFile[] = [];

  if (!fs.existsSync(skillsDir)) {
    console.error('Skills directory not found:', skillsDir);
    return [];
  }

  const skillFolders = fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const skillName of skillFolders) {
    const referencesDir = path.join(skillsDir, skillName, 'references');

    if (!fs.existsSync(referencesDir)) {
      continue;
    }

    const files = fs.readdirSync(referencesDir)
      .filter(file => file.endsWith('.md'));

    for (const fileName of files) {
      const filePath = path.join(referencesDir, fileName);
      const content = fs.readFileSync(filePath, 'utf-8');

      templates.push({
        skillName,
        fileName,
        filePath,
        content
      });
    }
  }

  return templates;
}

// Create or find a folder using OAuth
async function getOrCreateFolder(auth: any, name: string, parentId?: string): Promise<{ id: string; webViewLink: string }> {
  const drive = google.drive({ version: 'v3', auth });

  // Search for existing folder
  let query = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const searchResponse = await drive.files.list({
    q: query,
    fields: 'files(id, webViewLink)',
    pageSize: 1
  });

  if (searchResponse.data.files && searchResponse.data.files.length > 0) {
    return {
      id: searchResponse.data.files[0].id!,
      webViewLink: searchResponse.data.files[0].webViewLink!
    };
  }

  // Create new folder
  const createResponse = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    },
    fields: 'id, webViewLink'
  });

  return {
    id: createResponse.data.id!,
    webViewLink: createResponse.data.webViewLink!
  };
}

// Main sync function
async function syncTemplatesToDrive() {
  console.log('🚀 Starting template sync to Google Drive...\n');

  // Check authentication
  if (!googleOAuthClient.isAuthenticated()) {
    console.error('❌ Not authenticated with Google.');
    console.error('Please run the webapp and authenticate via /api/auth/google first.');
    console.error('Then make sure .google-oauth-token.json exists in the root directory.');
    process.exit(1);
  }

  console.log('✅ Authenticated with Google OAuth\n');

  try {
    // Refresh token if needed
    await googleOAuthClient.refreshTokenIfNeeded();
    const auth = googleOAuthClient.getAuth();

    // Step 1: Create folder structure
    console.log('📁 Creating folder structure...');
    const rootFolder = await getOrCreateFolder(auth, 'HR Command Center');
    const templatesFolder = await getOrCreateFolder(auth, 'Templates', rootFolder.id);
    console.log(`✓ Root folder: ${rootFolder.webViewLink}`);
    console.log(`✓ Templates folder: ${templatesFolder.webViewLink}\n`);

    // Step 2: Get all template files
    console.log('📄 Finding template files...');
    const templates = getAllTemplates();
    console.log(`✓ Found ${templates.length} template files across ${new Set(templates.map(t => t.skillName)).size} skills\n`);

    if (templates.length === 0) {
      console.log('No templates found. Exiting.');
      return;
    }

    // Step 3: Group by skill and create skill folders
    console.log('📤 Uploading templates to Google Drive...');
    const skillGroups = new Map<string, TemplateFile[]>();

    for (const template of templates) {
      if (!skillGroups.has(template.skillName)) {
        skillGroups.set(template.skillName, []);
      }
      skillGroups.get(template.skillName)!.push(template);
    }

    let uploadedCount = 0;
    let skippedCount = 0;

    for (const [skillName, skillTemplates] of skillGroups) {
      // Create skill subfolder
      const skillFolder = await getOrCreateFolder(auth, skillName, templatesFolder.id);
      console.log(`\n  ${skillName}/ (${skillTemplates.length} files)`);

      // Upload each template as Google Doc
      for (const template of skillTemplates) {
        try {
          // Create Google Doc from markdown
          const docTitle = template.fileName.replace('.md', '');

          const doc = await docsOAuthService.createDocumentFromMarkdown({
            title: docTitle,
            content: template.content,
            folderId: skillFolder.id
          });

          console.log(`    ✓ ${docTitle}`);
          uploadedCount++;

          // Rate limiting - wait 100ms between uploads to avoid quota issues
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error: any) {
          console.error(`    ✗ ${template.fileName}: ${error.message}`);
          skippedCount++;
        }
      }
    }

    // Step 4: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Sync Summary');
    console.log('='.repeat(60));
    console.log(`Total templates found:    ${templates.length}`);
    console.log(`Successfully uploaded:    ${uploadedCount}`);
    console.log(`Skipped/Failed:          ${skippedCount}`);
    console.log(`\n✅ Templates synced to: ${templatesFolder.webViewLink}`);
    console.log('\nYou can now edit templates directly in Google Docs!');

  } catch (error: any) {
    console.error('\n❌ Error during sync:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the sync
syncTemplatesToDrive();
