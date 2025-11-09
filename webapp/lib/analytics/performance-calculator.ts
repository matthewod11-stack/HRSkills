/**
 * Performance Rating Calculator
 *
 * Calculates AI-driven performance and potential scores based on employee data patterns.
 * This provides intelligent fallback when manager ratings are not available.
 *
 * Scoring Methodology:
 * - Performance Score (1-5): Based on compensation, tenure, level, and engagement signals
 * - Potential Score (1-3): Based on growth trajectory, mobility, and development indicators
 * - Rating Inflation: Difference between manager rating and AI score (if manager rating exists)
 */

export interface EmployeeDataForRating {
  employee_id: string;
  name?: string;
  department?: string;
  job_title?: string;
  level?: string;
  hire_date?: string;
  tenure_years?: number;
  status?: string;

  // Compensation (key performance indicator)
  compensation_base?: number;
  compensation_bonus?: number;
  compensation_equity?: number;

  // Manager ratings (if available)
  manager_rating?: number; // 1-5 scale
  current_performance_rating?: number; // 1-5 scale

  // Signals for calculation
  promotions?: number; // Number of promotions
  job_changes?: number; // Lateral moves
  tenure_at_level?: number; // Years at current level
  red_flags?: string; // Comma-separated flags

  // Optional context
  location?: string;
  manager_id?: string;
}

export interface PerformanceRatings {
  employee_id: string;
  ai_performance_score: number; // 1-5 scale (1=Poor, 5=Exceptional)
  ai_potential_score: number; // 1-3 scale (1=Low, 2=Medium, 3=High)
  rating_inflation: number | null; // How much manager over/under-rated vs AI
  confidence: number; // 0-100% confidence in AI rating
  factors: string[]; // What drove the rating
}

/**
 * Calculate AI performance and potential scores for a single employee
 */
