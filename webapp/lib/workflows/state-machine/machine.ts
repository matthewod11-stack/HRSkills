/**
 * Workflow State Machine
 *
 * Manages workflow state transitions, validation, and event handling.
 * This is the core orchestration layer for multi-step workflows.
 */

import { loadWorkflow } from '../loader';
import type { SuggestedAction, WorkflowId, WorkflowState, WorkflowStep } from '../types';
import { createStateSnapshot, saveConversationState, updateWorkflowState } from './persistence';
import type {
  StateMachineConfig,
  StateTransitionEvent,
  StateTransitionResult,
  StateValidationError,
  StateValidationResult,
  StepConfig,
  TransitionRule,
} from './types';

// ============================================================================
// WorkflowStateMachine Class
// ============================================================================

/**
 * State machine for managing workflow transitions
 *
 * Example usage:
 * ```typescript
 * const machine = new WorkflowStateMachine('hiring', conversationId)
 * await machine.initialize()
 *
 * // Transition to next step
 * const result = await machine.transition({
 *   type: 'step_completed',
 *   triggeredBy: 'user',
 *   timestamp: new Date().toISOString()
 * })
 *
 * if (result.success) {
 *   console.log('New step:', result.newState.step)
 * }
 * ```
 */
export class WorkflowStateMachine {
  private workflowId: WorkflowId;
  private conversationId: string;
  private state: WorkflowState | null = null;
  private config: StateMachineConfig | null = null;

