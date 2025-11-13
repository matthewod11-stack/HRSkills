/**
 * eNPS (Employee Net Promoter Score) Analytics Service
 *
 * Calculates eNPS metrics from employeeMetrics table:
 * - Overall eNPS score: ((Promoters - Detractors) / Total) × 100
 * - Quarterly trends and comparisons
 * - Department-level segmentation
 * - Category distributions (Promoter/Passive/Detractor)
 *
 * Score Categories:
 * - Promoters: 9-10
 * - Passives: 7-8
 * - Detractors: 0-6
 *
 * Interpretation:
 * - 50+: Excellent (world-class)
 * - 30-49: Great (above average)
 * - 10-29: Good (acceptable)
 * - 0-9: Needs Improvement
 * - Below 0: Poor (critical)
 */

import { db } from '@/lib/db';
import { employees, employeeMetrics } from '@/db/schema';
import { eq, and, gte, lte, sql, desc, isNotNull } from 'drizzle-orm';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface ENPSScore {
  score: number; // -100 to 100
  quarter: string; // e.g., "Q3 2025"
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  promoterPercentage: number;
  passivePercentage: number;
  detractorPercentage: number;
}

export interface ENPSTrend {
  quarter: string;
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  change?: number; // vs previous quarter
}

export interface ENPSByDepartment {
  department: string;
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  promoterPercentage: number;
  passivePercentage: number;
  detractorPercentage: number;
}

export interface ENPSDistribution {
  promoters: number;
  passives: number;
  detractors: number;
  promoterPercentage: number;
  passivePercentage: number;
  detractorPercentage: number;
  total: number;
}

