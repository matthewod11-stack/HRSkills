import { NextRequest, NextResponse } from 'next/server';
import {
  getAggregatedMetrics,
  formatMetricsSummary,
  checkThresholds,
  exportMetrics,
  clearMetrics,
} from '@/lib/performance-monitor';
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError, validationError, notFoundError } from '@/lib/api-helpers';

/**
 * GET /api/monitoring
 * Returns aggregated system performance and monitoring metrics
 *
 * Query Parameters:
 * - period: Number of minutes to aggregate (default: 60)
 * - format: 'json' | 'text' (default: 'json')
 *
 * Examples:
 * - GET /api/monitoring
 * - GET /api/monitoring?period=24&format=text
 */
export async function GET(request: NextRequest) {
  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Check permissions (only admins can view performance metrics)
  // Single-user model: authenticated = authorized

  try {
    const url = new URL(request.url);
    const periodMinutes = parseInt(url.searchParams.get('period') || '60');
    const format = url.searchParams.get('format') || 'json';

    const metrics = getAggregatedMetrics(periodMinutes);
    const thresholdCheck = checkThresholds(metrics);

    if (format === 'text') {
      const summary = formatMetricsSummary(metrics);
      const alerts =
        thresholdCheck.alerts.length > 0
          ? `\n\nALERTS (${thresholdCheck.status.toUpperCase()}):\n${thresholdCheck.alerts.map((a) => `- ${a}`).join('\n')}`
          : '\n\nNo alerts';

      return new NextResponse(summary + alerts, {
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        thresholds: thresholdCheck,
        period: {
          minutes: periodMinutes,
          start: metrics.periodStart,
          end: metrics.periodEnd,
        },
      },
    });
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/monitoring',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}

/**
 * POST /api/monitoring
 * System monitoring operations (export, clear)
 *
 * Body:
 * { action: 'export' | 'clear' }
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Single-user model: authenticated = authorized

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'export') {
      const allMetrics = exportMetrics();
      return NextResponse.json({
        success: true,
        data: allMetrics,
      });
    }

    if (action === 'clear') {
      clearMetrics();
      return NextResponse.json({
        success: true,
        message: 'Metrics cleared',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "export" or "clear"' },
      { status: 400 }
    );
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/monitoring',
      method: 'POST',
      userId: authResult.user.userId,
      requestBody: { action: 'unknown' },
    });
  }
}
