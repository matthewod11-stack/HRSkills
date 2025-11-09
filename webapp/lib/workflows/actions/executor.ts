/**
 * Action Executor
 *
 * Orchestrates action execution with validation, error handling, and retry logic.
 * Manages action handlers and provides a unified execution interface.
 */

import { nanoid } from 'nanoid'
import type {
  BaseAction,
  ActionType,
  ActionContext,
  ActionResult,
  ActionHandler,
  ActionRegistryEntry,
  ActionValidationResult,
  ActionExecutionOptions,
  BatchActionRequest,
  BatchActionResult,
  CreateActionInput,
  UpdateActionInput,
  ActionStatistics,
  ActionHistoryEntry
} from './types'

// ============================================================================
// ActionExecutor Class
// ============================================================================

/**
 * Central action execution engine
 *
 * Example usage:
 * ```typescript
 * const executor = new ActionExecutor()
 * executor.registerHandler(documentHandler)
 *
 * const action = executor.createAction({
 *   type: 'create_document',
 *   label: 'Create offer letter',
 *   description: 'Generate offer letter for candidate',
 *   payload: { ... },
 *   requiresApproval: true
 * })
 *
 * const result = await executor.execute(action, context)
 * if (result.success) {
 *   console.log('Document created:', result.output)
 * }
 * ```
 */
export class ActionExecutor {
  private handlers: Map<ActionType, ActionHandler> = new Map()
  private registry: Map<ActionType, ActionRegistryEntry> = new Map()
  private history: ActionHistoryEntry[] = []
  private rateLimitCounters: Map<string, number[]> = new Map()

  // ==========================================================================
  // Handler Registration
  // ==========================================================================

  /**
   * Register an action handler
   *
   * @param handler - Action handler implementation
   * @param options - Registration options
   */
  registerHandler(
    handler: ActionHandler,
    options: {
      enabled?: boolean
      requiredPermissions?: string[]
      rateLimitPerHour?: number
    } = {}
  ): void {
    this.handlers.set(handler.type, handler)

    const entry: ActionRegistryEntry = {
      type: handler.type,
      handler,
      enabled: options.enabled ?? true,
      requiredPermissions: options.requiredPermissions || [],
      rateLimitPerHour: options.rateLimitPerHour
    }

    this.registry.set(handler.type, entry)
    console.log(`Registered action handler: ${handler.type}`)
  }

  /**
   * Unregister an action handler
   */
  unregisterHandler(type: ActionType): void {
    this.handlers.delete(type)
    this.registry.delete(type)
  }

  /**
   * Get handler for action type
   */
  private getHandler(type: ActionType): ActionHandler | null {
    const entry = this.registry.get(type)

    if (!entry) {
      console.error(`No handler registered for action type: ${type}`)
      return null
    }

    if (!entry.enabled) {
      console.warn(`Handler for ${type} is disabled`)
      return null
    }

    return entry.handler
  }

  // ==========================================================================
  // Action Creation
  // ==========================================================================

