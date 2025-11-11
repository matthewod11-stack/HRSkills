import { NextRequest, NextResponse } from 'next/server'
import { loadDataFileByType } from '@/lib/analytics/utils'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'

export async function GET(request: NextRequest) {
  // Apply rate limiting (standard endpoints: 100 req/min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.standard);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'analytics', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to access metrics' },
      { status: 403 }
    );
  }
  try {
    // Load employee data to calculate real metrics
    const employeeData = await loadDataFileByType('employee_master')

    if (!employeeData || employeeData.length === 0) {
      return NextResponse.json({
        error: 'No data available',
        message: 'Please upload employee data in the Data Center first.',
        headcount: 0,
        attritionRate: 0,
        openPositions: 0,
        lastUpdated: new Date().toISOString()
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      })
    }

    // Calculate active headcount
    const activeEmployees = employeeData.filter((emp: any) =>
      !emp.status || emp.status.toLowerCase() === 'active'
    )
    const headcount = activeEmployees.length

    // Calculate YTD attrition rate
    // Attrition = (Terminations YTD / Average Headcount) * 100
    const currentYear = new Date().getFullYear()
    const yearStart = new Date(currentYear, 0, 1)

    const terminatedYTD = employeeData.filter((emp: any) => {
      if (!emp.termination_date && !emp.exit_date) return false

      const termDate = emp.termination_date || emp.exit_date
      const exitDate = new Date(termDate)

      return exitDate >= yearStart && exitDate <= new Date()
    }).length

    // Average headcount = (Starting headcount + Current headcount) / 2
    // For simplicity, using current headcount as baseline
    const avgHeadcount = headcount + terminatedYTD

    let attritionRate = 0
    if (avgHeadcount > 0) {
      attritionRate = parseFloat(((terminatedYTD / avgHeadcount) * 100).toFixed(1))
    }

    // Count open positions
    const openPositions = employeeData.filter((emp: any) =>
      emp.status && emp.status.toLowerCase() === 'open'
    ).length

    const metrics = {
      headcount,
      attritionRate,
      openPositions,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
      }
    })
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/metrics',
      method: 'GET',
      userId: authResult.user.userId
    });
  }
}
