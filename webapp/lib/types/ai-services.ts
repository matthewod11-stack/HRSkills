/**
 * Shared TypeScript types for AI Services
 */

import { env } from '@/env.mjs';

// TODO: Re-export NLP types when nlp-service is implemented
// export type {
//   SentimentResult,
//   EntityResult,
//   ClassificationResult,
//   BatchSentimentResult,
//   NlpConfig,
// } from '../ai-services/nlp-service';

// TODO: Re-export Translation types when translation-service is implemented
// export type {
//   TranslationResult,
//   BatchTranslationResult,
//   LanguageDetection,
//   TranslationConfig,
// } from '../ai-services/translation-service';

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
    nlpEnabled: env.NEXT_PUBLIC_ENABLE_NLP,
    translationEnabled: env.NEXT_PUBLIC_ENABLE_TRANSLATION,
    speechEnabled: env.NEXT_PUBLIC_ENABLE_SPEECH,
    documentAiEnabled: env.NEXT_PUBLIC_ENABLE_DOCUMENT_AI,
    vertexAiEnabled: env.NEXT_PUBLIC_ENABLE_VERTEX_AI,
    visionEnabled: env.NEXT_PUBLIC_ENABLE_VISION,
  };
}
