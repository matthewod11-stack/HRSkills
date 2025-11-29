/**
 * Phase 2 (Updated Phase 5): AI Provider Configuration API
 *
 * Allows users to view and update AI provider settings,
 * check health status, and manage fallback preferences.
 *
 * Phase 5: Simplified to Anthropic + OpenAI only
 */

import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { userPreferences } from '@/db/schema';
import { configureAI, getAIConfig, getAIHealth } from '@/lib/ai/router';
import type { AIProviderConfig, UserAIPreferences } from '@/lib/ai/types';
import { handleApiError } from '@/lib/api-helpers';
import { authErrorResponse, requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

/**
 * GET /api/ai/config
 *
 * Get current AI provider configuration and health status
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  try {
    // Get current configuration
    const config = getAIConfig();

    // Get health status of all providers
    const health = await getAIHealth();

    // Get user's AI preferences from database
    const userPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, authResult.user.userId))
      .limit(1);

    let aiPreferences: Partial<UserAIPreferences> = {
      preferredProvider: config.primary,
      enableCostOptimization: false,
      enablePromptCaching: true,
    };

    if (userPrefs.length > 0 && userPrefs[0].preferencesJson) {
      try {
        const prefs = JSON.parse(userPrefs[0].preferencesJson);
        aiPreferences = prefs.ai || aiPreferences;
      } catch (error) {
        console.error('[AI Config] Failed to parse user preferences:', error);
      }
    }

    return NextResponse.json({
      success: true,
      config,
      health,
      userPreferences: aiPreferences,
      availableProviders: ['anthropic', 'openai'],
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/config',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}

/**
 * PATCH /api/ai/config
 *
 * Update AI provider configuration (admin only)
 */
export async function PATCH(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Only admins can change global AI configuration
  // Single-user model: authenticated = authorized

  try {
    const body = await request.json();
    const updates: Partial<AIProviderConfig> = {};

    if (body.primary) {
      if (!['anthropic', 'openai'].includes(body.primary)) {
        return NextResponse.json(
          { success: false, error: 'Invalid primary provider' },
          { status: 400 }
        );
      }
      updates.primary = body.primary;
    }

    if (body.fallback !== undefined) {
      if (body.fallback && !['anthropic', 'openai'].includes(body.fallback)) {
        return NextResponse.json(
          { success: false, error: 'Invalid fallback provider' },
          { status: 400 }
        );
      }
      updates.fallback = body.fallback;
    }

    if (body.enableAutoFallback !== undefined) {
      updates.enableAutoFallback = body.enableAutoFallback;
    }

    // Update configuration
    configureAI(updates);

    return NextResponse.json({
      success: true,
      config: getAIConfig(),
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/config',
      method: 'PATCH',
      userId: authResult.user.userId,
    });
  }
}

/**
 * POST /api/ai/config/test
 *
 * Test AI provider connectivity
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  try {
    const health = await getAIHealth();

    const testResults = Object.entries(health).map(([provider, status]) => ({
      provider,
      healthy: status.healthy,
      latency: status.latency,
      lastChecked: status.lastChecked,
      message: status.healthy
        ? `${provider} is operational (${status.latency}ms latency)`
        : `${provider} is unavailable`,
    }));

    return NextResponse.json({
      success: true,
      results: testResults,
      overallHealth: Object.values(health).some((h) => h.healthy),
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/config/test',
      method: 'POST',
      userId: authResult.user.userId,
    });
  }
}
