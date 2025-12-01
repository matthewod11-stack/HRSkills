import * as Sentry from '@sentry/nextjs';
import { type NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api-helpers';
import { logAuditEvent } from '@/lib/security/audit-logger';

interface ErrorPayload {
  message: string;
  type?: string;
  url?: string;
  timestamp: number;
  stack?: string;
  userAgent?: string;
  source?: string;
}

/**
 * POST /api/analytics/errors
 *
 * Receives JavaScript error logs from the monitoring system.
 *
 * In production, you would:
 * - Store errors in a database
 * - Send to error tracking service (e.g., Sentry, Rollbar)
 * - Alert team for critical errors
 * - Group similar errors
 *
 * For now, this is a simple logging endpoint.
 */
export async function POST(request: NextRequest) {
  let rawError: ErrorPayload | undefined;
  try {
    rawError = await request.json();

    // Validate error exists and has required structure
    if (!rawError || !rawError.message || !rawError.timestamp) {
      return NextResponse.json({ error: 'Invalid error data' }, { status: 400 });
    }

    // TypeScript narrowing: after validation, error is definitely ErrorPayload
    const error: ErrorPayload = rawError;

    // Log to console (in production, send to error tracking service)
    console.error('[Analytics - Error]', {
      message: error.message,
      type: error.type,
      url: error.url,
      timestamp: new Date(error.timestamp).toISOString(),
      stack: error.stack?.substring(0, 200), // Truncate stack trace for console
    });

    // Check for critical errors that need immediate attention
    const criticalKeywords = ['security', 'auth', 'payment', 'data loss'];
    const isCritical = criticalKeywords.some((keyword) =>
      error.message.toLowerCase().includes(keyword)
    );

    // Determine severity level
    const severity = isCritical ? 'fatal' : 'error';

    // Send to Sentry error tracking service
    try {
      const sentryEventId = Sentry.captureException(new Error(error.message), {
        level: severity as Sentry.SeverityLevel,
        tags: {
          errorType: error.type,
          source: 'client-side',
        },
        contexts: {
          error: {
            stack: error.stack,
            url: error.url,
            userAgent: error.userAgent,
            type: error.type,
            timestamp: new Date(error.timestamp).toISOString(),
          },
        },
        extra: {
          originalError: error,
        },
      });

      // Log critical errors to audit log for compliance
      if (isCritical) {
        console.error('🚨 CRITICAL ERROR DETECTED:', error.message);

        // Log to security audit log
        await logAuditEvent({
          eventType: 'api.error',
          severity: 'critical',
          success: false,
          message: `Critical client-side error: ${error.message}`,
          metadata: {
            errorType: error.type,
            url: error.url,
            sentryEventId,
          },
        });
      }
    } catch (sentryError) {
      // Silently fail - don't break the endpoint if Sentry fails
      console.error('[Analytics - Errors] Failed to send to Sentry:', sentryError);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return handleApiError(err, {
      endpoint: '/api/analytics/errors',
      method: 'POST',
      requestBody: { errorType: rawError?.type },
    });
  }
}

/**
 * GET /api/analytics/errors
 *
 * Retrieve error logs (for internal dashboards)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const type = searchParams.get('type'); // 'error' or 'unhandledrejection'

    // Note: Errors are stored in Sentry, not in our database
    // For retrieving errors, use Sentry's API or dashboard
    // This endpoint returns a message indicating where to find errors

    return NextResponse.json({
      errors: [],
      count: 0,
      message: 'Errors are tracked in Sentry. Use Sentry dashboard or API to retrieve error logs.',
      filters: { limit, type },
      sentryIntegration: true,
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/errors',
      method: 'GET',
    });
  }
}
