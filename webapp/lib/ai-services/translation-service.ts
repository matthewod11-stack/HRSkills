/**
 * Google Cloud Translation API Service
 *
 * Provides automatic language detection and translation for multilingual HR operations.
 * Supports 100+ languages for documents, surveys, and chat interactions.
 *
 * @see https://cloud.google.com/translate/docs
 */

import { v2 } from '@google-cloud/translate'

const { Translate } = v2

// Initialize Translation client (uses GOOGLE_APPLICATION_CREDENTIALS env var)
let translateClient: v2.Translate | null = null

function getTranslateClient(): v2.Translate {
  if (!translateClient) {
    translateClient = new Translate()
  }
  return translateClient
}

/**
 * Translation result
 */
export interface TranslationResult {
  /** Translated text */
  text: string
  /** Source language (detected or provided) */
  sourceLanguage: string
  /** Target language */
  targetLanguage: string
  /** Confidence score (0-1) for language detection */
  confidence?: number
  /** Original text */
  originalText: string
}

/**
 * Batch translation result
 */
export interface BatchTranslationResult {
  /** Individual translation results */
  translations: TranslationResult[]
  /** Total characters translated */
  totalCharacters: number
  /** Processing metadata */
  metadata: {
    processingTime: number
    cacheHits: number
    apiCalls: number
  }
}

/**
 * Language detection result
 */
export interface LanguageDetection {
  /** Detected language code (e.g., 'en', 'es', 'zh-CN') */
  language: string
  /** Confidence score (0-1) */
  confidence: number
  /** Language name in English */
  languageName?: string
}

/**
 * Translation configuration
 */
export interface TranslationConfig {
  /** Source language (auto-detect if not provided) */
  sourceLanguage?: string
  /** Format: 'text' or 'html' */
  format?: 'text' | 'html'
  /** Enable response caching */
  enableCaching?: boolean
  /** Model to use ('base' or 'nmt' - Neural Machine Translation) */
  model?: 'base' | 'nmt'
}

// In-memory cache for translations (10 min TTL)
const translationCache = new Map<string, { result: TranslationResult; timestamp: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes
const MAX_CACHE_SIZE = 1000

// Clean cache periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of translationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      translationCache.delete(key)
    }
  }
  // Limit cache size
  if (translationCache.size > MAX_CACHE_SIZE) {
    const oldestKeys = Array.from(translationCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, translationCache.size - MAX_CACHE_SIZE)
      .map(([key]) => key)
    oldestKeys.forEach(key => translationCache.delete(key))
  }
}, 60 * 1000) // Clean every minute

/**
 * Detect the language of text
 *
 * @param text - Text to detect language for
 * @returns Language detection result
 *
 * @example
 * ```typescript
 * const result = await detectLanguage("Bonjour, comment allez-vous?")
 * // { language: 'fr', confidence: 0.99, languageName: 'French' }
 * ```
 */
export async function detectLanguage(text: string): Promise<LanguageDetection> {
  const client = getTranslateClient()

  try {
    const [detection] = await client.detect(text)

    return {
      language: detection.language,
      confidence: detection.confidence || 0,
      languageName: LANGUAGE_NAMES[detection.language] || detection.language,
    }
  } catch (error) {
    console.error('[Translation] Language detection failed:', error)
    // Default to English
    return {
      language: 'en',
      confidence: 0,
      languageName: 'English',
    }
  }
}

/**
 * Translate text to target language
 *
 * @param text - Text to translate
 * @param targetLanguage - Target language code (e.g., 'es', 'fr', 'zh-CN')
 * @param config - Translation configuration
 * @returns Translation result
 *
 * @example
 * ```typescript
 * const result = await translateText(
 *   "Hello, how are you?",
 *   "es"
 * )
 * // { text: "Hola, ¿cómo estás?", sourceLanguage: "en", targetLanguage: "es", ... }
 * ```
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  config: TranslationConfig = {}
): Promise<TranslationResult> {
  const client = getTranslateClient()

  // Check cache first
  if (config.enableCaching !== false) {
    const cacheKey = `${text.substring(0, 200)}:${targetLanguage}:${config.sourceLanguage || 'auto'}`
    const cached = translationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[Translation] Cache hit')
      return cached.result
    }
  }

  try {
    const options: v2.TranslateRequest = {
      from: config.sourceLanguage,
      to: targetLanguage,
      format: config.format === 'html' ? 'html' : 'text',
      model: config.model || 'nmt', // Use Neural Machine Translation by default
    }

    const [translation, metadata] = await client.translate(text, options)

    // Detect source language if not provided
    let sourceLanguage = config.sourceLanguage
    if (!sourceLanguage && metadata) {
      sourceLanguage = metadata.data?.translations?.[0]?.detectedSourceLanguage || 'unknown'
    }

    const result: TranslationResult = {
      text: translation,
      sourceLanguage: sourceLanguage || 'unknown',
      targetLanguage,
      originalText: text,
    }

    // Cache result
    if (config.enableCaching !== false) {
      const cacheKey = `${text.substring(0, 200)}:${targetLanguage}:${config.sourceLanguage || 'auto'}`
      translationCache.set(cacheKey, {
        result,
        timestamp: Date.now(),
      })
    }

    return result
  } catch (error) {
    console.error('[Translation] Translation failed:', error)
    // Fail open - return original text
    return {
      text: text,
      sourceLanguage: config.sourceLanguage || 'unknown',
      targetLanguage,
      originalText: text,
    }
  }
}

/**
 * Translate multiple texts in batch
 * More efficient than calling translateText() multiple times
 *
 * @param texts - Array of texts to translate
 * @param targetLanguage - Target language code
 * @param config - Translation configuration
 * @returns Batch translation result
 *
 * @example
 * ```typescript
 * const result = await translateBatch(
 *   ["Hello", "Goodbye", "Thank you"],
 *   "es"
 * )
 * // { translations: [...], totalCharacters: 24, ... }
 * ```
 */
