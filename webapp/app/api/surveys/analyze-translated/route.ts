import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import { analyzeSentimentBatch, extractEntities } from '@/lib/ai-services/nlp-service'
import { translateBatch, detectLanguage } from '@/lib/ai-services/translation-service'

/**
 * POST /api/surveys/analyze-translated
 * Analyze multilingual survey responses with automatic translation
 * Translates responses to English first, then performs sentiment analysis
 * Requires: Authentication + analytics read permission + Translation enabled
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

  // Check permissions
  if (!hasPermission(authResult.user, 'analytics', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  // Check if both NLP and Translation are enabled
  if (process.env.NEXT_PUBLIC_ENABLE_NLP !== 'true') {
    return NextResponse.json(
      { success: false, error: 'NLP service is not enabled' },
      { status: 503 }
    )
  }

  if (process.env.NEXT_PUBLIC_ENABLE_TRANSLATION !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Translation service is not enabled' },
      { status: 503 }
    )
  }

  try {
    const body = await request.json()
    const {
      surveyResponses,
      targetLanguage = 'en', // Translate to English for analysis
      analyzeDepartments = true,
      maxResponses = 500,
    } = body

    // Validate input
    if (!surveyResponses || !Array.isArray(surveyResponses)) {
      return NextResponse.json(
        { success: false, error: '"surveyResponses" must be an array' },
        { status: 400 }
      )
    }

    if (surveyResponses.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No survey responses provided' },
        { status: 400 }
      )
    }

    const limitedResponses = surveyResponses.slice(0, maxResponses)
    const startTime = Date.now()

    // Step 1: Translate all responses to target language (typically English)
    console.log(`[Multilingual Survey] Translating ${limitedResponses.length} responses to ${targetLanguage}...`)

    const originalTexts = limitedResponses.map((r: any) => r.response)
    const translationResult = await translateBatch(originalTexts, targetLanguage, {
      enableCaching: true,
    })

    const translatedTexts = translationResult.translations.map(t => t.text)

    console.log('[Multilingual Survey] Translation complete:', {
      totalCharacters: translationResult.totalCharacters,
      cacheHits: translationResult.metadata.cacheHits,
      apiCalls: translationResult.metadata.apiCalls,
    })

    // Step 2: Perform sentiment analysis on translated texts
    console.log('[Multilingual Survey] Analyzing sentiment...')

    const sentimentResults = await analyzeSentimentBatch(translatedTexts, {
      enableCaching: true,
    })

    // Step 3: Calculate sentiment distribution
    const sentimentDistribution = {
      veryPositive: sentimentResults.results.filter(r => r.sentiment.sentiment === 'very_positive').length,
      positive: sentimentResults.results.filter(r => r.sentiment.sentiment === 'positive').length,
      neutral: sentimentResults.results.filter(r => r.sentiment.sentiment === 'neutral').length,
      negative: sentimentResults.results.filter(r => r.sentiment.sentiment === 'negative').length,
      veryNegative: sentimentResults.results.filter(r => r.sentiment.sentiment === 'very_negative').length,
    }

    // Step 4: Group by department if requested
    let byDepartment: Record<string, any> | undefined
    if (analyzeDepartments) {
      byDepartment = {}

      for (let i = 0; i < limitedResponses.length; i++) {
        const response = limitedResponses[i]
        const sentiment = sentimentResults.results[i]
        const dept = response.department || 'Unknown'

        if (!byDepartment[dept]) {
          byDepartment[dept] = {
            count: 0,
            totalSentiment: 0,
            responses: [],
            languages: new Set(),
          }
        }

        byDepartment[dept].count++
        byDepartment[dept].totalSentiment += sentiment.sentiment.score
        byDepartment[dept].responses.push({
          original: response.response,
          translated: translatedTexts[i],
          sentiment: sentiment.sentiment,
          sourceLanguage: translationResult.translations[i].sourceLanguage,
        })
        byDepartment[dept].languages.add(translationResult.translations[i].sourceLanguage)
      }

      // Calculate averages and extract top concerns
      for (const dept in byDepartment) {
        byDepartment[dept].avgSentiment = byDepartment[dept].totalSentiment / byDepartment[dept].count
        byDepartment[dept].languages = Array.from(byDepartment[dept].languages)

        const topConcerns = byDepartment[dept].responses
          .filter((r: any) => r.sentiment.score < -0.3)
          .sort((a: any, b: any) => a.sentiment.score - b.sentiment.score)
          .slice(0, 3)
          .map((r: any) => ({
            text: r.original.substring(0, 100),
            translated: r.translated.substring(0, 100),
            language: r.sourceLanguage,
          }))

        byDepartment[dept] = {
          count: byDepartment[dept].count,
          avgSentiment: byDepartment[dept].avgSentiment,
          languages: byDepartment[dept].languages,
          topConcerns,
        }
      }
    }

    // Step 5: Detect language diversity
    const languageCounts: Record<string, number> = {}
    for (const translation of translationResult.translations) {
      const lang = translation.sourceLanguage
      languageCounts[lang] = (languageCounts[lang] || 0) + 1
    }

    const processingTime = Date.now() - startTime

    const analysis = {
      overall: {
        totalResponses: limitedResponses.length,
        avgSentiment: sentimentResults.overall.avgScore,
        sentimentDistribution,
        languageDiversity: Object.keys(languageCounts).length,
        languageBreakdown: languageCounts,
      },
      byDepartment,
      sentiment: sentimentResults,
      translation: {
        totalCharacters: translationResult.totalCharacters,
        targetLanguage,
        languagesDetected: Object.keys(languageCounts).length,
        cacheHits: translationResult.metadata.cacheHits,
        apiCalls: translationResult.metadata.apiCalls,
      },
    }

    console.log('[Multilingual Survey] Complete:', {
      responses: limitedResponses.length,
      languages: Object.keys(languageCounts).length,
      avgSentiment: sentimentResults.overall.avgScore.toFixed(2),
      processingTime: `${processingTime}ms`,
    })

    return NextResponse.json({
      success: true,
      data: analysis,
      metadata: {
        processingTime,
        responsesAnalyzed: limitedResponses.length,
        responsesTotal: surveyResponses.length,
      },
    })
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/surveys/analyze-translated',
      method: 'POST',
      userId: authResult.user.userId,
    })
  }
}
