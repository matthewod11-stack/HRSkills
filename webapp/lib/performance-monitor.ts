/**
 * Performance monitoring utilities
 * Tracks key metrics identified in the performance analysis report
 */

import { env } from '@/env.mjs';

export interface PerformanceMetrics {
  // API Performance
  apiLatency: number; // in milliseconds
  cacheHit: boolean;
  tokensUsed: {
    input: number;
    output: number;
    cached?: number;
    cacheCreation?: number; // Tokens written to cache
  };

  // Metadata
  endpoint: string;
  timestamp: number;
  userId?: string;
}

export interface AggregatedMetrics {
  // Latency
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;

  // Caching
  cacheHitRate: number; // percentage

  // Token usage
  avgInputTokens: number;
  avgOutputTokens: number;
  avgCachedTokens: number;
  totalTokenCost: number; // estimated in USD

  // Time period
  periodStart: Date;
  periodEnd: Date;
  sampleCount: number;
}

// In-memory store for metrics (in production, use a proper database or analytics service)
const metricsStore: PerformanceMetrics[] = [];
const MAX_STORED_METRICS = 1000;

/**
 * Track a performance metric
 */
export function trackMetric(metric: PerformanceMetrics): void {
  metricsStore.push(metric);

  // Keep only the most recent metrics
  if (metricsStore.length > MAX_STORED_METRICS) {
    metricsStore.shift();
  }

  // Log if latency exceeds threshold
  if (metric.apiLatency > 5000) {
    console.warn(`[PERF] High latency detected: ${metric.apiLatency}ms on ${metric.endpoint}`);
  }

  // Log cache misses for debugging
  if (!metric.cacheHit && env.NODE_ENV === 'development') {
    console.log(`[PERF] Cache miss on ${metric.endpoint}`);
  }
}

/**
 * Calculate token cost based on Anthropic pricing
 * Sonnet 4.5 pricing (as of report date):
 * - Input: $3 per million tokens
 * - Output: $15 per million tokens
 * - Cached input: $0.30 per million tokens (90% discount)
 * - Cache writes: $3.75 per million tokens (25% markup)
 */
export function calculateTokenCost(tokens: PerformanceMetrics['tokensUsed']): number {
  const inputCost = (tokens.input / 1_000_000) * 3;
  const outputCost = (tokens.output / 1_000_000) * 15;
  const cachedCost = ((tokens.cached || 0) / 1_000_000) * 0.3;
  const cacheCreationCost = ((tokens.cacheCreation || 0) / 1_000_000) * 3.75;

  return inputCost + outputCost + cachedCost + cacheCreationCost;
}

/**
 * Calculate savings from cache usage
 * Returns the cost difference between cached vs non-cached tokens
 */
export function calculateCacheSavings(cachedTokens: number): number {
  // Cached tokens cost $0.30/M instead of $3/M
  const cachedCost = (cachedTokens / 1_000_000) * 0.3;
  const uncachedEquivalent = (cachedTokens / 1_000_000) * 3;
  return uncachedEquivalent - cachedCost;
}

/**
 * Calculate cache efficiency metrics
 */
export function calculateCacheEfficiency(tokens: PerformanceMetrics['tokensUsed']): {
  cacheRatio: number; // Percentage of input tokens that were cached
  savings: number; // Dollars saved by caching
  efficiency: 'excellent' | 'good' | 'poor' | 'none';
} {
  const totalInput = tokens.input + (tokens.cached || 0);
  const cacheRatio = totalInput > 0 ? ((tokens.cached || 0) / totalInput) * 100 : 0;
  const savings = calculateCacheSavings(tokens.cached || 0);

  let efficiency: 'excellent' | 'good' | 'poor' | 'none' = 'none';
  if (cacheRatio >= 80) efficiency = 'excellent';
  else if (cacheRatio >= 50) efficiency = 'good';
  else if (cacheRatio > 0) efficiency = 'poor';

  return { cacheRatio, savings, efficiency };
}

/**
 * Get aggregated metrics for a time period
 */
