import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/templates
 *
 * TEMPORARILY DISABLED: Google Drive templates integration
 *
 * REASON: googleapis package has compatibility issues with Next.js 16 + Turbopack
 * See app/api/templates/content/route.ts for details.
 *
 * TODO: Re-enable once googleapis is compatible with Next.js 16 + Turbopack
 *
 * Tracking issue: Phase 12 - Final Validation
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Google Drive templates integration temporarily disabled',
      reason: 'googleapis compatibility issue with Next.js 16 + Turbopack',
      status: 'pending_fix',
      templates: [],
    },
    { status: 501 } // 501 Not Implemented
  );
}
