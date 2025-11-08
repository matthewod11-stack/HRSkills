require('dotenv').config({ path: '/Users/mattod/Desktop/HRSkills/.env.local' });
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');

async function testCreateInShared() {
  console.log('Testing: Create document in shared folder...\n');

  try {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    const folderId = process.env.HR_DRIVE_FOLDER_ID;

    const auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/documents']
    });

    const drive = google.drive({ version: 'v3', auth });
    const docs = google.docs({ version: 'v1', auth });

    console.log('Service account:', credentials.client_email);
    console.log('Shared folder ID:', folderId);
    console.log();

    // Create document in shared folder
    console.log('1. Creating Google Doc in your shared folder...');
    const createResponse = await drive.files.create({
      requestBody: {
        name: 'Test Offer Letter - ' + new Date().toISOString().split('T')[0],
        mimeType: 'application/vnd.google-apps.document',
        parents: [folderId]
      },
      fields: 'id, webViewLink'
    });

    const documentId = createResponse.data.id;
    console.log('✓ Document created!');
    console.log('   ID:', documentId);
    console.log('   Link:', createResponse.data.webViewLink);

    // Add content using Docs API
    console.log('\n2. Adding formatted content with Docs API...');
    await docs.documents.batchUpdate({
      documentId,
      requestBody: {
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: 'Offer Letter\n\nDate: November 7, 2025\nCandidate: John Doe\n\nDear John,\n\nWe are pleased to offer you the position of Senior Software Engineer.\n\nCompensation:\n- Base Salary: $180,000\n- Equity: 0.25%\n- Sign-on Bonus: $10,000\n\nBest regards,\nMatthew O\'Donnell'
            }
          }
        ]
      }
    });

    console.log('✓ Content added successfully!');
    console.log('\n✅ SUCCESS! Full integration working!');
    console.log('   Visit:', createResponse.data.webViewLink.replace('/view', '/edit'));
    console.log('\n🎉 Documents will be created in your Drive at:');
    console.log('   https://drive.google.com/drive/folders/' + folderId);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testCreateInShared();
