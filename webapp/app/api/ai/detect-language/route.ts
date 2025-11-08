import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import { detectLanguage, type LanguageDetection } from '@/lib/ai-services/translation-service'
import type { AIServiceResponse } from '@/lib/types/ai-services'

/**
 * POST /api/ai/detect-language
 * Detect the language of provided text
 * Requires: Authentication
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.ai)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response
  }

  // Authenticate
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return authErrorResponse(authResult)
  }

  // Check if Translation is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_TRANSLATION !== 'true') {
    return NextResponse.json(
      {
        success: false,
        error: 'Translation service is not enabled. Set NEXT_PUBLIC_ENABLE_TRANSLATION=true to enable.',
      },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const { text, texts } = body

    if (!text && !texts) {
      return NextResponse.json(
        { success: false, error: 'Either "text" or "texts" field is required' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Batch detection
    if (texts) {
      if (!Array.isArray(texts)) {
        return NextResponse.json(
          { success: false, error: '"texts" must be an array of strings' },
          { status: 400 }
        )
      }

      const detections = await Promise.all(
        texts.map(async (t: string) => await detectLanguage(t))
      )

      const response: AIServiceResponse<LanguageDetection[]> = {
        success: true,
        data: detections,
        metadata: {
          processingTime: Date.now() - startTime,
        },
      }

      return createSuccessResponse(response)
    }

    // Single detection
    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '"text" must be a non-empty string' },
        { status: 400 }
      )
    }

    const detection = await detectLanguage(text)

    const response: AIServiceResponse<LanguageDetection> = {
      success: true,
      data: detection,
      metadata: {
        processingTime: Date.now() - startTime,
      },
    }

    return createSuccessResponse(response)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/detect-language',
      method: 'POST',
      userId: authResult.user.userId,
    })
  }
}
