#!/usr/bin/env node
/**
 * Test Google Docs Export Functionality
 */

import { docsService } from './integrations/google/docs';
import { driveService } from './integrations/google/drive';

const sampleMarkdown = `# Offer Letter

**Date:** November 7, 2025
**Candidate:** John Doe

Dear John,

We are pleased to offer you the position of **Senior Software Engineer** at HR Command Center.

## Compensation

- **Base Salary:** $180,000 per year
- **Equity:** 0.25% stock options
- **Sign-on Bonus:** $10,000

## Benefits

- Health, dental, and vision insurance
- 401(k) matching up to 4%
- Unlimited PTO policy
- Remote work flexibility

## Work Arrangement

- **Location:** Remote (United States)
- **Start Date:** December 1, 2025
- **Reports To:** VP of Engineering

We're excited to have you join our team!

Best regards,
**Matthew O'Donnell**
*Chief People Officer*`;

async function testExport() {
  console.log('🧪 Testing Google Docs Export...\n');

  try {
    // Step 1: Create folder structure
    console.log('1️⃣ Creating folder structure...');
    const folders = await driveService.createHRFolderStructure();
    console.log(`✓ Folders created/verified`);
    console.log(`   Root: ${folders.root.webViewLink}\n`);

    // Step 2: Export document
    console.log('2️⃣ Exporting sample offer letter...');
    const doc = await docsService.createDocumentFromMarkdown({
      title: 'Test_Offer_Letter_2025-11-07',
      content: sampleMarkdown,
      folderId: folders.offer_letters?.id
    });

    console.log('✓ Document created successfully!\n');
    console.log('📄 Document Details:');
    console.log(`   Title: ${doc.title}`);
    console.log(`   View: ${doc.webViewLink}`);
    console.log(`   Edit: ${doc.editLink}\n`);

    console.log('✅ Test completed successfully!');
    console.log('\nYou can now:');
    console.log('1. Visit the edit link above to see the formatted Google Doc');
    console.log('2. Check your "HR Command Center/Offer Letters" folder in Google Drive');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testExport();
