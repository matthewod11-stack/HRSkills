/**
 * Flight Risk Detection (On-Demand)
 *
 * Analyzes employee metrics to identify high flight risk employees
 * and provides actionable insights for retention.
 *
 * Usage:
 * - User asks "Who are my flight risks?" in chat
 * - Claude calls detectFlightRisks() to get real-time analysis
 * - Returns formatted insights with suggested actions
 */

import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export interface FlightRiskEmployee {
  employeeId: string;
  fullName: string;
  email: string;
  department: string;
  jobTitle: string;
  managerName: string | null;

  // Risk metrics
  flightRisk: number; // 0-1 probability
  flightRiskLevel: 'low' | 'medium' | 'high' | 'critical';

  // Contributing factors
  engagementScore: number | null;
  performanceRating: number | null;
  tenureMonths: number;

  // Context
  lastReviewDate: string | null;
  recentPromotions: number;
  salaryPercentile: number | null;

  // Reasons (AI-generated or rule-based)
  riskFactors: string[];
}

export interface FlightRiskAnalysis {
  totalEmployees: number;
  atRiskCount: number;
  byLevel: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byDepartment: Record<string, number>;
  employees: FlightRiskEmployee[];
  generatedAt: string;
}

/**
 * Detect flight risk employees (on-demand)
 *
 * @param options Filter options
 * @returns Flight risk analysis with actionable insights
 */
