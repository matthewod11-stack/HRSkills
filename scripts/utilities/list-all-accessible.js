require('dotenv').config({ path: '/Users/mattod/Desktop/HRSkills/.env.local' });
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');

async function listAllAccessible() {
  console.log('Listing ALL files/folders accessible to service account...\n');

  try {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('Service account:', credentials.client_email);
    console.log('\nFetching all accessible files...');

    // List everything - both owned and shared
    const response = await drive.files.list({
      q: "trashed=false",
      fields: 'files(id, name, mimeType, owners, shared, capabilities)',
      pageSize: 100,
      orderBy: 'modifiedTime desc'
    });

    const files = response.data.files || [];
    console.log(`\nFound ${files.length} accessible files/folders:\n`);

    if (files.length === 0) {
      console.log('No files found.');
      console.log('\nThis means the folder share may not have propagated yet.');
      console.log('Wait 30 seconds and try again.');
      return;
    }

    // Group by type
    const folders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder');
    const docs = files.filter(f => f.mimeType === 'application/vnd.google-apps.document');
    const others = files.filter(f => f.mimeType !== 'application/vnd.google-apps.folder' && f.mimeType !== 'application/vnd.google-apps.document');

    if (folders.length > 0) {
      console.log('📁 FOLDERS:');
      folders.forEach(f => {
        const isShared = f.shared ? '🔗 SHARED' : '   owned';
        console.log(`  ${isShared} - ${f.name}`);
        console.log(`      ID: ${f.id}`);
        console.log(`      Can edit: ${f.capabilities?.canEdit}`);
      });
      console.log();
    }

    if (docs.length > 0) {
      console.log('📄 DOCUMENTS:');
      docs.forEach(f => {
        const isShared = f.shared ? '🔗 SHARED' : '   owned';
        console.log(`  ${isShared} - ${f.name}`);
      });
      console.log();
    }

    if (others.length > 0) {
      console.log('📎 OTHER FILES:');
      others.forEach(f => {
        console.log(`  - ${f.name} (${f.mimeType})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listAllAccessible();
