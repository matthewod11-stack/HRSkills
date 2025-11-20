/**
 * Sentry Client Configuration
 *
 * Configures Sentry for client-side (browser) error tracking.
 * This file is automatically loaded by Next.js when @sentry/nextjs is installed.
 *
 * NOTE: This file is loaded at BUILD TIME and RUNTIME.
 * - Build-time: Sentry.init() configuration is evaluated during build
 * - Runtime: Some variables (NODE_ENV) are checked at runtime
 * We keep direct process.env access here since Sentry needs to initialize
 * before env.mjs validation runs.
 */

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,

  // Set tracesSampleRate to 1.0 to capture 100% of the transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Set sample rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release version (optional, for tracking deployments)
  release: process.env.SENTRY_RELEASE || undefined,

  // Filter out known non-critical errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    'atomicFindClose',
    // Network errors that are often not actionable
    'NetworkError',
    'Network request failed',
    'Failed to fetch',
    // Third-party scripts
    'fb_xd_fragment',
    'bmi_SafeAddOnload',
    'EBCallBackMessageReceived',
    // Chrome extensions
    'chrome-extension://',
  ],

  // Filter out URLs that shouldn't be tracked
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],

  // Set beforeSend to filter or modify events before sending
  beforeSend(event, hint) {
    // Don't send errors in development (they're logged to console)
    if (process.env.NODE_ENV === 'development') {
      console.log('[Sentry] Would send event:', event);
      return null; // Don't send in development
    }

    // Filter out errors that are not actionable
    if (event.exception) {
      const error = hint.originalException;
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message).toLowerCase();
        // Ignore common non-critical errors
        if (
          message.includes('resizeobserver loop limit exceeded') ||
          message.includes('non-error promise rejection captured')
        ) {
          return null;
        }
      }
    }

    return event;
  },

  // Integrations
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Mask all text content and user input
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

