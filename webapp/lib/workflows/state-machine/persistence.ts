/**
 * Workflow State Persistence Layer
 *
 * Handles saving and loading workflow states from the database.
 * Uses hybrid approach: stores current state in conversations.workflowStateJson
 * and creates snapshots in workflowSnapshots table for history.
 */

import { db } from '@/lib/db';
import { conversations, workflowSnapshots } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import type { WorkflowState, WorkflowId } from '../types';
import type {
  WorkflowStateSnapshot,
  StateQueryOptions,
  StateUpdateOptions,
  StateTransitionEvent,
  HybridStateConfig,
  StateModeInfo,
} from './types';
import { nanoid } from 'nanoid';

// ============================================================================
// Configuration
// ============================================================================

const DEFAULT_HYBRID_CONFIG: HybridStateConfig = {
  upgradeThreshold: 75, // Confidence >= 75% triggers stateful mode
  maxStatelessMessages: 5,
  persistAfterActions: true,
  autoDowngrade: true,
};

// ============================================================================
// State Mode Management
// ============================================================================

/**
 * Determine if conversation should be stateful based on hybrid config
 *
 * @param workflowId - Detected workflow ID
 * @param confidence - Detection confidence (0-100)
 * @param messageCount - Number of messages in conversation
 * @param config - Hybrid state configuration
 * @returns State mode information
 */
export function determineStateMode(
  workflowId: WorkflowId,
  confidence: number,
  messageCount: number,
  config: HybridStateConfig = DEFAULT_HYBRID_CONFIG
): StateModeInfo {
  // Always stateless for 'general' workflow is pointless
  if (workflowId === 'general') {
    return {
      mode: 'stateless',
      reason: 'General workflow - no state tracking needed',
      messageCount,
    };
  }

  // Upgrade if confidence meets threshold
  if (confidence >= config.upgradeThreshold) {
    return {
      mode: 'stateful',
      reason: `High confidence (${confidence}%) workflow detected`,
      upgradedAt: new Date().toISOString(),
      messageCount,
    };
  }

  // Force upgrade after max stateless messages (workflowId is already not 'general' here)
  if (messageCount >= config.maxStatelessMessages) {
    return {
      mode: 'stateful',
      reason: `Exceeded ${config.maxStatelessMessages} messages without high-confidence workflow`,
      upgradedAt: new Date().toISOString(),
      messageCount,
    };
  }

  // Stay stateless
  return {
    mode: 'stateless',
    reason: `Low confidence (${confidence}%) - staying stateless`,
    messageCount,
  };
}

// ============================================================================
// State Loading
// ============================================================================

/**
 * Load current workflow state for a conversation
 *
 * @param conversationId - Conversation ID
 * @returns Workflow state or null if not found
 */
export async function loadConversationState(conversationId: string): Promise<WorkflowState | null> {
  try {
    const result = await db
      .select({ workflowStateJson: conversations.workflowStateJson })
      .from(conversations)
      .where(eq(conversations.id, conversationId))
      .limit(1);

    if (!result || result.length === 0 || !result[0].workflowStateJson) {
      return null;
    }

    const state = JSON.parse(result[0].workflowStateJson) as WorkflowState;
    return state;
  } catch (error) {
    console.error(`Failed to load conversation state for ${conversationId}:`, error);
    return null;
  }
}

/**
 * Load workflow state snapshot by ID
 *
 * @param snapshotId - Snapshot ID
 * @returns Workflow state snapshot or null
 */
export async function loadStateSnapshot(snapshotId: string): Promise<WorkflowStateSnapshot | null> {
  try {
    const result = await db
      .select()
      .from(workflowSnapshots)
      .where(eq(workflowSnapshots.id, snapshotId))
      .limit(1);

    if (!result || result.length === 0) {
      return null;
    }

    const snapshot = result[0];
    return {
      conversationId: snapshot.conversationId!,
      userId: '', // Not stored in snapshot table - would need to join conversations
      state: JSON.parse(snapshot.stateJson) as WorkflowState,
      version: 1, // Schema version
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.createdAt,
      isActive: true,
      transitions: [], // Would need separate transitions table to track history
    };
  } catch (error) {
    console.error(`Failed to load snapshot ${snapshotId}:`, error);
    return null;
  }
}

/**
 * Query workflow snapshots with filters
 *
 * @param options - Query options
 * @returns Array of state snapshots
 */
