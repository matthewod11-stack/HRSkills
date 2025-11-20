/**
 * Phase 2 (Updated Phase 5): AI Provider Abstraction - Type Definitions
 *
 * Unified interface for multiple AI providers (Anthropic, OpenAI)
 * Allows seamless switching and failover between providers.
 */

export type AIProviderType = 'anthropic' | 'openai' | 'auto';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ChatResponse {
  content: string;
  model: string;
  provider: AIProviderType;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  cost?: number; // Estimated cost in USD
}

export interface AnalysisTask {
  type: 'sentiment' | 'entities' | 'language' | 'classification' | 'summarization' | 'translation';
  text: string;
  options?: Record<string, any>;
}

export interface AnalysisResult {
  result: any;
  model: string;
  provider: AIProviderType;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

export interface ProviderHealth {
  provider: AIProviderType;
  healthy: boolean;
  latency: number; // milliseconds
  lastChecked: Date;
  errorRate: number; // 0-1
  quotaRemaining?: number;
}

export interface AIProviderConfig {
  primary: AIProviderType;
  fallback?: AIProviderType;
  enableAutoFallback: boolean;
  healthCheckInterval: number; // milliseconds
  maxRetries: number;
  timeout: number; // milliseconds
}

/**
 * Base interface that all AI providers must implement
 */
export interface AIProvider {
  readonly name: AIProviderType;
  readonly available: boolean;

  /**
   * Send a chat completion request
   */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;

  /**
   * Analyze text (sentiment, entities, etc.)
   */
  analyze(task: AnalysisTask): Promise<AnalysisResult>;

  /**
   * Translate text to target language
   */
  translate(text: string, targetLanguage: string): Promise<string>;

  /**
   * Check provider health
   */
  healthCheck(): Promise<ProviderHealth>;
}

/**
 * User preferences for AI provider
 */
export interface UserAIPreferences {
  userId: string;
  preferredProvider: AIProviderType;
  customApiKeys?: {
    anthropic?: string;
    openai?: string;
  };
  enableCostOptimization: boolean; // Use cheaper models when possible
  enablePromptCaching: boolean; // Cache repeated prompts
  updatedAt: string;
}
