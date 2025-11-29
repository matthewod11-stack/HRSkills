/**
 * Web Vitals Monitoring
 *
 * Tracks Core Web Vitals (CWV) metrics for performance monitoring.
 * Metrics tracked: CLS, LCP, INP, TTFB
 *
 * Usage:
 * - Development: Logs metrics to console
 * - Production: Can be extended to send to analytics service
 *
 * @see https://web.dev/vitals/
 */

import { type Metric, onCLS, onINP, onLCP, onTTFB } from 'web-vitals';
// NODE_ENV is available via process.env in both server and client contexts

/**
 * Web Vitals metric thresholds
 * @see https://web.dev/defining-core-web-vitals-thresholds/
 */
export const WEB_VITALS_THRESHOLDS = {
  // Cumulative Layout Shift (visual stability)
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  // Largest Contentful Paint (loading performance)
  LCP: {
    good: 2500, // ms
    needsImprovement: 4000, // ms
  },
  // Interaction to Next Paint (responsiveness - replaces FID in web-vitals v4)
  INP: {
    good: 200, // ms
    needsImprovement: 500, // ms
  },
  // Time to First Byte (server response)
  TTFB: {
    good: 800, // ms
    needsImprovement: 1800, // ms
  },
};

/**
 * Get rating for a metric value
 */
function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[metric.name as keyof typeof WEB_VITALS_THRESHOLDS];

  if (!thresholds) return 'good';

  if (metric.value <= thresholds.good) {
    return 'good';
  } else if (metric.value <= thresholds.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

/**
 * Get console color based on rating
 */
function getColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
  switch (rating) {
    case 'good':
      return '#0CCE6B'; // Green
    case 'needs-improvement':
      return '#FFA400'; // Orange
    case 'poor':
      return '#FF4E42'; // Red
  }
}

/**
 * Handle metric reporting
 */
function handleMetric(metric: Metric) {
  const rating = getRating(metric);
  const color = getColor(rating);

  // Development: Log to console with color coding
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `%c${metric.name} %c${metric.value.toFixed(metric.name === 'CLS' ? 3 : 0)}${metric.name === 'CLS' ? '' : 'ms'} %c(${rating})`,
      'font-weight: bold',
      `color: ${color}; font-weight: bold`,
      `color: ${color}`
    );
  }

  // Production: Send to analytics endpoint for persistence
  if (process.env.NODE_ENV === 'production') {
    persistMetric(metric, rating);
  }
}

/**
 * Send metrics to analytics API for storage
 */
async function persistMetric(metric: Metric, rating: string) {
  try {
    await fetch('/api/analytics/metrics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        navigationType: metric.navigationType,
      }),
      // Don't wait for response (fire and forget)
      keepalive: true,
    });
  } catch (error) {
    // Silently fail - don't impact user experience
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to send web vital:', error);
    }
  }
}

/**
 * Initialize Web Vitals monitoring
 *
 * Call this once in your app, typically in _app.tsx or layout.tsx
 */
export function initWebVitals() {
  // Track all Core Web Vitals (FID removed - replaced by INP in web-vitals v4)
  onCLS(handleMetric);
  onLCP(handleMetric);
  onINP(handleMetric);
  onTTFB(handleMetric);

  if (process.env.NODE_ENV === 'development') {
    console.log('%cWeb Vitals monitoring initialized', 'color: #0CCE6B; font-weight: bold');
  }
}

/**
 * Store Web Vitals data in memory for display in UI
 * (Optional: For showing metrics in a dashboard)
 */
interface WebVitalsData {
  CLS?: number;
  LCP?: number;
  INP?: number;
  TTFB?: number;
  lastUpdated?: number;
}

let webVitalsData: WebVitalsData = {};

export function storeWebVital(metric: Metric) {
  webVitalsData = {
    ...webVitalsData,
    [metric.name]: metric.value,
    lastUpdated: Date.now(),
  };
}

export function getWebVitalsData(): WebVitalsData {
  return webVitalsData;
}

/**
 * React Hook for accessing Web Vitals data
 * (Optional: For building a performance dashboard)
 */
export function useWebVitals() {
  if (typeof window === 'undefined') {
    return null;
  }
  return getWebVitalsData();
}
