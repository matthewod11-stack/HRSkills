/**
 * Anthropic API Client with Retry Logic and Circuit Breaker
 *
 * Wraps the Anthropic SDK with:
 * - Exponential backoff retry logic for transient failures
 * - Circuit breaker to prevent cascading failures
 * - Response validation
 */

import Anthropic from '@anthropic-ai/sdk';
import pRetry, { AbortError } from 'p-retry';
import CircuitBreaker from 'opossum';
import { env } from '@/env.mjs';

const apiKey = env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error('ANTHROPIC_API_KEY environment variable is required');
}

// Initialize Anthropic SDK
const anthropic = new Anthropic({ apiKey });

// Circuit breaker options
const circuitBreakerOptions = {
  timeout: 60000, // 60 second timeout
  errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
  resetTimeout: 30000, // Try again after 30 seconds
  name: 'anthropic-api',
};

/**
 * Determines if an error is retryable
 */
function isRetryableError(error: any): boolean {
  // Retry on network errors
  if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Retry on Anthropic API errors that are transient
  if (error.status) {
    // Retry on rate limits
    if (error.status === 429) return true;
    // Retry on server errors
    if (error.status >= 500 && error.status < 600) return true;
  }

  // Don't retry on client errors (4xx except 429)
  if (error.status && error.status >= 400 && error.status < 500) {
    return false;
  }

  return true; // Retry unknown errors
}

/**
 * Create a message with retry logic
 */
async function createMessageWithRetry(
  params: Anthropic.MessageCreateParams
): Promise<Anthropic.Message> {
  const run = async (): Promise<Anthropic.Message> => {
    try {
      const response = await anthropic.messages.create({
        ...params,
        stream: false, // Explicitly disable streaming
      });
      return response as Anthropic.Message;
    } catch (error: any) {
      // Log error for debugging
      if (env.NODE_ENV === 'development') {
        console.error('Anthropic API error:', {
          status: error.status,
          message: error.message,
          code: error.code,
        });
      }

      // Don't retry if error is not retryable
      if (!isRetryableError(error)) {
        throw new AbortError(error.message || 'Anthropic API error');
      }

      // Retry for transient errors
      throw error;
    }
  };

  return pRetry(run, {
    retries: 3,
    factor: 2, // Exponential backoff: 1s, 2s, 4s
    minTimeout: 1000,
    maxTimeout: 8000,
    onFailedAttempt: (error) => {
      if (env.NODE_ENV === 'development') {
        console.warn(`Retry attempt ${error.attemptNumber}/3 for Anthropic API`);
      }
    },
  });
}

// Create circuit breaker for the Anthropic API
const breaker = new CircuitBreaker(createMessageWithRetry, circuitBreakerOptions);

// Circuit breaker event handlers
breaker.on('open', () => {
  console.error('Circuit breaker opened - Anthropic API calls will fail fast');
});

breaker.on('halfOpen', () => {
  console.info('Circuit breaker half-open - Testing Anthropic API');
});

breaker.on('close', () => {
  console.info('Circuit breaker closed - Anthropic API is healthy');
});

/**
 * Create a message with retry logic and circuit breaker protection
 *
 * @example
 * ```typescript
 * const response = await createMessage({
 *   model: 'claude-sonnet-4-20250514',
 *   max_tokens: 1000,
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * });
 * ```
 */
export async function createMessage(
  params: Anthropic.MessageCreateParams
): Promise<Anthropic.Message> {
  try {
    const response = await breaker.fire(params);

    // Validate response has expected structure
    if (!response || !response.content || !Array.isArray(response.content)) {
      throw new Error('Invalid response structure from Anthropic API');
    }

    return response;
  } catch (error: any) {
    // Enhance error message
    if (error.message?.includes('Breaker is open')) {
      throw new Error('Anthropic API is currently unavailable. Please try again in a moment.');
    }

    throw error;
  }
}

/**
 * Get circuit breaker statistics
 */
export function getCircuitBreakerStats() {
  return {
    isOpen: breaker.opened,
    isHalfOpen: breaker.halfOpen,
    isClosed: breaker.closed,
    stats: breaker.stats,
  };
}

/**
 * Reset circuit breaker (for testing)
 */
export function resetCircuitBreaker() {
  breaker.close();
}

/**
 * Extract text content from Anthropic response
 */
export function extractTextContent(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

/**
 * Count tokens in a message (estimate)
 * Anthropic uses ~4 characters per token as a rough estimate
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Validate message parameters before sending
 */
export function validateMessageParams(params: Anthropic.MessageCreateParams): {
  valid: boolean;
  error?: string;
} {
  if (!params.model) {
    return { valid: false, error: 'Model is required' };
  }

  if (!params.messages || params.messages.length === 0) {
    return { valid: false, error: 'At least one message is required' };
  }

  if (!params.max_tokens || params.max_tokens <= 0) {
    return { valid: false, error: 'max_tokens must be greater than 0' };
  }

  if (params.max_tokens > 200000) {
    return { valid: false, error: 'max_tokens cannot exceed 200000' };
  }

  return { valid: true };
}

// Export the raw Anthropic client for advanced use cases
export { anthropic };
export type { Anthropic };
