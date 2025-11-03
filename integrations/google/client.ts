import { google } from 'googleapis';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export class GoogleClientWrapper {
  private auth: JWT;

  constructor() {
    const credentialsPath = process.env.GOOGLE_CREDENTIALS_PATH;

    if (!credentialsPath || !fs.existsSync(credentialsPath)) {
      throw new Error('Google credentials file not found. Check GOOGLE_CREDENTIALS_PATH in .env.local');
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    this.auth = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: [
        'https://www.googleapis.com/auth/admin.directory.user',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/spreadsheets'
      ],
      subject: process.env.GOOGLE_ADMIN_EMAIL
    });
  }

  getAuth(): JWT {
    return this.auth;
  }
}

// Singleton instance
export const googleClient = new GoogleClientWrapper();
