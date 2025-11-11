/**
 * Phase 2: AI Provider Router
 *
 * Intelligent routing between AI providers with:
 * - Automatic failover on errors/timeouts
 * - Health monitoring
 * - Cost optimization
 * - Usage tracking
 */

import {
  AIProvider,
  AIProviderType,
  AIProviderConfig,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  AnalysisTask,
  AnalysisResult,
  ProviderHealth,
} from './types';
import { AnthropicAdapter } from './providers/anthropic-adapter';
import { OpenAIAdapter } from './providers/openai-adapter';
import { GeminiAdapter } from './providers/gemini-adapter';
import { db } from '@/lib/db';
import { aiUsage } from '@/db/schema';
import { randomUUID } from 'crypto';

class AIProviderRouter {
  private providers: Map<AIProviderType, AIProvider>;
  private config: AIProviderConfig;
  private healthCache: Map<AIProviderType, ProviderHealth>;
  private fallbackChain: AIProviderType[];

  constructor() {
    this.providers = new Map();
    this.healthCache = new Map();

    // Initialize providers
    try {
      this.providers.set('anthropic', new AnthropicAdapter());
    } catch (error) {
      console.warn('[AIRouter] Anthropic provider unavailable:', error);
    }

    try {
      this.providers.set('openai', new OpenAIAdapter());
    } catch (error) {
      console.warn('[AIRouter] OpenAI provider unavailable:', error);
    }

    try {
      this.providers.set('gemini', new GeminiAdapter());
    } catch (error) {
      console.warn('[AIRouter] Gemini provider unavailable:', error);
    }

    // Default configuration
    this.config = {
      primary: 'anthropic',
      fallback: 'openai',
      enableAutoFallback: true,
      healthCheckInterval: 30000, // 30 seconds
      maxRetries: 3,
      timeout: 60000, // 60 seconds
    };

    // Fallback chain: anthropic → openai → gemini
    this.fallbackChain = ['anthropic', 'openai', 'gemini'];
  }

