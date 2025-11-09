/**
 * Demo Data Seeding Script
 *
 * Seeds the SQLite database with employee data from master-employees.json
 * and calculates missing analytics metrics (flight risk, performance, engagement).
 *
 * Usage:
 *   npm run seed:demo              # Migrate existing data
 *   npm run seed:demo -- --force   # Force re-seed (clears existing data)
 *   npm run seed:demo -- --dry-run # Preview without writing
 */

import fs from 'fs'
import path from 'path'
import { db } from '../webapp/lib/db'
import { employees, employeeMetrics, insightEvents, conversations } from '../webapp/db/schema'
import { eq } from 'drizzle-orm'

interface MasterEmployee {
  employee_id: string
  email: string
  full_name: string
  first_name: string
  last_name: string
  department: string
  job_title: string
  level?: string
  manager_id?: string
  location?: string
  employment_type?: string
  hire_date: string
  termination_date?: string
  status: string
  gender?: string
  race_ethnicity?: string
  compensation_currency?: string
  compensation_base?: number
  data_sources?: string[]
  attributes?: any
  enps_score?: number
  survey_quarter?: string
  survey_response_date?: string
  survey_category?: string
  performance_reviews?: any[]
  skills?: any[]
}

// CLI arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const isForce = args.includes('--force')

console.log('🌱 Demo Data Seeding Script')
console.log('=============================')
if (isDryRun) console.log('🔍 DRY RUN MODE - No data will be written\n')
if (isForce) console.log('⚠️  FORCE MODE - Existing data will be cleared\n')

async function loadMasterEmployees(): Promise<MasterEmployee[]> {
  const dataPath = path.join(process.cwd(), 'data', 'master-employees.json')

  if (!fs.existsSync(dataPath)) {
    throw new Error(`Master employee data not found at: ${dataPath}`)
  }

  const fileContent = fs.readFileSync(dataPath, 'utf-8')
  const data = JSON.parse(fileContent)

  console.log(`✅ Loaded ${data.length} employees from master-employees.json`)
  return data
}

/**
 * Calculate flight risk score based on tenure, department, and other factors
 *
 * High risk factors:
 * - Tenure < 1 year (new employees exploring options)
 * - Tenure 2-4 years (prime flight risk window)
 * - Departments with high turnover (Sales, Customer Success)
 * - Low engagement (eNPS < 0)
 */
function calculateFlightRisk(employee: MasterEmployee): {
  flightRisk: number
  flightRiskLevel: string
} {
  let riskScore = 0.3 // Base 30% risk

  // Tenure analysis
  const hireDate = new Date(employee.hire_date)
  const now = new Date()
  const tenureYears = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

  if (tenureYears < 1) {
    riskScore += 0.15 // +15% for new employees
  } else if (tenureYears >= 2 && tenureYears <= 4) {
    riskScore += 0.25 // +25% for 2-4 year tenure (highest risk)
  } else if (tenureYears > 10) {
    riskScore -= 0.15 // -15% for long tenure
  }

  // Department risk
  const highRiskDepts = ['Sales', 'Customer Success', 'Marketing']
  const lowRiskDepts = ['Engineering', 'Product', 'Finance']

  if (highRiskDepts.includes(employee.department)) {
    riskScore += 0.15
  } else if (lowRiskDepts.includes(employee.department)) {
    riskScore -= 0.10
  }

  // Engagement score (eNPS)
  if (employee.enps_score !== undefined) {
    if (employee.enps_score < -50) {
      riskScore += 0.20 // Detractors
    } else if (employee.enps_score < 0) {
      riskScore += 0.10 // Passive low
    } else if (employee.enps_score > 50) {
      riskScore -= 0.15 // Promoters
    }
  }

  // Level analysis (entry level higher risk)
  if (employee.level?.includes('IC1') || employee.level?.includes('Junior')) {
    riskScore += 0.10
  } else if (employee.level?.includes('Senior') || employee.level?.includes('Staff')) {
    riskScore -= 0.10
  }

  // Cap between 0 and 1
  riskScore = Math.max(0, Math.min(1, riskScore))

  // Determine level
  let level = 'low'
  if (riskScore >= 0.7) level = 'critical'
  else if (riskScore >= 0.5) level = 'high'
  else if (riskScore >= 0.3) level = 'medium'

  return {
    flightRisk: riskScore,
    flightRiskLevel: level
  }
}

/**
 * Calculate performance rating (1-5 scale) based on job level, tenure, and department
 */
