/**
 * Unified Analytics API (Phase 2)
 *
 * Single endpoint for all analytics with metric-based routing.
 * Consolidates: headcount, attrition, nine-box, diversity, performance, engagement
 *
 * Usage:
 *   GET /api/analytics?metric=headcount
 *   GET /api/analytics?metric=attrition&period=last_90_days
 *   GET /api/analytics?metric=nine-box&department=Engineering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError } from '@/lib/api-helpers';
import { db } from '@/lib/db';
import { employees } from '@/db/schema';
import { eq, sql, and, gte, lte } from 'drizzle-orm';

// Import analytics calculators
import {
  calculateHeadcount,
  calculateHeadcountByDeptAndLevel,
  calculateHeadcountTrends,
  calculateSpanOfControl,
} from '@/lib/analytics/headcount-sql';
import { calculateAttrition, getAttritionByDepartment } from '@/lib/analytics/attrition-sql';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type AnalyticsMetric =
  | 'headcount'
  | 'attrition'
  | 'nine-box'
  | 'diversity'
  | 'performance'
  | 'engagement'
  | 'compensation'
  | 'costs';

type DateRange = 'ytd' | 'qtd' | 'mtd' | 'last_30_days' | 'last_90_days' | 'last_6_months' | 'last_12_months' | 'custom';
type GroupBy = 'department' | 'location' | 'level' | 'manager';
type OutputFormat = 'json' | 'csv';

interface AnalyticsQueryParams {
  metric: AnalyticsMetric;
  department?: string;
  location?: string;
  dateRange?: DateRange;
  startDate?: string;
  endDate?: string;
  groupBy?: GroupBy;
  format?: OutputFormat;
}

interface AnalyticsResponse {
  success: boolean;
  metric: string;
  data: any;
  metadata: {
    generatedAt: string;
    filters: Record<string, any>;
    dataPoints: number;
    dataSource: string;
  };
}

type PerformanceLevel = 'High' | 'Medium' | 'Low';
type PotentialLevel = 'High' | 'Medium' | 'Low';

interface Employee {
  employee_id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  level?: string;
  status?: string;
  manager_rating?: number;
  current_performance_rating?: number;
  ai_performance_score?: number;
  ai_potential_score?: number;
  rating_inflation?: number;
  red_flags?: string;
  gender?: string;
  ethnicity?: string;
  location?: string;
  compensation_base?: number;
  compensation_bonus?: number;
  compensation_equity?: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert date range string to start/end dates
 */
