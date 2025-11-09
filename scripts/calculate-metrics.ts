/**
 * Metrics Calculation Utility
 *
 * Standalone utility for calculating employee metrics from existing data.
 * Can be run independently or imported by other scripts.
 *
 * Usage:
 *   npm run calculate:metrics              # Calculate for all active employees
 *   npm run calculate:metrics -- --employee-id EMP001  # Single employee
 */

import { db } from '../webapp/lib/db'
import { employees as employeesTable, employeeMetrics } from '../webapp/db/schema'
import { eq } from 'drizzle-orm'

interface Employee {
  id: string
  email: string
  fullName: string
  department: string
  jobTitle: string
  level: string | null
  managerId: string | null
  hireDate: string
  status: string
  attributes: string | null
}

interface CalculatedMetrics {
  flightRisk: number
  flightRiskLevel: 'low' | 'medium' | 'high' | 'critical'
  performanceRating: number
  performanceForecast: number
  engagement: number
  promotionReadiness: number
}

/**
 * Calculate flight risk score (0-1 scale)
 */
export function calculateFlightRisk(employee: Employee): {
  flightRisk: number
  flightRiskLevel: 'low' | 'medium' | 'high' | 'critical'
} {
  let riskScore = 0.3 // Baseline 30%

  // 1. Tenure analysis
  const hireDate = new Date(employee.hireDate)
  const tenureYears = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

  if (tenureYears < 1) {
    riskScore += 0.15 // New employees exploring options
  } else if (tenureYears >= 2 && tenureYears <= 4) {
    riskScore += 0.25 // Prime flight risk window
  } else if (tenureYears > 10) {
    riskScore -= 0.15 // Loyal long-tenure employees
  }

  // 2. Department risk patterns
  const highTurnoverDepts = ['Sales', 'Customer Success', 'Marketing', 'Support']
  const lowTurnoverDepts = ['Engineering', 'Product', 'Finance', 'Legal']

  if (highTurnoverDepts.includes(employee.department)) {
    riskScore += 0.15
  } else if (lowTurnoverDepts.includes(employee.department)) {
    riskScore -= 0.10
  }

  // 3. Level/seniority (entry-level higher risk)
  const level = employee.level || ''
  if (level.includes('IC1') || level.includes('Junior') || level.includes('1')) {
    riskScore += 0.10
  } else if (level.includes('IC5') || level.includes('Staff') || level.includes('Principal')) {
    riskScore -= 0.15 // Senior ICs less likely to leave
  } else if (level.includes('IC4') || level.includes('Senior')) {
    riskScore -= 0.05
  }

  // 4. Manager presence (no manager = higher risk)
  if (!employee.managerId) {
    riskScore += 0.10
  }

  // 5. Parse engagement data from attributes if available
  if (employee.attributes) {
    try {
      const attrs = JSON.parse(employee.attributes)
      if (attrs.enps_score !== undefined) {
        if (attrs.enps_score < -50) {
          riskScore += 0.20 // Strong detractors
        } else if (attrs.enps_score < 0) {
          riskScore += 0.10 // Mild detractors
        } else if (attrs.enps_score > 50) {
          riskScore -= 0.15 // Promoters
        }
      }
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  // Cap between 0 and 1
  riskScore = Math.max(0, Math.min(1, riskScore))

  // Determine level
  let level: 'low' | 'medium' | 'high' | 'critical' = 'low'
  if (riskScore >= 0.7) level = 'critical'
  else if (riskScore >= 0.5) level = 'high'
  else if (riskScore >= 0.3) level = 'medium'

  return { flightRisk: riskScore, flightRiskLevel: level }
}

/**
 * Calculate performance rating (1-5 scale)
 */
export function calculatePerformanceRating(employee: Employee): number {
  let rating = 3.0 // Default: "Meets Expectations"

  // 1. Tenure bonus (experience matters)
  const hireDate = new Date(employee.hireDate)
  const tenureYears = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

  if (tenureYears > 5) {
    rating += 0.5
  } else if (tenureYears > 2) {
    rating += 0.2
  } else if (tenureYears < 1) {
    rating -= 0.3 // Still ramping
  }

  // 2. Level analysis (higher levels typically = higher performance)
  const level = employee.level || ''
  if (level.includes('IC5') || level.includes('Staff') || level.includes('Principal')) {
    rating += 0.7
  } else if (level.includes('IC4') || level.includes('Senior')) {
    rating += 0.4
  } else if (level.includes('IC3')) {
    rating += 0.2
  } else if (level.includes('IC1')) {
    rating -= 0.2
  }

  // 3. Department performance patterns
  const highPerformingDepts = ['Engineering', 'Product', 'Data']
  if (highPerformingDepts.includes(employee.department)) {
    rating += 0.2
  }

  // 4. Add realistic variance (normal distribution)
  const variance = (Math.random() - 0.5) * 0.6
  rating += variance

  // Cap between 1 and 5, round to 1 decimal
  return Math.max(1, Math.min(5, Math.round(rating * 10) / 10))
}

/**
 * Calculate performance forecast (predicted next rating)
 */
export function calculatePerformanceForecast(
  currentRating: number,
  employee: Employee
): number {
  let forecast = currentRating

  // Tenure trend (longer tenure = slight upward trend)
  const hireDate = new Date(employee.hireDate)
  const tenureYears = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

  if (tenureYears < 2) {
    forecast += 0.3 // New employees likely to improve
  } else if (tenureYears > 8) {
    forecast -= 0.1 // Potential plateau
  }

  // Add small random variation
  forecast += (Math.random() - 0.5) * 0.4

  return Math.max(1, Math.min(5, Math.round(forecast * 10) / 10))
}

/**
 * Calculate engagement score (0-100 scale)
 */
export function calculateEngagement(employee: Employee): number {
  let engagement = 70 // Baseline

  // 1. Tenure-based engagement curve
  const hireDate = new Date(employee.hireDate)
  const tenureYears = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

  if (tenureYears < 0.5) {
    engagement += 15 // Honeymoon period
  } else if (tenureYears < 2) {
    engagement += 5 // Still enthusiastic
  } else if (tenureYears > 8) {
    engagement -= 10 // Potential burnout
  }

  // 2. Department engagement patterns
  const highEngagementDepts = ['Product', 'Engineering', 'Design']
  const lowEngagementDepts = ['Support', 'Operations']

  if (highEngagementDepts.includes(employee.department)) {
    engagement += 10
  } else if (lowEngagementDepts.includes(employee.department)) {
    engagement -= 10
  }

  // 3. Level/seniority (senior = more engaged typically)
  const level = employee.level || ''
  if (level.includes('IC4') || level.includes('IC5') || level.includes('Senior')) {
    engagement += 5
  }

  // 4. Parse from attributes if available
  if (employee.attributes) {
    try {
      const attrs = JSON.parse(employee.attributes)
      if (attrs.enps_score !== undefined) {
        // eNPS -100 to 100 → Engagement 0 to 100
        engagement = 50 + attrs.enps_score / 2
      }
    } catch (e) {
      // Keep calculated value
    }
  }

  return Math.max(0, Math.min(100, Math.round(engagement)))
}

/**
 * Calculate promotion readiness (0-1 scale)
 */
export function calculatePromotionReadiness(
  performanceRating: number,
  employee: Employee
): number {
  let readiness = 0.3 // Baseline

  // 1. Performance is primary factor
  if (performanceRating >= 4.5) {
    readiness = 0.8
  } else if (performanceRating >= 4.0) {
    readiness = 0.6
  } else if (performanceRating >= 3.5) {
    readiness = 0.4
  } else {
    readiness = 0.2
  }

  // 2. Tenure in current level
  const hireDate = new Date(employee.hireDate)
  const tenureYears = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

  if (tenureYears >= 2) {
    readiness += 0.15 // Time in role
  }

  // 3. Current level (IC4/IC5 ready for Staff/Principal)
  const level = employee.level || ''
  if (level.includes('IC4') || level.includes('IC5')) {
    readiness += 0.1
  }

  return Math.max(0, Math.min(1, Math.round(readiness * 100) / 100))
}

/**
 * Calculate all metrics for a single employee
 */
export function calculateAllMetrics(employee: Employee): CalculatedMetrics {
  const { flightRisk, flightRiskLevel } = calculateFlightRisk(employee)
  const performanceRating = calculatePerformanceRating(employee)
  const performanceForecast = calculatePerformanceForecast(performanceRating, employee)
  const engagement = calculateEngagement(employee)
  const promotionReadiness = calculatePromotionReadiness(performanceRating, employee)

  return {
    flightRisk,
    flightRiskLevel,
    performanceRating,
    performanceForecast,
    engagement,
    promotionReadiness
  }
}

/**
 * Main function - calculate and update metrics for all employees
 */
async function main() {
  const args = process.argv.slice(2)
  const employeeId = args.find(arg => arg.startsWith('--employee-id='))?.split('=')[1]

  console.log('📊 Calculating Employee Metrics')
  console.log('=================================\n')

  try {
    // Load employees
    let employeesList: Employee[]

    if (employeeId) {
      console.log(`Calculating for employee: ${employeeId}\n`)
      const employee = await db.query.employees.findFirst({
        where: (employees, { eq }) => eq(employees.id, employeeId)
      })

      if (!employee) {
        throw new Error(`Employee ${employeeId} not found`)
      }

      employeesList = [employee as Employee]
    } else {
      console.log('Calculating for all active employees\n')
      employeesList = await db.query.employees.findMany({
        where: (employees, { eq }) => eq(employees.status, 'active')
      }) as Employee[]
    }

    console.log(`Processing ${employeesList.length} employees...\n`)

    const today = new Date().toISOString().split('T')[0]
    let updated = 0

    for (const employee of employeesList) {
      const metrics = calculateAllMetrics(employee)

      // Insert or update metrics
      await db.insert(employeeMetrics).values({
        employeeId: employee.id,
        metricDate: today,
        performanceRating: metrics.performanceRating,
        flightRisk: metrics.flightRisk,
        flightRiskLevel: metrics.flightRiskLevel,
        performanceForecast: metrics.performanceForecast,
        promotionReadiness: metrics.promotionReadiness,
        enpsScore: null,
        surveyQuarter: null,
        surveyResponseDate: null,
        surveyCategory: null
      }).onConflictDoUpdate({
        target: [employeeMetrics.employeeId, employeeMetrics.metricDate],
        set: {
          performanceRating: metrics.performanceRating,
          flightRisk: metrics.flightRisk,
          flightRiskLevel: metrics.flightRiskLevel,
          performanceForecast: metrics.performanceForecast,
          promotionReadiness: metrics.promotionReadiness
        }
      })

      updated++

      if (employeeId) {
        // Show detailed output for single employee
        console.log(`Employee: ${employee.fullName}`)
        console.log(`  Flight Risk: ${Math.round(metrics.flightRisk * 100)}% (${metrics.flightRiskLevel})`)
        console.log(`  Performance: ${metrics.performanceRating}/5`)
        console.log(`  Forecast: ${metrics.performanceForecast}/5`)
        console.log(`  Engagement: ${metrics.engagement}/100`)
        console.log(`  Promotion Readiness: ${Math.round(metrics.promotionReadiness * 100)}%`)
      }
    }

    console.log(`\n✅ Updated metrics for ${updated} employees`)

  } catch (error) {
    console.error('\n❌ Calculation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}
