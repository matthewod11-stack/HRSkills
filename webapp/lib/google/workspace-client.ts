/**
 * Unified Google Workspace Client
 *
 * TEMPORARILY DISABLED: googleapis package has compatibility issues with Next.js 16 + Turbopack
 *
 * REASON: The googleapis-common dependency tries to import 'gaxios/build/src/common' which
 * doesn't exist in gaxios 7.x (only in 6.x). This breaks Turbopack builds.
 *
 * TODO: Re-enable once googleapis is compatible with Next.js 16 + Turbopack
 * OR: Migrate to direct Google Drive API REST calls instead of googleapis SDK
 *
 * Original functionality:
 * - Service Account (JWT) - for server-to-server operations
 * - OAuth 2.0 - for user-delegated operations
 * - Secure token storage (database, not version control)
 * - Minimal scopes (removed admin.directory)
 * - Automatic token refresh
 *
 * Tracking issue: Phase 12 - Final Validation
 */

// DISABLED: import { google } from 'googleapis';
// DISABLED: import { JWT, OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import { env } from '@/env.mjs';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

// Define scopes for each authentication method
const SERVICE_ACCOUNT_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/spreadsheets',
];

const OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
];

export type AuthMethod = 'service_account' | 'oauth';

export interface WorkspaceClientConfig {
  authMethod: AuthMethod;
  userId?: string; // Required for OAuth
}

/**
 * Unified Google Workspace Client
 *
 * Usage:
 * ```typescript
 * // Service Account (server-side operations)
 * const client = new GoogleWorkspaceClient({ authMethod: 'service_account' });
 * const drive = client.getDrive();
 *
 * // OAuth (user-delegated operations)
 * const client = new GoogleWorkspaceClient({ authMethod: 'oauth', userId: 'user123' });
 * await client.ensureAuthenticated(); // Checks/refreshes token
 * const drive = client.getDrive();
 * ```
 */
export class GoogleWorkspaceClient {
  private authMethod: AuthMethod;
  private userId?: string;
  private jwtAuth?: any; // DISABLED: JWT type from google-auth-library
  private oauth2Client?: any; // DISABLED: OAuth2Client type from google-auth-library

  constructor(config: WorkspaceClientConfig) {
    this.authMethod = config.authMethod;
    this.userId = config.userId;

    if (this.authMethod === 'oauth' && !this.userId) {
      throw new Error('userId is required for OAuth authentication');
    }
  }

  /**
   * Initialize authentication based on method
   */
  private async initializeAuth(): Promise<any> { // DISABLED: JWT | OAuth2Client types
    if (this.authMethod === 'service_account') {
      return this.initializeServiceAccount();
    } else {
      return await this.initializeOAuth();
    }
  }

  /**
   * Initialize Service Account (JWT) authentication
   */
  private initializeServiceAccount(): any { // DISABLED: JWT type
    throw new Error('Google Workspace client temporarily disabled - googleapis compatibility issue');

    // DISABLED CODE:
    // if (this.jwtAuth) {
    //   return this.jwtAuth;
    // }
    // const credentialsPath = env.GOOGLE_CREDENTIALS_PATH;
    // if (!credentialsPath || !fs.existsSync(credentialsPath)) {
    //   throw new Error(
    //     'Google Service Account credentials not found. Set GOOGLE_CREDENTIALS_PATH in environment.'
    //   );
    // }
    // const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));
    // this.jwtAuth = new JWT({
    //   email: credentials.client_email,
    //   key: credentials.private_key,
    //   scopes: SERVICE_ACCOUNT_SCOPES,
    // });
    // return this.jwtAuth;
  }

  /**
   * Initialize OAuth 2.0 authentication
   */
  private async initializeOAuth(): Promise<any> { // DISABLED: OAuth2Client type
    throw new Error('Google Workspace client temporarily disabled - googleapis compatibility issue');

    // DISABLED CODE:
    // if (this.oauth2Client) {
    //   return this.oauth2Client;
    // }
    // const clientId = env.GOOGLE_CLIENT_ID;
    // const clientSecret = env.GOOGLE_CLIENT_SECRET;
    // const redirectUri = env.GOOGLE_REDIRECT_URI;
    // if (!clientId || !clientSecret) {
    //   throw new Error(
    //     'Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
    //   );
    // }
    // this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    // // Load token from database
    // if (this.userId) {
    //   await this.loadTokenFromDatabase();
    // }
    // return this.oauth2Client;
  }

  /**
   * Load OAuth token from database
   */
  private async loadTokenFromDatabase(): Promise<void> {
    if (!this.userId || !this.oauth2Client) {
      return;
    }

    try {
      // Query user preferences for OAuth token
      const result = (db as any).all(
        sql`SELECT preferences_json FROM user_preferences WHERE user_id = ${this.userId} LIMIT 1`
      );

      if (result && result.length > 0) {
        const prefs = JSON.parse(result[0].preferences_json as string);
        if (prefs.googleOAuthToken) {
          this.oauth2Client.setCredentials(prefs.googleOAuthToken);
        }
      }
    } catch (error) {
      console.error('[GoogleWorkspace] Failed to load OAuth token:', error);
    }
  }

