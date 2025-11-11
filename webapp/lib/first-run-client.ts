/**
 * First-Run Detection Logic (Client-Side Only)
 *
 * Client-side utilities for first-run detection using localStorage.
 * For server-side detection, use lib/first-run.ts instead.
 */

/**
 * Mark first run as complete in localStorage
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
