/**
 * Workflow State Machine Types
 *
 * Additional types for managing workflow state transitions and persistence.
 * The core WorkflowState type is defined in ../types.ts
 */

import type { WorkflowId, WorkflowState } from '../types';

// ============================================================================
// State Transition Types
// ============================================================================

/**
 * State transition event
 * Represents a user action or system event that triggers a state change
 */
export interface StateTransitionEvent {
  type: TransitionEventType;
  triggeredBy: 'user' | 'system';
  timestamp: string;
  data?: Record<string, any>;
}

export type TransitionEventType =
  | 'workflow_started'
  | 'step_completed'
  | 'data_collected'
  | 'action_approved'
  | 'action_rejected'
  | 'action_completed'
  | 'action_failed'
  | 'workflow_completed'
  | 'workflow_cancelled'
  | 'error_occurred';

/**
 * State transition result
 * Returned after attempting to transition to a new state
 */
export interface StateTransitionResult {
  success: boolean;
  previousState: WorkflowState;
  newState: WorkflowState;
  event: StateTransitionEvent;
  errors?: string[];
}

// ============================================================================
// State Persistence Types
// ============================================================================

/**
 * Stored workflow state snapshot
 * Includes full state plus metadata for persistence layer
 */
export interface WorkflowStateSnapshot {
  conversationId: string;
  userId: string;
  state: WorkflowState;
  version: number; // Schema version for migrations
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  transitions: StateTransitionEvent[];
}

/**
 * State query options for loading states
 */
export interface StateQueryOptions {
  conversationId?: string;
  userId?: string;
  workflowId?: WorkflowId;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * State update options
 */
export interface StateUpdateOptions {
  merge?: boolean; // If true, merge with existing state; if false, replace
  validateTransition?: boolean; // Validate the state transition is valid
  recordEvent?: StateTransitionEvent;
}

// ============================================================================
// State Validation Types
// ============================================================================

/**
 * Validation result for state data
 */
export interface StateValidationResult {
  valid: boolean;
  errors: StateValidationError[];
  warnings?: StateValidationWarning[];
}

export interface StateValidationError {
  field: string;
  message: string;
  code: ValidationErrorCode;
}

export interface StateValidationWarning {
  field: string;
  message: string;
}

export type ValidationErrorCode =
  | 'missing_required_field'
  | 'invalid_format'
  | 'invalid_value'
  | 'constraint_violation'
  | 'workflow_mismatch';

// ============================================================================
// State Machine Configuration
// ============================================================================

/**
 * State machine configuration for a workflow
 * Defines valid transitions and validation rules
 */
export interface StateMachineConfig {
  workflowId: WorkflowId;
  initialStep: string;
  steps: StepConfig[];
  transitions: TransitionRule[];
  validationRules?: ValidationRule[];
}

export interface StepConfig {
  id: string;
  name: string;
  description: string;
  requiredData?: string[]; // Fields that must be present in state.data
  optionalData?: string[];
  maxDuration?: number; // Max time in milliseconds before warning
  allowedNextSteps: string[];
  isTerminal?: boolean; // True if this is a final step
}

export interface TransitionRule {
  from: string; // Step ID or '*' for any
  to: string;
  event: TransitionEventType;
  condition?: (state: WorkflowState) => boolean;
  onTransition?: (state: WorkflowState) => WorkflowState; // State transformation
}

export interface ValidationRule {
  field: string;
  validator: (value: any, state: WorkflowState) => StateValidationResult;
  required?: boolean;
}

// ============================================================================
// Hybrid State Tracking
// ============================================================================

/**
 * Hybrid state mode configuration
 * Determines when to upgrade from stateless to stateful
 */
export interface HybridStateConfig {
  upgradeThreshold: number; // Confidence threshold to upgrade (default: 75)
  maxStatelessMessages: number; // Max messages before forcing upgrade (default: 5)
  persistAfterActions: boolean; // Always persist after action execution
  autoDowngrade: boolean; // Downgrade to stateless if workflow becomes 'general'
}

/**
 * State mode status
 */
export type StateMode = 'stateless' | 'stateful';

export interface StateModeInfo {
  mode: StateMode;
  reason: string;
  upgradedAt?: string;
  messageCount: number;
}

// ============================================================================
// Helper Types
// ============================================================================

/**
 * State diff for tracking changes
 */
export interface StateDiff {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
}

/**
 * State history entry
 */
export interface StateHistoryEntry {
  state: WorkflowState;
  event: StateTransitionEvent;
  timestamp: string;
  diffs: StateDiff[];
}

/**
 * State export format
 */
export interface StateExport {
  version: string;
  exportedAt: string;
  snapshot: WorkflowStateSnapshot;
  history: StateHistoryEntry[];
  metadata: Record<string, any>;
}
