import { NextRequest, NextResponse } from 'next/server'
import { loadDataFileByType } from '@/lib/analytics/utils'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
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
      { success: false, error: 'Insufficient permissions to access metrics' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url)
    const metric = searchParams.get('metric')

    if (!metric) {
      return NextResponse.json(
        { error: 'Metric type is required' },
        { status: 400 }
      )
    }

    // Load employee data
    const employeeData = await loadDataFileByType('employee_master')

    if (!employeeData || employeeData.length === 0) {
      return NextResponse.json({
        error: 'No data available',
        message: 'Please upload employee data in the Data Center first.',
        data: []
      }, { status: 200 })
    }

    let responseData: any[] = []

    if (metric === 'headcount') {
      // Get last 5 new hires (sorted by hire_date DESC)
      const activeEmployees = employeeData
        .filter((emp: any) => !emp.status || emp.status.toLowerCase() === 'active')
        .filter((emp: any) => emp.hire_date || emp.start_date)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.hire_date || a.start_date).getTime()
          const dateB = new Date(b.hire_date || b.start_date).getTime()
          return dateB - dateA // Most recent first
        })
        .slice(0, 5)
        .map((emp: any) => ({
          name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.employee_name || 'Unknown',
          role: emp.job_title || emp.title || emp.position || 'No Title',
          date: emp.hire_date || emp.start_date
        }))

      responseData = activeEmployees
    } else if (metric === 'attrition') {
      // Get last 5 terminations (sorted by termination_date DESC)
      const currentYear = new Date().getFullYear()
      const yearStart = new Date(currentYear, 0, 1)

      const terminatedEmployees = employeeData
        .filter((emp: any) => {
          const termDate = emp.termination_date || emp.exit_date
          if (!termDate) return false

          const exitDate = new Date(termDate)
          return exitDate >= yearStart && exitDate <= new Date()
        })
        .sort((a: any, b: any) => {
          const dateA = new Date(a.termination_date || a.exit_date).getTime()
          const dateB = new Date(b.termination_date || b.exit_date).getTime()
          return dateB - dateA // Most recent first
        })
        .slice(0, 5)
        .map((emp: any) => ({
          name: emp.full_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.employee_name || 'Unknown',
          role: emp.job_title || emp.title || emp.position || 'No Title',
          date: emp.termination_date || emp.exit_date
        }))

      responseData = terminatedEmployees
    } else if (metric === 'openPositions') {
      // Get all open positions
      const openRoles = employeeData
        .filter((emp: any) => emp.status && emp.status.toLowerCase() === 'open')
        .map((emp: any) => ({
          name: emp.requisition_id || emp.job_id || 'N/A',
          role: emp.job_title || emp.title || emp.position || 'No Title',
          date: emp.opening_date || emp.created_date || null
        }))

      responseData = openRoles
    } else {
      return NextResponse.json(
        { error: 'Invalid metric type' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      metric,
      data: responseData
    })
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/metrics/details',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}