export async function translateBatch(
  texts: string[],
  targetLanguage: string,
  config: TranslationConfig = {}
): Promise<BatchTranslationResult> {
  const startTime = Date.now()
  let cacheHits = 0
  let apiCalls = 0

  const translations = await Promise.all(
    texts.map(async (text) => {
      const cacheKey = `${text.substring(0, 200)}:${targetLanguage}:${config.sourceLanguage || 'auto'}`
      const cached = translationCache.get(cacheKey)

      if (cached && config.enableCaching !== false) {
        cacheHits++
        return cached.result
      }

      apiCalls++
      return await translateText(text, targetLanguage, config)
    })
  )

  const totalCharacters = texts.reduce((sum, text) => sum + text.length, 0)

  return {
    translations,
    totalCharacters,
    metadata: {
      processingTime: Date.now() - startTime,
      cacheHits,
      apiCalls,
    },
  }
}

/**
 * Get list of supported languages
 *
 * @param displayLanguage - Language code for display names (default: 'en')
 * @returns Array of supported languages with codes and names
 */
export async function getSupportedLanguages(
  displayLanguage: string = 'en'
): Promise<Array<{ code: string; name: string }>> {
  const client = getTranslateClient()

  try {
    const [languages] = await client.getLanguages(displayLanguage)

    return languages.map(lang => ({
      code: lang.code,
      name: lang.name,
    }))
  } catch (error) {
    console.error('[Translation] Failed to get supported languages:', error)
    // Return common languages as fallback
    return COMMON_LANGUAGES
  }
}

/**
 * Check if Translation API is available and configured
 */
export async function isTranslationAvailable(): Promise<boolean> {
  try {
    const client = getTranslateClient()
    // Test with minimal API call
    await client.translate('test', 'es')
    return true
  } catch (error) {
    console.warn('[Translation] Not available:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

/**
 * Clear translation cache (useful for testing or memory management)
 */
export function clearTranslationCache(): void {
  translationCache.clear()
  console.log('[Translation] Cache cleared')
}

/**
 * Get cache statistics
 */
export function getTranslationCacheStats() {
  return {
    size: translationCache.size,
    maxSize: MAX_CACHE_SIZE,
    ttl: CACHE_TTL,
  }
}

/**
 * Pre-configured language sets for common use cases
 */
export const LANGUAGE_PRESETS = {
  /** Most common HR languages worldwide */
  GLOBAL_HR: ['en', 'es', 'zh-CN', 'fr', 'de', 'pt', 'ja', 'ko', 'it', 'ru'],

  /** European languages */
  EUROPEAN: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'sv', 'da'],

  /** Asian languages */
  ASIAN: ['zh-CN', 'zh-TW', 'ja', 'ko', 'th', 'vi', 'id', 'ms', 'tl', 'hi'],

  /** Americas */
  AMERICAS: ['en', 'es', 'pt', 'fr'],

  /** Top 5 most common */
  TOP_5: ['en', 'es', 'zh-CN', 'fr', 'de'],
}

/**
 * Common HR document types with typical language needs
 */
export const DOCUMENT_TYPE_LANGUAGES = {
  offer_letter: LANGUAGE_PRESETS.GLOBAL_HR,
  termination_letter: LANGUAGE_PRESETS.GLOBAL_HR,
  pip: LANGUAGE_PRESETS.GLOBAL_HR,
  employee_handbook: LANGUAGE_PRESETS.GLOBAL_HR,
  policy_document: LANGUAGE_PRESETS.GLOBAL_HR,
  survey: LANGUAGE_PRESETS.GLOBAL_HR,
}

/**
 * Language name mappings (subset - API provides full list)
 */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ar: 'Arabic',
  hi: 'Hindi',
  bn: 'Bengali',
  pa: 'Punjabi',
  id: 'Indonesian',
  ms: 'Malay',
  th: 'Thai',
  vi: 'Vietnamese',
  nl: 'Dutch',
  pl: 'Polish',
  sv: 'Swedish',
  da: 'Danish',
  fi: 'Finnish',
  no: 'Norwegian',
  tr: 'Turkish',
  el: 'Greek',
  he: 'Hebrew',
  cs: 'Czech',
  hu: 'Hungarian',
  ro: 'Romanian',
  uk: 'Ukrainian',
}

/**
 * Common languages fallback
 */
const COMMON_LANGUAGES = Object.entries(LANGUAGE_NAMES).map(([code, name]) => ({
  code,
  name,
}))
