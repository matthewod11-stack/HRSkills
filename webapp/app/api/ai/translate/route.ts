import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import {
  translateText,
  translateBatch,
  detectLanguage,
  getSupportedLanguages,
  isTranslationAvailable,
  type TranslationResult,
  type BatchTranslationResult,
} from '@/lib/ai-services/translation-service'
import type { AIServiceResponse } from '@/lib/types/ai-services'

/**
 * POST /api/ai/translate
 * Translate text or batch of texts to target language
 * Requires: Authentication + employees or analytics read permission
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

  // Check permissions - need employees or analytics read
  if (!hasPermission(authResult.user, 'employees', 'read') && !hasPermission(authResult.user, 'analytics', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to use translation service' },
      { status: 403 }
    )
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
    const {
      text,
      texts,
      targetLanguage,
      sourceLanguage,
      format = 'text',
      enableCaching = true,
      detectSource = false,
    } = body

    // Validate input
    if (!text && !texts) {
      return NextResponse.json(
        { success: false, error: 'Either "text" or "texts" field is required' },
        { status: 400 }
      )
    }

    if (!targetLanguage) {
      return NextResponse.json(
        { success: false, error: '"targetLanguage" is required (e.g., "es", "fr", "zh-CN")' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Batch translation
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

      const result = await translateBatch(texts, targetLanguage, {
        sourceLanguage,
        format,
        enableCaching,
      })

      const response: AIServiceResponse<BatchTranslationResult> = {
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

    // Single text translation
    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '"text" must be a non-empty string' },
        { status: 400 }
      )
    }

    // Detect source language if requested
    let detectedLanguage
    if (detectSource && !sourceLanguage) {
      detectedLanguage = await detectLanguage(text)
    }

    const result = await translateText(text, targetLanguage, {
      sourceLanguage: sourceLanguage || detectedLanguage?.language,
      format,
      enableCaching,
    })

    const response: AIServiceResponse<TranslationResult & { detection?: typeof detectedLanguage }> = {
      success: true,
      data: {
        ...result,
        ...(detectedLanguage && { detection: detectedLanguage }),
      },
      metadata: {
        processingTime: Date.now() - startTime,
      },
    }

    return createSuccessResponse(response)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/translate',
      method: 'POST',
      userId: authResult.user.userId,
    })
  }
}

/**
 * GET /api/ai/translate/languages
 * Get list of supported languages
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return authErrorResponse(authResult)
  }

  try {
    const { searchParams } = new URL(request.url)
    const displayLanguage = searchParams.get('displayLanguage') || 'en'

    const languages = await getSupportedLanguages(displayLanguage)

    return NextResponse.json({
      success: true,
      data: {
        languages,
        count: languages.length,
      },
    })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/translate/languages',
      method: 'GET',
      userId: authResult.user.userId,
    })
  }
}
