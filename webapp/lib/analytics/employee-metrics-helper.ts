/**
 * Employee Metrics Helper
 *
 * Provides utilities for querying employees with their latest performance metrics.
 * Handles the common pattern of joining employees with employee_metrics and
 * getting the most recent metric_date entry for each employee.
 */

import { desc, eq, type SQL } from 'drizzle-orm';
import type { Employee, EmployeeMetric } from '@/db/schema';
import { employeeMetrics, employees } from '@/db/schema';
import { db } from '@/lib/db';

/**
 * Employee with their latest metrics joined
 */
export interface EmployeeWithMetrics {
  emp: Employee;
  metrics: EmployeeMetric | null;
}

/**
 * Get all employees with their most recent employee_metrics data
 *
 * This function performs a LEFT JOIN to ensure all employees are included,
 * even those without performance metrics. For employees with multiple
 * metric_date entries, only the most recent is returned.
 *
 * @param whereClause - Optional SQL where clause to filter employees
 * @returns Array of employees with their latest metrics (or null if no metrics)
 *
 * @example
 * // Get all active employees with metrics
 * const activeWithMetrics = await getEmployeesWithLatestMetrics(
 *   eq(employees.status, 'active')
 * );
 */
export async function getEmployeesWithLatestMetrics(
  whereClause?: SQL
): Promise<EmployeeWithMetrics[]> {
  // Step 1: Get all employees matching the where clause
  // Note: We execute the query conditionally to avoid Drizzle ORM type narrowing issues
  const employeeList = whereClause
    ? await db.select().from(employees).where(whereClause)
    : await db.select().from(employees);

  if (employeeList.length === 0) {
    return [];
  }

  // Step 2: For each employee, get their latest metrics (if any)
  const results: EmployeeWithMetrics[] = [];

  for (const emp of employeeList) {
    // Get the most recent metrics for this employee
    const latestMetrics = await db
      .select()
      .from(employeeMetrics)
      .where(eq(employeeMetrics.employeeId, emp.id))
      .orderBy(desc(employeeMetrics.metricDate))
      .limit(1);

    results.push({
      emp,
      metrics: latestMetrics[0] || null,
    });
  }

  return results;
}

/**
 * Get a single employee with their latest metrics
 *
 * @param employeeId - The employee ID to fetch
 * @returns Employee with metrics or null if not found
 */
export async function getEmployeeWithLatestMetrics(
  employeeId: string
): Promise<EmployeeWithMetrics | null> {
  const emp = await db.select().from(employees).where(eq(employees.id, employeeId)).limit(1);

  if (emp.length === 0) {
    return null;
  }

  const latestMetrics = await db
    .select()
    .from(employeeMetrics)
    .where(eq(employeeMetrics.employeeId, employeeId))
    .orderBy(desc(employeeMetrics.metricDate))
    .limit(1);

  return {
    emp: emp[0],
    metrics: latestMetrics[0] || null,
  };
}

/**
 * Helper to get performance score with fallback
 *
 * Returns the performance rating from metrics, or a default value if not available.
 *
 * @param metrics - Employee metrics (can be null)
 * @param defaultScore - Default score to use if no metrics (default: 3)
 * @returns Performance score (1-5 scale)
 */
export function getPerformanceScore(
  metrics: EmployeeMetric | null,
  defaultScore: number = 3
): number {
  if (!metrics || metrics.performanceRating === null) {
    return defaultScore;
  }
  return metrics.performanceRating;
}

/**
 * Helper to calculate potential score
 *
 * Uses performance forecast if available, otherwise derives from performance rating.
 *
 * @param metrics - Employee metrics (can be null)
 * @param defaultPotential - Default potential to use if no metrics (default: 2)
 * @returns Potential score (1-3 scale: Low=1, Medium=2, High=3)
 */
export function getPotentialScore(
  metrics: EmployeeMetric | null,
  defaultPotential: number = 2
): number {
  if (!metrics) {
    return defaultPotential;
  }

  // Use performance forecast if available
  if (metrics.performanceForecast !== null) {
    // Convert 1-5 forecast to 1-3 potential scale
    if (metrics.performanceForecast >= 4.5) return 3; // High
    if (metrics.performanceForecast >= 3) return 2; // Medium
    return 1; // Low
  }

  // Derive from current performance rating
  const perfRating = metrics.performanceRating || defaultPotential + 1;
  if (perfRating >= 4) return 3; // High
  if (perfRating >= 3) return 2; // Medium
  return 1; // Low
}
