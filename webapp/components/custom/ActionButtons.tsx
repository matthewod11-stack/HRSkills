'use client';

/**
 * ActionButtons Component
 *
 * Displays and executes workflow-suggested actions.
 * Shows action buttons with status indicators and execution feedback.
 *
 * Performance optimizations:
 * - useReducer for complex state (Set/Map) instead of multiple useState
 * - useCallback for executeAction to prevent recreation on every render
 * - Removed authHeaders state duplication (use directly from localStorage)
 */

import React, { useReducer, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  Mail,
  MessageSquare,
  Calendar,
  Database,
  Zap,
} from 'lucide-react';
import type { BaseAction, ActionResult } from '@/lib/workflows/actions/types';
import { useAuth } from '@/lib/auth/auth-context';

interface ActionButtonsProps {
  actions: BaseAction[];
  conversationId: string;
  workflowId: string;
  onActionComplete?: (actionId: string, result: ActionResult) => void;
  className?: string;
}

/**
 * State shape for useReducer
 */
interface ActionButtonsState {
  executingActions: Set<string>;
  completedActions: Map<string, ActionResult>;
}

/**
 * Action types for reducer
 */
type ActionButtonsAction =
  | { type: 'START_EXECUTION'; actionId: string }
  | { type: 'COMPLETE_EXECUTION'; actionId: string; result: ActionResult }
  | { type: 'FINISH_EXECUTION'; actionId: string };

/**
 * Reducer for managing action execution state
 */
function actionButtonsReducer(
  state: ActionButtonsState,
  action: ActionButtonsAction
): ActionButtonsState {
  switch (action.type) {
    case 'START_EXECUTION':
      return {
        ...state,
        executingActions: new Set(state.executingActions).add(action.actionId),
      };

    case 'COMPLETE_EXECUTION':
      return {
        ...state,
        completedActions: new Map(state.completedActions).set(action.actionId, action.result),
      };

    case 'FINISH_EXECUTION': {
      const nextExecuting = new Set(state.executingActions);
      nextExecuting.delete(action.actionId);
      return {
        ...state,
        executingActions: nextExecuting,
      };
    }

    default:
      return state;
  }
}

/**
 * Get icon for action type
 */
function getActionIcon(type: string) {
  const icons: Record<string, any> = {
    create_document: FileText,
    send_email: Mail,
    send_slack_message: MessageSquare,
    create_calendar_event: Calendar,
    update_database: Database,
    api_call: Zap,
    webhook: Zap,
    custom: Zap,
  };
  return icons[type] || Zap;
}

/**
 * Get color scheme for action priority
 */
function getPriorityColors(priority?: string) {
  const colors: Record<string, { bg: string; border: string; text: string; hover: string }> = {
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      hover: 'hover:bg-red-100',
    },
    high: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      hover: 'hover:bg-orange-100',
    },
    medium: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      hover: 'hover:bg-blue-100',
    },
    low: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      hover: 'hover:bg-gray-100',
    },
  };
  return colors[priority || 'medium'];
}

