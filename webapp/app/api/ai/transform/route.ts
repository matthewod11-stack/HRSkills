import { type NextRequest, NextResponse } from 'next/server';
import { translateWithAI } from '@/lib/ai/router';
import { createSuccessResponse, handleApiError } from '@/lib/api-helpers';
import { authErrorResponse, requireAuth } from '@/lib/auth/middleware';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';

/**
 * POST /api/ai/transform
 * Unified transformation endpoint for translate, transcribe, and OCR operations
 *
 * Request Body:
 * {
 *   type: 'translate',
 *   text?: string,          // Single text transformation
 *   texts?: string[],       // Batch transformation (max 100, translate only)
 *   targetLanguage: string, // Required for translation
 *   options?: Record<string, any>
 * }
 *
 * Requires: Authentication + employees or analytics read permission
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
    const { type, text, texts, targetLanguage, options: _options } = body;

    // Validate transformation type
    const validTypes = ['translate', 'transcribe', 'ocr'];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `"type" must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // For now, only translation is implemented
    if (type !== 'translate') {
      return NextResponse.json(
        {
          success: false,
          error: `"${type}" transformation is not yet implemented`,
          migration: {
            status: 'in_progress',
            phase: 'Phase 2 Simplification',
            alternative:
              type === 'ocr'
                ? 'Use POST /api/ai/chat with Claude vision for OCR'
                : 'Coming in Phase 2.2',
            eta: 'Phase 2.2 (Q1 2025)',
          },
        },
        { status: 501 }
      );
    }

    // Validate input
    if (!text && !texts) {
      return NextResponse.json(
        { success: false, error: 'Either "text" or "texts" field is required' },
        { status: 400 }
      );
    }

    // Translation requires target language
    if (type === 'translate' && !targetLanguage) {
      return NextResponse.json(
        {
          success: false,
          error:
            '"targetLanguage" is required for translation (e.g., "Spanish", "French", "Chinese")',
        },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Batch translation
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

      const results = await Promise.all(
        texts.map((t: string) =>
          translateWithAI(t, targetLanguage, {
            userId: authResult.user.userId,
            endpoint: '/api/ai/transform',
          })
        )
      );

      const response = {
        success: true,
        data: {
          type,
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
      };

      return createSuccessResponse(response);
    }

    // Single text translation
    if (typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '"text" must be a non-empty string' },
        { status: 400 }
      );
    }

    const translatedText = await translateWithAI(text, targetLanguage, {
      userId: authResult.user.userId,
      endpoint: '/api/ai/transform',
    });

    const response = {
      success: true,
      data: {
        type,
        text: translatedText,
        originalText: text,
        targetLanguage,
      },
      metadata: {
        processingTime: Date.now() - startTime,
      },
    };

    return createSuccessResponse(response);
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/transform',
      method: 'POST',
      userId: authResult.user.userId,
    });
  }
}

/**
 * GET /api/ai/transform/languages
 * Get list of supported languages for translation
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
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
    ];

    return NextResponse.json({
      success: true,
      data: {
        languages,
        count: languages.length,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/transform/languages',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}
