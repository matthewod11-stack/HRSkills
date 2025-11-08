import { NextRequest, NextResponse } from 'next/server';
import { loadDataFileByType, getDateRange } from '@/lib/analytics/utils';
import {
  calculateAttrition,
  calculateRetention
} from '@/lib/analytics/attrition';
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError, validationError, notFoundError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'analytics', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to access analytics' },
      { status: 403 }
    );
  }
  try {
    // Get query parameters for date filtering
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'last_12_months';

    // Load required data
    const employees = await loadDataFileByType('employee_master');
    const turnoverData = await loadDataFileByType('turnover');

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No employee data found. Please upload employee_master.csv first.'
      }, { status: 404 });
    }

    if (!turnoverData || turnoverData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No turnover data found. Please upload turnover.csv to calculate attrition metrics.'
      }, { status: 404 });
    }

    // Load optional demographics
    const demographics = await loadDataFileByType('demographics');

    // Get date range for filtering
    const { start, end } = getDateRange(period);

    // Calculate attrition metrics
    const attrition = calculateAttrition(
      employees,
      turnoverData,
      demographics || undefined,
      start,
      end
    );

    // Calculate retention metrics
    const periodMonths = period === 'last_12_months' ? 12 :
                        period === 'last_90_days' ? 3 :
                        period === 'last_30_days' ? 1 : 12;

    const retention = calculateRetention(employees, turnoverData, periodMonths);

    return NextResponse.json({
      success: true,
      data: {
        attrition,
        retention
      },
      metadata: {
        employeeCount: employees.length,
        turnoverCount: turnoverData.length,
        hasDemographics: !!demographics,
        period,
        dateRange: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/attrition',
      method: 'GET',
      userId: authResult.user.userId,
      requestBody: { period: request.nextUrl.searchParams.get('period') || 'last_12_months' }
    });
  }
}