export function ActionButtons({
  actions,
  conversationId,
  workflowId,
  onActionComplete,
  className = '',
}: ActionButtonsProps) {
  const { getAuthHeaders } = useAuth();
  // Use reducer for complex state (Set/Map) instead of multiple useState
  const [state, dispatch] = useReducer(actionButtonsReducer, {
    executingActions: new Set<string>(),
    completedActions: new Map<string, ActionResult>(),
  });

  /**
   * Execute an action
   * Memoized to prevent recreation on every render
   */
  const executeAction = useCallback(
    async (action: BaseAction) => {
      // Mark as executing
      dispatch({ type: 'START_EXECUTION', actionId: action.id });

      try {
        const response = await fetch('/api/actions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            action,
            conversationId,
            workflowId,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.result?.error?.message || 'Action execution failed');
        }

        // Mark as completed
        dispatch({ type: 'COMPLETE_EXECUTION', actionId: action.id, result: data.result });

        // Notify parent
        if (onActionComplete) {
          onActionComplete(action.id, data.result);
        }
      } catch (error: any) {
        console.error('Action execution error:', error);

        // Record error result
        const errorResult: ActionResult = {
          success: false,
          actionId: action.id,
          executedAt: new Date().toISOString(),
          duration: 0,
          error: {
            code: 'execution_error',
            message: error.message || 'Unknown error',
          },
        };

        dispatch({ type: 'COMPLETE_EXECUTION', actionId: action.id, result: errorResult });

        if (onActionComplete) {
          onActionComplete(action.id, errorResult);
        }
      } finally {
        // Remove from executing
        dispatch({ type: 'FINISH_EXECUTION', actionId: action.id });
      }
    },
    [conversationId, workflowId, onActionComplete, getAuthHeaders]
  );

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className={`action-buttons space-y-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Zap className="h-4 w-4 text-amber-500" />
        <span>Suggested Actions ({actions.length})</span>
      </div>

      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = getActionIcon(action.type);
          const colors = getPriorityColors(action.priority);
          const isExecuting = state.executingActions.has(action.id);
          const result = state.completedActions.get(action.id);
          const isCompleted = result !== undefined;

          return (
            <div
              key={action.id}
              className={`action-button rounded-lg border p-3 transition-all ${
                isCompleted
                  ? result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                  : `${colors.bg} ${colors.border}`
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg ${
                    isCompleted
                      ? result.success
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                      : `bg-white ${colors.text}`
                  }`}
                >
                  {isExecuting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCompleted ? (
                    result.success ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4
                        className={`text-sm font-semibold ${
                          isCompleted
                            ? result.success
                              ? 'text-green-900'
                              : 'text-red-900'
                            : colors.text
                        }`}
                      >
                        {action.label}
                      </h4>
                      <p
                        className={`mt-1 text-xs ${
                          isCompleted
                            ? result.success
                              ? 'text-green-600'
                              : 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {action.description}
                      </p>

                      {/* Execution result */}
                      {isCompleted && result.success && result.output && (
                        <div className="mt-2 rounded bg-white p-2 text-xs text-gray-700">
                          <div className="flex items-center gap-1 font-medium text-green-700">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Success</span>
                          </div>
                          {result.output.url && (
                            <a
                              href={result.output.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 text-blue-600 hover:underline block truncate"
                            >
                              {result.output.url}
                            </a>
                          )}
                          {result.output.message && (
                            <p className="mt-1 text-gray-600">{result.output.message}</p>
                          )}
                          <p className="mt-1 text-gray-500">Completed in {result.duration}ms</p>
                        </div>
                      )}

                      {/* Error result */}
                      {isCompleted && !result.success && result.error && (
                        <div className="mt-2 rounded bg-white p-2 text-xs">
                          <div className="flex items-center gap-1 font-medium text-red-700">
                            <AlertCircle className="h-3 w-3" />
                            <span>Failed</span>
                          </div>
                          <p className="mt-1 text-red-600">{result.error.message}</p>
                        </div>
                      )}
                    </div>

                    {/* Action button */}
                    {!isCompleted && (
                      <button
                        onClick={() => executeAction(action)}
                        disabled={isExecuting}
                        className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          isExecuting
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : `${colors.hover} ${colors.text} border ${colors.border}`
                        }`}
                      >
                        {isExecuting ? 'Executing...' : 'Execute'}
                      </button>
                    )}

                    {/* Completed badge */}
                    {isCompleted && (
                      <div
                        className={`flex-shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                          result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {result.success ? 'Done' : 'Failed'}
                      </div>
                    )}
                  </div>

                  {/* Priority badge */}
                  {action.priority && action.priority !== 'medium' && !isCompleted && (
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          action.priority === 'critical'
                            ? 'bg-red-100 text-red-700'
                            : action.priority === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {action.priority.charAt(0).toUpperCase() + action.priority.slice(1)}{' '}
                        Priority
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Batch actions */}
      {actions.length > 1 && state.completedActions.size === 0 && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => actions.forEach(executeAction)}
            disabled={state.executingActions.size > 0}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Execute All ({actions.length})
          </button>
        </div>
      )}

      {/* Summary */}
      {state.completedActions.size > 0 && (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>
              {state.completedActions.size} of {actions.length} completed
            </span>
            <span>
              {Array.from(state.completedActions.values()).filter((r) => r.success).length} successful
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact action indicator for inline display
 */
export function ActionIndicator({ actionCount }: { actionCount: number }) {
  if (actionCount === 0) return null;

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
      <Zap className="h-3 w-3" />
      <span>
        {actionCount} action{actionCount > 1 ? 's' : ''}
      </span>
    </div>
  );
}
