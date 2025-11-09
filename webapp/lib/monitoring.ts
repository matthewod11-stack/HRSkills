/**
 * Performance Monitoring System
 *
 * Tracks Core Web Vitals and JavaScript errors without external dependencies.
 * Sends data to /api/analytics endpoints for storage/analysis.
 *
 * Metrics tracked:
 * - LCP (Largest Contentful Paint) - Loading performance
 * - FID (First Input Delay) - Interactivity
 * - CLS (Cumulative Layout Shift) - Visual stability
 * - FCP (First Contentful Paint) - Initial rendering
 * - TTFB (Time to First Byte) - Server response time
 */

export interface Metric {
  name: 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  id?: string;
  navigationType?: string;
}

export interface ErrorLog {
  message: string;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  type: 'error' | 'unhandledrejection';
}

/**
 * Web Vitals thresholds (from web.dev)
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

/**
 * Determine rating based on metric value and thresholds
 */
function getRating(metric: Metric['name'], value: number): Metric['rating'] {
  const threshold = THRESHOLDS[metric];
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metric to analytics endpoint
 */
async function sendMetric(metric: Metric): Promise<void> {
  try {
    // Only send in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Monitoring]', metric);
      return;
    }

    // Note: Web vitals metrics still use dedicated /api/analytics/metrics endpoint
    // This is separate from business analytics (/api/analytics?metric=X)
    await fetch('/api/analytics/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
      // Don't wait for response
      keepalive: true,
    });
  } catch (error) {
    // Silently fail - don't impact user experience
    console.error('Failed to send metric:', error);
  }
}

/**
 * Send error to analytics endpoint
 */
async function sendError(error: ErrorLog): Promise<void> {
  try {
    // Only send in production
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Error]', error);
      return;
    }

    // Note: Error logs still use dedicated /api/analytics/errors endpoint
    // This is separate from business analytics (/api/analytics?metric=X)
    await fetch('/api/analytics/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(error),
      keepalive: true,
    });
  } catch (err) {
    console.error('Failed to send error:', err);
  }
}

/**
 * Track Largest Contentful Paint (LCP)
 * Measures loading performance
 */
export function trackLCP(): void {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const lcp = entry as PerformanceEntry & { renderTime: number; loadTime: number };
      const value = lcp.renderTime || lcp.loadTime;

      sendMetric({
        name: 'LCP',
        value,
        rating: getRating('LCP', value),
        timestamp: Date.now(),
        id: lcp.name,
      });
    }
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // Browser doesn't support LCP
  }
}

/**
 * Track First Input Delay (FID)
 * Measures interactivity
 */
export function trackFID(): void {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const fid = entry as PerformanceEventTiming;

      sendMetric({
        name: 'FID',
        value: fid.processingStart - fid.startTime,
        rating: getRating('FID', fid.processingStart - fid.startTime),
        timestamp: Date.now(),
      });
    }
  });

  try {
    observer.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // Browser doesn't support FID
  }
}

/**
 * Track Cumulative Layout Shift (CLS)
 * Measures visual stability
 */
export function trackCLS(): void {
  if (typeof window === 'undefined') return;

  let clsValue = 0;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const cls = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
      if (!cls.hadRecentInput) {
        clsValue += cls.value;
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // Browser doesn't support CLS
  }

  // Report CLS on page hide
  const reportCLS = () => {
    sendMetric({
      name: 'CLS',
      value: clsValue,
      rating: getRating('CLS', clsValue),
      timestamp: Date.now(),
    });
  };

  // Report when user leaves page
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      reportCLS();
    }
  });

  // Report on page unload
  window.addEventListener('pagehide', reportCLS);
}

/**
 * Track First Contentful Paint (FCP)
 * Measures initial rendering
 */
export function trackFCP(): void {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        sendMetric({
          name: 'FCP',
          value: entry.startTime,
          rating: getRating('FCP', entry.startTime),
          timestamp: Date.now(),
        });
      }
    }
  });

  try {
    observer.observe({ entryTypes: ['paint'] });
  } catch (e) {
    // Browser doesn't support FCP
  }
}

/**
 * Track Time to First Byte (TTFB)
 * Measures server response time
 */
export function trackTTFB(): void {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const navigation = entry as PerformanceNavigationTiming;
      const ttfb = navigation.responseStart - navigation.requestStart;

      sendMetric({
        name: 'TTFB',
        value: ttfb,
        rating: getRating('TTFB', ttfb),
        timestamp: Date.now(),
        navigationType: navigation.type,
      });
    }
  });

  try {
    observer.observe({ entryTypes: ['navigation'] });
  } catch (e) {
    // Browser doesn't support Navigation Timing
  }
}

/**
 * Track JavaScript errors
 */
export function trackErrors(): void {
  if (typeof window === 'undefined') return;

  // Track unhandled errors
  window.addEventListener('error', (event) => {
    sendError({
      message: event.message,
      stack: event.error?.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      type: 'error',
    });
  });

  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    sendError({
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      type: 'unhandledrejection',
    });
  });
}

/**
 * Initialize all monitoring
 * Call this once in your root layout
 */
export function initMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Track Core Web Vitals
  trackLCP();
  trackFID();
  trackCLS();
  trackFCP();
  trackTTFB();

  // Track errors
  trackErrors();
}

/**
 * Manual metric reporting
 * Use for custom performance measurements
 */
export function reportCustomMetric(name: string, value: number): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Custom Metric] ${name}:`, value);
    return;
  }

  // Note: Custom metrics still use dedicated /api/analytics/metrics endpoint
  // This is separate from business analytics (/api/analytics?metric=X)
  fetch('/api/analytics/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      value,
      timestamp: Date.now(),
    }),
    keepalive: true,
  }).catch(console.error);
}
