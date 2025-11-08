import { NextRequest, NextResponse } from 'next/server';
import { createDemoToken } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api-helpers';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';

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

    // In development, accept any password (or no password)
    // In production, you would validate against a database with hashed passwords
    if (process.env.NODE_ENV === 'production' && !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password is required',
        },
        { status: 400 }
      );
    }

    // TODO: In production, validate credentials against database
    // const user = await db.users.findByEmailAndPassword(email, hashedPassword);
    // if (!user) {
    //   return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    // }

    // Generate JWT token
    const token = await createDemoToken(email, role as any);

    return NextResponse.json({
      success: true,
      token,
      user: {
        email,
        name: email.split('@')[0],
        role,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/auth/login',
      method: 'POST',
    });
  }
}
