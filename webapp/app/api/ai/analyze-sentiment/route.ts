import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError, createSuccessResponse, validateRequiredFields } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import {
  analyzeSentiment,
  analyzeSentimentBatch,
  isNlpAvailable,
  NLP_ANALYSIS_PRESETS,
} from '@/lib/ai-services/nlp-service'
import type { AIServiceResponse, SentimentResult, BatchSentimentResult } from '@/lib/types/ai-services'

/**
 * POST /api/ai/analyze-sentiment
 * Analyze sentiment of text or batch of texts
 * Requires: Authentication + analytics read permission
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (AI endpoints: 30 req/min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.ai)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response
  }

  // Authenticate
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return authErrorResponse(authResult)
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'analytics', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to access AI services' },
      { status: 403 }
    )
  }

  // Check if NLP is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_NLP !== 'true') {
    return NextResponse.json(
      {
        success: false,
        error: 'NLP service is not enabled. Set NEXT_PUBLIC_ENABLE_NLP=true to enable.',
      },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { text, texts, language, enableCaching = true } = body

    // Validate input
    if (!text && !texts) {
      return NextResponse.json(
        { success: false, error: 'Either "text" or "texts" field is required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Batch analysis
    if (texts) {
      if (!Array.isArray(texts)) {
        return NextResponse.json(
          { success: false, error: '"texts" must be an array of strings' },
          { status: 400 }
        )
      }

      if (texts.length === 0) {
        return NextResponse.json(
          { success: false, error: '"texts" array cannot be empty' },
          { status: 400 }
        )
      }

      if (texts.length > 100) {
        return NextResponse.json(
          { success: false, error: 'Maximum 100 texts per batch request' },
          { status: 400 }
        )
      }

      const result = await analyzeSentimentBatch(texts, {
        language,
        enableCaching,
      })

      const response: AIServiceResponse<BatchSentimentResult> = {
        success: true,
        data: result,
        metadata: {
          processingTime: Date.now() - startTime,
          apiCalls: result.metadata.apiCalls,
          cacheHit: result.metadata.cacheHits > 0,
        },
      }

      return createSuccessResponse(response)
    }

    // Single text analysis
    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '"text" must be a non-empty string' },
        { status: 400 }
      )
    }

    const result = await analyzeSentiment(text, {
      language,
      enableCaching,
    })

    const response: AIServiceResponse<SentimentResult> = {
      success: true,
      data: result,
      metadata: {
        processingTime: Date.now() - startTime,
      },
    }

    return createSuccessResponse(response)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/analyze-sentiment',
      method: 'POST',
      userId: authResult.user.userId,
    })
  }
}

/**
 * GET /api/ai/analyze-sentiment/health
 * Check if NLP service is available
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return authErrorResponse(authResult)
  }

  try {
    const available = await isNlpAvailable()

    return NextResponse.json({
      success: true,
      data: {
        available,
        enabled: process.env.NEXT_PUBLIC_ENABLE_NLP === 'true',
        service: 'Google Cloud Natural Language API',
      },
    })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/analyze-sentiment/health',
      method: 'GET',
      userId: authResult.user.userId,
    })
  }
}
