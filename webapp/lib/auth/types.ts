/**
 * Single-User Auth Types
 * Simplified for solo HR professional use case
 */

export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  role: 'admin'; // Always 'admin' - single user has full access
  sessionId: string;
  iat: number;
  exp: number;
}

export type AuthResult =
  | {
      success: true;
      user: AuthUser;
    }
  | {
      success: false;
      error: string;
      statusCode: 401 | 403;
    };