export function calculateEmployeeRating(
  employee: EmployeeDataForRating,
  departmentStats?: {
    avgCompensation: number;
    avgTenure: number;
    promotionRate: number;
  }
): PerformanceRatings {
  const factors: string[] = [];
  let performanceScore = 3.0; // Start at "Meets Expectations"
  let potentialScore = 2.0; // Start at "Medium"
  let confidence = 50; // Base confidence

  // ============================================================================
  // PERFORMANCE SCORE CALCULATION (1-5)
  // ============================================================================

  // Factor 1: Compensation relative to peers (strongest signal)
  if (employee.compensation_base && departmentStats?.avgCompensation) {
    const compRatio = employee.compensation_base / departmentStats.avgCompensation;

    if (compRatio >= 1.3) {
      performanceScore += 1.0;
      factors.push('Top compensation tier');
      confidence += 15;
    } else if (compRatio >= 1.15) {
      performanceScore += 0.5;
      factors.push('Above-average compensation');
      confidence += 10;
    } else if (compRatio <= 0.85) {
      performanceScore -= 0.5;
      factors.push('Below-average compensation');
    }
  }

  // Factor 2: Bonus/Equity (high performers get more variable comp)
  if (employee.compensation_bonus || employee.compensation_equity) {
    const bonus = employee.compensation_bonus || 0;
    const equity = employee.compensation_equity || 0;
    const base = employee.compensation_base || 1;
    const variableRatio = (bonus + equity) / base;

    if (variableRatio >= 0.4) {
      performanceScore += 0.5;
      factors.push('High variable compensation');
      confidence += 10;
    } else if (variableRatio >= 0.2) {
      performanceScore += 0.25;
      factors.push('Moderate variable compensation');
    }
  }

  // Factor 3: Tenure and level progression
  const tenureYears = employee.tenure_years || 0;
  const level = employee.level?.toLowerCase() || '';

  if (tenureYears > 0) {
    // Senior roles with short tenure = high performer (hired for expertise)
    if ((level.includes('senior') || level.includes('staff') || level.includes('principal')) && tenureYears < 2) {
      performanceScore += 0.5;
      factors.push('Senior hire');
      confidence += 10;
    }

    // Long tenure at entry level = potential concern
    if ((level.includes('junior') || level.includes('entry') || level.includes('associate')) && tenureYears > 4) {
      performanceScore -= 0.3;
      factors.push('Long tenure at entry level');
    }

    // Fast promotion track
    if (employee.promotions && tenureYears > 0) {
      const promotionRate = employee.promotions / tenureYears;
      if (promotionRate >= 0.5) { // Promoted every 2 years or faster
        performanceScore += 0.7;
        factors.push('Fast promotion track');
        confidence += 15;
      } else if (promotionRate >= 0.33) { // Promoted every 3 years
        performanceScore += 0.3;
        factors.push('Regular promotions');
        confidence += 5;
      }
    }
  }

  // Factor 4: Red flags (performance issues, PIP, attendance)
  if (employee.red_flags) {
    const flags = employee.red_flags.toLowerCase();

    if (flags.includes('pip') || flags.includes('performance improvement')) {
      performanceScore -= 1.5;
      factors.push('Performance improvement plan');
      confidence += 20; // High confidence in low rating
    } else if (flags.includes('attendance') || flags.includes('late')) {
      performanceScore -= 0.5;
      factors.push('Attendance issues');
    } else if (flags.includes('complaint') || flags.includes('hr')) {
      performanceScore -= 0.3;
      factors.push('HR concerns');
    }
  }

  // Factor 5: Manager rating comparison (if available)
  if (employee.manager_rating || employee.current_performance_rating) {
    const managerScore = employee.current_performance_rating ?? employee.manager_rating ?? 3;

    // Use manager rating but adjust confidence based on alignment
    const alignment = Math.abs(managerScore - performanceScore);
    if (alignment < 0.5) {
      confidence += 20; // Manager agrees with AI
      factors.push('Manager rating aligned');
    } else if (alignment > 1.5) {
      confidence -= 10; // Significant disagreement
      factors.push('Manager rating diverges');
    }

    // Blend manager rating with AI calculation (60% AI, 40% manager)
    performanceScore = performanceScore * 0.6 + managerScore * 0.4;
  }

  // ============================================================================
  // POTENTIAL SCORE CALCULATION (1-3)
  // ============================================================================

  // Factor 1: Career velocity (promotions/tenure ratio)
  if (employee.promotions && tenureYears > 0) {
    const velocity = employee.promotions / tenureYears;
    if (velocity >= 0.5) {
      potentialScore = 3.0; // High potential
      factors.push('High career velocity');
    } else if (velocity >= 0.25) {
      potentialScore = 2.5; // Medium-high potential
    }
  }

  // Factor 2: Time at current level (tenure_at_level)
  if (employee.tenure_at_level !== undefined) {
    if (employee.tenure_at_level > 4) {
      potentialScore -= 0.5; // Stuck at level
      factors.push('Long time at level');
    } else if (employee.tenure_at_level < 1.5 && employee.promotions && employee.promotions > 0) {
      potentialScore += 0.5; // Recently promoted
      factors.push('Recent promotion');
    }
  }

  // Factor 3: Early-career high performers (high potential)
  if (tenureYears < 3 && performanceScore >= 4.0) {
    potentialScore += 0.5;
    factors.push('Early-career high performer');
  }

  // Factor 4: Senior level with stagnation
  if ((level.includes('senior') || level.includes('staff')) && tenureYears > 6 && (!employee.promotions || employee.promotions === 0)) {
    potentialScore = 1.5; // Limited growth potential
    factors.push('Senior plateau');
  }

  // Factor 5: Lateral moves (indicate development/breadth)
  if (employee.job_changes && employee.job_changes > 0) {
    if (employee.job_changes >= 2) {
      potentialScore += 0.3;
      factors.push('Cross-functional experience');
    }
  }

  // ============================================================================
  // NORMALIZE SCORES AND CALCULATE INFLATION
  // ============================================================================

  // Clamp performance score to 1-5 range
  performanceScore = Math.max(1, Math.min(5, performanceScore));

  // Clamp potential score to 1-3 range
  potentialScore = Math.max(1, Math.min(3, potentialScore));

  // Calculate rating inflation (manager over-rating)
  let ratingInflation: number | null = null;
  if (employee.manager_rating || employee.current_performance_rating) {
    const managerScore = employee.current_performance_rating ?? employee.manager_rating ?? 3;
    // Inflation = manager score - AI score
    // Positive = manager is more generous, Negative = manager is harsher
    ratingInflation = Number((managerScore - performanceScore).toFixed(2));
  }

  // Clamp confidence to 0-100
  confidence = Math.max(0, Math.min(100, confidence));

  return {
    employee_id: employee.employee_id,
    ai_performance_score: Number(performanceScore.toFixed(2)),
    ai_potential_score: Number(potentialScore.toFixed(2)),
    rating_inflation: ratingInflation,
    confidence,
    factors: factors.slice(0, 5), // Limit to top 5 factors
  };
}