export function getAggregatedMetrics(periodMinutes: number = 60): AggregatedMetrics {
  const now = Date.now();
  const periodStart = now - periodMinutes * 60 * 1000;

  const relevantMetrics = metricsStore.filter((m) => m.timestamp >= periodStart);

  if (relevantMetrics.length === 0) {
    return {
      avgLatency: 0,
      p50Latency: 0,
      p95Latency: 0,
      p99Latency: 0,
      cacheHitRate: 0,
      avgInputTokens: 0,
      avgOutputTokens: 0,
      avgCachedTokens: 0,
      totalTokenCost: 0,
      periodStart: new Date(periodStart),
      periodEnd: new Date(now),
      sampleCount: 0,
    };
  }

  // Calculate latency percentiles
  const latencies = relevantMetrics.map((m) => m.apiLatency).sort((a, b) => a - b);
  const p50Index = Math.floor(latencies.length * 0.5);
  const p95Index = Math.floor(latencies.length * 0.95);
  const p99Index = Math.floor(latencies.length * 0.99);

  // Calculate cache hit rate
  const cacheHits = relevantMetrics.filter((m) => m.cacheHit).length;
  const cacheHitRate = (cacheHits / relevantMetrics.length) * 100;

  // Calculate average token usage
  const avgInputTokens =
    relevantMetrics.reduce((sum, m) => sum + m.tokensUsed.input, 0) / relevantMetrics.length;
  const avgOutputTokens =
    relevantMetrics.reduce((sum, m) => sum + m.tokensUsed.output, 0) / relevantMetrics.length;
  const avgCachedTokens =
    relevantMetrics.reduce((sum, m) => sum + (m.tokensUsed.cached || 0), 0) /
    relevantMetrics.length;

  // Calculate total cost
  const totalTokenCost = relevantMetrics.reduce(
    (sum, m) => sum + calculateTokenCost(m.tokensUsed),
    0
  );

  return {
    avgLatency: latencies.reduce((sum, l) => sum + l, 0) / latencies.length,
    p50Latency: latencies[p50Index],
    p95Latency: latencies[p95Index],
    p99Latency: latencies[p99Index],
    cacheHitRate,
    avgInputTokens,
    avgOutputTokens,
    avgCachedTokens,
    totalTokenCost,
    periodStart: new Date(periodStart),
    periodEnd: new Date(now),
    sampleCount: relevantMetrics.length,
  };
}

/**
 * Format aggregated metrics for logging/display
 */
export function formatMetricsSummary(metrics: AggregatedMetrics): string {
  return `
Performance Summary (${metrics.sampleCount} samples)
Period: ${metrics.periodStart.toLocaleTimeString()} - ${metrics.periodEnd.toLocaleTimeString()}

API Latency:
  - Average: ${Math.round(metrics.avgLatency)}ms
  - P50: ${Math.round(metrics.p50Latency)}ms
  - P95: ${Math.round(metrics.p95Latency)}ms
  - P99: ${Math.round(metrics.p99Latency)}ms

Caching:
  - Hit Rate: ${metrics.cacheHitRate.toFixed(1)}%
  - Avg Cached Tokens: ${Math.round(metrics.avgCachedTokens)}

Token Usage:
  - Avg Input: ${Math.round(metrics.avgInputTokens)}
  - Avg Output: ${Math.round(metrics.avgOutputTokens)}
  - Total Cost: $${metrics.totalTokenCost.toFixed(4)}
  `.trim();
}

/**
 * Check if metrics exceed performance thresholds
 */
export function checkThresholds(metrics: AggregatedMetrics): {
  alerts: string[];
  status: 'healthy' | 'warning' | 'critical';
} {
  const alerts: string[] = [];
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';

  // Latency thresholds from report
  if (metrics.p95Latency > 5000) {
    alerts.push(`P95 latency (${Math.round(metrics.p95Latency)}ms) exceeds target (5000ms)`);
    status = 'critical';
  } else if (metrics.p95Latency > 3000) {
    alerts.push(`P95 latency (${Math.round(metrics.p95Latency)}ms) approaching threshold`);
    status = 'warning';
  }

  // Cache hit rate threshold
  if (metrics.cacheHitRate < 50) {
    alerts.push(`Cache hit rate (${metrics.cacheHitRate.toFixed(1)}%) is low (target: 85%)`);
    status = status === 'critical' ? 'critical' : 'warning';
  }

  // Cost threshold (estimated $4,800/month = $160/day = $6.67/hour)
  const hourlyRate = (metrics.totalTokenCost / (metrics.sampleCount || 1)) * 200; // Assume 200 requests/hour
  if (hourlyRate > 6.67) {
    alerts.push(`Estimated hourly cost ($${hourlyRate.toFixed(2)}) exceeds target ($6.67)`);
    status = 'critical';
  }

  return { alerts, status };
}

/**
 * Export metrics for analysis
 */
export function exportMetrics(): PerformanceMetrics[] {
  return [...metricsStore];
}

/**
 * Clear all stored metrics (useful for testing)
 */
export function clearMetrics(): void {
  metricsStore.length = 0;
}
