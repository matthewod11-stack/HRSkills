/**
 * Phase 2: Google Gemini Provider Adapter
 *
 * Implements the unified AIProvider interface for Google Gemini models.
 * Can be used as a fallback option leveraging existing Google Cloud setup.
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
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
const GEMINI_COSTS = {
  'gemini-2.0-flash-exp': { input: 0.0, output: 0.0 }, // Free during preview
  'gemini-1.5-pro': { input: 1.25, output: 5.0 },
  'gemini-1.5-flash': { input: 0.075, output: 0.3 },
};

export class GeminiAdapter implements AIProvider {
  readonly name: AIProviderType = 'gemini';
  private client: GoogleGenerativeAI;
  private lastHealthCheck: Date | null = null;
  private healthStatus: ProviderHealth | null = null;
  private isAvailable: boolean = true;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.GOOGLE_GEMINI_API_KEY;

    if (!key) {
      console.warn('[GeminiAdapter] API key not configured - adapter unavailable');
      this.isAvailable = false;
      // Create dummy client
      this.client = new GoogleGenerativeAI('dummy');
      return;
    }

    this.client = new GoogleGenerativeAI(key);
  }

  get available(): boolean {
    return this.isAvailable;
  }

  /**
   * Send chat completion request
   */
  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    if (!this.isAvailable) {
      throw new Error('Gemini adapter not available - API key not configured');
    }

    const modelName = options?.model || 'gemini-2.0-flash-exp';
    const model = this.client.getGenerativeModel({ model: modelName });

    // Convert messages to Gemini format
    const systemPrompt =
      options?.systemPrompt || messages.find((m) => m.role === 'system')?.content;

    const history = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    try {
      const chat = model.startChat({
        history: history.slice(0, -1), // All but last message
        generationConfig: {
          temperature: options?.temperature ?? 1.0,
          maxOutputTokens: options?.maxTokens || 8192,
        },
        ...(systemPrompt && { systemInstruction: systemPrompt }),
      });

      // Send last message
      const lastMessage = history[history.length - 1];
      const result = await chat.sendMessage(lastMessage.parts[0].text);
      const response = result.response;

      // Estimate token usage (Gemini doesn't always provide exact counts)
      const inputTokens = this.estimateTokens(
        messages.map((m) => m.content).join(' ') + (systemPrompt || '')
      );
      const outputTokens = this.estimateTokens(response.text());
      const totalTokens = inputTokens + outputTokens;

      const cost = this.calculateCost(modelName, inputTokens, outputTokens);

      return {
        content: response.text(),
        model: modelName,
        provider: 'gemini',
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
        },
        cost,
      };
    } catch (error: any) {
      console.error('[GeminiAdapter] Chat request failed:', error);

      // Handle rate limits
      if (error.status === 429 || error.message?.includes('quota')) {
        throw new Error('Gemini rate limit exceeded - try again later');
      }

      throw new Error(`Gemini chat failed: ${error.message}`);
    }
  }

  /**
   * Analyze text using Gemini's structured output
   */
  async analyze(task: AnalysisTask): Promise<AnalysisResult> {
    const prompt = this.buildAnalysisPrompt(task);

    const response = await this.chat([{ role: 'user', content: prompt }], {
      model: 'gemini-1.5-flash', // Use faster model for analysis
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
      provider: 'gemini',
      usage: response.usage,
    };
  }

  /**
   * Translate text using Gemini
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
        model: 'gemini-1.5-flash',
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
        provider: 'gemini',
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
        model: 'gemini-1.5-flash',
        maxTokens: 10,
      });

      const latency = Date.now() - startTime;

      this.healthStatus = {
        provider: 'gemini',
        healthy: true,
        latency,
        lastChecked: now,
        errorRate: 0,
      };
    } catch (error) {
      this.healthStatus = {
        provider: 'gemini',
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
   * Estimate token count (rough approximation: 1 token ≈ 4 characters)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate estimated cost
   */
  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costs =
      GEMINI_COSTS[model as keyof typeof GEMINI_COSTS] || GEMINI_COSTS['gemini-1.5-flash'];

    const inputCost = (inputTokens / 1_000_000) * costs.input;
    const outputCost = (outputTokens / 1_000_000) * costs.output;

    return parseFloat((inputCost + outputCost).toFixed(6));
  }
}
