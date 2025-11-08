require('dotenv').config({ path: '/Users/mattod/Desktop/HRSkills/.env.local' });
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');

console.log('Testing Google authentication...\n');

try {
  const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

  if (!credentialsPath) {
    throw new Error('GOOGLE_CREDENTIALS_PATH not set in .env.local');
  }

  if (!fs.existsSync(credentialsPath)) {
    throw new Error(`Credentials file not found at: ${credentialsPath}`);
  }

  const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

  const auth = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/spreadsheets'
    ]
    // Note: subject/domain-wide delegation not needed for personal use
    // Only use if you need to impersonate workspace users
  });

  console.log('✓ Google client initialized successfully');
  console.log('Service account email:', credentials.client_email);

  // Test Drive API access
  const drive = google.drive({ version: 'v3', auth });

  drive.about.get({ fields: 'user' }, (err, response) => {
    if (err) {
      console.error('\n✗ Drive API Error:', err.message);
      process.exit(1);
    }

    console.log('\n✓ Drive API access confirmed!');
    console.log('Authenticated as:', response.data.user?.emailAddress || 'Service Account');

    // List a few files to verify access
    drive.files.list({
      pageSize: 5,
      fields: 'files(id, name, mimeType)'
    }, (err, res) => {
      if (err) {
        console.error('\n✗ Error listing files:', err.message);
        process.exit(1);
      }

      console.log('\n✓ Can access Drive files!');
      console.log('\nRecent files:');
      const files = res.data.files;
      if (files.length === 0) {
        console.log('  No files found (remember to share folders with service account email above)');
      } else {
        files.forEach(file => {
          console.log(`  - ${file.name} (${file.mimeType})`);
        });
      }
    });
  });

} catch (error) {
  console.error('✗ Error:', error.message);
  process.exit(1);
}
