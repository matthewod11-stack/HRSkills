import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import { AuthUser, AuthResult, Permission, DEFAULT_ROLES } from './types';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'CHANGE_THIS_IN_PRODUCTION_MIN_32_CHARS'
);

const JWT_ALGORITHM = 'HS256';
const TOKEN_EXPIRY = '8h';

/**
 * Verify JWT token and extract user information
 */
export async function verifyToken(token: string): Promise<AuthResult> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: [JWT_ALGORITHM],
    });

    return {
      success: true,
      user: payload as unknown as AuthUser,
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
export async function generateToken(user: Omit<AuthUser, 'iat' | 'exp'>): Promise<string> {
  return new SignJWT({ ...user } as any)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

/**
 * Authentication middleware - requires valid JWT token
 */
export async function requireAuth(request: NextRequest): Promise<AuthResult> {
  // DEVELOPMENT: Auto-authenticate
  if (process.env.NODE_ENV === 'development') {
    const role = DEFAULT_ROLES['hr_admin'];
    return {
      success: true,
      user: {
        userId: 'dev-user',
        email: 'dev@hrskills.local',
        name: 'Developer',
        roles: [role],
        sessionId: 'dev-session',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 86400
      }
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
 * Permission check middleware
 */
export function hasPermission(
  user: AuthUser,
  resource: Permission['resource'],
  action: Permission['actions'][number]
): boolean {
  return user.roles.some(role =>
    role.permissions.some(
      perm => perm.resource === resource && perm.actions.includes(action)
    )
  );
}

/**
 * Role-based access control middleware
 */
export function requireRole(user: AuthUser, ...allowedRoles: string[]): boolean {
  return user.roles.some(role => allowedRoles.includes(role.name));
}

/**
 * Create error response for auth failures
 */
export function authErrorResponse(result: AuthResult): NextResponse {
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
 * DO NOT USE IN PRODUCTION - This is for demonstration only
 */
export async function createDemoToken(
  email: string,
  roleName: keyof typeof DEFAULT_ROLES = 'hr_admin'
): Promise<string> {
  const role = DEFAULT_ROLES[roleName];

  const user: Omit<AuthUser, 'iat' | 'exp'> = {
    userId: `user_${Date.now()}`,
    email,
    name: email.split('@')[0],
    roles: [role],
    sessionId: `session_${Date.now()}`,
  };

  return generateToken(user);
}
