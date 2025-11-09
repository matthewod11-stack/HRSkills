import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import { translateWithAI } from '@/lib/ai/router'

/**
 * POST /api/ai/translate
 * Translate text or batch of texts to target language using unified AI provider
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

  try {
    const body = await request.json()
    const { text, texts, targetLanguage } = body

    // Validate input
    if (!text && !texts) {
      return NextResponse.json(
        { success: false, error: 'Either "text" or "texts" field is required' },
        { status: 400 }
      )
    }

    if (!targetLanguage) {
      return NextResponse.json(
        { success: false, error: '"targetLanguage" is required (e.g., "Spanish", "French", "Chinese")' },
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

      const results = await Promise.all(
        texts.map((t: string) =>
          translateWithAI(t, targetLanguage, {
            userId: authResult.user.userId,
            endpoint: '/api/ai/translate',
          })
        )
      )

      const response = {
        success: true,
        data: {
          translations: results.map((text, i) => ({
            text,
            originalText: texts[i],
            targetLanguage,
          })),
          totalTexts: texts.length,
          metadata: {
            processingTime: Date.now() - startTime,
            apiCalls: texts.length,
          },
        },
        metadata: {
          processingTime: Date.now() - startTime,
          apiCalls: texts.length,
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

    const translatedText = await translateWithAI(text, targetLanguage, {
      userId: authResult.user.userId,
      endpoint: '/api/ai/translate',
    })

    const response = {
      success: true,
      data: {
        text: translatedText,
        originalText: text,
        targetLanguage,
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
 * Get list of commonly supported languages
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return authErrorResponse(authResult)
  }

  try {
    // Common languages supported by Claude, GPT, and Gemini
    const languages = [
      { code: 'es', name: 'Spanish', nativeName: 'Español' },
      { code: 'fr', name: 'French', nativeName: 'Français' },
      { code: 'de', name: 'German', nativeName: 'Deutsch' },
      { code: 'it', name: 'Italian', nativeName: 'Italiano' },
      { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский' },
      { code: 'pl', name: 'Polish', nativeName: 'Polski' },
      { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
      { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
      { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
      { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
      { code: 'th', name: 'Thai', nativeName: 'ไทย' },
      { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
      { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
      { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
    ]

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