export async function detectFlightRisks(
  options: {
    department?: string;
    minRiskLevel?: 'medium' | 'high' | 'critical';
    limit?: number;
  } = {}
): Promise<FlightRiskAnalysis> {
  const { department, minRiskLevel = 'medium', limit = 50 } = options;

  // Build WHERE clause
  const conditions: string[] = ["e.status = 'active'", 'em.flight_risk IS NOT NULL'];

  // Filter by risk level
  if (minRiskLevel === 'critical') {
    conditions.push("em.flight_risk_level = 'critical'");
  } else if (minRiskLevel === 'high') {
    conditions.push("em.flight_risk_level IN ('high', 'critical')");
  } else if (minRiskLevel === 'medium') {
    conditions.push("em.flight_risk_level IN ('medium', 'high', 'critical')");
  }

  // Filter by department
  if (department) {
    conditions.push(`e.department = '${department}'`);
  }

  const whereClause = conditions.join(' AND ');

  // Query flight risk employees with context
  const query = sql.raw(`
    SELECT
      e.employee_id,
      e.full_name,
      e.email,
      e.department,
      e.job_title,
      e.hire_date,
      m.full_name as manager_name,
      em.flight_risk,
      em.flight_risk_level,
      em.engagement_score,
      em.performance_rating,
      em.metric_date,
      pr.review_date as last_review_date,
      pr.overall_rating as last_performance_rating
    FROM employees e
    LEFT JOIN employee_metrics em ON e.employee_id = em.employee_id
    LEFT JOIN employees m ON e.manager_id = m.employee_id
    LEFT JOIN (
      SELECT employee_id, MAX(review_date) as review_date, overall_rating
      FROM performance_reviews
      GROUP BY employee_id
    ) pr ON e.employee_id = pr.employee_id
    WHERE ${whereClause}
    ORDER BY em.flight_risk DESC
    LIMIT ${limit}
  `);

  const rows = (db as any).all(query) as any[];

  // Calculate tenure and format employees
  const employees: FlightRiskEmployee[] = rows.map((row) => {
    const hireDate = new Date(row.hire_date);
    const now = new Date();
    const tenureMonths = Math.floor(
      (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    const riskFactors = generateRiskFactors({
      flightRisk: row.flight_risk,
      engagementScore: row.engagement_score,
      performanceRating: row.performance_rating || row.last_performance_rating,
      tenureMonths,
      lastReviewDate: row.last_review_date,
    });

    return {
      employeeId: row.employee_id,
      fullName: row.full_name,
      email: row.email,
      department: row.department,
      jobTitle: row.job_title,
      managerName: row.manager_name,
      flightRisk: row.flight_risk,
      flightRiskLevel: row.flight_risk_level,
      engagementScore: row.engagement_score,
      performanceRating: row.performance_rating || row.last_performance_rating,
      tenureMonths,
      lastReviewDate: row.last_review_date,
      recentPromotions: 0, // TODO: Calculate from job title changes
      salaryPercentile: null, // TODO: Calculate from compensation data
      riskFactors,
    };
  });

  // Calculate summary statistics
  const byLevel = {
    critical: employees.filter((e) => e.flightRiskLevel === 'critical').length,
    high: employees.filter((e) => e.flightRiskLevel === 'high').length,
    medium: employees.filter((e) => e.flightRiskLevel === 'medium').length,
    low: employees.filter((e) => e.flightRiskLevel === 'low').length,
  };

  const byDepartment: Record<string, number> = {};
  employees.forEach((emp) => {
    byDepartment[emp.department] = (byDepartment[emp.department] || 0) + 1;
  });

  // Get total active employees for context
  const totalResult = (db as any).all(
    sql.raw("SELECT COUNT(*) as count FROM employees WHERE status = 'active'")
  );
  const totalEmployees = totalResult[0].count;

  return {
    totalEmployees,
    atRiskCount: employees.length,
    byLevel,
    byDepartment,
    employees,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate risk factors based on employee metrics
 */
function generateRiskFactors(metrics: {
  flightRisk: number;
  engagementScore: number | null;
  performanceRating: number | null;
  tenureMonths: number;
  lastReviewDate: string | null;
}): string[] {
  const factors: string[] = [];

  // Engagement issues
  if (metrics.engagementScore !== null && metrics.engagementScore < 3.0) {
    factors.push(`Low engagement score (${metrics.engagementScore.toFixed(1)}/5.0)`);
  }

  // Performance concerns
  if (metrics.performanceRating !== null && metrics.performanceRating < 3.0) {
    factors.push(`Below-average performance (${metrics.performanceRating.toFixed(1)}/5.0)`);
  }

  // Tenure patterns
  if (metrics.tenureMonths < 6) {
    factors.push('New hire (<6 months) - critical retention period');
  } else if (metrics.tenureMonths >= 18 && metrics.tenureMonths <= 36) {
    factors.push('2-3 year tenure - common departure window');
  }

  // Review gaps
  if (metrics.lastReviewDate) {
    const monthsSinceReview = Math.floor(
      (Date.now() - new Date(metrics.lastReviewDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    );
    if (monthsSinceReview > 12) {
      factors.push(`No performance review in ${monthsSinceReview} months`);
    }
  } else {
    factors.push('Never received a performance review');
  }

  // High risk score
  if (metrics.flightRisk > 0.8) {
    factors.push('Multiple risk indicators detected');
  }

  // Default if no specific factors
  if (factors.length === 0) {
    factors.push('Pattern analysis indicates increased turnover risk');
  }

  return factors;
}

/**
 * Get suggested retention actions based on risk analysis
 */
export function getSuggestedRetentionActions(employee: FlightRiskEmployee): Array<{
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}> {
  const actions: Array<{
    action: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }> = [];

  // Critical actions for high-risk employees
  if (employee.flightRiskLevel === 'critical' || employee.flightRisk > 0.8) {
    actions.push({
      action: 'Schedule urgent 1:1 with manager',
      description: 'Immediate conversation to understand concerns and blockers',
      priority: 'high',
    });

    actions.push({
      action: 'Review compensation',
      description: 'Ensure salary is competitive for role and performance',
      priority: 'high',
    });
  }

  // Engagement interventions
  if (employee.engagementScore !== null && employee.engagementScore < 3.0) {
    actions.push({
      action: 'Conduct stay interview',
      description: 'Understand what would keep them engaged and motivated',
      priority: employee.flightRiskLevel === 'critical' ? 'high' : 'medium',
    });

    actions.push({
      action: 'Review career development plan',
      description: 'Discuss growth opportunities and learning goals',
      priority: 'medium',
    });
  }

  // Performance-based actions
  if (employee.performanceRating !== null && employee.performanceRating < 3.0) {
    actions.push({
      action: 'Create performance improvement plan',
      description: 'Set clear expectations and provide support',
      priority: 'medium',
    });
  }

  // Tenure-based actions
  if (employee.tenureMonths < 6) {
    actions.push({
      action: 'Check onboarding experience',
      description: 'Ensure new hire has support, resources, and clear goals',
      priority: 'high',
    });
  }

  // Review gaps
  if (
    !employee.lastReviewDate ||
    new Date(employee.lastReviewDate) < new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  ) {
    actions.push({
      action: 'Schedule performance review',
      description: 'Provide feedback and discuss progress',
      priority: 'medium',
    });
  }

  return actions;
}

/**
 * Format flight risk analysis for chat response
 */
export function formatFlightRiskForChat(analysis: FlightRiskAnalysis): string {
  const { totalEmployees, atRiskCount, byLevel, byDepartment, employees } = analysis;

  let response = `## Flight Risk Analysis\n\n`;
  response += `**Total Active Employees:** ${totalEmployees}\n`;
  response += `**At-Risk Employees:** ${atRiskCount} (${((atRiskCount / totalEmployees) * 100).toFixed(1)}%)\n\n`;

  response += `### Risk Breakdown\n`;
  response += `- 🔴 **Critical:** ${byLevel.critical}\n`;
  response += `- 🟠 **High:** ${byLevel.high}\n`;
  response += `- 🟡 **Medium:** ${byLevel.medium}\n\n`;

  if (Object.keys(byDepartment).length > 0) {
    response += `### By Department\n`;
    Object.entries(byDepartment)
      .sort(([, a], [, b]) => b - a)
      .forEach(([dept, count]) => {
        response += `- **${dept}:** ${count}\n`;
      });
    response += `\n`;
  }

  if (employees.length > 0) {
    response += `### Top ${Math.min(5, employees.length)} At-Risk Employees\n\n`;
    employees.slice(0, 5).forEach((emp, idx) => {
      const riskEmoji =
        emp.flightRiskLevel === 'critical' ? '🔴' : emp.flightRiskLevel === 'high' ? '🟠' : '🟡';
      response += `${idx + 1}. ${riskEmoji} **${emp.fullName}** (${emp.department})\n`;
      response += `   - **Role:** ${emp.jobTitle}\n`;
      response += `   - **Risk Level:** ${emp.flightRiskLevel.toUpperCase()} (${(emp.flightRisk * 100).toFixed(0)}% probability)\n`;
      response += `   - **Key Factors:**\n`;
      emp.riskFactors.forEach((factor) => {
        response += `     - ${factor}\n`;
      });

      const actions = getSuggestedRetentionActions(emp);
      if (actions.length > 0) {
        response += `   - **Suggested Actions:**\n`;
        actions.slice(0, 2).forEach((action) => {
          response += `     - ${action.action}\n`;
        });
      }
      response += `\n`;
    });
  }

  response += `\n**Want me to create retention plans for any of these employees?**`;

  return response;
}
