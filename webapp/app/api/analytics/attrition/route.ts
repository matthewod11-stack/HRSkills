/**
 * Phase 2: SQL-powered Attrition/Turnover Analytics API
 *
 * Migrated from JSON file loading to SQLite database queries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateAttrition, getAttritionByDepartment } from '@/lib/analytics/attrition-sql';
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { employees } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Helper: Convert period string to date range
 */
function getDateRange(period: string): { start: string; end: string } {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'last_30_days':
      start.setDate(start.getDate() - 30);
      break;
    case 'last_90_days':
      start.setDate(start.getDate() - 90);
      break;
    case 'last_6_months':
      start.setMonth(start.getMonth() - 6);
      break;
    case 'last_12_months':
    default:
      start.setMonth(start.getMonth() - 12);
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

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
    const department = searchParams.get('department');

    // Check if we have employee data
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees);

    const totalEmployees = countResult[0]?.count || 0;

    if (totalEmployees === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No employee data found. Please upload employee data or run the migration.',
        },
        { status: 404 }
      );
    }

    // Check for terminated employees
    const terminatedResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(eq(employees.status, 'terminated'));

    const terminatedCount = terminatedResult[0]?.count || 0;

    if (terminatedCount === 0) {
      return NextResponse.json({
        success: true,
        data: {
          attrition: {
            overall: {
              totalTerminations: 0,
              attritionRate: 0,
              voluntaryRate: 0,
              involuntaryRate: 0,
            },
            byDepartment: {},
            byLevel: {},
            byLocation: {},
          },
        },
        metadata: {
          totalEmployees,
          terminatedCount: 0,
          period,
          message: 'No turnover data available for the selected period.',
          calculatedAt: new Date().toISOString(),
          dataSource: 'SQLite',
        },
      });
    }

    // Get date range
    const { start, end } = getDateRange(period);

    // Calculate attrition metrics
    let attrition;
    if (department) {
      // Single department attrition
      const deptAttrition = await getAttritionByDepartment(department, start, end);
      attrition = {
        overall: {
          totalTerminations: deptAttrition.terminations,
          attritionRate: deptAttrition.attritionRate,
          voluntaryRate: 0,
          involuntaryRate: 0,
        },
        byDepartment: {
          [department]: deptAttrition,
        },
        byLevel: {},
        byLocation: {},
      };
    } else {
      // Full attrition analysis
      attrition = await calculateAttrition(start, end);
    }

    return NextResponse.json({
      success: true,
      data: {
        attrition,
      },
      metadata: {
        totalEmployees,
        terminatedCount,
        period,
        dateRange: {
          start,
          end,
        },
        department: department || 'all',
        calculatedAt: new Date().toISOString(),
        dataSource: 'SQLite',
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/attrition',
      method: 'GET',
      userId: authResult.user.userId,
      requestBody: {
        period: request.nextUrl.searchParams.get('period') || 'last_12_months',
      },
    });
  }
}