export async function queryStateSnapshots(
  options: StateQueryOptions
): Promise<WorkflowStateSnapshot[]> {
  try {
    let query = db.select().from(workflowSnapshots);

    // Apply filters
    const conditions = [];
    if (options.conversationId) {
      conditions.push(eq(workflowSnapshots.conversationId, options.conversationId));
    }
    if (options.workflowId) {
      conditions.push(eq(workflowSnapshots.workflowId, options.workflowId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    // Order by most recent
    query = query.orderBy(desc(workflowSnapshots.createdAt)) as any;

    // Apply limit/offset
    if (options.limit) {
      query = query.limit(options.limit) as any;
    }
    if (options.offset) {
      query = query.offset(options.offset) as any;
    }

    const results = await query;

    return results.map((snapshot: any) => ({
      conversationId: snapshot.conversationId!,
      userId: '',
      state: JSON.parse(snapshot.stateJson) as WorkflowState,
      version: 1,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.createdAt,
      isActive: true,
      transitions: [],
    }));
  } catch (error) {
    console.error('Failed to query state snapshots:', error);
    return [];
  }
}

// ============================================================================
// State Saving
// ============================================================================

/**
 * Save workflow state to conversation
 *
 * @param conversationId - Conversation ID
 * @param state - Workflow state to save
 * @param options - Update options
 * @returns Success boolean
 */
export async function saveConversationState(
  conversationId: string,
  state: WorkflowState,
  options: StateUpdateOptions = {}
): Promise<boolean> {
  try {
    const stateJson = JSON.stringify(state);

    await db
      .update(conversations)
      .set({
        workflowStateJson: stateJson,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(conversations.id, conversationId));

    return true;
  } catch (error) {
    console.error(`Failed to save conversation state for ${conversationId}:`, error);
    return false;
  }
}

/**
 * Create a workflow state snapshot
 *
 * @param conversationId - Conversation ID
 * @param state - Workflow state
 * @param event - Optional transition event that triggered snapshot
 * @returns Snapshot ID or null on failure
 */
export async function createStateSnapshot(
  conversationId: string,
  state: WorkflowState,
  event?: StateTransitionEvent
): Promise<string | null> {
  try {
    const snapshotId = nanoid();
    const stateJson = JSON.stringify(state);

    await db.insert(workflowSnapshots).values({
      id: snapshotId,
      workflowId: state.workflowId,
      conversationId,
      step: state.step,
      stateJson,
      createdAt: new Date().toISOString(),
    });

    return snapshotId;
  } catch (error) {
    console.error('Failed to create state snapshot:', error);
    return null;
  }
}

/**
 * Initialize a new workflow state
 *
 * @param workflowId - Workflow ID
 * @param initialStep - Initial step name (default: 'start')
 * @returns New workflow state
 */
export function initializeWorkflowState(
  workflowId: WorkflowId,
  initialStep: string = 'start'
): WorkflowState {
  return {
    workflowId,
    step: initialStep,
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

/**
 * Update workflow state with new data
 *
 * @param state - Current state
 * @param updates - Partial state updates
 * @returns Updated state
 */
export function updateWorkflowState(
  state: WorkflowState,
  updates: Partial<WorkflowState>
): WorkflowState {
  return {
    ...state,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// State Deletion
// ============================================================================

/**
 * Clear workflow state from conversation
 *
 * @param conversationId - Conversation ID
 * @returns Success boolean
 */
export async function clearConversationState(conversationId: string): Promise<boolean> {
  try {
    await db
      .update(conversations)
      .set({
        workflowStateJson: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(conversations.id, conversationId));

    return true;
  } catch (error) {
    console.error(`Failed to clear conversation state for ${conversationId}:`, error);
    return false;
  }
}

/**
 * Delete all snapshots for a conversation
 *
 * @param conversationId - Conversation ID
 * @returns Number of snapshots deleted
 */
export async function deleteConversationSnapshots(conversationId: string): Promise<number> {
  try {
    const result = await db
      .delete(workflowSnapshots)
      .where(eq(workflowSnapshots.conversationId, conversationId));

    return result.changes || 0;
  } catch (error) {
    console.error(`Failed to delete snapshots for ${conversationId}:`, error);
    return 0;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if conversation has active workflow state
 *
 * @param conversationId - Conversation ID
 * @returns true if state exists
 */
export async function hasActiveState(conversationId: string): Promise<boolean> {
  const state = await loadConversationState(conversationId);
  return state !== null;
}

/**
 * Get state statistics for debugging
 *
 * @param conversationId - Conversation ID
 * @returns Statistics object
 */
export async function getStateStatistics(conversationId: string): Promise<{
  hasState: boolean;
  snapshotCount: number;
  currentWorkflow?: WorkflowId;
  currentStep?: string;
  completedSteps?: number;
  pendingActions?: number;
}> {
  const state = await loadConversationState(conversationId);
  const snapshots = await queryStateSnapshots({ conversationId });

  if (!state) {
    return {
      hasState: false,
      snapshotCount: snapshots.length,
    };
  }

  return {
    hasState: true,
    snapshotCount: snapshots.length,
    currentWorkflow: state.workflowId,
    currentStep: state.step,
    completedSteps: state.completedSteps?.length || 0,
    pendingActions: state.nextActions?.length || 0,
  };
}
