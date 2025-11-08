require('dotenv').config({ path: '/Users/mattod/Desktop/HRSkills/.env.local' });
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');

async function testCreateAndShare() {
  console.log('Testing: Create doc and transfer ownership to user...\n');

  try {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    const userEmail = process.env.GOOGLE_ADMIN_EMAIL; // Your email

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive']
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('Service account:', credentials.client_email);
    console.log('User email:', userEmail);
    console.log();

    // Create a test doc
    console.log('1. Creating test document...');
    const createResponse = await drive.files.create({
      requestBody: {
        name: 'Test Document - HR Skills',
        mimeType: 'application/vnd.google-apps.document'
      },
      fields: 'id, webViewLink'
    });

    const fileId = createResponse.data.id;
    console.log('✓ Document created:', fileId);
    console.log('   Link:', createResponse.data.webViewLink);

    // Share with user and transfer ownership
    console.log('\n2. Sharing with you and transferring ownership...');
    await drive.permissions.create({
      fileId,
      requestBody: {
        type: 'user',
        role: 'owner',
        emailAddress: userEmail
      },
      transferOwnership: true
    });

    console.log('✓ Ownership transferred to:', userEmail);
    console.log('\n✅ Success! The document is now in your Drive.');
    console.log('   Visit:', createResponse.data.webViewLink.replace('/view', '/edit'));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testCreateAndShare();
