import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/auth/google/status
 *
 * TEMPORARILY DISABLED: Google OAuth status check
 *
 * REASON: googleapis package has compatibility issues with Next.js 16 + Turbopack
 * See app/api/templates/content/route.ts for details.
 *
 * TODO: Re-enable once googleapis is compatible with Next.js 16 + Turbopack
 *
 * Tracking issue: Phase 12 - Final Validation
 */
export async function GET() {
  return NextResponse.json(
    {
      authenticated: false,
      error: 'Google OAuth integration temporarily disabled',
      reason: 'googleapis compatibility issue with Next.js 16 + Turbopack',
      status: 'pending_fix',
    },
    { status: 501 } // 501 Not Implemented
  );
}
