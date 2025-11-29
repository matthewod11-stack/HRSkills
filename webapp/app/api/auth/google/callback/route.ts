import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/auth/google/callback
 *
 * TEMPORARILY DISABLED: Google OAuth callback handler
 *
 * REASON: googleapis package has compatibility issues with Next.js 16 + Turbopack
 * See app/api/templates/content/route.ts for details.
 *
 * TODO: Re-enable once googleapis is compatible with Next.js 16 + Turbopack
 *
 * Tracking issue: Phase 12 - Final Validation
 */
export async function GET(_request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Google OAuth integration temporarily disabled',
      reason: 'googleapis compatibility issue with Next.js 16 + Turbopack',
      status: 'pending_fix',
    },
    { status: 501 } // 501 Not Implemented
  );
}
