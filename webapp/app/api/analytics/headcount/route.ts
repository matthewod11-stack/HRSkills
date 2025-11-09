/**
 * Phase 2: SQL-powered Headcount Analytics API
 *
 * Migrated from JSON file loading to SQLite database queries.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateHeadcount,
  calculateHeadcountByDeptAndLevel,
  calculateHeadcountTrends,
  calculateSpanOfControl,
} from '@/lib/analytics/headcount-sql';
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { employees } from '@/db/schema';
import { sql } from 'drizzle-orm';

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

    // Calculate all headcount metrics using SQL
    const [headcount, headcountByDeptAndLevel, trends, spanOfControl] =
      await Promise.all([
        calculateHeadcount(),
        calculateHeadcountByDeptAndLevel(),
        calculateHeadcountTrends(),
        calculateSpanOfControl(),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        headcount,
        headcountByDeptAndLevel,
        trends,
        spanOfControl,
      },
      metadata: {
        totalEmployees,
        activeEmployees: headcount.totalHeadcount,
        calculatedAt: new Date().toISOString(),
        dataSource: 'SQLite',
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/headcount',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}