  constructor(workflowId: WorkflowId, conversationId: string) {
    this.workflowId = workflowId;
    this.conversationId = conversationId;
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the state machine with workflow configuration
   *
   * @param initialState - Optional initial state (if loading existing)
   * @returns true if initialized successfully
   */
  async initialize(initialState?: WorkflowState): Promise<boolean> {
    try {
      // Load workflow configuration
      const workflow = loadWorkflow(this.workflowId);
      if (!workflow) {
        console.error(`Workflow ${this.workflowId} not found`);
        return false;
      }

      // Build state machine config from workflow
      this.config = this.buildConfig(workflow.steps || []);

      // Set initial state
      if (initialState) {
        this.state = initialState;
      } else {
        this.state = {
          workflowId: this.workflowId,
          step: this.config.initialStep,
          data: {},
          completedSteps: [],
          nextActions: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {
            initialized: true,
            version: 1,
          },
        };
      }

      return true;
    } catch (error) {
      console.error('Failed to initialize state machine:', error);
      return false;
    }
  }

  /**
   * Build state machine configuration from workflow steps
   *
   * @param steps - Workflow steps
   * @returns State machine configuration
   */
  private buildConfig(steps: WorkflowStep[]): StateMachineConfig {
    const stepConfigs: StepConfig[] = steps.map((step) => ({
      id: step.id,
      name: step.name,
      description: step.description,
      requiredData: step.requiredData,
      optionalData: step.optionalData,
      allowedNextSteps: step.nextSteps || [],
      isTerminal: step.isTerminal || false,
    }));

    // Build transition rules from step configuration
    const transitions: TransitionRule[] = [];
    for (const step of steps) {
      if (step.nextSteps && step.nextSteps.length > 0) {
        for (const nextStep of step.nextSteps) {
          transitions.push({
            from: step.id,
            to: nextStep,
            event: 'step_completed',
          });
        }
      }
    }

    return {
      workflowId: this.workflowId,
      initialStep: steps[0]?.id || 'start',
      steps: stepConfigs,
      transitions,
    };
  }

  // ==========================================================================
  // State Access
  // ==========================================================================

  /**
   * Get current state
   */
  getState(): WorkflowState | null {
    return this.state;
  }

  /**
   * Get current step
   */
  getCurrentStep(): string | null {
    return this.state?.step || null;
  }

  /**
   * Get current step configuration
   */
  getCurrentStepConfig(): StepConfig | null {
    if (!this.state || !this.config) return null;
    return this.config.steps.find((s) => s.id === this.state!.step) || null;
  }

  /**
   * Get next suggested actions
   */
  getNextActions(): SuggestedAction[] {
    return this.state?.nextActions || [];
  }

  /**
   * Get completed steps
   */
  getCompletedSteps(): string[] {
    return this.state?.completedSteps || [];
  }

  /**
   * Get workflow progress as percentage
   */
  getProgress(): number {
    if (!this.state || !this.config) return 0;
    const totalSteps = this.config.steps.length;
    const completed = this.state.completedSteps.length;
    return totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;
  }

  // ==========================================================================
  // State Transitions
  // ==========================================================================

  /**
   * Check if transition to a step is allowed
   *
   * @param toStep - Target step ID
   * @returns true if transition is valid
   */
  canTransition(toStep: string): boolean {
    if (!this.state || !this.config) return false;

    const currentStep = this.getCurrentStepConfig();
    if (!currentStep) return false;

    return currentStep.allowedNextSteps.includes(toStep);
  }

  /**
   * Transition to a new state
   *
   * @param event - Transition event
   * @param toStep - Optional target step (if not provided, use first allowed next step)
   * @param data - Optional data updates
   * @returns Transition result
   */
  async transition(
    event: StateTransitionEvent,
    toStep?: string,
    data?: Record<string, any>
  ): Promise<StateTransitionResult> {
    if (!this.state || !this.config) {
      return {
        success: false,
        previousState: this.state!,
        newState: this.state!,
        event,
        errors: ['State machine not initialized'],
      };
    }

    const previousState = { ...this.state };

    // Determine target step
    let targetStep = toStep;
    if (!targetStep) {
      const currentStepConfig = this.getCurrentStepConfig();
      if (currentStepConfig && currentStepConfig.allowedNextSteps.length > 0) {
        targetStep = currentStepConfig.allowedNextSteps[0];
      }
    }

    // Validate transition
    if (targetStep && !this.canTransition(targetStep)) {
      return {
        success: false,
        previousState,
        newState: this.state,
        event,
        errors: [`Invalid transition from ${this.state.step} to ${targetStep}`],
      };
    }

    // Validate data if provided
    if (data) {
      const validation = this.validateData(data);
      if (!validation.valid) {
        return {
          success: false,
          previousState,
          newState: this.state,
          event,
          errors: validation.errors.map((e) => e.message),
        };
      }
    }

    // Build new state
    const newState = updateWorkflowState(this.state, {
      step: targetStep || this.state.step,
      data: { ...this.state.data, ...data },
      completedSteps:
        targetStep && !this.state.completedSteps.includes(this.state.step)
          ? [...this.state.completedSteps, this.state.step]
          : this.state.completedSteps,
      metadata: {
        ...this.state.metadata,
        lastTransition: {
          event: event.type,
          from: this.state.step,
          to: targetStep,
          timestamp: event.timestamp,
        },
      },
    });

    // Update internal state
    this.state = newState;

    // Persist to database
    const saved = await saveConversationState(this.conversationId, newState);
    if (!saved) {
      console.warn('Failed to persist state to database');
    }

    // Create snapshot for audit trail
    await createStateSnapshot(this.conversationId, newState, event);

    return {
      success: true,
      previousState,
      newState,
      event,
    };
  }

  /**
   * Complete current step and move to next
   *
   * @param data - Optional data collected during step
   * @param nextStep - Optional explicit next step
   * @returns Transition result
   */
  async completeStep(
    data?: Record<string, any>,
    nextStep?: string
  ): Promise<StateTransitionResult> {
    const event: StateTransitionEvent = {
      type: 'step_completed',
      triggeredBy: 'user',
      timestamp: new Date().toISOString(),
      data,
    };

    return this.transition(event, nextStep, data);
  }

  /**
   * Update state data without transitioning
   *
   * @param data - Data to merge into state
   * @returns Success boolean
   */
  async updateData(data: Record<string, any>): Promise<boolean> {
    if (!this.state) return false;

    const event: StateTransitionEvent = {
      type: 'data_collected',
      triggeredBy: 'system',
      timestamp: new Date().toISOString(),
      data,
    };

    const result = await this.transition(event, this.state.step, data);
    return result.success;
  }

  /**
   * Set next suggested actions
   *
   * @param actions - Suggested actions
   * @returns Success boolean
   */
  async setSuggestedActions(actions: SuggestedAction[]): Promise<boolean> {
    if (!this.state) return false;

    this.state = updateWorkflowState(this.state, {
      nextActions: actions,
    });

    return saveConversationState(this.conversationId, this.state);
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate state data against current step requirements
   *
   * @param data - Data to validate
   * @returns Validation result
   */
  private validateData(data: Record<string, any>): StateValidationResult {
    const currentStep = this.getCurrentStepConfig();
    if (!currentStep) {
      return { valid: true, errors: [] };
    }

    const errors: StateValidationError[] = [];

    // Check required fields
    if (currentStep.requiredData) {
      for (const field of currentStep.requiredData) {
        if (!data[field] && (!this.state?.data || !this.state.data[field])) {
          errors.push({
            field,
            message: `Required field '${field}' is missing`,
            code: 'missing_required_field',
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate complete state
   *
   * @returns Validation result
   */
  validateState(): StateValidationResult {
    if (!this.state) {
      return {
        valid: false,
        errors: [
          {
            field: 'state',
            message: 'State is null',
            code: 'missing_required_field',
          },
        ],
      };
    }

    return this.validateData(this.state.data);
  }

  // ==========================================================================
  // Workflow Completion
  // ==========================================================================

  /**
   * Check if workflow is complete
   */
  isComplete(): boolean {
    const currentStep = this.getCurrentStepConfig();
    return currentStep?.isTerminal || false;
  }

  /**
   * Mark workflow as complete
   *
   * @returns Transition result
   */
  async complete(): Promise<StateTransitionResult> {
    const event: StateTransitionEvent = {
      type: 'workflow_completed',
      triggeredBy: 'system',
      timestamp: new Date().toISOString(),
    };

    if (!this.state) {
      return {
        success: false,
        previousState: this.state!,
        newState: this.state!,
        event,
        errors: ['State machine not initialized'],
      };
    }

    const previousState = { ...this.state };

    this.state = updateWorkflowState(this.state, {
      metadata: {
        ...this.state.metadata,
        completed: true,
        completedAt: new Date().toISOString(),
      },
    });

    await saveConversationState(this.conversationId, this.state);
    await createStateSnapshot(this.conversationId, this.state, event);

    return {
      success: true,
      previousState,
      newState: this.state,
      event,
    };
  }

  /**
   * Cancel workflow
   *
   * @param reason - Cancellation reason
   * @returns Transition result
   */
  async cancel(reason?: string): Promise<StateTransitionResult> {
    const event: StateTransitionEvent = {
      type: 'workflow_cancelled',
      triggeredBy: 'user',
      timestamp: new Date().toISOString(),
      data: { reason },
    };

    if (!this.state) {
      return {
        success: false,
        previousState: this.state!,
        newState: this.state!,
        event,
        errors: ['State machine not initialized'],
      };
    }

    const previousState = { ...this.state };

    this.state = updateWorkflowState(this.state, {
      metadata: {
        ...this.state.metadata,
        cancelled: true,
        cancelledAt: new Date().toISOString(),
        cancellationReason: reason,
      },
    });

    await saveConversationState(this.conversationId, this.state);
    await createStateSnapshot(this.conversationId, this.state, event);

    return {
      success: true,
      previousState,
      newState: this.state,
      event,
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Get workflow summary for debugging
   */
  getSummary(): {
    workflowId: WorkflowId;
    currentStep: string | null;
    progress: number;
    completedSteps: string[];
    isComplete: boolean;
    nextActions: number;
  } {
    return {
      workflowId: this.workflowId,
      currentStep: this.getCurrentStep(),
      progress: this.getProgress(),
      completedSteps: this.getCompletedSteps(),
      isComplete: this.isComplete(),
      nextActions: this.getNextActions().length,
    };
  }

  /**
   * Export state for debugging or backup
   */
  exportState(): WorkflowState | null {
    return this.state ? { ...this.state } : null;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new workflow state machine
 *
 * @param workflowId - Workflow ID
 * @param conversationId - Conversation ID
 * @param initialState - Optional initial state
 * @returns Initialized state machine
 */
export async function createStateMachine(
  workflowId: WorkflowId,
  conversationId: string,
  initialState?: WorkflowState
): Promise<WorkflowStateMachine | null> {
  const machine = new WorkflowStateMachine(workflowId, conversationId);
  const initialized = await machine.initialize(initialState);

  if (!initialized) {
    return null;
  }

  return machine;
}

/**
 * Load state machine from conversation
 *
 * @param conversationId - Conversation ID
 * @param state - Existing workflow state
 * @returns State machine or null
 */
export async function loadStateMachine(
  conversationId: string,
  state: WorkflowState
): Promise<WorkflowStateMachine | null> {
  return createStateMachine(state.workflowId, conversationId, state);
}
