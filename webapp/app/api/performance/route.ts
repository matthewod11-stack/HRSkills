import { NextRequest, NextResponse } from 'next/server'
import {
  getAggregatedMetrics,
  formatMetricsSummary,
  checkThresholds,
  exportMetrics,
  clearMetrics
} from '@/lib/performance-monitor'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError, validationError, notFoundError } from '@/lib/api-helpers';

/**
 * GET /api/performance
 * Returns aggregated performance metrics
 */
export async function GET(request: NextRequest) {
  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Check permissions (only admins can view performance metrics)
  if (!hasPermission(authResult.user, 'settings', 'write')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const url = new URL(request.url)
    const periodMinutes = parseInt(url.searchParams.get('period') || '60')
    const format = url.searchParams.get('format') || 'json'

    const metrics = getAggregatedMetrics(periodMinutes)
    const thresholdCheck = checkThresholds(metrics)

    if (format === 'text') {
      const summary = formatMetricsSummary(metrics)
      const alerts = thresholdCheck.alerts.length > 0
        ? `\n\nALERTS (${thresholdCheck.status.toUpperCase()}):\n${thresholdCheck.alerts.map(a => `- ${a}`).join('\n')}`
        : '\n\nNo alerts'

      return new NextResponse(summary + alerts, {
        headers: { 'Content-Type': 'text/plain' }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        thresholds: thresholdCheck,
        period: {
          minutes: periodMinutes,
          start: metrics.periodStart,
          end: metrics.periodEnd
        }
      }
    })
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/performance',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}

/**
 * GET /api/performance/export
 * Export raw metrics data
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  if (!hasPermission(authResult.user, 'settings', 'write')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json()
    const { action } = body

    if (action === 'export') {
      const allMetrics = exportMetrics()
      return NextResponse.json({
        success: true,
        data: allMetrics
      })
    }

    if (action === 'clear') {
      clearMetrics()
      return NextResponse.json({
        success: true,
        message: 'Metrics cleared'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/performance',
      method: 'POST',
      userId: authResult.user.userId,
      requestBody: { action: 'unknown' }
    });
  }
}
