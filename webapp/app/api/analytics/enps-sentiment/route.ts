/**
 * eNPS Sentiment Analysis API
 *
 * Provides AI-powered sentiment analysis for eNPS survey comments.
 *
 * Endpoints:
 * - GET: Retrieve sentiment analysis data with filtering
 * - POST: Trigger batch sentiment analysis
 */

import { and, eq, isNotNull, sql } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { employeeMetrics, employees } from '@/db/schema';
import {
  analyzeQuarterComments,
  analyzeUnclassifiedComments,
  getSentimentDistribution,
  getTopNegativeComments,
  getTopPositiveComments,
  type SentimentAnalysisProgress,
} from '@/lib/ai/enps-sentiment';
import { createSuccessResponse, handleApiError } from '@/lib/api-helpers';
import { authErrorResponse, requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

// ============================================================================
// GET - Retrieve Sentiment Analysis Data
// ============================================================================

export async function GET(request: NextRequest) {
  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const quarter = searchParams.get('quarter') || undefined;
    const department = searchParams.get('department') || undefined;

    // Get sentiment distribution
    const distribution = await getSentimentDistribution(quarter);

    // Get top comments
    const [topPositive, topNegative] = await Promise.all([
      getTopPositiveComments(quarter, 5),
      getTopNegativeComments(quarter, 5),
    ]);

    // Get department breakdown if requested
    interface DepartmentSentiment {
      department: string;
      positive: number;
      neutral: number;
      negative: number;
      total: number;
      positivePercentage: number;
      neutralPercentage: number;
      negativePercentage: number;
    }
    let byDepartment: DepartmentSentiment[] = [];
    if (!department) {
      // Get sentiment by department
      const whereConditions = [isNotNull(employeeMetrics.sentiment)];
      if (quarter) {
        whereConditions.push(eq(employeeMetrics.surveyQuarter, quarter));
      }

      const deptResults = await db
        .select({
          department: employees.department,
          sentiment: employeeMetrics.sentiment,
          count: sql<number>`count(*)`,
        })
        .from(employeeMetrics)
        .innerJoin(employees, eq(employeeMetrics.employeeId, employees.id))
        .where(and(...whereConditions))
        .groupBy(employees.department, employeeMetrics.sentiment);

      // Group by department
      const deptMap = new Map<string, { positive: number; neutral: number; negative: number }>();

      deptResults.forEach((row) => {
        if (!row.department) return;

        if (!deptMap.has(row.department)) {
          deptMap.set(row.department, { positive: 0, neutral: 0, negative: 0 });
        }

        const data = deptMap.get(row.department)!;
        if (row.sentiment === 'positive') data.positive = row.count;
        else if (row.sentiment === 'neutral') data.neutral = row.count;
        else if (row.sentiment === 'negative') data.negative = row.count;
      });

      byDepartment = Array.from(deptMap.entries()).map(([dept, data]) => {
        const total = data.positive + data.neutral + data.negative;
        return {
          department: dept,
          positive: data.positive,
          neutral: data.neutral,
          negative: data.negative,
          total,
          positivePercentage: Math.round((data.positive / total) * 100),
          neutralPercentage: Math.round((data.neutral / total) * 100),
          negativePercentage: Math.round((data.negative / total) * 100),
        };
      });
    }

    // Calculate trends (sentiment over quarters)
    const trendResults = await db
      .select({
        quarter: employeeMetrics.surveyQuarter,
        sentiment: employeeMetrics.sentiment,
        count: sql<number>`count(*)`,
      })
      .from(employeeMetrics)
      .where(and(isNotNull(employeeMetrics.surveyQuarter), isNotNull(employeeMetrics.sentiment)))
      .groupBy(employeeMetrics.surveyQuarter, employeeMetrics.sentiment)
      .orderBy(sql`${employeeMetrics.surveyQuarter} DESC`);

    // Group by quarter
    const trendMap = new Map<string, { positive: number; neutral: number; negative: number }>();

    trendResults.forEach((row) => {
      if (!row.quarter) return;

      if (!trendMap.has(row.quarter)) {
        trendMap.set(row.quarter, { positive: 0, neutral: 0, negative: 0 });
      }

      const data = trendMap.get(row.quarter)!;
      if (row.sentiment === 'positive') data.positive = row.count;
      else if (row.sentiment === 'neutral') data.neutral = row.count;
      else if (row.sentiment === 'negative') data.negative = row.count;
    });

    const trends = Array.from(trendMap.entries())
      .map(([quarter, data]) => {
        const total = data.positive + data.neutral + data.negative;
        return {
          quarter,
          positive: data.positive,
          neutral: data.neutral,
          negative: data.negative,
          total,
          positivePercentage: Math.round((data.positive / total) * 100),
          neutralPercentage: Math.round((data.neutral / total) * 100),
          negativePercentage: Math.round((data.negative / total) * 100),
        };
      })
      .sort((a, b) => b.quarter.localeCompare(a.quarter)); // Most recent first

    return createSuccessResponse({
      distribution,
      topPositive,
      topNegative,
      byDepartment,
      trends,
      filters: {
        quarter,
        department,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/enps-sentiment',
      method: 'GET',
    });
  }
}

// ============================================================================
// POST - Trigger Sentiment Analysis
// ============================================================================

export async function POST(request: NextRequest) {
  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  try {
    const body = await request.json();
    const { quarter, mode } = body;

    let progress: SentimentAnalysisProgress;

    if (mode === 'quarter' && quarter) {
      // Analyze specific quarter
      progress = await analyzeQuarterComments(quarter);
    } else {
      // Analyze all unclassified comments
      progress = await analyzeUnclassifiedComments();
    }

    return createSuccessResponse({
      message: 'Sentiment analysis completed',
      analysis: {
        success: true,
        data: progress,
      },
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/enps-sentiment',
      method: 'POST',
    });
  }
}
