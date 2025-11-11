/**
 * Phase 2: SQL-based Headcount Analytics
 *
 * Migrated from in-memory array operations to SQL queries for better performance.
 * Uses Drizzle ORM with SQLite for type-safe, indexed queries.
 */

import { db } from '@/lib/db';
import { employees } from '@/db/schema';
import { eq, and, sql, gte } from 'drizzle-orm';

export interface HeadcountResult {
  totalHeadcount: number;
  byDepartment: Record<string, number>;
  byLevel: Record<string, number>;
  byLocation: Record<string, number>;
  byStatus: Record<string, number>;
  demographics?: {
    byGender?: Record<string, number>;
    byRace?: Record<string, number>;
  };
}

/**
 * Calculate headcount metrics using SQL aggregations
 */
export async function calculateHeadcount(): Promise<HeadcountResult> {
  // Total active headcount
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(eq(employees.status, 'active'));

  const totalHeadcount = totalResult[0]?.count || 0;

  // Headcount by department (indexed query)
  const byDeptResult = await db
    .select({
      department: employees.department,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(eq(employees.status, 'active'))
    .groupBy(employees.department);

  const byDepartment: Record<string, number> = {};
  byDeptResult.forEach((row) => {
    if (row.department) {
      byDepartment[row.department] = row.count;
    }
  });

  // Headcount by level
  const byLevelResult = await db
    .select({
      level: employees.level,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(eq(employees.status, 'active'))
    .groupBy(employees.level);

  const byLevel: Record<string, number> = {};
  byLevelResult.forEach((row) => {
    if (row.level) {
      byLevel[row.level] = row.count;
    }
  });

  // Headcount by location
  const byLocationResult = await db
    .select({
      location: employees.location,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(eq(employees.status, 'active'))
    .groupBy(employees.location);

  const byLocation: Record<string, number> = {};
  byLocationResult.forEach((row) => {
    if (row.location) {
      byLocation[row.location] = row.count;
    }
  });

  // Headcount by status (all statuses)
  const byStatusResult = await db
    .select({
      status: employees.status,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .groupBy(employees.status);

  const byStatus: Record<string, number> = {};
  byStatusResult.forEach((row) => {
    byStatus[row.status] = row.count;
  });

  // Demographics (gender and race/ethnicity)
  const byGenderResult = await db
    .select({
      gender: employees.gender,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(eq(employees.status, 'active'))
    .groupBy(employees.gender);

  const byGender: Record<string, number> = {};
  byGenderResult.forEach((row) => {
    if (row.gender) {
      byGender[row.gender] = row.count;
    }
  });

  const byRaceResult = await db
    .select({
      race: employees.raceEthnicity,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(eq(employees.status, 'active'))
    .groupBy(employees.raceEthnicity);

  const byRace: Record<string, number> = {};
  byRaceResult.forEach((row) => {
    if (row.race) {
      byRace[row.race] = row.count;
    }
  });

  return {
    totalHeadcount,
    byDepartment,
    byLevel,
    byLocation,
    byStatus,
    demographics: {
      byGender,
      byRace,
    },
  };
}

/**
 * Calculate headcount by department and level (cross-tab)
 */
export async function calculateHeadcountByDeptAndLevel(): Promise<
  Record<string, Record<string, number>>
> {
  const result = await db
    .select({
      department: employees.department,
      level: employees.level,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(eq(employees.status, 'active'))
    .groupBy(employees.department, employees.level);

  const crosstab: Record<string, Record<string, number>> = {};

  result.forEach((row) => {
    if (!row.department || !row.level) return;

    if (!crosstab[row.department]) {
      crosstab[row.department] = {};
    }

    crosstab[row.department][row.level] = row.count;
  });

  return crosstab;
}

/**
 * Calculate headcount growth/trends
 */
export async function calculateHeadcountTrends(): Promise<{
  currentHeadcount: number;
  hires: number;
  terminations: number;
  netChange: number;
  growthRate: number;
}> {
  // Current active headcount
  const currentResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(eq(employees.status, 'active'));

  const currentHeadcount = currentResult[0]?.count || 0;

  // Calculate date 12 months ago
  const oneYearAgo = new Date();
  oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

  // Hires in last 12 months
  const hiresResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(and(eq(employees.status, 'active'), gte(employees.hireDate, oneYearAgoStr)));

  const hires = hiresResult[0]?.count || 0;

  // Terminations in last 12 months
  const terminationsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(
      and(eq(employees.status, 'terminated'), gte(employees.terminationDate || '', oneYearAgoStr))
    );

  const terminations = terminationsResult[0]?.count || 0;

  const netChange = hires - terminations;
  const previousHeadcount = currentHeadcount - netChange;
  const growthRate =
    previousHeadcount > 0 ? parseFloat(((netChange / previousHeadcount) * 100).toFixed(1)) : 0;

  return {
    currentHeadcount,
    hires,
    terminations,
    netChange,
    growthRate,
  };
}

/**
 * Calculate manager-to-employee ratios (span of control)
 */
export async function calculateSpanOfControl(): Promise<{
  averageSpan: number;
  byManager: Record<string, { manager: string; directReports: number; managerEmail: string }>;
  totalManagers: number;
}> {
  // Get all active employees with manager info
  const directReportsResult = await db
    .select({
      managerId: employees.managerId,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(
      and(
        eq(employees.status, 'active'),
        sql`${employees.managerId} IS NOT NULL AND ${employees.managerId} != ''`
      )
    )
    .groupBy(employees.managerId);

  const byManager: Record<
    string,
    { manager: string; directReports: number; managerEmail: string }
  > = {};

  let totalDirectReports = 0;

  // Get manager details for each manager ID
  for (const row of directReportsResult) {
    if (!row.managerId) continue;

    const managerDetails = await db
      .select({
        fullName: employees.fullName,
        email: employees.email,
      })
      .from(employees)
      .where(eq(employees.id, row.managerId))
      .limit(1);

    if (managerDetails.length > 0) {
      byManager[row.managerId] = {
        manager: managerDetails[0].fullName,
        managerEmail: managerDetails[0].email,
        directReports: row.count,
      };
      totalDirectReports += row.count;
    }
  }

  const totalManagers = Object.keys(byManager).length;
  const averageSpan =
    totalManagers > 0 ? parseFloat((totalDirectReports / totalManagers).toFixed(1)) : 0;

  return {
    averageSpan,
    byManager,
    totalManagers,
  };
}

/**
 * Get headcount for a specific department
 */
export async function getHeadcountByDepartment(department: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(and(eq(employees.status, 'active'), eq(employees.department, department)));

  return result[0]?.count || 0;
}

/**
 * Get headcount for a specific location
 */
export async function getHeadcountByLocation(location: string): Promise<number> {
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(and(eq(employees.status, 'active'), eq(employees.location, location)));

  return result[0]?.count || 0;
}
