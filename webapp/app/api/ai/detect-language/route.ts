import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import { chatWithAI } from '@/lib/ai/router'

/**
 * POST /api/ai/detect-language
 * Detect the language of provided text using unified AI provider
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
        texts.map(async (t: string) => {
          const result = await chatWithAI(
            [
              {
                role: 'user',
                content: `Detect the language of this text. Return ONLY a JSON object with format: {"language": "language_code", "languageName": "Language Name", "confidence": 0.0-1.0}. Text: "${t}"`,
              },
            ],
            {
              temperature: 0.1,
              maxTokens: 100,
              userId: authResult.user.userId,
              endpoint: '/api/ai/detect-language',
            }
          )

          try {
            const jsonMatch = result.content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              return JSON.parse(jsonMatch[0])
            }
          } catch (error) {
            console.error('[detect-language] Failed to parse AI response:', error)
          }

          return { language: 'unknown', languageName: 'Unknown', confidence: 0 }
        })
      )

      const response = {
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

    const result = await chatWithAI(
      [
        {
          role: 'user',
          content: `Detect the language of this text. Return ONLY a JSON object with format: {"language": "language_code", "languageName": "Language Name", "confidence": 0.0-1.0}. Text: "${text}"`,
        },
      ],
      {
        temperature: 0.1,
        maxTokens: 100,
        userId: authResult.user.userId,
        endpoint: '/api/ai/detect-language',
      }
    )

    let detection
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        detection = JSON.parse(jsonMatch[0])
      }
    } catch (error) {
      console.error('[detect-language] Failed to parse AI response:', error)
      detection = { language: 'unknown', languageName: 'Unknown', confidence: 0 }
    }

    const response = {
      success: true,
      data: detection,
      metadata: {
        processingTime: Date.now() - startTime,
        model: result.model,
        provider: result.provider,
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