  /**
   * Create a new action
   *
   * @param input - Action creation input
   * @returns Created action with ID and status
   */
  createAction(input: CreateActionInput): BaseAction {
    return {
      ...input,
      id: nanoid(),
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  }

  /**
   * Update an existing action
   *
   * @param action - Action to update
   * @param updates - Fields to update
   * @returns Updated action
   */
  updateAction(action: BaseAction, updates: UpdateActionInput): BaseAction {
    return {
      ...action,
      ...updates,
      updatedAt: new Date().toISOString()
    }
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate an action before execution
   *
   * @param action - Action to validate
   * @param context - Execution context
   * @returns Validation result
   */
  async validate(
    action: BaseAction,
    context: ActionContext
  ): Promise<ActionValidationResult> {
    const errors = []
    const warnings = []

    // Check if handler exists
    const handler = this.getHandler(action.type)
    if (!handler) {
      return {
        valid: false,
        errors: [{
          field: 'type',
          message: `No handler available for action type: ${action.type}`,
          code: 'invalid_value'
        }]
      }
    }

    // Check permissions
    const entry = this.registry.get(action.type)!
    if (entry.requiredPermissions.length > 0) {
      const missingPermissions = entry.requiredPermissions.filter(
        perm => !context.userPermissions.includes(perm)
      )

      if (missingPermissions.length > 0) {
        errors.push({
          field: 'permissions',
          message: `Missing required permissions: ${missingPermissions.join(', ')}`,
          code: 'permission_denied'
        })
      }
    }

    // Check rate limits
    if (entry.rateLimitPerHour) {
      const key = `${context.userId}:${action.type}`
      const isRateLimited = this.checkRateLimit(key, entry.rateLimitPerHour)

      if (isRateLimited) {
        errors.push({
          field: 'rate_limit',
          message: `Rate limit exceeded for ${action.type}. Max ${entry.rateLimitPerHour} per hour.`,
          code: 'invalid_value'
        })
      }
    }

    // Return early if basic validation failed
    if (errors.length > 0) {
      return { valid: false, errors, warnings }
    }

    // Run handler-specific validation
    const handlerValidation = await handler.validate(action, context)

    return {
      valid: handlerValidation.valid && errors.length === 0,
      errors: [...errors, ...handlerValidation.errors],
      warnings: [...warnings, ...(handlerValidation.warnings || [])]
    }
  }

  /**
   * Check rate limit for action
   */
  private checkRateLimit(key: string, limitPerHour: number): boolean {
    const now = Date.now()
    const oneHourAgo = now - 60 * 60 * 1000

    // Get or create counter
    let timestamps = this.rateLimitCounters.get(key) || []

    // Remove old timestamps
    timestamps = timestamps.filter(ts => ts > oneHourAgo)

    // Check if limit exceeded
    if (timestamps.length >= limitPerHour) {
      return true
    }

    // Add current timestamp
    timestamps.push(now)
    this.rateLimitCounters.set(key, timestamps)

    return false
  }

  // ==========================================================================
  // Execution
  // ==========================================================================

  /**
   * Execute an action
   *
   * @param action - Action to execute
   * @param context - Execution context
   * @param options - Execution options
   * @returns Action result
   */
  async execute(
    action: BaseAction,
    context: ActionContext,
    options: ActionExecutionOptions = {}
  ): Promise<ActionResult> {
    const startTime = Date.now()

    // Validate before execution
    const validation = await this.validate(action, context)
    if (!validation.valid) {
      return {
        success: false,
        actionId: action.id,
        executedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: {
          code: 'validation_failed',
          message: 'Action validation failed',
          details: validation.errors
        }
      }
    }

    // Dry run mode - validate only
    if (options.dryRun) {
      return {
        success: true,
        actionId: action.id,
        executedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        metadata: { dryRun: true, validation }
      }
    }

    // Get handler
    const handler = this.getHandler(action.type)!

    // Execute with timeout and retries
    let result: ActionResult
    const maxRetries = options.retries || 0
    let attempt = 0

    while (attempt <= maxRetries) {
      try {
        // Execute with timeout
        result = await this.executeWithTimeout(
          handler,
          action,
          context,
          options.timeout || 30000 // 30 second default timeout
        )

        // Success - break retry loop
        if (result.success) {
          break
        }

        // Failed - check if we should retry
        if (attempt < maxRetries) {
          console.log(`Action ${action.id} failed, retrying (${attempt + 1}/${maxRetries})...`)
          await this.delay(1000 * (attempt + 1)) // Exponential backoff
        }
      } catch (error: any) {
        result = {
          success: false,
          actionId: action.id,
          executedAt: new Date().toISOString(),
          duration: Date.now() - startTime,
          error: {
            code: 'execution_error',
            message: error.message || 'Unknown execution error',
            details: error
          }
        }

        // Retry on error if attempts remaining
        if (attempt < maxRetries) {
          console.log(`Action ${action.id} error, retrying (${attempt + 1}/${maxRetries})...`)
          await this.delay(1000 * (attempt + 1))
        }
      }

      attempt++
    }

    // Record execution in history
    this.recordHistory(action, result!, context)

    return result!
  }

  /**
   * Execute action with timeout
   */
  private async executeWithTimeout(
    handler: ActionHandler,
    action: BaseAction,
    context: ActionContext,
    timeout: number
  ): Promise<ActionResult> {
    return Promise.race([
      handler.execute(action, context),
      new Promise<ActionResult>((_, reject) =>
        setTimeout(() => reject(new Error(`Action execution timeout after ${timeout}ms`)), timeout)
      )
    ])
  }

  /**
   * Delay helper for retry backoff
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ==========================================================================
  // Batch Execution
  // ==========================================================================

  /**
   * Execute multiple actions
   *
   * @param request - Batch execution request
   * @returns Batch execution result
   */
  async executeBatch(request: BatchActionRequest): Promise<BatchActionResult> {
    const startTime = Date.now()
    const results: ActionResult[] = []
    let successCount = 0
    let failureCount = 0
    const errors: BatchActionResult['errors'] = []

    if (request.sequential) {
      // Execute one at a time
      for (const action of request.actions) {
        const result = await this.execute(action, request.context, request.options)
        results.push(result)

        if (result.success) {
          successCount++
        } else {
          failureCount++
          errors.push({
            actionId: action.id,
            error: result.error
          })
        }
      }
    } else {
      // Execute in parallel
      const promises = request.actions.map(action =>
        this.execute(action, request.context, request.options)
      )

      const batchResults = await Promise.all(promises)

      for (let i = 0; i < batchResults.length; i++) {
        const result = batchResults[i]
        results.push(result)

        if (result.success) {
          successCount++
        } else {
          failureCount++
          errors.push({
            actionId: request.actions[i].id,
            error: result.error
          })
        }
      }
    }

    return {
      results,
      totalDuration: Date.now() - startTime,
      successCount,
      failureCount,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  // ==========================================================================
  // History & Statistics
  // ==========================================================================

  /**
   * Record action execution in history
   */
  private recordHistory(
    action: BaseAction,
    result: ActionResult,
    context: ActionContext
  ): void {
    const entry: ActionHistoryEntry = {
      id: nanoid(),
      actionId: action.id,
      action,
      result,
      context,
      timestamp: new Date().toISOString()
    }

    this.history.push(entry)

    // Limit history size to prevent memory issues
    if (this.history.length > 1000) {
      this.history = this.history.slice(-1000)
    }
  }

  /**
   * Get action history
   */
  getHistory(filter?: {
    actionType?: ActionType
    userId?: string
    workflowId?: string
    status?: 'success' | 'failure'
  }): ActionHistoryEntry[] {
    let filtered = this.history

    if (filter?.actionType) {
      filtered = filtered.filter(e => e.action.type === filter.actionType)
    }

    if (filter?.userId) {
      filtered = filtered.filter(e => e.context.userId === filter.userId)
    }

    if (filter?.workflowId) {
      filtered = filtered.filter(e => e.context.workflowId === filter.workflowId)
    }

    if (filter?.status) {
      filtered = filtered.filter(e =>
        filter.status === 'success' ? e.result.success : !e.result.success
      )
    }

    return filtered
  }

  /**
   * Get execution statistics
   */
  getStatistics(): ActionStatistics {
    const byType: ActionStatistics['byType'] = {} as any
    const byWorkflow: ActionStatistics['byWorkflow'] = {} as any

    let totalExecuted = 0
    let successCount = 0
    let failureCount = 0
    let totalDuration = 0

    for (const entry of this.history) {
      totalExecuted++
      totalDuration += entry.result.duration

      if (entry.result.success) {
        successCount++
      } else {
        failureCount++
      }

      // By type
      const type = entry.action.type
      if (!byType[type]) {
        byType[type] = { count: 0, successRate: 0, avgDuration: 0 }
      }
      byType[type].count++

      // By workflow
      const workflowId = entry.context.workflowId
      if (!byWorkflow[workflowId]) {
        byWorkflow[workflowId] = { count: 0, successRate: 0 }
      }
      byWorkflow[workflowId].count++
    }

    // Calculate rates and averages
    for (const type in byType) {
      const typeEntries = this.history.filter(e => e.action.type === type)
      const typeSuccess = typeEntries.filter(e => e.result.success).length
      const typeDuration = typeEntries.reduce((sum, e) => sum + e.result.duration, 0)

      byType[type as ActionType].successRate = typeSuccess / typeEntries.length
      byType[type as ActionType].avgDuration = typeDuration / typeEntries.length
    }

    for (const workflowId in byWorkflow) {
      const workflowEntries = this.history.filter(e => e.context.workflowId === workflowId)
      const workflowSuccess = workflowEntries.filter(e => e.result.success).length

      byWorkflow[workflowId].successRate = workflowSuccess / workflowEntries.length
    }

    return {
      totalExecuted,
      successCount,
      failureCount,
      averageDuration: totalExecuted > 0 ? totalDuration / totalExecuted : 0,
      byType,
      byWorkflow
    }
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = []
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global action executor instance
 */
export const actionExecutor = new ActionExecutor()