function getDateRange(range: DateRange, customStart?: string, customEnd?: string): { start: string; end: string } {
  const end = new Date();
  const start = new Date();

  if (range === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }

  switch (range) {
    case 'mtd':
      start.setDate(1); // First day of current month
      break;
    case 'qtd':
      const currentMonth = start.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      start.setMonth(quarterStartMonth);
      start.setDate(1);
      break;
    case 'ytd':
      start.setMonth(0); // January
      start.setDate(1);
      break;
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

/**
 * Classify performance level from score
 */
function getPerformanceLevel(score: number): PerformanceLevel {
  if (score >= 4) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

/**
 * Classify potential level from score
 */
function getPotentialLevel(score: number): PotentialLevel {
  if (score >= 3) return 'High';
  if (score >= 2) return 'Medium';
  return 'Low';
}

/**
 * Get 9-box category name from performance and potential levels
 */
function getCategoryName(performance: PerformanceLevel, potential: PotentialLevel): string {
  const key = `${performance}-${potential}`;
  const categories: Record<string, string> = {
    'High-High': 'Future Leader',
    'High-Medium': 'High Performer',
    'High-Low': 'Solid Performer',
    'Medium-High': 'Key Talent',
    'Medium-Medium': 'Growth Potential',
    'Medium-Low': 'Core Employee',
    'Low-High': 'Inconsistent',
    'Low-Medium': 'Development Needed',
    'Low-Low': 'Underperformer',
  };
  return categories[key] || 'Unknown';
}

/**
 * Convert JSON data to CSV format
 */
function convertToCSV(data: any, metric: string): string {
  // For now, return a simple CSV conversion
  // In production, use a proper CSV library
  let csv = '';

  if (Array.isArray(data)) {
    if (data.length === 0) return '';

    // Get headers from first object
    const headers = Object.keys(data[0]);
    csv = headers.join(',') + '\n';

    // Add rows
    for (const row of data) {
      csv += headers.map(h => JSON.stringify(row[h] ?? '')).join(',') + '\n';
    }
  } else {
    // For complex objects, flatten and convert
    csv = `metric,value\n${metric},${JSON.stringify(data)}\n`;
  }

  return csv;
}

// ============================================================================
// METRIC CALCULATORS
// ============================================================================

/**
 * Calculate headcount metrics
 */
async function calculateHeadcountMetrics(params: AnalyticsQueryParams): Promise<any> {
  const [headcount, headcountByDeptAndLevel, trends, spanOfControl] = await Promise.all([
    calculateHeadcount(),
    calculateHeadcountByDeptAndLevel(),
    calculateHeadcountTrends(),
    calculateSpanOfControl(),
  ]);

  let data: any = {
    total: headcount.totalHeadcount,
    byDepartment: headcount.byDepartment,
    byLocation: headcount.byLocation || {},
    trends,
    spanOfControl,
  };

  // Filter by department if specified
  if (params.department) {
    const deptData = headcountByDeptAndLevel.find((d: any) => d.department === params.department);
    data = {
      total: deptData?.headcount || 0,
      department: params.department,
      byLevel: deptData?.byLevel || {},
      trends: trends.filter((t: any) => t.department === params.department),
    };
  }

  // Apply groupBy
  if (params.groupBy === 'department') {
    data.grouped = headcountByDeptAndLevel;
  }

  return data;
}

/**
 * Calculate attrition/turnover metrics
 */
async function calculateAttritionMetrics(params: AnalyticsQueryParams): Promise<any> {
  const dateRange = params.dateRange || 'last_12_months';
  const { start, end } = getDateRange(dateRange, params.startDate, params.endDate);

  // Check for terminated employees
  const terminatedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(eq(employees.status, 'terminated'));

  const terminatedCount = terminatedResult[0]?.count || 0;

  if (terminatedCount === 0) {
    return {
      overall: {
        totalTerminations: 0,
        attritionRate: 0,
        voluntaryRate: 0,
        involuntaryRate: 0,
      },
      byDepartment: {},
      byLevel: {},
      byLocation: {},
      message: 'No turnover data available for the selected period.',
    };
  }

  // Calculate attrition
  let attrition;
  if (params.department) {
    const deptAttrition = await getAttritionByDepartment(params.department, start, end);
    attrition = {
      overall: {
        totalTerminations: deptAttrition.terminations,
        attritionRate: deptAttrition.attritionRate,
        voluntaryRate: 0,
        involuntaryRate: 0,
      },
      byDepartment: {
        [params.department]: deptAttrition,
      },
      byLevel: {},
      byLocation: {},
    };
  } else {
    attrition = await calculateAttrition(start, end);
  }

  return attrition;
}

/**
 * Calculate 9-box grid metrics
 */
async function calculateNineBoxMetrics(params: AnalyticsQueryParams): Promise<any> {
  // Fetch active employees from database
  let query = db.select().from(employees).where(eq(employees.status, 'active'));

  // Filter by department if specified
  if (params.department) {
    query = query.where(and(eq(employees.status, 'active'), eq(employees.department, params.department))) as any;
  }

  const activeEmployees = await query;

  if (activeEmployees.length === 0) {
    return {
      grid: [],
      summary: {
        highPerformers: 0,
        coreEmployees: 0,
        developmentNeeded: 0,
        totalAnalyzed: 0,
        avgRatingInflation: 0,
      },
      message: 'No active employees found for analysis.',
    };
  }

  // Initialize 9-box grid
  const cells = new Map<string, any>();
  const performanceLevels: PerformanceLevel[] = ['High', 'Medium', 'Low'];
  const potentialLevels: PotentialLevel[] = ['High', 'Medium', 'Low'];

  for (const perf of performanceLevels) {
    for (const pot of potentialLevels) {
      cells.set(`${perf}-${pot}`, {
        performance: perf,
        potential: pot,
        count: 0,
        employees: [],
        category: getCategoryName(perf, pot),
      });
    }
  }

  // Place employees into cells
  let totalInflation = 0;
  let inflationCount = 0;

  for (const emp of activeEmployees) {
    const perfScore = emp.ai_performance_score ?? emp.current_performance_rating ?? emp.manager_rating ?? 3;

    let potScore = emp.ai_potential_score;
    if (!potScore) {
      const perf = emp.current_performance_rating ?? emp.manager_rating ?? 3;
      if (perf >= 4) potScore = 2.5;
      else if (perf >= 3) potScore = 2;
      else potScore = 1.5;
    }

    const perfLevel = getPerformanceLevel(perfScore);
    const potLevel = getPotentialLevel(potScore);
    const key = `${perfLevel}-${potLevel}`;

    const cell = cells.get(key);
    if (cell) {
      cell.count++;
      cell.employees.push({
        id: emp.employee_id,
        name: emp.name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
        department: emp.department || 'Unknown',
        aiPerformanceScore: perfScore,
        aiPotentialScore: potScore,
        managerRating: emp.manager_rating ?? null,
        ratingInflation: emp.rating_inflation ?? null,
      });

      if (emp.rating_inflation !== null && emp.rating_inflation !== undefined) {
        totalInflation += emp.rating_inflation;
        inflationCount++;
      }
    }
  }

  // Calculate summary metrics
  const highPerformers =
    (cells.get('High-High')?.count || 0) +
    (cells.get('High-Medium')?.count || 0) +
    (cells.get('High-Low')?.count || 0);

  const coreEmployees =
    (cells.get('Medium-High')?.count || 0) +
    (cells.get('Medium-Medium')?.count || 0) +
    (cells.get('Medium-Low')?.count || 0);

  const developmentNeeded =
    (cells.get('Low-High')?.count || 0) +
    (cells.get('Low-Medium')?.count || 0) +
    (cells.get('Low-Low')?.count || 0);

  const avgRatingInflation = inflationCount > 0 ? totalInflation / inflationCount : 0;

  return {
    grid: Array.from(cells.values()),
    summary: {
      highPerformers,
      coreEmployees,
      developmentNeeded,
      totalAnalyzed: activeEmployees.length,
      avgRatingInflation: parseFloat(avgRatingInflation.toFixed(2)),
    },
  };
}

/**
 * Calculate diversity metrics
 */
async function calculateDiversityMetrics(params: AnalyticsQueryParams): Promise<any> {
  // Fetch active employees
  const activeEmployees = await db.select().from(employees).where(eq(employees.status, 'active'));

  if (activeEmployees.length === 0) {
    return {
      gender: {},
      ethnicity: {},
      total: 0,
      message: 'No active employees found for diversity analysis.',
    };
  }

  // Calculate gender distribution
  const genderCounts: Record<string, number> = {};
  const ethnicityCounts: Record<string, number> = {};

  for (const emp of activeEmployees) {
    const gender = emp.gender || 'Not Specified';
    const ethnicity = emp.ethnicity || 'Not Specified';

    genderCounts[gender] = (genderCounts[gender] || 0) + 1;
    ethnicityCounts[ethnicity] = (ethnicityCounts[ethnicity] || 0) + 1;
  }

  // Convert to percentages
  const total = activeEmployees.length;
  const genderPercentages: Record<string, number> = {};
  const ethnicityPercentages: Record<string, number> = {};

  for (const [gender, count] of Object.entries(genderCounts)) {
    genderPercentages[gender] = parseFloat(((count / total) * 100).toFixed(2));
  }

  for (const [ethnicity, count] of Object.entries(ethnicityCounts)) {
    ethnicityPercentages[ethnicity] = parseFloat(((count / total) * 100).toFixed(2));
  }

  return {
    gender: {
      counts: genderCounts,
      percentages: genderPercentages,
    },
    ethnicity: {
      counts: ethnicityCounts,
      percentages: ethnicityPercentages,
    },
    total,
  };
}

/**
 * Calculate performance metrics
 */
async function calculatePerformanceMetrics(params: AnalyticsQueryParams): Promise<any> {
  // Fetch active employees with performance data
  const activeEmployees = await db.select().from(employees).where(eq(employees.status, 'active'));

  if (activeEmployees.length === 0) {
    return {
      average: 0,
      distribution: {},
      total: 0,
      message: 'No active employees found for performance analysis.',
    };
  }

  let totalRating = 0;
  let ratingCount = 0;
  const distribution: Record<string, number> = {
    '5': 0,
    '4': 0,
    '3': 0,
    '2': 0,
    '1': 0,
  };

  for (const emp of activeEmployees) {
    const rating = emp.current_performance_rating ?? emp.manager_rating ?? emp.ai_performance_score;

    if (rating !== null && rating !== undefined) {
      totalRating += rating;
      ratingCount++;

      const roundedRating = Math.round(rating);
      if (roundedRating >= 1 && roundedRating <= 5) {
        distribution[roundedRating.toString()]++;
      }
    }
  }

  const average = ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(2)) : 0;

  return {
    average,
    distribution,
    total: ratingCount,
    analyzed: activeEmployees.length,
  };
}

/**
 * Calculate compensation metrics
 */
async function calculateCompensationMetrics(params: AnalyticsQueryParams): Promise<any> {
  // Fetch active employees with compensation data
  const activeEmployees = await db.select().from(employees).where(eq(employees.status, 'active'));

  if (activeEmployees.length === 0) {
    return {
      average: { base: 0, bonus: 0, equity: 0, total: 0 },
      byDepartment: {},
      byLevel: {},
      total: 0,
      message: 'No active employees found for compensation analysis.',
    };
  }

  let totalBase = 0;
  let totalBonus = 0;
  let totalEquity = 0;
  let count = 0;

  const byDepartment: Record<string, any> = {};
  const byLevel: Record<string, any> = {};

  for (const emp of activeEmployees) {
    const base = emp.compensation_base || 0;
    const bonus = emp.compensation_bonus || 0;
    const equity = emp.compensation_equity || 0;

    totalBase += base;
    totalBonus += bonus;
    totalEquity += equity;
    count++;

    // By department
    const dept = emp.department || 'Unknown';
    if (!byDepartment[dept]) {
      byDepartment[dept] = { base: 0, bonus: 0, equity: 0, count: 0 };
    }
    byDepartment[dept].base += base;
    byDepartment[dept].bonus += bonus;
    byDepartment[dept].equity += equity;
    byDepartment[dept].count++;

    // By level
    const level = emp.level || 'Unknown';
    if (!byLevel[level]) {
      byLevel[level] = { base: 0, bonus: 0, equity: 0, count: 0 };
    }
    byLevel[level].base += base;
    byLevel[level].bonus += bonus;
    byLevel[level].equity += equity;
    byLevel[level].count++;
  }

  // Calculate averages
  for (const dept of Object.keys(byDepartment)) {
    const c = byDepartment[dept].count;
    byDepartment[dept].averageBase = c > 0 ? Math.round(byDepartment[dept].base / c) : 0;
    byDepartment[dept].averageBonus = c > 0 ? Math.round(byDepartment[dept].bonus / c) : 0;
    byDepartment[dept].averageEquity = c > 0 ? Math.round(byDepartment[dept].equity / c) : 0;
  }

  for (const level of Object.keys(byLevel)) {
    const c = byLevel[level].count;
    byLevel[level].averageBase = c > 0 ? Math.round(byLevel[level].base / c) : 0;
    byLevel[level].averageBonus = c > 0 ? Math.round(byLevel[level].bonus / c) : 0;
    byLevel[level].averageEquity = c > 0 ? Math.round(byLevel[level].equity / c) : 0;
  }

  return {
    average: {
      base: count > 0 ? Math.round(totalBase / count) : 0,
      bonus: count > 0 ? Math.round(totalBonus / count) : 0,
      equity: count > 0 ? Math.round(totalEquity / count) : 0,
      total: count > 0 ? Math.round((totalBase + totalBonus + totalEquity) / count) : 0,
    },
    byDepartment,
    byLevel,
    total: count,
  };
}

/**
 * Calculate engagement metrics (placeholder)
 */
async function calculateEngagementMetrics(params: AnalyticsQueryParams): Promise<any> {
  // TODO: Implement engagement metrics when engagement survey data is available
  return {
    score: 0,
    participation: 0,
    byDepartment: {},
    message: 'Engagement metrics require survey data. This is a placeholder.',
  };
}

/**
 * Calculate cost metrics (placeholder)
 */
async function calculateCostMetrics(params: AnalyticsQueryParams): Promise<any> {
  // Calculate total compensation costs
  const compensationMetrics = await calculateCompensationMetrics(params);

  return {
    totalCompensation: compensationMetrics.average.total * compensationMetrics.total,
    byDepartment: compensationMetrics.byDepartment,
    employees: compensationMetrics.total,
    message: 'Cost metrics based on compensation data. Add benefits and overhead for complete picture.',
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

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
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') as AnalyticsMetric;

    if (!metric) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: metric',
          validMetrics: ['headcount', 'attrition', 'nine-box', 'diversity', 'performance', 'engagement', 'compensation', 'costs'],
        },
        { status: 400 }
      );
    }

    const params: AnalyticsQueryParams = {
      metric,
      department: searchParams.get('department') || undefined,
      location: searchParams.get('location') || undefined,
      dateRange: (searchParams.get('dateRange') as DateRange) || 'last_12_months',
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      groupBy: (searchParams.get('groupBy') as GroupBy) || undefined,
      format: (searchParams.get('format') as OutputFormat) || 'json',
    };

    // Check if we have employee data
    const countResult = await db.select({ count: sql<number>`count(*)` }).from(employees);
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

    // Route to appropriate metric calculator
    let data: any;
    switch (metric) {
      case 'headcount':
        data = await calculateHeadcountMetrics(params);
        break;
      case 'attrition':
        data = await calculateAttritionMetrics(params);
        break;
      case 'nine-box':
        data = await calculateNineBoxMetrics(params);
        break;
      case 'diversity':
        data = await calculateDiversityMetrics(params);
        break;
      case 'performance':
        data = await calculatePerformanceMetrics(params);
        break;
      case 'engagement':
        data = await calculateEngagementMetrics(params);
        break;
      case 'compensation':
        data = await calculateCompensationMetrics(params);
        break;
      case 'costs':
        data = await calculateCostMetrics(params);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown metric: ${metric}`,
            validMetrics: ['headcount', 'attrition', 'nine-box', 'diversity', 'performance', 'engagement', 'compensation', 'costs'],
          },
          { status: 400 }
        );
    }

    // Calculate data points
    let dataPoints = 0;
    if (Array.isArray(data)) {
      dataPoints = data.length;
    } else if (typeof data === 'object') {
      dataPoints = Object.keys(data).length;
    }

    // Build response
    const response: AnalyticsResponse = {
      success: true,
      metric,
      data,
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: {
          metric,
          department: params.department || 'all',
          location: params.location || 'all',
          dateRange: params.dateRange,
          groupBy: params.groupBy || 'none',
        },
        dataPoints,
        dataSource: 'SQLite',
      },
    };

    // Convert to CSV if requested
    if (params.format === 'csv') {
      const csv = convertToCSV(data, metric);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${metric}-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics',
      method: 'GET',
      userId: authResult.user.userId,
      requestBody: {
        metric: request.nextUrl.searchParams.get('metric'),
      },
    });
  }
}
