import { NextRequest, NextResponse } from 'next/server';
import { loadDataFileByType } from '@/lib/analytics/utils';
import {
  calculateHeadcount,
  calculateHeadcountByDeptAndLevel,
  calculateHeadcountTrends,
  calculateSpanOfControl
} from '@/lib/analytics/headcount';
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
    // Load employee master data
    const employees = await loadDataFileByType('employee_master');

    if (!employees || employees.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No employee data found. Please upload employee_master.csv first.'
      }, { status: 404 });
    }

    // Load optional data
    const demographics = await loadDataFileByType('demographics');
    const turnoverData = await loadDataFileByType('turnover');

    // Calculate all headcount metrics
    const headcount = calculateHeadcount(employees, demographics || undefined);
    const headcountByDeptAndLevel = calculateHeadcountByDeptAndLevel(employees);
    const trends = calculateHeadcountTrends(employees, turnoverData || undefined);
    const spanOfControl = calculateSpanOfControl(employees);

    return NextResponse.json({
      success: true,
      data: {
        headcount,
        headcountByDeptAndLevel,
        trends,
        spanOfControl
      },
      metadata: {
        employeeCount: employees.length,
        hasDemographics: !!demographics,
        hasTurnoverData: !!turnoverData,
        calculatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/headcount',
      method: 'GET',
      userId: authResult.user.userId
    });
  }
}
