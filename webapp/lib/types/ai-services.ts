/**
 * Shared TypeScript types for AI Services
 */

// Re-export NLP types for convenience
export type {
  SentimentResult,
  EntityResult,
  ClassificationResult,
  BatchSentimentResult,
  NlpConfig,
} from '../ai-services/nlp-service';

// Re-export Translation types for convenience
export type {
  TranslationResult,
  BatchTranslationResult,
  LanguageDetection,
  TranslationConfig,
} from '../ai-services/translation-service';

/**
 * Generic AI API response wrapper
 */
export interface AIServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    processingTime?: number;
    cacheHit?: boolean;
    apiCalls?: number;
    cost?: number;
  };
}

/**
 * AI service feature flags
 */
export interface AIFeatureFlags {
  nlpEnabled: boolean;
  translationEnabled: boolean;
  speechEnabled: boolean;
  documentAiEnabled: boolean;
  vertexAiEnabled: boolean;
  visionEnabled: boolean;
}

/**
 * Get AI feature flags from environment
 */
export function getAIFeatureFlags(): AIFeatureFlags {
  return {
    nlpEnabled: process.env.NEXT_PUBLIC_ENABLE_NLP === 'true',
    translationEnabled: process.env.NEXT_PUBLIC_ENABLE_TRANSLATION === 'true',
    speechEnabled: process.env.NEXT_PUBLIC_ENABLE_SPEECH === 'true',
    documentAiEnabled: process.env.NEXT_PUBLIC_ENABLE_DOCUMENT_AI === 'true',
    vertexAiEnabled: process.env.NEXT_PUBLIC_ENABLE_VERTEX_AI === 'true',
    visionEnabled: process.env.NEXT_PUBLIC_ENABLE_VISION === 'true',
  };
}
