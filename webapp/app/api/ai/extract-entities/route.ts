import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import { extractEntities, analyzeText } from '@/lib/ai-services/nlp-service'
import type { AIServiceResponse, EntityResult } from '@/lib/types/ai-services'

/**
 * POST /api/ai/extract-entities
 * Extract entities (people, places, organizations) from text
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
    const { text, language, includeEntitySentiment = false, fullAnalysis = false } = body

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '"text" must be a non-empty string' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Full analysis (sentiment + entities + categories)
    if (fullAnalysis) {
      const result = await analyzeText(text, {
        language,
        includeEntitySentiment,
      })

      const response: AIServiceResponse<typeof result> = {
        success: true,
        data: result,
        metadata: {
          processingTime: Date.now() - startTime,
        },
      }

      return createSuccessResponse(response)
    }

    // Entity extraction only
    const entities = await extractEntities(text, {
      language,
      includeEntitySentiment,
    })

    const response: AIServiceResponse<EntityResult[]> = {
      success: true,
      data: entities,
      metadata: {
        processingTime: Date.now() - startTime,
      },
    }

    return createSuccessResponse(response)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/extract-entities',
      method: 'POST',
      userId: authResult.user.userId,
    })
  }
}
