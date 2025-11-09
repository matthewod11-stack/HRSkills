/**
 * Phase 2: Anthropic (Claude) Provider Adapter
 *
 * Wraps existing anthropic-client.ts with the unified AIProvider interface.
 * Maintains existing circuit breaker and retry logic.
 */

import Anthropic from '@anthropic-ai/sdk';
import CircuitBreaker from 'opossum';
import pRetry from 'p-retry';
import {
  AIProvider,
  AIProviderType,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  AnalysisTask,
  AnalysisResult,
  ProviderHealth,
} from '../types';

// Cost per million tokens (as of January 2025)
const CLAUDE_COSTS = {
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
  'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
};

export class AnthropicAdapter implements AIProvider {
  readonly name: AIProviderType = 'anthropic';
  private client: Anthropic;
  private breaker: CircuitBreaker;
  private lastHealthCheck: Date | null = null;
  private healthStatus: ProviderHealth | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;

    if (!key) {
      throw new Error('Anthropic API key not configured');
    }

    this.client = new Anthropic({ apiKey: key });

    // Circuit breaker configuration (from existing anthropic-client.ts)
    this.breaker = new CircuitBreaker(this.makeRequest.bind(this), {
      timeout: 60000, // 60 second timeout
      errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
      resetTimeout: 30000, // Try again after 30 seconds
      name: 'anthropic-api',
    });

    this.breaker.on('open', () => {
      console.warn('[AnthropicAdapter] Circuit breaker opened - too many failures');
    });

    this.breaker.on('halfOpen', () => {
      console.log('[AnthropicAdapter] Circuit breaker half-open - testing recovery');
    });
  }

  get available(): boolean {
    return !this.breaker.opened;
  }

  /**
   * Send chat completion request
   */
  async chat(
    messages: ChatMessage[],
    options?: ChatOptions
  ): Promise<ChatResponse> {
    const model = options?.model || 'claude-3-5-sonnet-20241022';
    const maxTokens = options?.maxTokens || 4096;
    const temperature = options?.temperature ?? 1.0;

    // Convert to Anthropic message format
    const anthropicMessages: Anthropic.MessageParam[] = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // Extract system prompt
    const systemPrompt =
      options?.systemPrompt ||
      messages.find(m => m.role === 'system')?.content ||
      undefined;

    try {
      const response = await this.breaker.fire({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: anthropicMessages,
      });

      const cost = this.calculateCost(
        model,
        response.usage.input_tokens,
        response.usage.output_tokens
      );

      return {
        content: response.content[0].type === 'text' ? response.content[0].text : '',
        model,
        provider: 'anthropic',
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        cost,
      };
    } catch (error: any) {
      console.error('[AnthropicAdapter] Chat request failed:', error);
      throw new Error(`Anthropic chat failed: ${error.message}`);
    }
  }

  /**
   * Analyze text using Claude's structured output
   */
  async analyze(task: AnalysisTask): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(task);

    const response = await this.chat([{ role: 'user', content: prompt }], {
      model: 'claude-3-5-sonnet-20241022',
      temperature: 0.3, // Lower temperature for analysis tasks
    });

    let result: any;
    try {
      // Try to parse as JSON
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = response.content;
      }
    } catch {
      result = response.content;
    }

    return {
      result,
      model: response.model,
      provider: 'anthropic',
      usage: response.usage,
    };
  }

  /**
   * Translate text using Claude
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    const response = await this.chat(
      [
        {
          role: 'user',
          content: `Translate the following text to ${targetLanguage}. Only return the translation, nothing else:\n\n${text}`,
        },
      ],
      {
        model: 'claude-3-5-haiku-20241022', // Use cheaper model for translation
        temperature: 0.3,
      }
    );

    return response.content.trim();
  }

  /**
   * Check provider health
   */
  async healthCheck(): Promise<ProviderHealth> {
    const now = new Date();

    // Return cached result if checked recently (< 30 seconds ago)
    if (
      this.healthStatus &&
      this.lastHealthCheck &&
      now.getTime() - this.lastHealthCheck.getTime() < 30000
    ) {
      return this.healthStatus;
    }

    const startTime = Date.now();

    try {
      // Simple health check: ask for a single word response
      await this.chat(
        [{ role: 'user', content: 'Reply with only the word "OK"' }],
        { model: 'claude-3-5-haiku-20241022', maxTokens: 10 }
      );

      const latency = Date.now() - startTime;

      this.healthStatus = {
        provider: 'anthropic',
        healthy: true,
        latency,
        lastChecked: now,
        errorRate: 0,
      };
    } catch (error) {
      this.healthStatus = {
        provider: 'anthropic',
        healthy: false,
        latency: Date.now() - startTime,
        lastChecked: now,
        errorRate: 1,
      };
    }

    this.lastHealthCheck = now;
    return this.healthStatus;
  }

  /**
   * Internal: Make request with retry logic
   */
  private async makeRequest(params: any): Promise<Anthropic.Message> {
    return pRetry(
      async () => {
        try {
          return await this.client.messages.create(params);
        } catch (error: any) {
          // Retry on rate limits and server errors
          if (error.status === 429 || error.status >= 500) {
            throw error; // Will be retried by p-retry
          }
          // Don't retry on client errors
          throw new pRetry.AbortError(error.message);
        }
      },
      {
        retries: 3,
        factor: 2, // Exponential backoff: 1s, 2s, 4s
        minTimeout: 1000,
        maxTimeout: 8000,
        onFailedAttempt: (error) => {
          console.warn(
            `[AnthropicAdapter] Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
          );
        },
      }
    );
  }

  /**
   * Build analysis prompt based on task type
   */
  private buildAnalysisPrompt(task: AnalysisTask): string {
    switch (task.type) {
      case 'sentiment':
        return `Analyze the sentiment of this text. Return JSON only with format: {"sentiment": "positive"|"negative"|"neutral", "score": -1.0 to 1.0, "reasoning": "brief explanation"}\n\nText: "${task.text}"`;

      case 'entities':
        return `Extract named entities from this text. Return JSON only with format: {"entities": [{"text": "entity", "type": "PERSON"|"ORGANIZATION"|"LOCATION"|"DATE", "confidence": 0.0-1.0}]}\n\nText: "${task.text}"`;

      case 'classification':
        const categories = task.options?.categories || [];
        return `Classify this text into one of these categories: ${categories.join(', ')}. Return JSON only with format: {"category": "chosen_category", "confidence": 0.0-1.0}\n\nText: "${task.text}"`;

      case 'summarization':
        const maxLength = task.options?.maxLength || 100;
        return `Summarize this text in ${maxLength} words or less:\n\n${task.text}`;

      case 'translation':
        const targetLang = task.options?.targetLanguage || 'English';
        return `Translate this text to ${targetLang}:\n\n${task.text}`;

      default:
        return task.text;
    }
  }

  /**
   * Calculate estimated cost
   */
  private calculateCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const costs =
      CLAUDE_COSTS[model as keyof typeof CLAUDE_COSTS] ||
      CLAUDE_COSTS['claude-3-5-sonnet-20241022'];

    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;

    return parseFloat((inputCost + outputCost).toFixed(6));
  }
}
