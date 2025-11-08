# Setup: HR Command Center Google Drive Folder

The service account has limited storage quota. To work around this, we'll create the folder structure in YOUR Google Drive and share it with the service account.

## Steps:

### 1. Create Folder in Your Google Drive

1. Go to https://drive.google.com
2. Create a new folder called "HR Command Center"

### 2. Share with Service Account

1. Right-click the "HR Command Center" folder
2. Click "Share"
3. Add this email address: `hrcommand@hrcommandcenter-477518.iam.gserviceaccount.com`
4. Give it "Editor" permissions
5. Click "Send" (uncheck "Notify people" if you want)

### 3. Get the Folder ID

1. Open the "HR Command Center" folder
2. Look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. Copy the folder ID (the long string after `/folders/`)

### 4. Set Environment Variable

Add this to your `.env.local` file:

```
HR_DRIVE_FOLDER_ID=your_folder_id_here
```

## Alternative: Automated Setup

Run this script to create the folder automatically in your Drive:

```bash
node scripts/setup-drive-in-user-account.js
```

This will:
- Prompt you to authenticate with your Google account
- Create the "HR Command Center" folder in your Drive
- Share it with the service account
- Save the folder ID to `.env.local`
