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

import { and, eq, sql } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { employees } from '@/db/schema';
import { calculateAttrition, getAttritionByDepartment } from '@/lib/analytics/attrition-sql';
import { calculateENPS } from '@/lib/analytics/enps-sql';
// Import analytics calculators
import {
  calculateHeadcount,
  calculateHeadcountByDeptAndLevel,
  calculateHeadcountTrends,
  calculateSpanOfControl,
} from '@/lib/analytics/headcount-sql';
import { handleApiError } from '@/lib/api-helpers';
import { authErrorResponse, requireAuth } from '@/lib/auth/middleware';
import { db } from '@/lib/db';

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
  | 'enps' // Employee Net Promoter Score
  | 'compensation'
  | 'costs';

type DateRange =
  | 'ytd'
  | 'qtd'
  | 'mtd'
  | 'last_30_days'
  | 'last_90_days'
  | 'last_6_months'
  | 'last_12_months'
  | 'custom';
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

/** Analytics data can be various metric result shapes */
type AnalyticsData =
  | HeadcountMetricsResult
  | AttritionMetricsResult
  | NineBoxMetricsResult
  | DiversityMetricsResult
  | PerformanceMetricsResult
  | CompensationMetricsResult
  | EngagementMetricsResult
  | CostMetricsResult;

interface AnalyticsResponse {
  success: boolean;
  metric: string;
  data: AnalyticsData;
  metadata: {
    generatedAt: string;
    filters: Record<string, string | undefined>;
    dataPoints: number;
    dataSource: string;
  };
}

/** Headcount metrics result */
interface HeadcountMetricsResult {
  total: number;
  byDepartment?: Record<string, number>;
  byLocation?: Record<string, number>;
  byLevel?: Record<string, number>;
  department?: string;
  trends?: unknown[];
  trendSummary?: unknown;
  spanOfControl?: unknown;
  grouped?: unknown;
}

/** Attrition metrics result */
interface AttritionMetricsResult {
  overall: {
    totalTerminations: number;
    attritionRate: number;
    voluntaryRate: number;
    involuntaryRate: number;
  };
  byDepartment: Record<string, unknown>;
  byLevel: Record<string, unknown>;
  byLocation: Record<string, unknown>;
  message?: string;
}

/** Nine-box metrics result */
interface NineBoxMetricsResult {
  grid: NineBoxCell[];
  summary: {
    highPerformers: number;
    coreEmployees: number;
    developmentNeeded: number;
    totalAnalyzed: number;
    avgRatingInflation: number;
  };
  message?: string;
}

interface NineBoxCell {
  performance: PerformanceLevel;
  potential: PotentialLevel;
  count: number;
  employees: NineBoxEmployee[];
  category: string;
}

interface NineBoxEmployee {
  id: string;
  name: string;
  department: string;
  aiPerformanceScore: number;
  aiPotentialScore: number;
  managerRating: number | null;
  ratingInflation: number | null;
}

/** Diversity metrics result */
interface DiversityMetricsResult {
  gender: {
    counts?: Record<string, number>;
    percentages?: Record<string, number>;
  };
  ethnicity: {
    counts?: Record<string, number>;
    percentages?: Record<string, number>;
  };
  total: number;
  message?: string;
}

/** Performance metrics result */
interface PerformanceMetricsResult {
  average: number;
  distribution: Record<string, number>;
  total: number;
  analyzed?: number;
  message?: string;
}

/** Compensation breakdown */
interface CompensationBreakdown {
  base: number;
  bonus: number;
  equity: number;
  count: number;
  averageBase?: number;
  averageBonus?: number;
  averageEquity?: number;
}

/** Compensation metrics result */
interface CompensationMetricsResult {
  average: {
    base: number;
    bonus: number;
    equity: number;
    total: number;
  };
  byDepartment: Record<string, CompensationBreakdown>;
  byLevel: Record<string, CompensationBreakdown>;
  total: number;
  message?: string;
}

