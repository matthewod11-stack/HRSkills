/**
 * First-Run Detection Logic
 *
 * Detects if this is the first time the app is being run and
 * provides utilities for checking initialization status.
 */

import { db } from '@/lib/db'
import { employees, conversations } from '@/db/schema'

export interface FirstRunStatus {
  isFirstRun: boolean
  hasEmployees: boolean
  hasConversations: boolean
  employeeCount: number
  needsInitialization: boolean
  initializationSteps: {
    databaseSetup: boolean
    demoDataSeeded: boolean
    conversationsCreated: boolean
  }
}

/**
 * Check if this is the first run of the application
 */
export async function checkFirstRun(): Promise<FirstRunStatus> {
  try {
    // Check if employees table has data
    const employeeCount = await db.select({ count: employees.id }).from(employees).execute()
    const hasEmployees = employeeCount.length > 0

    // Check if conversations table has data
    const conversationCount = await db.select({ count: conversations.id }).from(conversations).execute()
    const hasConversations = conversationCount.length > 0

    // Determine if this is truly a first run
    const isFirstRun = !hasEmployees && !hasConversations

    return {
      isFirstRun,
      hasEmployees,
      hasConversations,
      employeeCount: employeeCount.length,
      needsInitialization: isFirstRun,
      initializationSteps: {
        databaseSetup: true, // Schema is always set up by this point
        demoDataSeeded: hasEmployees,
        conversationsCreated: hasConversations
      }
    }
  } catch (error) {
    console.error('[First Run] Error checking first run status:', error)

    // If we can't query the database, assume it's a first run
    return {
      isFirstRun: true,
      hasEmployees: false,
      hasConversations: false,
      employeeCount: 0,
      needsInitialization: true,
      initializationSteps: {
        databaseSetup: false,
        demoDataSeeded: false,
        conversationsCreated: false
      }
    }
  }
}

/**
 * Check if demo data exists
 */
export async function hasDemoData(): Promise<boolean> {
  try {
    const employeeCount = await db.select({ count: employees.id }).from(employees).execute()
    return employeeCount.length > 0
  } catch (error) {
    console.error('[First Run] Error checking demo data:', error)
    return false
  }
}

/**
 * Get initialization progress for UI display
 */
export async function getInitializationProgress(): Promise<{
  percentage: number
  currentStep: string
  steps: Array<{ name: string; completed: boolean }>
}> {
  const status = await checkFirstRun()

  const steps = [
    {
      name: 'Database setup',
      completed: status.initializationSteps.databaseSetup
    },
    {
      name: 'Demo data seeded',
      completed: status.initializationSteps.demoDataSeeded
    },
    {
      name: 'Example conversations created',
      completed: status.initializationSteps.conversationsCreated
    }
  ]

  const completedSteps = steps.filter(s => s.completed).length
  const percentage = Math.round((completedSteps / steps.length) * 100)

  const currentStep = steps.find(s => !s.completed)?.name || 'Complete'

  return {
    percentage,
    currentStep,
    steps
  }
}

/**
 * Mark first run as complete in localStorage
 * (Server-side initialization is tracked via database state)
 */
export function markFirstRunComplete() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hrskills_first_run_complete', 'true')
    localStorage.setItem('hrskills_first_run_date', new Date().toISOString())
  }
}

/**
 * Check if user has completed first run (client-side)
 */
export function hasCompletedFirstRun(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem('hrskills_first_run_complete') === 'true'
}

/**
 * Reset first run status (for testing)
 */
export function resetFirstRunStatus() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hrskills_first_run_complete')
    localStorage.removeItem('hrskills_first_run_date')
    localStorage.removeItem('hrskills_seen_welcome')
  }
}

/**
 * Get days since first run
 */
export function getDaysSinceFirstRun(): number {
  if (typeof window === 'undefined') return 0

  const firstRunDate = localStorage.getItem('hrskills_first_run_date')
  if (!firstRunDate) return 0

  const now = new Date()
  const then = new Date(firstRunDate)
  const diffTime = Math.abs(now.getTime() - then.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}
