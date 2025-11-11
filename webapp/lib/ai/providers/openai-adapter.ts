/**
 * Phase 2: OpenAI (GPT) Provider Adapter
 *
 * Implements the unified AIProvider interface for OpenAI models.
 * Used as fallback when Anthropic is unavailable.
 */

import OpenAI from 'openai';
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
const GPT_COSTS = {
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4-turbo': { input: 10.0, output: 30.0 },
};

export class OpenAIAdapter implements AIProvider {
  readonly name: AIProviderType = 'openai';
  private client: OpenAI;
  private lastHealthCheck: Date | null = null;
  private healthStatus: ProviderHealth | null = null;
  private isAvailable: boolean = true;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY;

    if (!key) {
      console.warn('[OpenAIAdapter] API key not configured - adapter unavailable');
      this.isAvailable = false;
      // Create dummy client to avoid null checks
      this.client = new OpenAI({ apiKey: 'dummy' });
      return;
    }

    this.client = new OpenAI({ apiKey: key });
  }

  get available(): boolean {
    return this.isAvailable;
  }

  /**
   * Send chat completion request
   */
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.isAvailable) {
      throw new Error('OpenAI adapter not available - API key not configured');
    }

    const model = options?.model || 'gpt-4o';
    const maxTokens = options?.maxTokens || 4096;
    const temperature = options?.temperature ?? 1.0;

    // Convert to OpenAI message format
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add system prompt if provided
    if (options?.systemPrompt) {
      openaiMessages.unshift({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    try {
      const response = await this.client.chat.completions.create({
        model,
        messages: openaiMessages,
        max_tokens: maxTokens,
        temperature,
      });

      const choice = response.choices[0];
      const usage = response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      };

      const cost = this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens);

      return {
        content: choice.message.content || '',
        model,
        provider: 'openai',
        usage: {
          inputTokens: usage.prompt_tokens,
          outputTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
        cost,
      };
    } catch (error: any) {
      console.error('[OpenAIAdapter] Chat request failed:', error);

      // Handle rate limits
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded - try again later');
      }

      throw new Error(`OpenAI chat failed: ${error.message}`);
    }
  }

  /**
   * Analyze text using GPT's structured output
   */
  async analyze(task: AnalysisTask): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(task);

    const response = await this.chat([{ role: 'user', content: prompt }], {
      model: 'gpt-4o-mini', // Use cheaper model for analysis
      temperature: 0.3,
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
      provider: 'openai',
      usage: response.usage,
    };
  }

  /**
   * Translate text using GPT
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
        model: 'gpt-4o-mini',
        temperature: 0.3,
      }
    );

    return response.content.trim();
  }

  /**
   * Check provider health
   */
  async healthCheck(): Promise<ProviderHealth> {
    if (!this.isAvailable) {
      return {
        provider: 'openai',
        healthy: false,
        latency: 0,
        lastChecked: new Date(),
        errorRate: 1,
      };
    }

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
      await this.chat([{ role: 'user', content: 'Reply with only the word "OK"' }], {
        model: 'gpt-4o-mini',
        maxTokens: 10,
      });

      const latency = Date.now() - startTime;

      this.healthStatus = {
        provider: 'openai',
        healthy: true,
        latency,
        lastChecked: now,
        errorRate: 0,
      };
    } catch (error) {
      this.healthStatus = {
        provider: 'openai',
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
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs = GPT_COSTS[model as keyof typeof GPT_COSTS] || GPT_COSTS['gpt-4o'];

    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;

    return parseFloat((inputCost + outputCost).toFixed(6));
  }
}
