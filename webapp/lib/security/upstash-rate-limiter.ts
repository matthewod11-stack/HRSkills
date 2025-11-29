/**
 * Upstash Rate Limiting Implementation
 *
 * Distributed rate limiting using Upstash Redis
 * Survives server restarts and supports multi-instance deployments
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { type NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';

/**
 * Rate limit configuration interface
 * Matches the in-memory implementation for consistency
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
}

/**
 * Initialize Upstash Redis client (singleton)
 */
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    // Validate credentials exist
    if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error(
        'Upstash credentials not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local'
      );
    }

    redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redis;
}

/**
 * Get client identifier from request
 * Same logic as in-memory implementation for consistency
 */
function getClientIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  return `${ip}:${userAgent}`;
}

/**
 * Create Upstash Ratelimit instance for a specific configuration
 */
function createRatelimiter(config: RateLimitConfig): Ratelimit {
  const redis = getRedis();

  // Convert windowMs to seconds for Upstash
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.maxRequests, `${windowSeconds} s`),
    analytics: true, // Enable analytics in Upstash dashboard
    prefix: 'hrskills:ratelimit', // Namespace for keys
  });
}

/**
 * Apply rate limit using Upstash Redis
 * Returns same interface as in-memory implementation for drop-in replacement
 */
export async function applyUpstashRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  response?: NextResponse;
  remaining: number;
  resetTime: number;
}> {
  try {
    const identifier = getClientIdentifier(request);
    const ratelimiter = createRatelimiter(config);

    // Check rate limit with Upstash
    const { success, limit, remaining, reset } = await ratelimiter.limit(identifier);

    // If rate limit exceeded
    if (!success) {
      const now = Date.now();
      const resetTime = reset; // Upstash returns epoch timestamp in milliseconds
      const retryAfter = Math.ceil((resetTime - now) / 1000);

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
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetTime.toString(),
            },
          }
        ),
        remaining: 0,
        resetTime,
      };
    }

    // Rate limit OK, return success
    return {
      allowed: true,
      remaining,
      resetTime: reset,
    };
  } catch (error) {
    // If Upstash fails, log error and ALLOW request (fail open)
    // This prevents outages if Upstash is down
    console.error('[Upstash] Rate limit check failed, allowing request:', error);

    // Return success with conservative estimates
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetTime: Date.now() + config.windowMs,
    };
  }
}

/**
 * Test Upstash connection
 * Use this to verify credentials are correct
 */
export async function testUpstashConnection(): Promise<boolean> {
  try {
    const redis = getRedis();
    await redis.ping();
    console.log('[Upstash] Connection test successful');
    return true;
  } catch (error) {
    console.error('[Upstash] Connection test failed:', error);
    return false;
  }
}
