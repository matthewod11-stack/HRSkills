import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/documents/export-to-google-docs
 *
 * TEMPORARILY DISABLED: Google Docs export integration
 *
 * REASON: googleapis package has compatibility issues with Next.js 16 + Turbopack
 * See app/api/templates/content/route.ts for details.
 *
 * TODO: Re-enable once googleapis is compatible with Next.js 16 + Turbopack
 *
 * Tracking issue: Phase 12 - Final Validation
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Google Docs export integration temporarily disabled',
      reason: 'googleapis compatibility issue with Next.js 16 + Turbopack',
      status: 'pending_fix',
    },
    { status: 501 } // 501 Not Implemented
  );
}
