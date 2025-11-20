import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import { env } from '../../webapp/env.mjs';

async function cleanupDrive() {
  console.log('Cleaning up service account Drive...\n');

  try {
    const credentialsPath = env.GOOGLE_CREDENTIALS_PATH;
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });

    // List all files
    console.log('Fetching all files...');
    const response = await drive.files.list({
      pageSize: 1000,
      fields: 'files(id, name, mimeType, size, createdTime)'
    });

    const files = response.data.files || [];
    console.log(`Found ${files.length} files\n`);

    if (files.length === 0) {
      console.log('No files to delete.');
      return;
    }

    // Show files
    let totalSize = 0;
    files.forEach(file => {
      const size = parseInt(file.size || 0);
      totalSize += size;
      console.log(`- ${file.name} (${Math.round(size / 1024)}KB)`);
    });

    console.log(`\nTotal size: ${Math.round(totalSize / 1024 / 1024)}MB`);
    console.log(`\nDeleting all files...`);

    // Delete all files
    for (const file of files) {
      try {
        await drive.files.delete({ fileId: file.id });
        console.log(`✓ Deleted: ${file.name}`);
      } catch (err) {
        console.log(`✗ Failed to delete: ${file.name}`);
      }
    }

    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

cleanupDrive();
