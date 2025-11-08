import { NextRequest, NextResponse } from 'next/server';
import { loadDataFileByType, groupBy } from '@/lib/analytics/utils';
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware';
import { handleApiError, validationError, notFoundError } from '@/lib/api-helpers';

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
  ai_performance_score?: number;
  ai_potential_score?: number;
  rating_inflation?: number;
  red_flags?: string;
}

function getPerformanceLevel(score: number): PerformanceLevel {
  if (score >= 4) return 'High';
  if (score >= 3) return 'Medium';
  return 'Low';
}

function getPotentialLevel(score: number): PotentialLevel {
  if (score >= 3) return 'High';
  if (score >= 2) return 'Medium';
  return 'Low';
}

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
    'Low-Low': 'Underperformer'
  };
  return categories[key] || 'Unknown';
}

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
    // Load employee data from master sheet
    const employeeData = await loadDataFileByType('employee_master');

    if (!employeeData || employeeData.length === 0) {
      return NextResponse.json({
        success: false,
        error: {
          message: 'No employee data found. Please upload your employee master sheet in the Data Center first.',
          code: 'NO_DATA'
        }
      }, { status: 400 });
    }

    // Filter to active employees only
    const activeEmployees = employeeData.filter((emp: Employee) =>
      !emp.status || emp.status.toLowerCase() === 'active'
    );

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
          category: getCategoryName(perf, pot)
        });
      }
    }

    // Place employees into cells
    let totalInflation = 0;
    let inflationCount = 0;

    for (const emp of activeEmployees) {
      // Use AI scores if available, fallback to current_performance_rating or default
      const perfScore = emp.ai_performance_score ?? emp.current_performance_rating ?? emp.manager_rating ?? 3;

      // For potential, use AI score or infer from performance (high performers often have higher potential)
      let potScore = emp.ai_potential_score;
      if (!potScore) {
        // Infer potential from performance rating as a fallback
        const perf = emp.current_performance_rating ?? emp.manager_rating ?? 3;
        if (perf >= 4) potScore = 2.5; // High performers likely have medium-high potential
        else if (perf >= 3) potScore = 2; // Medium performers have medium potential
        else potScore = 1.5; // Lower performers have lower potential
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
          ratingInflation: emp.rating_inflation ?? null
        });

        // Track rating inflation
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

    return NextResponse.json({
      success: true,
      data: {
        grid: Array.from(cells.values()),
        summary: {
          highPerformers,
          coreEmployees,
          developmentNeeded,
          totalAnalyzed: activeEmployees.length,
          avgRatingInflation: parseFloat(avgRatingInflation.toFixed(2))
        }
      }
    });
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/analytics/nine-box',
      method: 'GET',
      userId: authResult.user.userId
    });
  }
}
