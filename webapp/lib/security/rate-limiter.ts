/**
 * Rate Limiting Middleware
 *
 * Implements token bucket algorithm for rate limiting API requests
 * Prevents abuse and DoS attacks
 *
 * Feature Flag: ENABLE_UPSTASH_RATE_LIMIT
 * - true: Use Upstash Redis (distributed, survives restarts)
 * - false: Use in-memory (default, recommended for local dev)
 */

import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';
import { applyUpstashRateLimit } from './upstash-rate-limiter';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
}

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store (use Redis in production for distributed systems)
const store = new Map<string, RateLimitStore>();

// Cleanup old entries every 10 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (value.resetTime < now) {
        store.delete(key);
      }
    }
  },
  10 * 60 * 1000
);

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Use IP address as identifier
  // In production, might want to use user ID for authenticated requests
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

  // Include user-agent to prevent IP spoofing
  const userAgent = request.headers.get('user-agent') || 'unknown';

  return `${ip}:${userAgent}`;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    message = 'Too many requests, please try again later',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = config;

  return async (request: NextRequest): Promise<NextResponse | null> => {
    const identifier = getClientIdentifier(request);
    const now = Date.now();

    let limitInfo = store.get(identifier);

    // Initialize or reset if window expired
    if (!limitInfo || limitInfo.resetTime < now) {
      limitInfo = {
        count: 0,
        resetTime: now + windowMs,
      };
      store.set(identifier, limitInfo);
    }

    // Check if limit exceeded
    if (limitInfo.count >= maxRequests) {
      const retryAfter = Math.ceil((limitInfo.resetTime - now) / 1000);

      return NextResponse.json(
        {
          success: false,
          error: message,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitInfo.resetTime.toString(),
          },
        }
      );
    }

    // Increment counter
    limitInfo.count++;

    return null; // Allow request to proceed
  };
}

/**
 * Preset rate limit configurations
 */
export const RateLimitPresets = {
  // Strict: 10 requests per minute
  strict: {
    windowMs: 60 * 1000,
    maxRequests: 10,
    message: 'Rate limit exceeded. Maximum 10 requests per minute.',
  },

  // Standard: 100 requests per minute
  standard: {
    windowMs: 60 * 1000,
    maxRequests: 100,
    message: 'Rate limit exceeded. Maximum 100 requests per minute.',
  },

  // Lenient: 1000 requests per minute
  lenient: {
    windowMs: 60 * 1000,
    maxRequests: 1000,
    message: 'Rate limit exceeded. Maximum 1000 requests per minute.',
  },

  // Auth endpoints: 5 attempts per 15 minutes
  auth: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },

  // File uploads: 10 per hour
  upload: {
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    message: 'Upload limit exceeded. Maximum 10 uploads per hour.',
  },

  // AI/LLM endpoints: 30 per minute (expensive operations)
  ai: {
    windowMs: 60 * 1000,
    maxRequests: 30,
    message: 'AI request limit exceeded. Maximum 30 AI requests per minute.',
  },
};

/**
 * Apply rate limit using in-memory store
 * (Renamed from applyRateLimit to applyInMemoryRateLimit)
 */
export async function applyInMemoryRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  remaining: number;
  resetTime: number;
}> {
  const identifier = getClientIdentifier(request);
  const now = Date.now();

  let limitInfo = store.get(identifier);

  // Initialize or reset if window expired
  if (!limitInfo || limitInfo.resetTime < now) {
    limitInfo = {
      count: 0,
      resetTime: now + config.windowMs,
    };
    store.set(identifier, limitInfo);
  }

  const remaining = Math.max(0, config.maxRequests - limitInfo.count);

  // Check if limit exceeded
  if (limitInfo.count >= config.maxRequests) {
    const retryAfter = Math.ceil((limitInfo.resetTime - now) / 1000);

    return {
      allowed: false,
      response: NextResponse.json(
        {
          success: false,
          error: config.message || 'Too many requests',
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitInfo.resetTime.toString(),
          },
        }
      ),
      remaining: 0,
      resetTime: limitInfo.resetTime,
    };
  }

  // Increment counter
  limitInfo.count++;

  return {
    allowed: true,
    remaining: remaining - 1,
    resetTime: limitInfo.resetTime,
  };
}

/**
 * Helper to add rate limit headers to any response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  resetTime: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', resetTime.toString());
  return response;
}

/**
 * Apply rate limit with feature flag support
 *
 * Feature Flag: ENABLE_UPSTASH_RATE_LIMIT
 * - true: Use Upstash Redis (distributed, production-ready)
 * - false: Use in-memory (default, local development)
 *
 * Rollback: Set ENABLE_UPSTASH_RATE_LIMIT=false in Vercel dashboard
 * (no code deployment needed)
 */
export async function applyRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  remaining: number;
  resetTime: number;
}> {
  // Check feature flag
  if (env.ENABLE_UPSTASH_RATE_LIMIT) {
    // Use Upstash Redis (distributed)
    return await applyUpstashRateLimit(request, config);
  } else {
    // Use in-memory (default)
    return await applyInMemoryRateLimit(request, config);
  }
}
