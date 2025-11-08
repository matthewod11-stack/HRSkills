require('dotenv').config({ path: '/Users/mattod/Desktop/HRSkills/.env.local' });
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');

async function checkQuota() {
  console.log('Checking Drive quota usage...\n');

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
    console.log();

    // Get quota info
    const about = await drive.about.get({
      fields: 'storageQuota, user'
    });

    const quota = about.data.storageQuota;
    console.log('Storage Quota Information:');
    console.log('  Limit:', quota.limit ? (parseInt(quota.limit) / 1024 / 1024 / 1024).toFixed(2) + ' GB' : 'Unlimited');
    console.log('  Usage:', quota.usage ? (parseInt(quota.usage) / 1024 / 1024).toFixed(2) + ' MB' : '0 MB');
    console.log('  Usage in Drive:', quota.usageInDrive ? (parseInt(quota.usageInDrive) / 1024 / 1024).toFixed(2) + ' MB' : '0 MB');
    console.log('  Usage in Drive Trash:', quota.usageInDriveTrash ? (parseInt(quota.usageInDriveTrash) / 1024 / 1024).toFixed(2) + ' MB' : '0 MB');
    console.log();

    // List files including trashed
    console.log('Checking for files (including trash)...');
    const allFiles = await drive.files.list({
      q: '',
      fields: 'files(id, name, mimeType, size, trashed)',
      pageSize: 1000
    });

    const files = allFiles.data.files || [];
    const trashedFiles = files.filter(f => f.trashed);
    const activeFiles = files.filter(f => !f.trashed);

    console.log(`  Active files: ${activeFiles.length}`);
    console.log(`  Trashed files: ${trashedFiles.length}`);
    console.log();

    if (trashedFiles.length > 0) {
      console.log('Files in trash:');
      trashedFiles.forEach(f => {
        const size = f.size ? (parseInt(f.size) / 1024).toFixed(2) + ' KB' : '0 KB';
        console.log(`  - ${f.name} (${size})`);
      });
      console.log('\n💡 Try emptying trash to free up quota.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

checkQuota();
