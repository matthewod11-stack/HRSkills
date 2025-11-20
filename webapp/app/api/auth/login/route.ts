import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';
import { createDemoToken, generateToken } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api-helpers';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';
import { verifyPassword } from '@/lib/auth/password';

/**
 * POST /api/auth/login
 *
 * Simple authentication endpoint for development
 * In production, this would validate against a user database
 *
 * Request body:
 * {
 *   "email": "user@example.com",
 *   "password": "password" // Optional for demo
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": { ... }
 * }
 */
export async function POST(req: NextRequest) {
  // Apply rate limiting to prevent brute force attacks
  const rateLimitResult = await applyRateLimit(req, RateLimitPresets.auth);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  try {
    const body = await req.json();
    const { email, password, role = 'hr_admin' } = body;

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address',
        },
        { status: 400 }
      );
    }

    // Development mode: accept any password (or no password) - completely unchanged
    if (env.NODE_ENV !== 'production') {
      // Generate JWT token (role is always 'admin' for single-user system)
      const token = await createDemoToken(email);
      
      return NextResponse.json({
        success: true,
        token,
        user: {
          email,
          name: email.split('@')[0],
          role: 'admin',
        },
      });
    }

    // Production mode: validate credentials against environment variables
    const adminEmail = env.ADMIN_EMAIL;
    const adminPasswordHash = env.ADMIN_PASSWORD_HASH;

    // If env vars are not set, allow any credentials (graceful fallback for initial setup)
    if (!adminEmail || !adminPasswordHash) {
      // Generate JWT token without validation (allows setup without credentials)
      const token = await createDemoToken(email);
      
      return NextResponse.json({
        success: true,
        token,
        user: {
          email,
          name: email.split('@')[0],
          role: 'admin',
        },
      });
    }

    // Env vars are set - validate credentials
    if (!password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password is required',
        },
        { status: 400 }
      );
    }

    // Validate email matches ADMIN_EMAIL
    if (email !== adminEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Validate password against ADMIN_PASSWORD_HASH
    if (!verifyPassword(password, adminPasswordHash)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid credentials',
        },
        { status: 401 }
      );
    }

    // Credentials are valid - generate JWT token with admin user info
    const token = await generateToken({
      userId: `admin_${Date.now()}`,
      email: adminEmail,
      name: adminEmail.split('@')[0],
      role: 'admin',
      sessionId: `session_${Date.now()}`,
    });

    return NextResponse.json({
      success: true,
      token,
      user: {
        email: adminEmail,
        name: adminEmail.split('@')[0],
        role: 'admin',
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/auth/login',
      method: 'POST',
    });
  }
}
