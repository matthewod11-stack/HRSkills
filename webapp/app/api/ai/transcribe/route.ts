/**
 * Transcribe Audio API
 *
 * STATUS: Deprecated in Phase 2 - Migrating to unified AI provider
 *
 * This endpoint previously used Google Speech-to-Text API for audio transcription.
 * During Phase 2 simplification, this functionality is being evaluated
 * for migration to alternative providers.
 *
 * Wait for the updated implementation in Phase 2.2.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  return NextResponse.json(
    {
      success: false,
      error: 'This endpoint is deprecated and being migrated to the unified AI provider',
      migration: {
        status: 'in_progress',
        phase: 'Phase 2 Simplification',
        alternative: 'Speech transcription is being evaluated for Phase 2.2',
        eta: 'Phase 2.2 (Q1 2025)',
      },
    },
    { status: 501 }
  );
}
