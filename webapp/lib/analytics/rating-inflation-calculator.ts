/**
 * Rating Inflation Calculator
 *
 * Calculates the difference between self-reported and manager-reported
 * performance ratings. This helps identify rating inflation where employees
 * rate themselves higher than their managers do.
 */

import { and, desc, eq } from 'drizzle-orm';
import { performanceReviews } from '@/db/schema';
import { db } from '@/lib/db';

/**
 * Rating inflation result
 */
export interface RatingInflation {
  selfRating: number | null;
  managerRating: number | null;
  inflation: number | null; // selfRating - managerRating
  hasBothRatings: boolean;
}

/**
 * Calculate rating inflation for a single employee
 *
 * Compares the most recent self-review rating with the most recent manager-review rating.
 * A positive inflation value indicates the employee rated themselves higher than their manager.
 * A negative value indicates the manager rated them higher than they rated themselves.
 *
 * @param employeeId - The employee ID to calculate inflation for
 * @returns Rating inflation object with self, manager, and calculated inflation
 *
 * @example
 * const inflation = await calculateRatingInflation('emp_123');
 * if (inflation.hasBothRatings) {
 *   console.log(`Inflation: ${inflation.inflation}`);
 *   // Inflation: 0.5 (employee rated 0.5 points higher than manager)
 * }
 */
export async function calculateRatingInflation(employeeId: string): Promise<RatingInflation> {
  // Get most recent self-review
  const selfReviews = await db
    .select()
    .from(performanceReviews)
    .where(
      and(eq(performanceReviews.employeeId, employeeId), eq(performanceReviews.reviewType, 'self'))
    )
    .orderBy(desc(performanceReviews.reviewDate))
    .limit(1);

  // Get most recent manager review
  const managerReviews = await db
    .select()
    .from(performanceReviews)
    .where(
      and(
        eq(performanceReviews.employeeId, employeeId),
        eq(performanceReviews.reviewType, 'manager')
      )
    )
    .orderBy(desc(performanceReviews.reviewDate))
    .limit(1);

  const selfRating = selfReviews[0]?.rating || null;
  const managerRating = managerReviews[0]?.rating || null;

  // Calculate inflation only if we have both ratings
  const hasBothRatings = selfRating !== null && managerRating !== null;
  const inflation = hasBothRatings ? selfRating! - managerRating! : null;

  return {
    selfRating,
    managerRating,
    inflation,
    hasBothRatings,
  };
}

/**
 * Calculate rating inflation for multiple employees (batch operation)
 *
 * More efficient than calling calculateRatingInflation in a loop.
 *
 * @param employeeIds - Array of employee IDs
 * @returns Map of employeeId → RatingInflation
 */
export async function calculateRatingInflationBatch(
  employeeIds: string[]
): Promise<Map<string, RatingInflation>> {
  if (employeeIds.length === 0) {
    return new Map();
  }

  // Get all self reviews for these employees
  // Note: Drizzle doesn't have a great 'IN' clause helper for arrays
  // We'll filter in memory for simplicity
  const selfReviews = await db
    .select()
    .from(performanceReviews)
    .where(eq(performanceReviews.reviewType, 'self'))
    .orderBy(desc(performanceReviews.reviewDate));

  // Get all manager reviews for these employees
  const managerReviews = await db
    .select()
    .from(performanceReviews)
    .where(eq(performanceReviews.reviewType, 'manager'))
    .orderBy(desc(performanceReviews.reviewDate));

  // Build map of employeeId → latest self rating
  const selfRatingMap = new Map<string, number>();
  for (const review of selfReviews) {
    if (
      employeeIds.includes(review.employeeId) &&
      !selfRatingMap.has(review.employeeId) &&
      review.rating !== null
    ) {
      selfRatingMap.set(review.employeeId, review.rating);
    }
  }

  // Build map of employeeId → latest manager rating
  const managerRatingMap = new Map<string, number>();
  for (const review of managerReviews) {
    if (
      employeeIds.includes(review.employeeId) &&
      !managerRatingMap.has(review.employeeId) &&
      review.rating !== null
    ) {
      managerRatingMap.set(review.employeeId, review.rating);
    }
  }

  // Calculate inflation for each employee
  const results = new Map<string, RatingInflation>();

  for (const empId of employeeIds) {
    const selfRating = selfRatingMap.get(empId) || null;
    const managerRating = managerRatingMap.get(empId) || null;
    const hasBothRatings = selfRating !== null && managerRating !== null;
    const inflation = hasBothRatings ? selfRating! - managerRating! : null;

    results.set(empId, {
      selfRating,
      managerRating,
      inflation,
      hasBothRatings,
    });
  }

  return results;
}

/**
 * Get average rating inflation across multiple employees
 *
 * Useful for calculating department-level or organization-level inflation metrics.
 *
 * @param inflationMap - Map of employee inflations (from calculateRatingInflationBatch)
 * @returns Average inflation (only includes employees with both ratings)
 */
export function calculateAverageInflation(inflationMap: Map<string, RatingInflation>): number {
  let totalInflation = 0;
  let count = 0;

  for (const inflation of inflationMap.values()) {
    if (inflation.hasBothRatings && inflation.inflation !== null) {
      totalInflation += inflation.inflation;
      count++;
    }
  }

  return count > 0 ? totalInflation / count : 0;
}
