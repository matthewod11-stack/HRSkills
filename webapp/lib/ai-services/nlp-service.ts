/**
 * Google Cloud Natural Language API Service
 *
 * Provides sentiment analysis, entity extraction, and content classification
 * for HR text data (performance reviews, surveys, exit interviews, etc.)
 *
 * @see https://cloud.google.com/natural-language/docs
 */

import { LanguageServiceClient } from '@google-cloud/language'
import type { protos } from '@google-cloud/language'

type IDocument = protos.google.cloud.language.v1.IDocument
type ISentiment = protos.google.cloud.language.v1.ISentiment
type IEntity = protos.google.cloud.language.v1.IEntity
type IClassificationCategory = protos.google.cloud.language.v1.IClassificationCategory

// Initialize NLP client (uses GOOGLE_APPLICATION_CREDENTIALS env var)
let nlpClient: LanguageServiceClient | null = null

function getNlpClient(): LanguageServiceClient {
  if (!nlpClient) {
    nlpClient = new LanguageServiceClient()
  }
  return nlpClient
}

/**
 * Sentiment analysis result
 */
export interface SentimentResult {
  /** Overall sentiment score (-1.0 to 1.0, where -1 is most negative, 1 is most positive) */
  score: number
  /** Sentiment magnitude (0.0 to infinity, indicates strength of emotion) */
  magnitude: number
  /** Human-readable sentiment category */
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
  /** Confidence level */
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Entity extraction result
 */
export interface EntityResult {
  /** Entity name */
  name: string
  /** Entity type (PERSON, LOCATION, ORGANIZATION, EVENT, etc.) */
  type: string
  /** Salience score (0.0 to 1.0, importance in the text) */
  salience: number
  /** Sentiment about this entity (-1.0 to 1.0) */
  sentiment?: number
  /** Mentions of this entity in the text */
  mentions: number
}

/**
 * Content classification result
 */
export interface ClassificationResult {
  /** Category name */
  category: string
  /** Confidence score (0.0 to 1.0) */
  confidence: number
}

/**
 * Batch sentiment analysis result
 */
export interface BatchSentimentResult {
  /** Overall statistics */
  overall: {
    avgScore: number
    avgMagnitude: number
    positiveCount: number
    negativeCount: number
    neutralCount: number
    totalAnalyzed: number
  }
  /** Individual results */
  results: Array<{
    text: string
    sentiment: SentimentResult
  }>
  /** Processing metadata */
  metadata: {
    processingTime: number
    cacheHits: number
    apiCalls: number
  }
}

/**
 * NLP Analysis Configuration
 */
export interface NlpConfig {
  /** Language of the text (auto-detected if not specified) */
  language?: string
  /** Include entity sentiment (slower but more detailed) */
  includeEntitySentiment?: boolean
  /** Enable caching for identical texts */
  enableCaching?: boolean
}

// In-memory cache for sentiment analysis (5 min TTL)
const sentimentCache = new Map<string, { result: SentimentResult; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 500

// Clean cache periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of sentimentCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      sentimentCache.delete(key)
    }
  }
  // Limit cache size
  if (sentimentCache.size > MAX_CACHE_SIZE) {
    const oldestKeys = Array.from(sentimentCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, sentimentCache.size - MAX_CACHE_SIZE)
      .map(([key]) => key)
    oldestKeys.forEach(key => sentimentCache.delete(key))
  }
}, 60 * 1000) // Clean every minute

/**
 * Analyze sentiment of text
 *
 * @param text - Text to analyze (max 1MB)
 * @param config - Analysis configuration
 * @returns Sentiment analysis result
 *
 * @example
 * ```typescript
 * const result = await analyzeSentiment(
 *   "I love working here! The team is amazing and I feel valued."
 * )
 * // Result: { score: 0.9, magnitude: 1.2, sentiment: 'very_positive', confidence: 'high' }
 * ```
 */
export async function analyzeSentiment(
  text: string,
  config: NlpConfig = {}
): Promise<SentimentResult> {
  const client = getNlpClient()

  // Check cache first
  if (config.enableCaching !== false) {
    const cacheKey = `sentiment:${text.substring(0, 500)}`
    const cached = sentimentCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[NLP] Sentiment cache hit')
      return cached.result
    }
  }

  const document: IDocument = {
    content: text,
    type: 'PLAIN_TEXT',
    language: config.language || undefined,
  }

  try {
    const [result] = await client.analyzeSentiment({ document })

    const score = result.documentSentiment?.score || 0
    const magnitude = result.documentSentiment?.magnitude || 0

    const sentimentResult: SentimentResult = {
      score,
      magnitude,
      sentiment: categorizeSentiment(score),
      confidence: calculateConfidence(magnitude),
    }

    // Cache result
    if (config.enableCaching !== false) {
      const cacheKey = `sentiment:${text.substring(0, 500)}`
      sentimentCache.set(cacheKey, {
        result: sentimentResult,
        timestamp: Date.now(),
      })
    }

    return sentimentResult
  } catch (error) {
    console.error('[NLP] Sentiment analysis failed:', error)
    // Fail open: return neutral sentiment
    return {
      score: 0,
      magnitude: 0,
      sentiment: 'neutral',
      confidence: 'low',
    }
  }
}