export interface ENPSAnalytics {
  currentScore: ENPSScore | null;
  trends: ENPSTrend[];
  byDepartment: ENPSByDepartment[];
  distribution: ENPSDistribution;
  summary: {
    averageScore: number;
    totalResponses: number;
    quarterCount: number;
    trendDirection: 'up' | 'down' | 'stable';
    trendChange: number; // Long-term trend (first to last)
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate eNPS score from counts
 */
function calculateScore(
  promoters: number,
  passives: number,
  detractors: number
): number {
  const total = promoters + passives + detractors;
  if (total === 0) return 0;

  return Math.round(((promoters - detractors) / total) * 100);
}

/**
 * Get score interpretation
 */
export function getScoreInterpretation(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 50)
    return {
      label: 'Excellent',
      color: 'green',
      description: 'World-class employee satisfaction',
    };
  if (score >= 30)
    return {
      label: 'Great',
      color: 'blue',
      description: 'Above average satisfaction',
    };
  if (score >= 10)
    return {
      label: 'Good',
      color: 'yellow',
      description: 'Acceptable satisfaction levels',
    };
  if (score >= 0)
    return {
      label: 'Needs Improvement',
      color: 'orange',
      description: 'Below average satisfaction',
    };
  return {
    label: 'Poor',
    color: 'red',
    description: 'Critical satisfaction issues',
  };
}

// ============================================================================
// CORE ANALYTICS FUNCTIONS
// ============================================================================

/**
 * Calculate overall eNPS metrics with quarterly trends
 */
export async function calculateENPS(): Promise<ENPSAnalytics> {
  // Get all eNPS responses grouped by quarter and category
  const results = await db
    .select({
      quarter: employeeMetrics.surveyQuarter,
      category: employeeMetrics.surveyCategory,
      count: sql<number>`count(*)`,
    })
    .from(employeeMetrics)
    .where(
      and(
        isNotNull(employeeMetrics.enpsScore),
        isNotNull(employeeMetrics.surveyQuarter),
        isNotNull(employeeMetrics.surveyCategory)
      )
    )
    .groupBy(employeeMetrics.surveyQuarter, employeeMetrics.surveyCategory)
    .orderBy(desc(employeeMetrics.surveyQuarter));

  // Group by quarter
  const quarterMap = new Map<
    string,
    { promoters: number; passives: number; detractors: number }
  >();

  results.forEach((row) => {
    if (!row.quarter || !row.category) return;

    if (!quarterMap.has(row.quarter)) {
      quarterMap.set(row.quarter, { promoters: 0, passives: 0, detractors: 0 });
    }

    const data = quarterMap.get(row.quarter)!;
    const categoryLower = row.category.toLowerCase();

    if (categoryLower === 'promoter') data.promoters += row.count;
    else if (categoryLower === 'passive') data.passives += row.count;
    else if (categoryLower === 'detractor') data.detractors += row.count;
  });

  // Build trends array
  const trends: ENPSTrend[] = Array.from(quarterMap.entries())
    .map(([quarter, data]) => {
      const total = data.promoters + data.passives + data.detractors;
      return {
        quarter,
        score: calculateScore(data.promoters, data.passives, data.detractors),
        promoters: data.promoters,
        passives: data.passives,
        detractors: data.detractors,
        total,
      };
    })
    .sort((a, b) => b.quarter.localeCompare(a.quarter)); // Most recent first

  // Add quarter-over-quarter changes
  for (let i = 0; i < trends.length; i++) {
    if (i < trends.length - 1) {
      trends[i].change = trends[i].score - trends[i + 1].score;
    }
  }

  // Current score (most recent quarter)
  const currentData = trends.length > 0 ? trends[0] : null;
  const currentScore: ENPSScore | null = currentData
    ? {
        score: currentData.score,
        quarter: currentData.quarter,
        promoters: currentData.promoters,
        passives: currentData.passives,
        detractors: currentData.detractors,
        total: currentData.total,
        promoterPercentage: Math.round(
          (currentData.promoters / currentData.total) * 100
        ),
        passivePercentage: Math.round(
          (currentData.passives / currentData.total) * 100
        ),
        detractorPercentage: Math.round(
          (currentData.detractors / currentData.total) * 100
        ),
      }
    : null;

  // Department breakdown
  const byDepartment = await calculateENPSByDepartment();

  // Overall distribution
  const totalPromoters = trends.reduce((sum, t) => sum + t.promoters, 0);
  const totalPassives = trends.reduce((sum, t) => sum + t.passives, 0);
  const totalDetractors = trends.reduce((sum, t) => sum + t.detractors, 0);
  const totalResponses = totalPromoters + totalPassives + totalDetractors;

  const distribution: ENPSDistribution = {
    promoters: totalPromoters,
    passives: totalPassives,
    detractors: totalDetractors,
    promoterPercentage:
      totalResponses > 0
        ? Math.round((totalPromoters / totalResponses) * 100)
        : 0,
    passivePercentage:
      totalResponses > 0
        ? Math.round((totalPassives / totalResponses) * 100)
        : 0,
    detractorPercentage:
      totalResponses > 0
        ? Math.round((totalDetractors / totalResponses) * 100)
        : 0,
    total: totalResponses,
  };

  // Calculate summary statistics
  const averageScore =
    trends.length > 0
      ? Math.round(trends.reduce((sum, t) => sum + t.score, 0) / trends.length)
      : 0;

  const longTermTrend =
    trends.length >= 2 ? trends[0].score - trends[trends.length - 1].score : 0;

  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  if (longTermTrend > 5) trendDirection = 'up';
  else if (longTermTrend < -5) trendDirection = 'down';

  return {
    currentScore,
    trends,
    byDepartment,
    distribution,
    summary: {
      averageScore,
      totalResponses,
      quarterCount: trends.length,
      trendDirection,
      trendChange: longTermTrend,
    },
  };
}

/**
 * Calculate eNPS by department
 */
export async function calculateENPSByDepartment(
  quarter?: string
): Promise<ENPSByDepartment[]> {
  const whereConditions = [
    isNotNull(employeeMetrics.enpsScore),
    isNotNull(employeeMetrics.surveyCategory),
  ];

  if (quarter) {
    whereConditions.push(eq(employeeMetrics.surveyQuarter, quarter));
  }

  const results = await db
    .select({
      department: employees.department,
      category: employeeMetrics.surveyCategory,
      count: sql<number>`count(*)`,
    })
    .from(employeeMetrics)
    .innerJoin(employees, eq(employeeMetrics.employeeId, employees.id))
    .where(and(...whereConditions))
    .groupBy(employees.department, employeeMetrics.surveyCategory);

  // Group by department
  const deptMap = new Map<
    string,
    { promoters: number; passives: number; detractors: number }
  >();

  results.forEach((row) => {
    if (!row.department || !row.category) return;

    if (!deptMap.has(row.department)) {
      deptMap.set(row.department, { promoters: 0, passives: 0, detractors: 0 });
    }

    const data = deptMap.get(row.department)!;
    const categoryLower = row.category.toLowerCase();

    if (categoryLower === 'promoter') data.promoters += row.count;
    else if (categoryLower === 'passive') data.passives += row.count;
    else if (categoryLower === 'detractor') data.detractors += row.count;
  });

  // Build department array
  return Array.from(deptMap.entries())
    .map(([department, data]) => {
      const total = data.promoters + data.passives + data.detractors;
      return {
        department,
        score: calculateScore(data.promoters, data.passives, data.detractors),
        promoters: data.promoters,
        passives: data.passives,
        detractors: data.detractors,
        total,
        promoterPercentage: Math.round((data.promoters / total) * 100),
        passivePercentage: Math.round((data.passives / total) * 100),
        detractorPercentage: Math.round((data.detractors / total) * 100),
      };
    })
    .sort((a, b) => b.score - a.score); // Highest score first
}

/**
 * Get eNPS trends over time
 */
export async function calculateENPSTrends(
  startQuarter?: string,
  endQuarter?: string
): Promise<ENPSTrend[]> {
  const analytics = await calculateENPS();
  let trends = analytics.trends;

  if (startQuarter) {
    trends = trends.filter((t) => t.quarter >= startQuarter);
  }

  if (endQuarter) {
    trends = trends.filter((t) => t.quarter <= endQuarter);
  }

  return trends;
}

/**
 * Get overall distribution of Promoters/Passives/Detractors
 */
export async function getENPSDistribution(
  quarter?: string
): Promise<ENPSDistribution> {
  const whereConditions = [
    isNotNull(employeeMetrics.enpsScore),
    isNotNull(employeeMetrics.surveyCategory),
  ];

  if (quarter) {
    whereConditions.push(eq(employeeMetrics.surveyQuarter, quarter));
  }

  const results = await db
    .select({
      category: employeeMetrics.surveyCategory,
      count: sql<number>`count(*)`,
    })
    .from(employeeMetrics)
    .where(and(...whereConditions))
    .groupBy(employeeMetrics.surveyCategory);

  let promoters = 0;
  let passives = 0;
  let detractors = 0;

  results.forEach((row) => {
    if (!row.category) return;
    const categoryLower = row.category.toLowerCase();

    if (categoryLower === 'promoter') promoters = row.count;
    else if (categoryLower === 'passive') passives = row.count;
    else if (categoryLower === 'detractor') detractors = row.count;
  });

  const total = promoters + passives + detractors;

  return {
    promoters,
    passives,
    detractors,
    promoterPercentage: total > 0 ? Math.round((promoters / total) * 100) : 0,
    passivePercentage: total > 0 ? Math.round((passives / total) * 100) : 0,
    detractorPercentage: total > 0 ? Math.round((detractors / total) * 100) : 0,
    total,
  };
}

/**
 * Get eNPS responses for a specific department
 */
export async function getENPSByDepartment(
  department: string,
  quarter?: string
): Promise<ENPSByDepartment | null> {
  const all = await calculateENPSByDepartment(quarter);
  return all.find((d) => d.department === department) || null;
}
