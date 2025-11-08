import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
];

// Token storage path
const TOKEN_PATH = path.join(process.cwd(), '.google-oauth-token.json');

export class GoogleOAuthClient {
  private oauth2Client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error('Missing OAuth credentials in environment variables');
    }

    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    // Load existing token if available
    this.loadToken();
  }

  /**
   * Load saved OAuth token from disk
   */
  private loadToken(): void {
    try {
      if (fs.existsSync(TOKEN_PATH)) {
        const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
        this.oauth2Client.setCredentials(token);
      }
    } catch (error) {
      console.warn('Failed to load OAuth token:', error);
    }
  }

  /**
   * Save OAuth token to disk
   */
  private saveToken(token: any): void {
    try {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
    } catch (error) {
      console.error('Failed to save OAuth token:', error);
    }
  }

  /**
   * Generate authorization URL for user consent
   */
  getAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // Force consent screen to get refresh token
    });
  }

  /**
   * Exchange authorization code for access token
   */
  async getTokenFromCode(code: string): Promise<void> {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    this.saveToken(tokens);
  }

  /**
   * Check if we have valid credentials
   */
  isAuthenticated(): boolean {
    const credentials = this.oauth2Client.credentials;
    return !!(credentials && credentials.access_token);
  }

  /**
   * Get the OAuth2 client for API calls
   */
  getAuth(): OAuth2Client {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated. Please authenticate first.');
    }
    return this.oauth2Client;
  }

  /**
   * Refresh the access token if needed
   */
  async refreshTokenIfNeeded(): Promise<void> {
    try {
      await this.oauth2Client.getAccessToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw new Error('Authentication expired. Please re-authenticate.');
    }
  }

  /**
   * Revoke the current token and clear storage
   */
  async revoke(): Promise<void> {
    try {
      await this.oauth2Client.revokeCredentials();
      if (fs.existsSync(TOKEN_PATH)) {
        fs.unlinkSync(TOKEN_PATH);
      }
    } catch (error) {
      console.error('Failed to revoke token:', error);
    }
  }
}

// Singleton instance
export const googleOAuthClient = new GoogleOAuthClient();
