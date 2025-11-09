/**
 * Action Handlers Registry
 *
 * Registers all action handlers with the executor.
 * Import this file to initialize the action system.
 */

import { actionExecutor } from '../executor'
import { documentHandler, registerDocumentHandler } from './document-handler'

/**
 * Register all action handlers
 */
export function registerAllHandlers() {
  console.log('[Actions] Registering action handlers...')

  // Register document handler
  registerDocumentHandler(actionExecutor)

  console.log('[Actions] All handlers registered successfully')
}

/**
 * Export handlers for direct use
 */
export { documentHandler }

/**
 * Auto-initialize handlers on import
 */
if (typeof window !== 'undefined') {
  // Only run in browser environment
  registerAllHandlers()
}