/**
 * Calculate department-level statistics for relative scoring
 */
export function calculateDepartmentStats(employees: EmployeeDataForRating[]): {
  avgCompensation: number;
  avgTenure: number;
  promotionRate: number;
} {
  const validComp = employees.filter(e => e.compensation_base && e.compensation_base > 0);
  const validTenure = employees.filter(e => e.tenure_years && e.tenure_years > 0);
  const validPromotions = employees.filter(e => e.promotions !== undefined && e.tenure_years && e.tenure_years > 0);

  const avgCompensation = validComp.length > 0
    ? validComp.reduce((sum, e) => sum + (e.compensation_base || 0), 0) / validComp.length
    : 0;

  const avgTenure = validTenure.length > 0
    ? validTenure.reduce((sum, e) => sum + (e.tenure_years || 0), 0) / validTenure.length
    : 0;

  const promotionRate = validPromotions.length > 0
    ? validPromotions.reduce((sum, e) => sum + (e.promotions || 0) / (e.tenure_years || 1), 0) / validPromotions.length
    : 0;

  return {
    avgCompensation,
    avgTenure,
    promotionRate,
  };
}

/**
 * Batch calculate ratings for multiple employees
 */
export function calculateBatchRatings(
  employees: EmployeeDataForRating[],
  groupByDepartment: boolean = true
): Map<string, PerformanceRatings> {
  const results = new Map<string, PerformanceRatings>();

  if (groupByDepartment) {
    // Group by department for relative scoring
    const byDepartment = new Map<string, EmployeeDataForRating[]>();

    employees.forEach(emp => {
      const dept = emp.department || 'Unknown';
      if (!byDepartment.has(dept)) {
        byDepartment.set(dept, []);
      }
      byDepartment.get(dept)!.push(emp);
    });

    // Calculate ratings per department
    byDepartment.forEach((deptEmployees, dept) => {
      const deptStats = calculateDepartmentStats(deptEmployees);

      deptEmployees.forEach(emp => {
        const rating = calculateEmployeeRating(emp, deptStats);
        results.set(emp.employee_id, rating);
      });
    });
  } else {
    // Calculate globally (less accurate)
    const globalStats = calculateDepartmentStats(employees);

    employees.forEach(emp => {
      const rating = calculateEmployeeRating(emp, globalStats);
      results.set(emp.employee_id, rating);
    });
  }

  return results;
}

/**
 * Identify employees with significant rating inflation (manager leniency/strictness)
 */
export function identifyRatingInflation(ratings: Map<string, PerformanceRatings>, threshold: number = 1.0): {
  overRated: PerformanceRatings[]; // Manager too generous
  underRated: PerformanceRatings[]; // Manager too strict
  aligned: PerformanceRatings[]; // Close alignment
} {
  const overRated: PerformanceRatings[] = [];
  const underRated: PerformanceRatings[] = [];
  const aligned: PerformanceRatings[] = [];

  ratings.forEach(rating => {
    if (rating.rating_inflation === null) {
      return; // No manager rating to compare
    }

    if (rating.rating_inflation >= threshold) {
      overRated.push(rating);
    } else if (rating.rating_inflation <= -threshold) {
      underRated.push(rating);
    } else {
      aligned.push(rating);
    }
  });

  return {
    overRated: overRated.sort((a, b) => (b.rating_inflation || 0) - (a.rating_inflation || 0)),
    underRated: underRated.sort((a, b) => (a.rating_inflation || 0) - (b.rating_inflation || 0)),
    aligned,
  };
}