  /**
   * Save OAuth token to database
   */
  private async saveTokenToDatabase(token: any): Promise<void> {
    if (!this.userId) {
      return;
    }

    try {
      // Get existing preferences
      const result = (db as any).all(
        sql`SELECT preferences_json FROM user_preferences WHERE user_id = ${this.userId} LIMIT 1`
      );

      let preferences: any = {};
      if (result && result.length > 0) {
        preferences = JSON.parse(result[0].preferences_json as string);
      }

      // Update with new token
      preferences.googleOAuthToken = token;

      // Upsert to database
      (db as any).all(
        sql`INSERT INTO user_preferences (user_id, preferences_json, updated_at)
            VALUES (${this.userId}, ${JSON.stringify(preferences)}, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET
              preferences_json = ${JSON.stringify(preferences)},
              updated_at = CURRENT_TIMESTAMP`
      );
    } catch (error) {
      console.error('[GoogleWorkspace] Failed to save OAuth token:', error);
      throw error;
    }
  }

  /**
   * Check if OAuth client is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (this.authMethod === 'service_account') {
      return true; // Service accounts are always authenticated
    }

    if (!this.oauth2Client) {
      await this.initializeOAuth();
    }

    const credentials = this.oauth2Client!.credentials;
    return !!(credentials && credentials.access_token);
  }

  /**
   * Ensure authentication is valid (refresh if needed)
   */
  async ensureAuthenticated(): Promise<void> {
    const auth = await this.initializeAuth();

    if (this.authMethod === 'oauth' && this.oauth2Client) {
      try {
        // This will automatically refresh if needed
        await this.oauth2Client.getAccessToken();
      } catch (error) {
        console.error('[GoogleWorkspace] Token refresh failed:', error);
        throw new Error('OAuth authentication expired. Please re-authenticate.');
      }
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(): string {
    if (this.authMethod !== 'oauth') {
      throw new Error('getAuthUrl() only available for OAuth authentication');
    }

    if (!this.oauth2Client) {
      throw new Error('OAuth client not initialized');
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: OAUTH_SCOPES,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(code: string): Promise<void> {
    if (this.authMethod !== 'oauth' || !this.oauth2Client) {
      throw new Error('exchangeCodeForToken() only available for OAuth authentication');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    await this.saveTokenToDatabase(tokens);
  }

  /**
   * Revoke OAuth token
   */
  async revokeOAuthToken(): Promise<void> {
    if (this.authMethod !== 'oauth' || !this.oauth2Client) {
      throw new Error('revokeOAuthToken() only available for OAuth authentication');
    }

    try {
      await this.oauth2Client.revokeCredentials();

      // Clear from database
      if (this.userId) {
        const result = (db as any).all(
          sql`SELECT preferences_json FROM user_preferences WHERE user_id = ${this.userId} LIMIT 1`
        );

        if (result && result.length > 0) {
          const prefs = JSON.parse(result[0].preferences_json as string);
          delete prefs.googleOAuthToken;

          (db as any).all(
            sql`UPDATE user_preferences
                SET preferences_json = ${JSON.stringify(prefs)}, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = ${this.userId}`
          );
        }
      }
    } catch (error) {
      console.error('[GoogleWorkspace] Failed to revoke token:', error);
    }
  }

  /**
   * Get Google Drive API client
   */
  async getDrive(): Promise<any> {
    throw new Error('Google Workspace client temporarily disabled - googleapis compatibility issue');
    // DISABLED: return google.drive({ version: 'v3', auth });
  }

  /**
   * Get Google Docs API client
   */
  async getDocs(): Promise<any> {
    throw new Error('Google Workspace client temporarily disabled - googleapis compatibility issue');
    // DISABLED: return google.docs({ version: 'v1', auth });
  }

  /**
   * Get Google Sheets API client
   */
  async getSheets(): Promise<any> {
    throw new Error('Google Workspace client temporarily disabled - googleapis compatibility issue');
    // DISABLED: return google.sheets({ version: 'v4', auth });
  }

  /**
   * Get Gmail API client
   */
  async getGmail(): Promise<any> {
    throw new Error('Google Workspace client temporarily disabled - googleapis compatibility issue');
    // DISABLED: return google.gmail({ version: 'v1', auth });
  }

  /**
   * Get Calendar API client
   */
  async getCalendar(): Promise<any> {
    throw new Error('Google Workspace client temporarily disabled - googleapis compatibility issue');
    // DISABLED: return google.calendar({ version: 'v3', auth });
  }
}

// Factory functions for common use cases

/**
 * Get service account client (for server-side operations)
 */
export function getServiceAccountClient(): GoogleWorkspaceClient {
  return new GoogleWorkspaceClient({ authMethod: 'service_account' });
}

/**
 * Get OAuth client (for user-delegated operations)
 */
export function getOAuthClient(userId: string): GoogleWorkspaceClient {
  return new GoogleWorkspaceClient({ authMethod: 'oauth', userId });
}