/**
 * Analyze sentiment for multiple texts in batch
 * More efficient than calling analyzeSentiment() multiple times
 *
 * @param texts - Array of texts to analyze
 * @param config - Analysis configuration
 * @returns Batch analysis result with statistics
 *
 * @example
 * ```typescript
 * const exitInterviews = [
 *   "Limited growth opportunities...",
 *   "Great team but compensation not competitive...",
 *   "Best job I've ever had, sad to leave..."
 * ]
 * const result = await analyzeSentimentBatch(exitInterviews)
 * // Result: { overall: { avgScore: -0.2, positiveCount: 1, ... }, results: [...] }
 * ```
 */
export async function analyzeSentimentBatch(
  texts: string[],
  config: NlpConfig = {}
): Promise<BatchSentimentResult> {
  const startTime = Date.now()
  let cacheHits = 0
  let apiCalls = 0

  const results = await Promise.all(
    texts.map(async (text) => {
      const cacheKey = `sentiment:${text.substring(0, 500)}`
      const cached = sentimentCache.get(cacheKey)

      if (cached && config.enableCaching !== false) {
        cacheHits++
        return { text, sentiment: cached.result }
      }

      apiCalls++
      const sentiment = await analyzeSentiment(text, config)
      return { text, sentiment }
    })
  )

  // Calculate overall statistics
  const scores = results.map(r => r.sentiment.score)
  const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length
  const avgMagnitude = results.reduce((sum, r) => sum + r.sentiment.magnitude, 0) / results.length

  const positiveCount = results.filter(r => r.sentiment.score > 0.25).length
  const negativeCount = results.filter(r => r.sentiment.score < -0.25).length
  const neutralCount = results.length - positiveCount - negativeCount

  return {
    overall: {
      avgScore,
      avgMagnitude,
      positiveCount,
      negativeCount,
      neutralCount,
      totalAnalyzed: results.length,
    },
    results,
    metadata: {
      processingTime: Date.now() - startTime,
      cacheHits,
      apiCalls,
    },
  }
}

/**
 * Extract entities from text (people, places, organizations, etc.)
 *
 * @param text - Text to analyze
 * @param config - Analysis configuration
 * @returns List of extracted entities
 *
 * @example
 * ```typescript
 * const entities = await extractEntities(
 *   "Sarah from Engineering mentioned the San Francisco office needs more headcount."
 * )
 * // Result: [
 * //   { name: "Sarah", type: "PERSON", salience: 0.8, ... },
 * //   { name: "Engineering", type: "ORGANIZATION", salience: 0.6, ... },
 * //   { name: "San Francisco", type: "LOCATION", salience: 0.5, ... }
 * // ]
 * ```
 */
export async function extractEntities(
  text: string,
  config: NlpConfig = {}
): Promise<EntityResult[]> {
  const client = getNlpClient()

  const document: IDocument = {
    content: text,
    type: 'PLAIN_TEXT',
    language: config.language || undefined,
  }

  try {
    const [result] = await client.analyzeEntities({ document })

    const entities: EntityResult[] = (result.entities || []).map((entity: IEntity) => ({
      name: entity.name || '',
      type: entity.type || 'UNKNOWN',
      salience: entity.salience || 0,
      sentiment: entity.sentiment?.score,
      mentions: entity.mentions?.length || 0,
    }))

    // Sort by salience (most important first)
    return entities.sort((a, b) => b.salience - a.salience)
  } catch (error) {
    console.error('[NLP] Entity extraction failed:', error)
    return []
  }
}

/**
 * Classify content into categories
 * Useful for categorizing feedback themes
 *
 * @param text - Text to classify (minimum 20 words)
 * @param config - Analysis configuration
 * @returns List of categories with confidence scores
 *
 * @example
 * ```typescript
 * const categories = await classifyContent(
 *   "The compensation package is not competitive with market rates..."
 * )
 * // Result: [
 * //   { category: "/Business & Industrial/Human Resources/Compensation", confidence: 0.9 }
 * // ]
 * ```
 */
