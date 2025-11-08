require('dotenv').config({ path: '/Users/mattod/Desktop/HRSkills/.env.local' });
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');

async function testDocsViaDrive() {
  console.log('Testing Google Docs creation via Drive API...\n');

  try {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/documents'
      ]
    });

    const drive = google.drive({ version: 'v3', auth });

    console.log('Creating Google Doc via Drive API...');

    // Create a Google Doc using Drive API
    const response = await drive.files.create({
      requestBody: {
        name: 'Test Document via Drive API',
        mimeType: 'application/vnd.google-apps.document'
      },
      fields: 'id, name, webViewLink'
    });

    console.log('✓ Document created successfully!');
    console.log('Document ID:', response.data.id);
    console.log('Name:', response.data.name);
    console.log('View link:', response.data.webViewLink);
    console.log('Edit link:', response.data.webViewLink.replace('/view', '/edit'));

    // Now try to edit it with Docs API
    const docs = google.docs({ version: 'v1', auth });
    const documentId = response.data.id;

    console.log('\nAttempting to add content via Docs API...');
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: 'Hello from HR Command Center!\n\nThis document was created via Drive API and edited via Docs API.'
            }
          }
        ]
      }
    });

    console.log('✓ Content added successfully!');
    console.log('\n✅ Both Drive and Docs APIs are working!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testDocsViaDrive();
