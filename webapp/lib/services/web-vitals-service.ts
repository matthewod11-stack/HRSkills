/**
 * Web Vitals Metrics Service
 *
 * Handles storage and retrieval of Core Web Vitals metrics.
 * Provides functions for storing metrics, querying with filters, and aggregating data.
 */

import { randomUUID } from 'node:crypto';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { type NewWebVitalsMetric, type WebVitalsMetric, webVitalsMetrics } from '@/db/schema';
import { db } from '@/lib/db';

export interface WebVitalsMetricInput {
  name: string; // 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB'
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number | string; // Unix timestamp or ISO string
  url?: string;
  userAgent?: string;
  navigationType?: string;
}

export interface MetricFilters {
  metricName?: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  rating?: 'good' | 'needs-improvement' | 'poor';
  limit?: number;
  offset?: number;
}

export interface AggregatedMetrics {
  total: number;
  average: number;
  p50: number; // Median
  p75: number;
  p95: number;
  p99: number;
  min: number;
  max: number;
  byRating: {
    good: number;
    'needs-improvement': number;
    poor: number;
  };
}

/**
 * Store a Web Vitals metric in the database
 */
export async function storeMetric(metric: WebVitalsMetricInput): Promise<void> {
  // Convert timestamp to ISO string if it's a number
  const timestampISO =
    typeof metric.timestamp === 'number'
      ? new Date(metric.timestamp).toISOString()
      : metric.timestamp;

  const newMetric: NewWebVitalsMetric = {
    id: `wv_${randomUUID()}`,
    metricName: metric.name,
    value: metric.value,
    rating: metric.rating,
    timestamp: timestampISO,
    url: metric.url || null,
    userAgent: metric.userAgent || null,
    navigationType: metric.navigationType || null,
  };

  await db.insert(webVitalsMetrics).values(newMetric);
}

/**
 * Retrieve Web Vitals metrics with optional filters
 */
export async function getMetrics(filters: MetricFilters = {}): Promise<WebVitalsMetric[]> {
  const { metricName, startDate, endDate, rating, limit = 100, offset = 0 } = filters;

  let query = db.select().from(webVitalsMetrics);

  // Build where conditions
  const conditions = [];
  if (metricName) {
    conditions.push(eq(webVitalsMetrics.metricName, metricName));
  }
  if (rating) {
    conditions.push(eq(webVitalsMetrics.rating, rating));
  }
  if (startDate) {
    conditions.push(gte(webVitalsMetrics.timestamp, startDate));
  }
  if (endDate) {
    conditions.push(lte(webVitalsMetrics.timestamp, endDate));
  }

  // Apply conditions
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  // Order by timestamp descending (most recent first)
  query = query.orderBy(desc(webVitalsMetrics.timestamp)) as any;

  // Apply pagination
  const results = await query.limit(limit).offset(offset);

  return results;
}

/**
 * Get aggregated metrics for a time range
 */
export async function getAggregatedMetrics(
  metricName: string,
  startDate?: string,
  endDate?: string
): Promise<AggregatedMetrics | null> {
  // Build where conditions
  const conditions = [eq(webVitalsMetrics.metricName, metricName)];
  if (startDate) {
    conditions.push(gte(webVitalsMetrics.timestamp, startDate));
  }
  if (endDate) {
    conditions.push(lte(webVitalsMetrics.timestamp, endDate));
  }

  const whereClause = and(...conditions);

  // Get all metrics for this metric name and time range
  const metrics = await db
    .select()
    .from(webVitalsMetrics)
    .where(whereClause)
    .orderBy(desc(webVitalsMetrics.timestamp));

  if (metrics.length === 0) {
    return null;
  }

  // Calculate statistics
  const values = metrics.map((m) => m.value).sort((a, b) => a - b);
  const total = values.length;
  const sum = values.reduce((acc, val) => acc + val, 0);
  const average = sum / total;

  // Calculate percentiles
  const percentile = (arr: number[], p: number): number => {
    const index = Math.ceil((p / 100) * arr.length) - 1;
    return arr[Math.max(0, Math.min(index, arr.length - 1))];
  };

  const p50 = percentile(values, 50);
  const p75 = percentile(values, 75);
  const p95 = percentile(values, 95);
  const p99 = percentile(values, 99);

  // Count by rating
  const byRating = {
    good: metrics.filter((m) => m.rating === 'good').length,
    'needs-improvement': metrics.filter((m) => m.rating === 'needs-improvement').length,
    poor: metrics.filter((m) => m.rating === 'poor').length,
  };

  return {
    total,
    average,
    p50,
    p75,
    p95,
    p99,
    min: values[0],
    max: values[values.length - 1],
    byRating,
  };
}

/**
 * Get count of metrics matching filters
 */
export async function getMetricCount(filters: MetricFilters = {}): Promise<number> {
  const { metricName, startDate, endDate, rating } = filters;

  const conditions = [];
  if (metricName) {
    conditions.push(eq(webVitalsMetrics.metricName, metricName));
  }
  if (rating) {
    conditions.push(eq(webVitalsMetrics.rating, rating));
  }
  if (startDate) {
    conditions.push(gte(webVitalsMetrics.timestamp, startDate));
  }
  if (endDate) {
    conditions.push(lte(webVitalsMetrics.timestamp, endDate));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(webVitalsMetrics)
    .where(whereClause);

  return result[0]?.count || 0;
}
