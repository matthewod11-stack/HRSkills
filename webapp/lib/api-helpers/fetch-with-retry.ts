/**
 * Frontend API Client with Retry Logic
 *
 * Implements exponential backoff retry logic for frontend fetch calls
 * to handle transient network failures and improve reliability.
 */

// NODE_ENV is available via process.env in both server and client contexts

class NonRetryableError extends Error {}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get auth headers from localStorage
 */
function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};

  const token = localStorage.getItem('hr_skills_demo_token');
  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
}

export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  onRetry?: (attempt: number) => void;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  retryDelay: 1000, // Base delay of 1 second
  timeout: 30000, // 30 second timeout
  onRetry: () => {}, // No-op by default
};

/**
 * Determines if an HTTP status code is retryable
 */
function isRetryableStatus(status: number): boolean {
  // Retry on server errors (5xx)
  if (status >= 500 && status < 600) return true;

  // Retry on rate limit (429)
  if (status === 429) return true;

  // Don't retry client errors (4xx except 429)
  return false;
}

/**
 * Fetch with automatic retry logic and exponential backoff
 *
 * @example
 * ```typescript
 * const data = await fetchWithRetry('/api/employees', {
 *   method: 'POST',
 *   body: JSON.stringify({ name: 'John' })
 * });
 * ```
 */
export async function fetchWithRetry<T = any>(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let attempt = 0;

  while (attempt <= opts.maxRetries) {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          ...getAuthHeaders(),
          ...(init?.headers || {}),
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is successful
      if (response.ok) {
        // Parse JSON response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return await response.json();
        }
        return (await response.text()) as T;
      }

      // Determine if we should retry
      if (isRetryableStatus(response.status)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Don't retry client errors (4xx)
      const errorData = await response.json().catch(() => ({}));
      throw new NonRetryableError(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Network errors and timeouts should be retried
      if (error instanceof NonRetryableError) {
        throw error;
      }

      if (attempt === opts.maxRetries) {
        throw error;
      }

      const backoff = Math.min(opts.retryDelay * Math.pow(2, attempt), opts.retryDelay * 8);
      opts.onRetry(attempt + 1);

      if (process.env.NODE_ENV === 'development') {
        console.warn(`Retry attempt ${attempt + 1}/${opts.maxRetries} for ${url}`);
      }

      attempt++;
      await sleep(backoff);
      continue;
    }
  }

  throw new Error('Unable to complete request');
}

/**
 * Convenience wrapper for GET requests
 */
export async function get<T = any>(url: string, options?: RetryOptions): Promise<T> {
  return fetchWithRetry<T>(url, { method: 'GET' }, options);
}

/**
 * Convenience wrapper for POST requests
 */
export async function post<T = any>(url: string, data: any, options?: RetryOptions): Promise<T> {
  return fetchWithRetry<T>(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    options
  );
}

/**
 * Convenience wrapper for PUT requests
 */
export async function put<T = any>(url: string, data: any, options?: RetryOptions): Promise<T> {
  return fetchWithRetry<T>(
    url,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    },
    options
  );
}

/**
 * Convenience wrapper for DELETE requests
 */
export async function del<T = any>(url: string, options?: RetryOptions): Promise<T> {
  return fetchWithRetry<T>(url, { method: 'DELETE' }, options);
}
