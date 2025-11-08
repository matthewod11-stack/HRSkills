require('dotenv').config({ path: '/Users/mattod/Desktop/HRSkills/.env.local' });
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');

async function testDocsAPI() {
  console.log('Testing Google Docs API access...\n');

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

    console.log('Service account:', credentials.client_email);
    console.log('Requesting access token...');

    // Test authentication
    await auth.authorize();
    console.log('✓ Authentication successful\n');

    // Create a simple Google Doc
    const docs = google.docs({ version: 'v1', auth });

    console.log('Creating test document...');
    const createResponse = await docs.documents.create({
      requestBody: {
        title: 'Test Document from HR Skills'
      }
    });

    const documentId = createResponse.data.documentId;
    console.log('✓ Document created!');
    console.log('Document ID:', documentId);
    console.log('View link:', `https://docs.google.com/document/d/${documentId}/view`);
    console.log('Edit link:', `https://docs.google.com/document/d/${documentId}/edit`);

    // Add some text
    console.log('\nAdding content...');
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: 'Hello from HR Command Center!\n\nThis is a test document.'
            }
          }
        ]
      }
    });

    console.log('✓ Content added successfully!');
    console.log('\n✅ All tests passed! Google Docs integration is working.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testDocsAPI();
