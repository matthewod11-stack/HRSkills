/**
 * Shared Anthropic API Key Manager
 *
 * Manages a shared "zero-config" Anthropic API key for demo users
 * with rate limiting and quota tracking.
 *
 * Features:
 * - 100 requests per day limit for shared key users
 * - Automatic fallback to user's personal key if provided
 * - Usage tracking in SQLite database
 * - Quota reset at midnight UTC
 * - Clear upgrade prompts when limits reached
 */

import { db } from '@/lib/db';
import { aiQuotaUsage, userPreferences } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

export interface QuotaStatus {
  hasPersonalKey: boolean;
  usingSharedKey: boolean;
  requestsToday: number;
  requestsRemaining: number;
  quotaLimit: number;
  quotaResetAt: Date;
  isQuotaExceeded: boolean;
}

export interface QuotaCheckResult {
  allowed: boolean;
  status: QuotaStatus;
  message?: string;
}

/**
 * Get the Anthropic API key to use for the current request
 *
 * Priority:
 * 1. User's personal API key (from user_preferences table)
 * 2. Shared managed API key (from environment)
 * 3. Null if neither available
 */
export async function getAnthropicKey(userId?: string): Promise<{
  apiKey: string | null;
  isSharedKey: boolean;
}> {
  // Check if user has personal key configured
  if (userId) {
    const userPrefs = await db.query.userPreferences.findFirst({
      where: (prefs, { eq }) => eq(prefs.userId, userId),
    });

    if (userPrefs?.anthropicApiKey) {
      return {
        apiKey: userPrefs.anthropicApiKey,
        isSharedKey: false,
      };
    }
  }

  // Fall back to shared managed key
  const sharedKey = process.env.ANTHROPIC_MANAGED_KEY || process.env.ANTHROPIC_API_KEY;

  return {
    apiKey: sharedKey || null,
    isSharedKey: true,
  };
}

/**
 * Check if a request is allowed under the current quota
 */
export async function checkQuota(userId: string = 'shared-demo'): Promise<QuotaCheckResult> {
  const { apiKey, isSharedKey } = await getAnthropicKey(userId);

  // Personal API keys have unlimited quota
  if (!isSharedKey) {
    return {
      allowed: true,
      status: {
        hasPersonalKey: true,
        usingSharedKey: false,
        requestsToday: 0,
        requestsRemaining: Infinity,
        quotaLimit: Infinity,
        quotaResetAt: new Date(0),
        isQuotaExceeded: false,
      },
    };
  }

  // Shared key quota check
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const quotaLimit = parseInt(process.env.SHARED_KEY_DAILY_LIMIT || '100', 10);

  // Get today's usage
  const usage = await db.query.aiQuotaUsage.findFirst({
    where: and(
      eq(aiQuotaUsage.userId, userId),
      gte(aiQuotaUsage.date, today.toISOString().split('T')[0])
    ),
  });

  const requestsToday = usage?.requestCount || 0;
  const requestsRemaining = Math.max(0, quotaLimit - requestsToday);
  const isQuotaExceeded = requestsToday >= quotaLimit;

  // Calculate reset time (next midnight UTC)
  const quotaResetAt = new Date(today);
  quotaResetAt.setUTCDate(quotaResetAt.getUTCDate() + 1);

  const status: QuotaStatus = {
    hasPersonalKey: false,
    usingSharedKey: true,
    requestsToday,
    requestsRemaining,
    quotaLimit,
    quotaResetAt,
    isQuotaExceeded,
  };

  if (isQuotaExceeded) {
    return {
      allowed: false,
      status,
      message: `Daily quota exceeded (${quotaLimit} requests). Quota resets at ${quotaResetAt.toISOString()}. Add your own API key in Settings for unlimited usage.`,
    };
  }

  return {
    allowed: true,
    status,
  };
}

/**
 * Track a request against the quota
 */
export async function trackQuotaUsage(
  userId: string = 'shared-demo',
  tokensUsed: number = 0
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Check if record exists for today
  const existing = await db.query.aiQuotaUsage.findFirst({
    where: and(eq(aiQuotaUsage.userId, userId), eq(aiQuotaUsage.date, today)),
  });

  if (existing) {
    // Increment existing record
    await db
      .update(aiQuotaUsage)
      .set({
        requestCount: sql`${aiQuotaUsage.requestCount} + 1`,
        tokensUsed: sql`${aiQuotaUsage.tokensUsed} + ${tokensUsed}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(aiQuotaUsage.id, existing.id));
  } else {
    // Create new record
    await db.insert(aiQuotaUsage).values({
      id: `quota_${userId}_${today}`,
      userId,
      date: today,
      requestCount: 1,
      tokensUsed,
      quotaLimit: parseInt(process.env.SHARED_KEY_DAILY_LIMIT || '100', 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
}

/**
 * Get quota status for display in UI
 */
export async function getQuotaStatus(userId: string = 'shared-demo'): Promise<QuotaStatus> {
  const result = await checkQuota(userId);
  return result.status;
}

/**
 * Check if user should see upgrade prompt
 *
 * Show upgrade prompt when:
 * - Using shared key (not personal key)
 * - AND used >70% of daily quota
 */
export async function shouldShowUpgradePrompt(userId: string = 'shared-demo'): Promise<boolean> {
  const status = await getQuotaStatus(userId);

  if (!status.usingSharedKey) {
    return false; // Has personal key, no need to upgrade
  }

  const usagePercent = (status.requestsToday / status.quotaLimit) * 100;
  return usagePercent >= 70;
}

/**
 * Reset quota for a specific user (admin function)
 */
export async function resetQuota(userId: string): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  await db
    .delete(aiQuotaUsage)
    .where(and(eq(aiQuotaUsage.userId, userId), eq(aiQuotaUsage.date, today)));
}
