import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';
import { createDemoToken } from '@/lib/auth/middleware';
import { handleApiError, validationError, notFoundError } from '@/lib/api-helpers';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';

/**
 * POST /api/auth/demo-token
 *
 * Generate a demo JWT token for development/testing
 * WARNING: THIS IS FOR DEVELOPMENT ONLY - REMOVE IN PRODUCTION
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (auth endpoints: 5 req/15min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.auth);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Only allow in development
  if (env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Demo tokens not available in production' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    // Single-user model: always creates admin token
    const token = await createDemoToken(email);

    return NextResponse.json({
      success: true,
      token,
      role: 'admin',
      email,
      expiresIn: '8h',
      usage: `curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/employees`,
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/auth/demo-token',
      method: 'POST',
      requestBody: { email: 'redacted', role: 'redacted' },
    });
  }
}

/**
 * GET /api/auth/demo-token
 *
 * Quick demo token generation via query params
 */
export async function GET(request: NextRequest) {
  // Apply rate limiting (auth endpoints: 5 req/15min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.auth);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Only allow in development
  if (env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Demo tokens not available in production' },
      { status: 403 }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email') || 'admin@hrskills.demo';

  // Single-user model: always creates admin token (role parameter ignored)
  try {
    const token = await createDemoToken(email);

    return NextResponse.json({
      success: true,
      token,
      role: 'admin',
      email,
      expiresIn: '8h',
      usage: `curl -H "Authorization: Bearer ${token}" http://localhost:3000/api/employees`,
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/auth/demo-token',
      method: 'GET',
    });
  }
}
