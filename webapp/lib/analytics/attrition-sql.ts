/**
 * Phase 2: SQL-based Attrition/Turnover Analytics
 *
 * Migrated from in-memory array operations to SQL queries.
 * Calculates turnover rates, voluntary vs involuntary, and demographic breakdowns.
 */

import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { employees } from '@/db/schema';
import { db } from '@/lib/db';

export interface AttritionResult {
  overall: {
    totalTerminations: number;
    attritionRate: number;
    voluntaryRate: number;
    involuntaryRate: number;
  };
  byDepartment: Record<
    string,
    {
      terminations: number;
      attritionRate: number;
    }
  >;
  byLevel: Record<
    string,
    {
      terminations: number;
      attritionRate: number;
    }
  >;
  byLocation: Record<
    string,
    {
      terminations: number;
      attritionRate: number;
    }
  >;
  demographics?: {
    byGender?: Record<string, { terminations: number; rate: number }>;
    byRace?: Record<string, { terminations: number; rate: number }>;
  };
}

/**
 * Calculate attrition/turnover metrics using SQL
 */
export async function calculateAttrition(
  startDate?: string,
  endDate?: string
): Promise<AttritionResult> {
  // Default to last 12 months if no date range provided
  if (!startDate) {
    const oneYearAgo = new Date();
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);
    startDate = oneYearAgo.toISOString().split('T')[0];
  }

  if (!endDate) {
    endDate = new Date().toISOString().split('T')[0];
  }

  // Get active headcount
  const activeResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(eq(employees.status, 'active'));

  const activeCount = activeResult[0]?.count || 0;

  // Get terminated employees in date range
  const terminatedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(
      and(
        eq(employees.status, 'terminated'),
        gte(employees.terminationDate || '', startDate),
        lte(employees.terminationDate || '', endDate)
      )
    );

  const totalTerminations = terminatedResult[0]?.count || 0;

  // Average headcount (active + terminated in period)
  const avgHeadcount = activeCount + totalTerminations;

  // Calculate overall attrition rate
  const attritionRate =
    avgHeadcount > 0 ? parseFloat(((totalTerminations / avgHeadcount) * 100).toFixed(1)) : 0;

  // For now, we don't have voluntary/involuntary data in the schema
  // This would require adding a termination_type field
  const overall = {
    totalTerminations,
    attritionRate,
    voluntaryRate: 0, // TODO: Add when termination_type field is available
    involuntaryRate: 0,
  };

  // Attrition by department
  const byDepartment = await calculateAttritionByField('department', startDate, endDate);

  // Attrition by level
  const byLevel = await calculateAttritionByField('level', startDate, endDate);

  // Attrition by location
  const byLocation = await calculateAttritionByField('location', startDate, endDate);

  // Demographics breakdown
  const demographics = await calculateDemographicAttrition(startDate, endDate);

  return {
    overall,
    byDepartment,
    byLevel,
    byLocation,
    demographics,
  };
}

/**
 * Helper: Calculate attrition rate by a specific field (dept, level, location)
 */
async function calculateAttritionByField(
  field: 'department' | 'level' | 'location',
  startDate: string,
  endDate: string
): Promise<
  Record<
    string,
    {
      terminations: number;
      attritionRate: number;
    }
  >
