# Google Drive Templates Integration

## Overview

Your HR Skills platform now uses **Google Drive** as the template source instead of local markdown files. This allows you to:

1. **Edit templates in Google Docs** with rich formatting
2. **Customize templates** to match your company's style
3. **Version control** your templates in Google Drive
4. **Sync changes** automatically to the chat system

## How It Works

### 1. Template Sync (One-Time Setup)

All 86 skill templates have been synced to Google Drive at:
**https://drive.google.com/drive/folders/11vhzFujQ1Z05Vg4TPts6a4cp3jbXKlrS**

Folder structure:
```
HR Command Center/
└── Templates/
    ├── benefits-leave-coordinator/
    │   ├── benefits-enrollment-guide
    │   ├── leave-policies-and-laws
    │   └── ...
    ├── job-description-writer/
    │   ├── jd-templates-by-role
    │   ├── jd-examples
    │   └── ...
    └── [25 other skills]/
```

### 2. Editing Templates

To customize a template:

1. Open the template in Google Drive (click the link above)
2. Navigate to the skill folder (e.g., "job-description-writer")
3. Open any template document
4. Edit directly in Google Docs - formatting is preserved
5. Save (auto-saves in Google Docs)

### 3. Automatic Usage

When you use the chat interface:

1. System detects which skill you're using
2. Loads templates **from Google Drive** (with 1-hour cache)
3. Uses your customized versions for document generation
4. Exports back to Google Drive when you click "Export"

### 4. Syncing New Templates

If you add new template files to the filesystem, re-sync them:

```bash
npm exec tsx scripts/sync-templates-to-drive.ts
```

This will:
- Find all `.md` files in `skills/*/references/`
- Upload to Google Drive (organized by skill)
- Skip existing templates (won't overwrite your edits)

## Example Workflow

### Scenario: Customize Offer Letter Template

1. **Edit the template in Drive:**
   - Open: `HR Templates > hr-document-generator > company-voice-guide`
   - Add your company branding guidelines
   - Update tone/language preferences
   - Save

2. **Generate a new offer letter:**
   - In chat: "Write an offer letter for John Smith, Software Engineer, $120k"
   - System loads your customized template from Drive
   - Generates offer using your branding/language

3. **Export to Drive:**
   - Click "Export to Google Docs" button
   - Document opens in Google Docs with proper formatting
   - Located in your HR Drive folder

## API Endpoints

### List All Templates
```bash
GET /api/templates
```

Returns:
```json
{
  "success": true,
  "count": 86,
  "templates": [
    {
      "id": "1G632JRS_...",
      "name": "benefits-enrollment-guide",
      "skillName": "benefits-leave-coordinator",
      "webViewLink": "https://docs.google.com/..."
    }
  ]
}
```

### Fetch Template Content
```bash
GET /api/templates/content?documentId=1G632JRS_...
```

Returns:
```json
{
  "success": true,
  "documentId": "1G632JRS_...",
  "title": "Benefits Enrollment Guide",
  "content": "# Benefits Enrollment Guide\n\n..."
}
```

## Caching

Templates are cached for **1 hour** to reduce API calls:

- Template list: Cached for 1 hour
- Template content: Cached per document for 1 hour
- Auto-refreshes when cache expires

To force refresh (useful after editing):
```typescript
import { clearTemplateCache } from '@/lib/templates-drive'
clearTemplateCache()
```

## Technical Details

### Files Modified

1. **`webapp/lib/templates-drive.ts`** (NEW)
   - Fetches templates from Google Drive
   - Converts Google Docs to markdown
   - Caching layer

2. **`webapp/lib/skills.ts`** (MODIFIED)
   - Added `loadSkillWithDriveTemplates()` function
   - Automatically falls back to filesystem if Drive unavailable

3. **`webapp/app/api/chat/route.ts`** (MODIFIED)
   - Uses `loadSkillWithDriveTemplates()` instead of `loadSkill()`
   - Logs when Drive templates are loaded

4. **`webapp/app/api/templates/route.ts`** (NEW)
   - Lists all available templates

5. **`webapp/app/api/templates/content/route.ts`** (NEW)
   - Fetches individual template content

6. **`scripts/sync-templates-to-drive.ts`** (UPDATED)
   - Uses OAuth instead of service account
   - Syncs all markdown templates to Drive

### Authentication

Uses **OAuth 2.0** with your Google account:
- Token stored in `.google-oauth-token.json`
- Auto-refreshes when expired
- Same auth used for exports

## Troubleshooting

### "Not authenticated" errors
```bash
# Re-authenticate via browser
open http://localhost:3000
# Click "Export" on any message to trigger auth flow
```

### Templates not updating
```bash
# Clear cache and restart dev server
rm -rf .next
npm run dev
```

### Re-sync all templates
```bash
# This will overwrite Drive templates with filesystem versions
npm exec tsx scripts/sync-templates-to-drive.ts
```

## Benefits

✅ **Edit anywhere** - Use Google Docs on any device
✅ **Rich formatting** - Bold, italic, headers, bullets preserved
✅ **Version history** - Google Docs tracks all changes
✅ **Collaboration** - Share templates with team members
✅ **Cloud backup** - Never lose templates
✅ **Live updates** - Changes appear in chat within 1 hour (cache TTL)

## Next Steps

1. Open your templates folder: https://drive.google.com/drive/folders/11vhzFujQ1Z05Vg4TPts6a4cp3jbXKlrS
2. Browse through the 25 skills and 86 templates
3. Edit a few templates to match your company style
4. Test by generating documents in the chat interface
5. Exported documents will also appear in your Drive