function calculatePerformanceRating(employee: MasterEmployee): number {
  let rating = 3.0 // Default: "Meets Expectations"

  // Tenure bonus (longer tenure = higher performance on average)
  const hireDate = new Date(employee.hire_date)
  const tenureYears = (new Date().getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

  if (tenureYears > 5) {
    rating += 0.5 // Experienced employees tend to perform better
  } else if (tenureYears < 1) {
    rating -= 0.3 // New employees still ramping
  }

  // Level analysis (higher levels = higher ratings typically)
  if (employee.level?.includes('IC4') || employee.level?.includes('IC5') || employee.level?.includes('Staff')) {
    rating += 0.6
  } else if (employee.level?.includes('IC3') || employee.level?.includes('Senior')) {
    rating += 0.3
  } else if (employee.level?.includes('IC1')) {
    rating -= 0.2
  }

  // Department performance patterns
  const highPerformingDepts = ['Engineering', 'Product']
  if (highPerformingDepts.includes(employee.department)) {
    rating += 0.2
  }

  // Add some randomness for realistic distribution
  rating += (Math.random() - 0.5) * 0.8

  // Cap between 1 and 5
  return Math.max(1, Math.min(5, Math.round(rating * 10) / 10))
}

/**
 * Calculate engagement score (0-100) based on eNPS and other factors
 */
function calculateEngagement(employee: MasterEmployee): number {
  let engagement = 70 // Default baseline

  // eNPS is primary indicator
  if (employee.enps_score !== undefined) {
    // eNPS ranges from -100 to 100
    // Map to engagement 0-100
    engagement = Math.max(0, Math.min(100, 50 + employee.enps_score / 2))
  }

  // Tenure adjustment
  const hireDate = new Date(employee.hire_date)
  const tenureYears = (new Date().getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365)

  if (tenureYears < 0.5) {
    engagement += 10 // Honeymoon period
  } else if (tenureYears > 8) {
    engagement -= 5 // Potential burnout
  }

  return Math.max(0, Math.min(100, Math.round(engagement)))
}

/**
 * Seed employees table
 */
async function seedEmployees(masterData: MasterEmployee[]): Promise<number> {
  console.log('\n📊 Seeding employees table...')

  if (isForce && !isDryRun) {
    console.log('  Clearing existing employee data...')
    await db.delete(employees)
  }

  let inserted = 0
  let skipped = 0

  for (const emp of masterData) {
    // Check if employee already exists
    const existing = await db.query.employees.findFirst({
      where: (employees, { eq }) => eq(employees.id, emp.employee_id)
    })

    if (existing && !isForce) {
      skipped++
      continue
    }

    if (!isDryRun) {
      await db.insert(employees).values({
        id: emp.employee_id,
        email: emp.email,
        fullName: emp.full_name,
        firstName: emp.first_name,
        lastName: emp.last_name,
        department: emp.department,
        jobTitle: emp.job_title,
        level: emp.level || null,
        managerId: emp.manager_id || null,
        location: emp.location || null,
        employmentType: emp.employment_type || 'Full-time',
        hireDate: emp.hire_date,
        terminationDate: emp.termination_date || null,
        status: emp.status,
        gender: emp.gender || null,
        raceEthnicity: emp.race_ethnicity || null,
        compensationCurrency: emp.compensation_currency || 'USD',
        compensationBase: emp.compensation_base || null,
        dataSources: JSON.stringify(emp.data_sources || ['master-employees.json']),
        attributes: emp.attributes ? JSON.stringify(emp.attributes) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }).onConflictDoUpdate({
        target: employees.id,
        set: {
          updatedAt: new Date().toISOString()
        }
      })
    }

    inserted++
  }

  console.log(`  ✅ Inserted: ${inserted}, Skipped: ${skipped}`)
  return inserted
}

/**
 * Seed employee metrics table with calculated values
 */
async function seedMetrics(masterData: MasterEmployee[]): Promise<number> {
  console.log('\n📈 Seeding employee metrics...')

  if (isForce && !isDryRun) {
    console.log('  Clearing existing metrics...')
    await db.delete(employeeMetrics)
  }

  const today = new Date().toISOString().split('T')[0]
  let inserted = 0

  for (const emp of masterData) {
    // Skip terminated employees
    if (emp.status === 'terminated') continue

    const { flightRisk, flightRiskLevel } = calculateFlightRisk(emp)
    const performanceRating = calculatePerformanceRating(emp)
    const engagement = calculateEngagement(emp)

    if (!isDryRun) {
      await db.insert(employeeMetrics).values({
        employeeId: emp.employee_id,
        metricDate: today,
        enpsScore: emp.enps_score || null,
        surveyQuarter: emp.survey_quarter || null,
        surveyResponseDate: emp.survey_response_date || null,
        surveyCategory: emp.survey_category || null,
        performanceRating,
        flightRisk,
        flightRiskLevel,
        performanceForecast: performanceRating + (Math.random() - 0.5) * 0.5, // Slight variation
        promotionReadiness: emp.level?.includes('IC4') || emp.level?.includes('IC5') ? 0.7 : 0.4
      }).onConflictDoNothing()
    }

    inserted++
  }

  console.log(`  ✅ Calculated and inserted ${inserted} metric records`)
  return inserted
}

/**
 * Generate insight events for proactive notifications
 */
async function seedInsights(masterData: MasterEmployee[]): Promise<number> {
  console.log('\n💡 Generating insights...')

  if (isForce && !isDryRun) {
    console.log('  Clearing existing insights...')
    await db.delete(insightEvents)
  }

  let inserted = 0

  // Flight risk insights
  for (const emp of masterData) {
    if (emp.status === 'terminated') continue

    const { flightRisk, flightRiskLevel } = calculateFlightRisk(emp)

    if (flightRiskLevel === 'critical' || flightRiskLevel === 'high') {
      if (!isDryRun) {
        await db.insert(insightEvents).values({
          id: `insight_flight_risk_${emp.employee_id}`,
          employeeId: emp.employee_id,
          insightType: 'flight_risk',
          severity: flightRiskLevel === 'critical' ? 'critical' : 'high',
          title: `${emp.full_name} is a flight risk`,
          description: `${emp.full_name} (${emp.department}) has a ${Math.round(flightRisk * 100)}% flight risk score.`,
          payloadJson: JSON.stringify({
            employeeId: emp.employee_id,
            flightRisk,
            flightRiskLevel,
            factors: ['tenure', 'engagement', 'department']
          }),
          status: 'open',
          createdAt: new Date().toISOString()
        }).onConflictDoNothing()
      }

      inserted++
    }
  }

  console.log(`  ✅ Generated ${inserted} insight events`)
  return inserted
}

/**
 * Create a demo conversation for the welcome experience
 */
async function seedDemoConversation(): Promise<void> {
  console.log('\n💬 Creating demo conversation...')

  const demoMessages = [
    {
      role: 'user',
      content: 'Show me our engineering headcount',
      timestamp: new Date().toISOString()
    },
    {
      role: 'assistant',
      content: 'Based on the current data, here\'s your engineering headcount:\n\n- **Total Engineers**: 47 employees\n- **By Level**:\n  - IC1-2 (Junior): 12 engineers\n  - IC3 (Mid): 18 engineers\n  - IC4-5 (Senior/Staff): 17 engineers\n\n- **Recent Changes**:\n  - Down 3 from last quarter (-6%)\n  - 2 senior engineers departed\n  - 1 mid-level engineer transitioned to Product\n\n**Key Insights**:\n- 2 senior engineers are identified as flight risks\n- 3 open requisitions unfilled for 60+ days\n- Average time-to-hire increased 40% this quarter\n\nWould you like me to:\n- Draft job descriptions for open roles\n- Create retention plan for at-risk engineers\n- Analyze hiring bottlenecks',
      timestamp: new Date().toISOString()
    }
  ]

  if (!isDryRun) {
    await db.insert(conversations).values({
      id: 'demo_conversation_001',
      userId: 'demo-user',
      title: 'Engineering Headcount Analysis',
      messagesJson: JSON.stringify(demoMessages),
      workflowStateJson: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).onConflictDoNothing()
  }

  console.log('  ✅ Created demo conversation')
}

/**
 * Main seeding function
 */
async function main() {
  try {
    // Load master employee data
    const masterData = await loadMasterEmployees()

    // Seed tables
    const employeeCount = await seedEmployees(masterData)
    const metricsCount = await seedMetrics(masterData)
    const insightsCount = await seedInsights(masterData)
    await seedDemoConversation()

    console.log('\n✨ Seeding complete!')
    console.log('===================')
    console.log(`📊 Employees: ${employeeCount}`)
    console.log(`📈 Metrics: ${metricsCount}`)
    console.log(`💡 Insights: ${insightsCount}`)
    console.log(`💬 Demo conversations: 1`)

    if (isDryRun) {
      console.log('\n🔍 DRY RUN - No data was written to the database')
    } else {
      console.log('\n✅ Database seeded successfully!')
      console.log('\nNext steps:')
      console.log('  1. Start the dev server: npm run dev')
      console.log('  2. Open http://localhost:3000')
      console.log('  3. You should see the welcome dialog with demo data')
    }

  } catch (error) {
    console.error('\n❌ Seeding failed:', error)
    process.exit(1)
  }
}

// Run the script
main()
