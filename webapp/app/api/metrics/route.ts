import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';
import { db } from '@/lib/db';
import { employees } from '@/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';
import { getAggregatedMetrics } from '@/lib/performance-monitor';
import { calculateENPS } from '@/lib/analytics/enps-sql';

/**
 * GET /api/metrics
 * Unified metrics endpoint supporting multiple metric types via query parameters
 *
 * Query Parameters:
 * - type: 'dashboard' | 'headcount' | 'attrition' | 'openPositions' | 'ai-costs' | 'performance'
 * - details: 'true' | 'false' (optional, for drill-down data)
 *
 * Examples:
 * - GET /api/metrics (default: dashboard summary)
 * - GET /api/metrics?type=dashboard
 * - GET /api/metrics?type=headcount&details=true
 * - GET /api/metrics?type=ai-costs
 */
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

  // Single-user model: authenticated = authorized
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'dashboard';
    const details = searchParams.get('details') === 'true';

    // Handle AI costs metrics
    if (type === 'ai-costs' || type === 'performance') {
      return await getAICostsMetrics();
    }

    // Query employee data from SQLite using Drizzle ORM
    const allEmployees = await db.select().from(employees);

    if (!allEmployees || allEmployees.length === 0) {
      return NextResponse.json(
        {
          error: 'No data available',
          message: 'Please upload employee data in the Data Center first.',
          headcount: 0,
          enpsScore: 0,
          openPositions: 0,
          lastUpdated: new Date().toISOString(),
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          },
        }
      );
    }

    // Calculate active headcount
    const activeEmployees = allEmployees.filter((emp) => emp.status === 'active');
    const headcount = activeEmployees.length;

    // Calculate eNPS score
    const enpsData = await calculateENPS();
    const enpsScore = enpsData.currentScore?.score || 0;

    const openPositions = 0; // Not tracked in current schema

    // Handle different metric types
    if (type === 'dashboard') {
      // Return dashboard summary
      const metrics = {
        headcount,
        enpsScore,
        openPositions,
        lastUpdated: new Date().toISOString(),
      };

      return NextResponse.json(metrics, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      });
    }

    if (type === 'headcount') {
      if (details) {
        // Get last 5 new hires (sorted by hire_date DESC)
        const recentHires = activeEmployees
          .filter((emp) => emp.hireDate)
          .sort((a, b) => {
            const dateA = new Date(a.hireDate!).getTime();
            const dateB = new Date(b.hireDate!).getTime();
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((emp) => ({
            name: emp.fullName || 'Unknown',
            role: emp.jobTitle || 'No Title',
            date: emp.hireDate,
          }));

        return NextResponse.json({
          success: true,
          metric: 'headcount',
          total: headcount,
          data: recentHires,
        });
      } else {
        return NextResponse.json({
          success: true,
          metric: 'headcount',
          value: headcount,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    if (type === 'attrition') {
      if (details) {
        // Get last 5 terminations (sorted by termination_date DESC)
        const recentTerminations = allEmployees
          .filter((emp) => {
            if (!emp.terminationDate) return false;
            const exitDate = new Date(emp.terminationDate);
            const yearStartDate = new Date(yearStart);
            return exitDate >= yearStartDate && exitDate <= new Date();
          })
          .sort((a, b) => {
            const dateA = new Date(a.terminationDate!).getTime();
            const dateB = new Date(b.terminationDate!).getTime();
            return dateB - dateA;
          })
          .slice(0, 5)
          .map((emp) => ({
            name: emp.fullName || 'Unknown',
            role: emp.jobTitle || 'No Title',
            date: emp.terminationDate,
          }));

        return NextResponse.json({
          success: true,
          metric: 'attrition',
          rate: attritionRate,
          count: terminatedYTD,
          data: recentTerminations,
        });
      } else {
        return NextResponse.json({
          success: true,
          metric: 'attrition',
          value: attritionRate,
          count: terminatedYTD,
          lastUpdated: new Date().toISOString(),
        });
      }
    }

    if (type === 'openPositions') {
      return NextResponse.json({
        success: true,
        metric: 'openPositions',
        value: openPositions,
        data: [],
        message: 'Open positions tracking not yet implemented',
        lastUpdated: new Date().toISOString(),
      });
    }

    // Invalid type
    return NextResponse.json(
      {
        error: `Invalid metric type: ${type}`,
        validTypes: [
          'dashboard',
          'headcount',
          'attrition',
          'openPositions',
          'ai-costs',
          'performance',
        ],
      },
      { status: 400 }
    );
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/metrics',
      method: 'GET',
      userId: authResult.user.userId,
    });
  }
}

/**
 * Helper function to get AI costs and performance metrics
 */
async function getAICostsMetrics() {
  try {
    // Get last 24 hours of metrics
    const metrics = getAggregatedMetrics(24 * 60);

    if (metrics.sampleCount === 0) {
      // No data yet - return empty state
      return NextResponse.json({
        cacheHitRate: 0,
        avgCachedTokens: 0,
        avgInputTokens: 0,
        avgOutputTokens: 0,
        totalCost: 0,
        estimatedMonthlyCost: 0,
        savingsVsBaseline: 0,
        sampleCount: 0,
        periodStart: metrics.periodStart,
        periodEnd: metrics.periodEnd,
      });
    }

    // Calculate monthly projections
    const requestsPerDay = 200; // Conservative estimate
    const daysPerMonth = 30;
    const avgCostPerRequest = metrics.totalTokenCost / metrics.sampleCount;
    const monthlyCost = avgCostPerRequest * requestsPerDay * daysPerMonth;
    const baselineMonthlyCost = 4800;
    const savings = baselineMonthlyCost - monthlyCost;

    return NextResponse.json({
      cacheHitRate: metrics.cacheHitRate,
      avgCachedTokens: metrics.avgCachedTokens,
      avgInputTokens: metrics.avgInputTokens,
      avgOutputTokens: metrics.avgOutputTokens,
      totalCost: metrics.totalTokenCost,
      estimatedMonthlyCost: monthlyCost,
      savingsVsBaseline: Math.max(0, savings),
      sampleCount: metrics.sampleCount,
      periodStart: metrics.periodStart,
      periodEnd: metrics.periodEnd,
    });
  } catch (error) {
    console.error('Failed to calculate AI cost metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve metrics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