  /**
   * Update router configuration
   */
  configure(config: Partial<AIProviderConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  /**
   * Send chat completion request with automatic failover through entire chain
   */
  async chat(
    messages: ChatMessage[],
    options?: ChatOptions & { userId?: string; endpoint?: string }
  ): Promise<ChatResponse> {
    // Determine starting provider
    let startProvider: AIProviderType = this.config.primary;
    if (options?.model?.startsWith('gpt')) {
      startProvider = 'openai';
    } else if (options?.model?.startsWith('gemini')) {
      startProvider = 'gemini';
    }

    // Build ordered list of providers to try
    const providersToTry = [startProvider];
    if (this.config.enableAutoFallback) {
      // Add remaining providers from fallback chain
      this.fallbackChain.forEach((p) => {
        if (p !== startProvider && this.providers.has(p)) {
          providersToTry.push(p);
        }
      });
    }

    const errors: Record<string, string> = {};

    // Try each provider in order
    for (const providerType of providersToTry) {
      try {
        const response = await this.chatWithProvider(providerType, messages, options);

        // Track usage
        await this.trackUsage(response, options?.userId, options?.endpoint);

        // Log failover if not using primary
        if (providerType !== startProvider) {
          console.log(`[AIRouter] Successfully failed over to ${providerType}`);
        }

        return response;
      } catch (error: any) {
        errors[providerType] = error.message;
        console.error(`[AIRouter] ${providerType} failed:`, error.message);

        // Continue to next provider
        if (providersToTry.indexOf(providerType) < providersToTry.length - 1) {
          const nextProvider = providersToTry[providersToTry.indexOf(providerType) + 1];
          console.log(`[AIRouter] Failing over to ${nextProvider}...`);
        }
      }
    }

    // All providers failed
    const errorSummary = Object.entries(errors)
      .map(([provider, error]) => `${provider}: ${error}`)
      .join('; ');
    throw new Error(`All AI providers failed. ${errorSummary}`);
  }

  /**
   * Analyze text with automatic failover
   */
  async analyze(
    task: AnalysisTask,
    options?: { userId?: string; endpoint?: string }
  ): Promise<AnalysisResult> {
    const providerType = this.config.primary;

    try {
      const provider = this.providers.get(providerType);
      if (!provider || !provider.available) {
        throw new Error(`${providerType} provider not available`);
      }

      const result = await provider.analyze(task);

      // Track usage
      await this.trackUsage(
        {
          ...result,
          content: JSON.stringify(result.result),
        } as ChatResponse,
        options?.userId,
        options?.endpoint
      );

      return result;
    } catch (error: any) {
      console.error(`[AIRouter] Analysis failed with ${providerType}:`, error.message);

      // Try fallback
      if (this.config.enableAutoFallback && this.config.fallback) {
        const fallbackProvider = this.providers.get(this.config.fallback);
        if (fallbackProvider && fallbackProvider.available) {
          console.log(`[AIRouter] Failing over analysis to ${this.config.fallback}`);
          const result = await fallbackProvider.analyze(task);

          await this.trackUsage(
            {
              ...result,
              content: JSON.stringify(result.result),
            } as ChatResponse,
            options?.userId,
            options?.endpoint
          );

          return result;
        }
      }

      throw error;
    }
  }

  /**
   * Translate text with automatic failover
   */
  async translate(
    text: string,
    targetLanguage: string,
    options?: { userId?: string; endpoint?: string }
  ): Promise<string> {
    const providerType = this.config.primary;

    try {
      const provider = this.providers.get(providerType);
      if (!provider || !provider.available) {
        throw new Error(`${providerType} provider not available`);
      }

      return await provider.translate(text, targetLanguage);
    } catch (error: any) {
      console.error(`[AIRouter] Translation failed with ${providerType}:`, error.message);

      // Try fallback
      if (this.config.enableAutoFallback && this.config.fallback) {
        const fallbackProvider = this.providers.get(this.config.fallback);
        if (fallbackProvider && fallbackProvider.available) {
          console.log(`[AIRouter] Failing over translation to ${this.config.fallback}`);
          return await fallbackProvider.translate(text, targetLanguage);
        }
      }

      throw error;
    }
  }

  /**
   * Get health status of all providers
   */
  async getAllHealth(): Promise<Record<AIProviderType, ProviderHealth>> {
    const health: Partial<Record<AIProviderType, ProviderHealth>> = {};

    for (const [type, provider] of this.providers.entries()) {
      try {
        health[type] = await provider.healthCheck();
      } catch (error) {
        health[type] = {
          provider: type,
          healthy: false,
          latency: 0,
          lastChecked: new Date(),
          errorRate: 1,
        };
      }
    }

    return health as Record<AIProviderType, ProviderHealth>;
  }

  /**
   * Get recommended provider based on health and cost
   */
  async getRecommendedProvider(): Promise<AIProviderType> {
    const health = await this.getAllHealth();

    // Prefer primary if healthy
    if (health[this.config.primary]?.healthy) {
      return this.config.primary;
    }

    // Fallback if available and healthy
    if (this.config.fallback && health[this.config.fallback]?.healthy) {
      return this.config.fallback;
    }

    // Return primary anyway (will fail with proper error)
    return this.config.primary;
  }

  /**
   * Internal: Chat with specific provider
   */
  private async chatWithProvider(
    providerType: AIProviderType,
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse> {
    const provider = this.providers.get(providerType);

    if (!provider) {
      throw new Error(`Provider ${providerType} not configured`);
    }

    if (!provider.available) {
      throw new Error(`Provider ${providerType} is not available`);
    }

    return await provider.chat(messages, options);
  }

  /**
   * Track AI usage to database
   */
  private async trackUsage(
    response: ChatResponse,
    userId?: string,
    endpoint?: string
  ): Promise<void> {
    try {
      await db.insert(aiUsage).values({
        id: randomUUID(),
        provider: response.provider,
        model: response.model,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens: response.usage.totalTokens,
        estimatedCost: response.cost || 0,
        endpoint: endpoint || null,
        userId: userId || null,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      // Don't fail the request if tracking fails
      console.error('[AIRouter] Failed to track usage:', error);
    }
  }
}

// Singleton instance
export const aiRouter = new AIProviderRouter();

// Export convenience functions
export const chatWithAI = (
  messages: ChatMessage[],
  options?: ChatOptions & { userId?: string; endpoint?: string }
) => aiRouter.chat(messages, options);

export const analyzeWithAI = (
  task: AnalysisTask,
  options?: { userId?: string; endpoint?: string }
) => aiRouter.analyze(task, options);

export const translateWithAI = (
  text: string,
  targetLanguage: string,
  options?: { userId?: string; endpoint?: string }
) => aiRouter.translate(text, targetLanguage, options);

export const getAIHealth = () => aiRouter.getAllHealth();

export const configureAI = (config: Partial<AIProviderConfig>) => aiRouter.configure(config);

export const getAIConfig = () => aiRouter.getConfig();
