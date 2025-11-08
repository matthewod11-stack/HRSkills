require('dotenv').config({ path: '/Users/mattod/Desktop/HRSkills/.env.local' });
const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');

async function testSharedFolder() {
  console.log('Testing access to shared folder...\n');

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
    console.log('\nSearching for shared "HR Command Center" folder...');

    // Search for folders shared with the service account
    const response = await drive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and name='HR Command Center'",
      fields: 'files(id, name, webViewLink, capabilities)',
      pageSize: 10
    });

    const folders = response.data.files || [];
    console.log(`Found ${folders.length} matching folder(s)\n`);

    if (folders.length === 0) {
      console.log('❌ No shared folder found.');
      console.log('\nPlease make sure you:');
      console.log('1. Created a folder named "HR Command Center" in your Google Drive');
      console.log('2. Shared it with: hrcommand@hrcommandcenter-477518.iam.gserviceaccount.com');
      console.log('3. Gave "Editor" permissions');
      return;
    }

    for (const folder of folders) {
      console.log('✓ Found folder:', folder.name);
      console.log('  ID:', folder.id);
      console.log('  Link:', folder.webViewLink);
      console.log('  Can edit:', folder.capabilities?.canEdit || false);
      console.log();

      // Try to create a test file in this folder
      console.log('Testing: Creating a document in this folder...');
      try {
        const testDoc = await drive.files.create({
          requestBody: {
            name: 'Test Document - ' + new Date().toISOString(),
            mimeType: 'application/vnd.google-apps.document',
            parents: [folder.id]
          },
          fields: 'id, webViewLink'
        });

        console.log('✅ SUCCESS! Document created in your Drive!');
        console.log('   Document ID:', testDoc.data.id);
        console.log('   Link:', testDoc.data.webViewLink.replace('/view', '/edit'));
        console.log('\n🎉 Integration is working! Documents will be created in your Drive.');

      } catch (createError) {
        console.log('❌ Failed to create document:', createError.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response?.data) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testSharedFolder();