/** Engagement metrics result */
interface EngagementMetricsResult {
  score: number;
  department?: string;
  currentQuarter?: string;
  distribution?: unknown;
  trends?: unknown[];
  byDepartment?: unknown[];
  summary?: unknown;
  message?: string;
}

/** Cost metrics result */
interface CostMetricsResult {
  totalCompensation: number;
  byDepartment: Record<string, CompensationBreakdown>;
  employees: number;
  message?: string;
}

type PerformanceLevel = 'High' | 'Medium' | 'Low';
type PotentialLevel = 'High' | 'Medium' | 'Low';

// Employee interface kept for type documentation and future use
type _Employee = {
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
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert date range string to start/end dates
 */
function getDateRange(
  range: DateRange,
  customStart?: string,
  customEnd?: string
): { start: string; end: string } {
  const end = new Date();
  const start = new Date();

  if (range === 'custom' && customStart && customEnd) {
    return { start: customStart, end: customEnd };
  }

  switch (range) {
    case 'mtd':
      start.setDate(1); // First day of current month
      break;
    case 'qtd': {
      const currentMonth = start.getMonth();
      const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
      start.setMonth(quarterStartMonth);
      start.setDate(1);
      break;
    }
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
function convertToCSV(data: AnalyticsData, metric: string): string {
  // For now, return a simple CSV conversion
  // In production, use a proper CSV library
  let csv = '';

  if (Array.isArray(data)) {
    if (data.length === 0) return '';

    // Get headers from first object
    const firstRow = data[0] as Record<string, unknown>;
    const headers = Object.keys(firstRow);
    csv = `${headers.join(',')}\n`;

    // Add rows
    for (const row of data) {
      const rowData = row as Record<string, unknown>;
      csv += `${headers.map((h) => JSON.stringify(rowData[h] ?? '')).join(',')}\n`;
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
async function calculateHeadcountMetrics(
  params: AnalyticsQueryParams
): Promise<HeadcountMetricsResult> {
  const [headcount, headcountByDeptAndLevel, trendData, spanOfControl] = await Promise.all([
    calculateHeadcount(),
    calculateHeadcountByDeptAndLevel(),
    calculateHeadcountTrends(params.department || undefined),
    calculateSpanOfControl(),
  ]);

  const baseData = {
    total: headcount.totalHeadcount,
    byDepartment: headcount.byDepartment,
    byLocation: headcount.byLocation || {},
    trends: trendData.history,
    trendSummary: trendData.summary,
    spanOfControl,
  };

  // Filter by department if specified
  if (params.department) {
    const department = params.department;
    const byLevel =
      (headcountByDeptAndLevel as Record<string, Record<string, number>>)[department] || {};

    const departmentTotal = headcount.byDepartment?.[department] || 0;

    return {
      total: departmentTotal,
      department,
      byLevel,
      trends: trendData.history,
      trendSummary: trendData.summary,
    };
  }

  // Apply groupBy
  if (params.groupBy === 'department') {
    return {
      ...baseData,
      grouped: headcountByDeptAndLevel,
    };
  }

  return baseData;
}

/**
 * Calculate attrition/turnover metrics
 */
async function calculateAttritionMetrics(
  params: AnalyticsQueryParams
): Promise<AttritionMetricsResult> {
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
  let attrition:
    | Awaited<ReturnType<typeof calculateAttrition>>
    | {
        overall: {
          totalTerminations: number;
          attritionRate: number;
          voluntaryRate: number;
          involuntaryRate: number;
        };
        byDepartment: Record<string, unknown>;
        byLevel: Record<string, unknown>;
        byLocation: Record<string, unknown>;
      };
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
async function calculateNineBoxMetrics(
  params: AnalyticsQueryParams
): Promise<NineBoxMetricsResult> {
  try {
    // Import helpers for performance metrics and rating inflation
    let getEmployeesWithLatestMetrics: typeof import('@/lib/analytics/employee-metrics-helper').getEmployeesWithLatestMetrics;
    let getPerformanceScore: typeof import('@/lib/analytics/employee-metrics-helper').getPerformanceScore;
    let getPotentialScore: typeof import('@/lib/analytics/employee-metrics-helper').getPotentialScore;
    let calculateRatingInflationBatch: typeof import('@/lib/analytics/rating-inflation-calculator').calculateRatingInflationBatch;
    let calculateAverageInflation: typeof import('@/lib/analytics/rating-inflation-calculator').calculateAverageInflation;

    try {
      const helperModule = await import('@/lib/analytics/employee-metrics-helper');
      getEmployeesWithLatestMetrics = helperModule.getEmployeesWithLatestMetrics;
      getPerformanceScore = helperModule.getPerformanceScore;
      getPotentialScore = helperModule.getPotentialScore;
    } catch (importError) {
      console.error('Error importing employee-metrics-helper:', importError);
      throw new Error(
        `Failed to import employee-metrics-helper: ${importError instanceof Error ? importError.message : String(importError)}`
      );
    }

    try {
      const inflationModule = await import('@/lib/analytics/rating-inflation-calculator');
      calculateRatingInflationBatch = inflationModule.calculateRatingInflationBatch;
      calculateAverageInflation = inflationModule.calculateAverageInflation;
    } catch (importError) {
      console.error('Error importing rating-inflation-calculator:', importError);
      throw new Error(
        `Failed to import rating-inflation-calculator: ${importError instanceof Error ? importError.message : String(importError)}`
      );
    }

    // Build where clause
    const whereClause = params.department
      ? and(eq(employees.status, 'active'), eq(employees.department, params.department))
      : eq(employees.status, 'active');

    // Fetch active employees with their latest performance metrics
    let employeesWithMetrics: Awaited<ReturnType<typeof getEmployeesWithLatestMetrics>>;
    try {
      employeesWithMetrics = await getEmployeesWithLatestMetrics(whereClause);
    } catch (queryError) {
      console.error('Error fetching employees with metrics:', queryError);
      throw new Error(
        `Failed to fetch employees: ${queryError instanceof Error ? queryError.message : String(queryError)}`
      );
    }

    if (employeesWithMetrics.length === 0) {
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

    // Calculate rating inflation for all employees (batch operation)
    const employeeIds = employeesWithMetrics.map((e) => e.emp.id);
    const inflationMap = await calculateRatingInflationBatch(employeeIds);

    // Initialize 9-box grid
    const cells = new Map<string, NineBoxCell>();
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
    for (const { emp, metrics } of employeesWithMetrics) {
      // Get performance and potential scores (with fallback to defaults)
      const perfScore = getPerformanceScore(metrics, 3);
      const potScore = getPotentialScore(metrics, 2);

      const perfLevel = getPerformanceLevel(perfScore);
      const potLevel = getPotentialLevel(potScore);
      const key = `${perfLevel}-${potLevel}`;

      // Get rating inflation data for this employee
      const inflation = inflationMap.get(emp.id);

      const cell = cells.get(key);
      if (cell) {
        cell.count++;
        cell.employees.push({
          id: emp.id,
          name: emp.fullName || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
          department: emp.department || 'Unknown',
          aiPerformanceScore: perfScore,
          aiPotentialScore: potScore,
          managerRating: inflation?.managerRating || null,
          ratingInflation: inflation?.inflation || null,
        });
      }
    }

    // Calculate average rating inflation across all employees
    const avgRatingInflation = calculateAverageInflation(inflationMap);

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

    return {
      grid: Array.from(cells.values()),
      summary: {
        highPerformers,
        coreEmployees,
        developmentNeeded,
        totalAnalyzed: employeesWithMetrics.length,
        avgRatingInflation: parseFloat(avgRatingInflation.toFixed(2)),
      },
    };
  } catch (error) {
    // Log the error for debugging
    console.error('Error in calculateNineBoxMetrics:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
}

/**
 * Calculate diversity metrics
 */
async function calculateDiversityMetrics(
  _params: AnalyticsQueryParams
): Promise<DiversityMetricsResult> {
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
    const ethnicity = emp.raceEthnicity || 'Not Specified';

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
async function calculatePerformanceMetrics(
  _params: AnalyticsQueryParams
): Promise<PerformanceMetricsResult> {
  // Import helper for performance metrics
  const { getEmployeesWithLatestMetrics, getPerformanceScore } = await import(
    '@/lib/analytics/employee-metrics-helper'
  );

  // Fetch active employees with their latest performance metrics
  const employeesWithMetrics = await getEmployeesWithLatestMetrics(eq(employees.status, 'active'));

  if (employeesWithMetrics.length === 0) {
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

  for (const { emp: _emp, metrics } of employeesWithMetrics) {
    // Get performance rating from metrics (defaults to 3 if no metrics)
    const rating = getPerformanceScore(metrics, 3);

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
    analyzed: employeesWithMetrics.length,
  };
}

/**
 * Calculate compensation metrics
 */
async function calculateCompensationMetrics(
  _params: AnalyticsQueryParams
): Promise<CompensationMetricsResult> {
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

  const byDepartment: Record<string, CompensationBreakdown> = {};
  const byLevel: Record<string, CompensationBreakdown> = {};

  for (const emp of activeEmployees) {
    const base = emp.compensationBase || 0;
    const bonus = emp.compensationBonus || 0;
    const equity = emp.compensationEquity || 0;

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
 * Calculate engagement metrics (eNPS)
 */
async function calculateEngagementMetrics(
  params: AnalyticsQueryParams
): Promise<EngagementMetricsResult> {
  // Calculate eNPS metrics
  const enpsData = await calculateENPS();

  // Filter by department if specified
  if (params.department) {
    const deptData = enpsData.byDepartment.find((d) => d.department === params.department);
    return {
      score: deptData?.score || 0,
      department: params.department,
      distribution: deptData
        ? {
            promoters: deptData.promoters,
            passives: deptData.passives,
            detractors: deptData.detractors,
            total: deptData.total,
          }
        : null,
      trends: enpsData.trends.filter((t) => t.quarter),
      message: deptData ? undefined : `No eNPS data found for department: ${params.department}`,
    };
  }

  // Return overall eNPS data
  return {
    score: enpsData.currentScore?.score || 0,
    currentQuarter: enpsData.currentScore?.quarter,
    distribution: enpsData.distribution,
    trends: enpsData.trends,
    byDepartment: enpsData.byDepartment,
    summary: enpsData.summary,
  };
}

/**
 * Calculate cost metrics (placeholder)
 */
async function calculateCostMetrics(params: AnalyticsQueryParams): Promise<CostMetricsResult> {
  // Calculate total compensation costs
  const compensationMetrics = await calculateCompensationMetrics(params);

  return {
    totalCompensation: compensationMetrics.average.total * compensationMetrics.total,
    byDepartment: compensationMetrics.byDepartment,
    employees: compensationMetrics.total,
    message:
      'Cost metrics based on compensation data. Add benefits and overhead for complete picture.',
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

  // Single-user model: authenticated = authorized

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric') as AnalyticsMetric;

    if (!metric) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: metric',
          validMetrics: [
            'headcount',
            'attrition',
            'nine-box',
            'diversity',
            'performance',
            'engagement',
            'enps',
            'compensation',
            'costs',
          ],
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
    let data: AnalyticsData;
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
      case 'enps':
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
            validMetrics: [
              'headcount',
              'attrition',
              'nine-box',
              'diversity',
              'performance',
              'engagement',
              'enps',
              'compensation',
              'costs',
            ],
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
    // Log detailed error information for debugging
    console.error('Error in /api/analytics:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return handleApiError(error, {
      endpoint: '/api/analytics',
      method: 'GET',
      userId: authResult?.user?.userId || 'UNKNOWN',
      requestBody: {
        metric: request.nextUrl.searchParams.get('metric'),
      },
    });
  }
}
