/**
 * Resume Parser API
 *
 * STATUS: Deprecated in Phase 2 - Migrating to unified AI provider
 *
 * This endpoint previously used Google Document AI for resume parsing.
 * During Phase 2 simplification, this functionality is being migrated
 * to use Claude's vision capabilities with the unified AI router.
 *
 * For now, use POST /api/ai/chat with vision capabilities or
 * wait for the updated implementation in Phase 2.2.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { authErrorResponse, requireAuth } from '@/lib/auth/middleware';

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
        alternative: 'Use POST /api/ai/chat with Claude vision for document analysis',
        eta: 'Phase 2.2 (Q1 2025)',
      },
    },
    { status: 501 }
  );
}