export async function classifyContent(
  text: string,
  config: NlpConfig = {}
): Promise<ClassificationResult[]> {
  const client = getNlpClient()

  // Content classification requires at least 20 words
  const wordCount = text.split(/\s+/).length
  if (wordCount < 20) {
    console.warn('[NLP] Content too short for classification (< 20 words)')
    return []
  }

  const document: IDocument = {
    content: text,
    type: 'PLAIN_TEXT',
    language: config.language || undefined,
  }

  try {
    const [result] = await client.classifyText({ document })

    return (result.categories || []).map((cat: IClassificationCategory) => ({
      category: cat.name || '',
      confidence: cat.confidence || 0,
    }))
  } catch (error) {
    console.error('[NLP] Content classification failed:', error)
    return []
  }
}

/**
 * Comprehensive text analysis (sentiment + entities + classification)
 * Single API call for all analysis types
 *
 * @param text - Text to analyze
 * @param config - Analysis configuration
 * @returns Combined analysis result
 */
export async function analyzeText(text: string, config: NlpConfig = {}) {
  const client = getNlpClient()

  const document: IDocument = {
    content: text,
    type: 'PLAIN_TEXT',
    language: config.language || undefined,
  }

  try {
    const [result] = await client.annotateText({
      document,
      features: {
        extractSyntax: false,
        extractEntities: true,
        extractDocumentSentiment: true,
        extractEntitySentiment: config.includeEntitySentiment || false,
        classifyText: text.split(/\s+/).length >= 20, // Only if enough words
      },
    })

    const score = result.documentSentiment?.score || 0
    const magnitude = result.documentSentiment?.magnitude || 0

    return {
      sentiment: {
        score,
        magnitude,
        sentiment: categorizeSentiment(score),
        confidence: calculateConfidence(magnitude),
      },
      entities: (result.entities || []).map((entity: IEntity) => ({
        name: entity.name || '',
        type: entity.type || 'UNKNOWN',
        salience: entity.salience || 0,
        sentiment: entity.sentiment?.score,
        mentions: entity.mentions?.length || 0,
      })).sort((a, b) => b.salience - a.salience),
      categories: (result.categories || []).map((cat: IClassificationCategory) => ({
        category: cat.name || '',
        confidence: cat.confidence || 0,
      })),
      language: result.language || 'en',
    }
  } catch (error) {
    console.error('[NLP] Text analysis failed:', error)
    return {
      sentiment: { score: 0, magnitude: 0, sentiment: 'neutral' as const, confidence: 'low' as const },
      entities: [],
      categories: [],
      language: 'en',
    }
  }
}

/**
 * Check if NLP API is available and configured
 */
export async function isNlpAvailable(): Promise<boolean> {
  try {
    const client = getNlpClient()
    // Test with minimal API call
    await client.analyzeSentiment({
      document: { content: 'test', type: 'PLAIN_TEXT' },
    })
    return true
  } catch (error) {
    console.warn('[NLP] Not available:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

/**
 * Categorize sentiment score into human-readable category
 */
function categorizeSentiment(score: number): SentimentResult['sentiment'] {
  if (score >= 0.6) return 'very_positive'
  if (score >= 0.25) return 'positive'
  if (score <= -0.6) return 'very_negative'
  if (score <= -0.25) return 'negative'
  return 'neutral'
}

/**
 * Calculate confidence level based on magnitude
 * Higher magnitude = stronger emotion = higher confidence
 */
function calculateConfidence(magnitude: number): SentimentResult['confidence'] {
  if (magnitude >= 2.0) return 'high'
  if (magnitude >= 0.5) return 'medium'
  return 'low'
}

/**
 * Pre-configured analysis presets for common HR use cases
 */
export const NLP_ANALYSIS_PRESETS = {
  /** Quick sentiment check only */
  SENTIMENT_ONLY: {
    includeEntitySentiment: false,
    enableCaching: true,
  },

  /** Full analysis (sentiment + entities + categories) */
  FULL_ANALYSIS: {
    includeEntitySentiment: true,
    enableCaching: true,
  },

  /** Entity extraction for theme identification */
  ENTITIES_ONLY: {
    includeEntitySentiment: false,
    enableCaching: true,
  },

  /** No caching (for real-time analysis) */
  REAL_TIME: {
    includeEntitySentiment: false,
    enableCaching: false,
  },
}

/**
 * Clear sentiment cache (useful for testing or memory management)
 */
export function clearSentimentCache(): void {
  sentimentCache.clear()
  console.log('[NLP] Sentiment cache cleared')
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: sentimentCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL,
  }
}
