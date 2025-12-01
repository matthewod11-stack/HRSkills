import { type NextRequest, NextResponse } from 'next/server';
import { env } from '@/env.mjs';
import { handleApiError } from '@/lib/api-helpers';
import {
  getMetricCount,
  getMetrics,
  type MetricFilters,
  storeMetric,
} from '@/lib/services/web-vitals-service';

interface MetricPayload {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url?: string;
  userAgent?: string;
  navigationType?: string;
}

/**
 * POST /api/analytics/metrics
 *
 * Receives Core Web Vitals metrics from the monitoring system.
 *
 * In production, you would:
 * - Store metrics in a database
 * - Send to analytics service (e.g., Google Analytics, Mixpanel)
 * - Aggregate for dashboards
 *
 * For now, this is a simple logging endpoint.
 */
export async function POST(request: NextRequest) {
  let rawMetric: MetricPayload | undefined;
  try {
    rawMetric = await request.json();

    // Validate metric structure
    if (!rawMetric || !rawMetric.name || !rawMetric.value || !rawMetric.timestamp) {
      return NextResponse.json({ error: 'Invalid metric data' }, { status: 400 });
    }

    // TypeScript narrowing: after validation, metric is definitely MetricPayload
    const metric: MetricPayload = rawMetric;

    // Log to console (in development)
    if (env.NODE_ENV === 'development') {
      console.log('[Analytics - Metric]', {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        timestamp: new Date(metric.timestamp).toISOString(),
      });
    }

    // Store metric in database (default to 'good' rating if not provided)
    await storeMetric({
      name: metric.name,
      value: metric.value,
      rating: metric.rating ?? 'good',
      timestamp: metric.timestamp,
      url: metric.url,
      userAgent: metric.userAgent,
      navigationType: metric.navigationType,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/metrics',
      method: 'POST',
      requestBody: { metricName: rawMetric?.name },
    });
  }
}

/**
 * GET /api/analytics/metrics
 *
 * Retrieve aggregated metrics (for internal dashboards)
 *
 * Query Parameters:
 * - metricName: Filter by metric name (LCP, FID, CLS, FCP, TTFB)
 * - startDate: ISO date string for start of range
 * - endDate: ISO date string for end of range
 * - rating: Filter by rating (good, needs-improvement, poor)
 * - limit: Number of results (default: 100)
 * - offset: Pagination offset (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: MetricFilters = {
      metricName: searchParams.get('metricName') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      rating: (searchParams.get('rating') as 'good' | 'needs-improvement' | 'poor') || undefined,
      limit: parseInt(searchParams.get('limit') || '100', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    };

    const metrics = await getMetrics(filters);
    const total = await getMetricCount(filters);

    return NextResponse.json({
      metrics,
      pagination: {
        total,
        limit: filters.limit,
        offset: filters.offset,
        hasMore: (filters.offset || 0) + metrics.length < total,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/metrics',
      method: 'GET',
    });
  }
}
