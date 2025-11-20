/**
 * Simplified Authentication Middleware (Version 2)
 *
 * Uses the simplified 2-role RBAC system (admin/user).
 * Provides cleaner, easier-to-understand permission checks.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { env } from '@/env.mjs';
import {
  SimpleAuthUser,
  SimpleAuthResult,
  ROLES,
  getRoleByName,
  hasPermission,
  hasRole,
  requireAdmin,
  RoleName,
} from './roles-v2';

const JWT_SECRET = new TextEncoder().encode(env.JWT_SECRET);

const JWT_ALGORITHM = 'HS256';
const TOKEN_EXPIRY = '8h';

/**
 * Verify JWT token and extract user information
 */
export async function verifyToken(token: string): Promise<SimpleAuthResult> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    // Handle both v1 and v2 tokens
    const user = payload as any;

    // If user has old role format, migrate it
    let role = user.role;
    if (!role || (user.roles && Array.isArray(user.roles))) {
      // V1 token format - migrate
      const oldRoleName = user.roles?.[0]?.name || 'user';
      role = getRoleByName(oldRoleName);
    }

    return {
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role,
        employeeId: user.employeeId,
        sessionId: user.sessionId,
        iat: user.iat,
        exp: user.exp,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: 'Invalid or expired token',
      statusCode: 401,
    };
  }
}

/**
 * Generate JWT token for authenticated user
 */
export async function generateToken(user: Omit<SimpleAuthUser, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...user } as any)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Authentication middleware - requires valid JWT token
 */
export async function requireAuth(request: NextRequest): Promise<SimpleAuthResult> {
  // DEVELOPMENT: Auto-authenticate as admin
  if (env.NODE_ENV === 'development') {
    return {
      success: true,
      user: {
        userId: 'dev-user',
        email: 'dev@hrskills.local',
        name: 'Developer',
        role: ROLES.admin,
        sessionId: 'dev-session',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400,
      },
    };
  }

  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      error: 'Missing authorization header',
      statusCode: 401,
    };
  }

  const token = authHeader.substring(7);
  return verifyToken(token);
}

/**
 * Create error response for auth failures
 */
export function authErrorResponse(result: SimpleAuthResult): NextResponse {
  if (result.success) {
    throw new Error('Cannot create error response for successful auth');
  }

  return NextResponse.json(
    {
      success: false,
      error: result.error,
      timestamp: new Date().toISOString(),
    },
    {
      status: result.statusCode,
      headers: {
        'WWW-Authenticate': 'Bearer realm="HR Command Center"',
      },
    }
  );
}

/**
 * Helper to create a demo token for development/testing
 */
export async function createDemoToken(
  email: string,
  roleName: RoleName = 'admin'
): Promise<string> {
  const user: Omit<SimpleAuthUser, 'iat' | 'exp'> = {
    userId: `user_${Date.now()}`,
    email,
    name: email.split('@')[0],
    role: ROLES[roleName],
    sessionId: `session_${Date.now()}`,
  };

  return generateToken(user);
}

// Re-export permission helpers for convenience
export { hasPermission, hasRole, requireAdmin };
