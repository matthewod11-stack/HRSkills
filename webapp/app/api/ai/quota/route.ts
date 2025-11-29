/**
 * AI Quota Status API Endpoint
 *
 * Returns the current quota usage and status for the authenticated user.
 * Used by the Settings page and QuotaBanner component.
 *
 * GET /api/ai/quota - Get current quota status
 */

import { type NextRequest, NextResponse } from 'next/server';
import { checkQuota, getAnthropicKey } from '@/lib/ai/shared-key-manager';
import { handleApiError } from '@/lib/api-helpers';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authResult.user.userId;

    // Check if user has personal API key
    const { isSharedKey } = await getAnthropicKey(userId);

    // Get quota status
    const quotaStatus = await checkQuota(userId);

    // Calculate time until reset (midnight UTC)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCHours(24, 0, 0, 0);

    return NextResponse.json({
      success: true,
      hasPersonalKey: !isSharedKey,
      usingSharedKey: isSharedKey,
      requestsToday: quotaStatus.status.requestsToday,
      requestsRemaining: quotaStatus.status.requestsRemaining,
      quotaLimit: quotaStatus.status.quotaLimit,
      quotaResetAt: tomorrow.toISOString(),
      isQuotaExceeded: !quotaStatus.allowed,
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/quota',
      method: 'GET',
    });
  }
}