> {
  const result: Record<
    string,
    {
      terminations: number;
      attritionRate: number;
    }
  > = {};

  // Get active employees by field
  const activeByField = await db
    .select({
      fieldValue: employees[field],
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(eq(employees.status, 'active'))
    .groupBy(employees[field]);

  // Get terminated employees by field
  const terminatedByField = await db
    .select({
      fieldValue: employees[field],
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(
      and(
        eq(employees.status, 'terminated'),
        gte(employees.terminationDate || '', startDate),
        lte(employees.terminationDate || '', endDate)
      )
    )
    .groupBy(employees[field]);

  // Create maps for easy lookup
  const activeMap = new Map<string, number>();
  activeByField.forEach((row) => {
    if (row.fieldValue) {
      activeMap.set(row.fieldValue, row.count);
    }
  });

  const terminatedMap = new Map<string, number>();
  terminatedByField.forEach((row) => {
    if (row.fieldValue) {
      terminatedMap.set(row.fieldValue, row.count);
    }
  });

  // Combine all field values
  const allValues = new Set([...activeMap.keys(), ...terminatedMap.keys()]);

  allValues.forEach((value) => {
    const activeCount = activeMap.get(value) || 0;
    const terminatedCount = terminatedMap.get(value) || 0;
    const avgHeadcount = activeCount + terminatedCount;

    result[value] = {
      terminations: terminatedCount,
      attritionRate:
        avgHeadcount > 0 ? parseFloat(((terminatedCount / avgHeadcount) * 100).toFixed(1)) : 0,
    };
  });

  return result;
}

/**
 * Helper: Calculate attrition by demographic fields (gender, race/ethnicity)
 */
async function calculateDemographicAttrition(
  startDate: string,
  endDate: string
): Promise<{
  byGender?: Record<string, { terminations: number; rate: number }>;
  byRace?: Record<string, { terminations: number; rate: number }>;
}> {
  // Gender breakdown
  const activeByGender = await db
    .select({
      gender: employees.gender,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(eq(employees.status, 'active'))
    .groupBy(employees.gender);

  const terminatedByGender = await db
    .select({
      gender: employees.gender,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(
      and(
        eq(employees.status, 'terminated'),
        gte(employees.terminationDate || '', startDate),
        lte(employees.terminationDate || '', endDate)
      )
    )
    .groupBy(employees.gender);

  const byGender: Record<string, { terminations: number; rate: number }> = {};

  const activeGenderMap = new Map<string, number>();
  activeByGender.forEach((row) => {
    if (row.gender) activeGenderMap.set(row.gender, row.count);
  });

  const terminatedGenderMap = new Map<string, number>();
  terminatedByGender.forEach((row) => {
    if (row.gender) terminatedGenderMap.set(row.gender, row.count);
  });

  const allGenders = new Set([...activeGenderMap.keys(), ...terminatedGenderMap.keys()]);

  allGenders.forEach((gender) => {
    const activeCount = activeGenderMap.get(gender) || 0;
    const terminatedCount = terminatedGenderMap.get(gender) || 0;
    const avgHeadcount = activeCount + terminatedCount;

    byGender[gender] = {
      terminations: terminatedCount,
      rate: avgHeadcount > 0 ? parseFloat(((terminatedCount / avgHeadcount) * 100).toFixed(1)) : 0,
    };
  });

  // Race/ethnicity breakdown
  const activeByRace = await db
    .select({
      race: employees.raceEthnicity,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(eq(employees.status, 'active'))
    .groupBy(employees.raceEthnicity);

  const terminatedByRace = await db
    .select({
      race: employees.raceEthnicity,
      count: sql<number>`count(*)`,
    })
    .from(employees)
    .where(
      and(
        eq(employees.status, 'terminated'),
        gte(employees.terminationDate || '', startDate),
        lte(employees.terminationDate || '', endDate)
      )
    )
    .groupBy(employees.raceEthnicity);

  const byRace: Record<string, { terminations: number; rate: number }> = {};

  const activeRaceMap = new Map<string, number>();
  activeByRace.forEach((row) => {
    if (row.race) activeRaceMap.set(row.race, row.count);
  });

  const terminatedRaceMap = new Map<string, number>();
  terminatedByRace.forEach((row) => {
    if (row.race) terminatedRaceMap.set(row.race, row.count);
  });

  const allRaces = new Set([...activeRaceMap.keys(), ...terminatedRaceMap.keys()]);

  allRaces.forEach((race) => {
    const activeCount = activeRaceMap.get(race) || 0;
    const terminatedCount = terminatedRaceMap.get(race) || 0;
    const avgHeadcount = activeCount + terminatedCount;

    byRace[race] = {
      terminations: terminatedCount,
      rate: avgHeadcount > 0 ? parseFloat(((terminatedCount / avgHeadcount) * 100).toFixed(1)) : 0,
    };
  });

  return {
    byGender,
    byRace,
  };
}

/**
 * Get attrition rate for a specific department
 */
export async function getAttritionByDepartment(
  department: string,
  startDate?: string,
  endDate?: string
): Promise<{ terminations: number; attritionRate: number }> {
  if (!startDate) {
    const oneYearAgo = new Date();
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);
    startDate = oneYearAgo.toISOString().split('T')[0];
  }

  if (!endDate) {
    endDate = new Date().toISOString().split('T')[0];
  }

  const activeResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(and(eq(employees.status, 'active'), eq(employees.department, department)));

  const terminatedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(employees)
    .where(
      and(
        eq(employees.status, 'terminated'),
        eq(employees.department, department),
        gte(employees.terminationDate || '', startDate),
        lte(employees.terminationDate || '', endDate)
      )
    );

  const activeCount = activeResult[0]?.count || 0;
  const terminations = terminatedResult[0]?.count || 0;
  const avgHeadcount = activeCount + terminations;

  return {
    terminations,
    attritionRate:
      avgHeadcount > 0 ? parseFloat(((terminations / avgHeadcount) * 100).toFixed(1)) : 0,
  };
}

/**
 * Calculate time-to-fill (average days to hire)
 */
export async function calculateTimeToFill(): Promise<{
  averageDays: number;
  byDepartment: Record<string, number>;
}> {
  // This would require requisition data which we don't have yet
  // Placeholder for future implementation
  return {
    averageDays: 0,
    byDepartment: {},
  };
}
