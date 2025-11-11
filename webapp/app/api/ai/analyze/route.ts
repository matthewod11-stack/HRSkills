import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';
import { analyzeWithAI } from '@/lib/ai/router';
import type { AnalysisTask } from '@/lib/ai/types';

/**
 * POST /api/ai/analyze
 * Unified analysis endpoint for sentiment, entities, language detection, classification, and summarization
 *
 * Request Body:
 * {
 *   type: 'sentiment' | 'entities' | 'language' | 'classification' | 'summarization',
 *   text?: string,          // Single text analysis
 *   texts?: string[],       // Batch analysis (max 100)
 *   options?: Record<string, any>  // Type-specific options
 * }
 *
 * Requires: Authentication + analytics read permission
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (AI endpoints: 30 req/min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.ai);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Single-user model: authenticated = authorized

  try {
    const body = await request.json();
    const { type, text, texts, options } = body;

    // Validate analysis type
    const validTypes = ['sentiment', 'entities', 'language', 'classification', 'summarization'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `"type" must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Validate input
    if (!text && !texts) {
      return NextResponse.json(
        { success: false, error: 'Either "text" or "texts" field is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Batch analysis
    if (texts) {
      if (!Array.isArray(texts)) {
        return NextResponse.json(
          { success: false, error: '"texts" must be an array of strings' },
          { status: 400 }
        );
      }

      if (texts.length === 0) {
        return NextResponse.json(
          { success: false, error: '"texts" array cannot be empty' },
          { status: 400 }
        );
      }

      if (texts.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Maximum 100 texts per batch request' },
          { status: 400 }
        );
      }

      // Analyze each text with the AI router
      const results = await Promise.all(
        texts.map(async (t: string) => {
          const task: AnalysisTask = {
            type: type as AnalysisTask['type'],
            text: t,
            options,
          };
          return analyzeWithAI(task, {
            userId: authResult.user.userId,
            endpoint: '/api/ai/analyze',
          });
        })
      );

      const response = {
        success: true,
        data: {
          type,
          results: results.map((r) => r.result),
          totalTexts: texts.length,
          metadata: {
            apiCalls: texts.length,
            processingTime: Date.now() - startTime,
          },
        },
        metadata: {
          processingTime: Date.now() - startTime,
          apiCalls: texts.length,
        },
      };

      return createSuccessResponse(response);
    }

    // Single text analysis
    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '"text" must be a non-empty string' },
        { status: 400 }
      );
    }

    const task: AnalysisTask = {
      type: type as AnalysisTask['type'],
      text,
      options,
    };

    const result = await analyzeWithAI(task, {
      userId: authResult.user.userId,
      endpoint: '/api/ai/analyze',
    });

    const response = {
      success: true,
      data: {
        type,
        ...result.result,
      },
      metadata: {
        processingTime: Date.now() - startTime,
        model: result.model,
        provider: result.provider,
      },
    };

    return createSuccessResponse(response);
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/analyze',
      method: 'POST',
      userId: authResult.user.userId,
    });
  }
}

/**
 * GET /api/ai/analyze/health
 * Check AI provider health for analysis operations
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  try {
    const { getAIHealth } = await import('@/lib/ai/router');
    const health = await getAIHealth();

    return NextResponse.json({
      success: true,
      data: {
        available: Object.values(health).some((h) => h.healthy),
        providers: health,
        service: 'Unified AI Analysis (Claude/GPT/Gemini)',
        supportedTypes: ['sentiment', 'entities', 'language', 'classification', 'summarization'],
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/analyze/health',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}
