import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * GET /api/templates/content?documentId=xxx
 *
 * TEMPORARILY DISABLED: Google Docs templates integration
 *
 * REASON: googleapis package has compatibility issues with Next.js 16 + Turbopack
 * The googleapis-common dependency tries to import 'gaxios/build/src/common' which
 * doesn't exist in gaxios 7.x (only in 6.x). Forcing gaxios 6.x via overrides
 * doesn't resolve the issue with Turbopack's module resolution.
 *
 * TODO: Re-enable once googleapis is compatible with Next.js 16 + Turbopack
 * OR: Migrate to direct Google Drive API REST calls instead of googleapis SDK
 *
 * Tracking issue: Phase 12 - Final Validation
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Google Docs templates integration temporarily disabled',
      reason: 'googleapis compatibility issue with Next.js 16 + Turbopack',
      status: 'pending_fix',
    },
    { status: 501 } // 501 Not Implemented
  );
}
