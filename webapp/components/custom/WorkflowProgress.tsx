'use client';

/**
 * WorkflowProgress Component
 *
 * Displays workflow state progress with step tracking and visual indicators.
 * Shows current step, completed steps, and overall progress percentage.
 */

import React from 'react';
import { CheckCircle2, Circle, ArrowRight } from 'lucide-react';

interface WorkflowStateData {
  currentStep: string | null;
  progress: number;
  completedSteps: string[];
  isComplete: boolean;
  hasActions: boolean;
  actionCount: number;
}

interface WorkflowProgressProps {
  workflowId: string;
  workflowName?: string;
  state: WorkflowStateData;
  className?: string;
}

/**
 * Format step ID to display name
 * Converts snake_case to Title Case
 */
function formatStepName(step: string): string {
  return step
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get workflow display name from ID
 */
function getWorkflowDisplayName(workflowId: string): string {
  const names: Record<string, string> = {
    hiring: 'Hiring & Recruitment',
    performance: 'Performance Management',
    onboarding: 'Employee Onboarding',
    offboarding: 'Employee Offboarding',
    analytics: 'HR Analytics',
    compensation: 'Compensation & Benefits',
    employee_relations: 'Employee Relations',
    compliance: 'HR Compliance',
  };
  return names[workflowId] || workflowId;
}

export function WorkflowProgress({
  workflowId,
  workflowName,
  state,
  className = '',
}: WorkflowProgressProps) {
  const displayName = workflowName || getWorkflowDisplayName(workflowId);

  // Don't show progress for general workflow
  if (workflowId === 'general' || !state.currentStep) {
    return null;
  }

  const { currentStep, progress, completedSteps, isComplete, hasActions, actionCount } = state;

  return (
    <div
      className={`workflow-progress rounded-lg border border-gray-200 bg-white p-4 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{displayName}</h3>
          <p className="text-xs text-gray-500">
            {isComplete ? 'Workflow Complete' : `Step: ${formatStepName(currentStep)}`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-600">{progress}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Completed Steps */}
      {completedSteps.length > 0 && (
        <div className="mb-3">
          <div className="text-xs font-medium text-gray-700 mb-1">Completed Steps:</div>
          <div className="flex flex-wrap gap-2">
            {completedSteps.map((step, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs text-green-700"
              >
                <CheckCircle2 className="h-3 w-3" />
                {formatStepName(step)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Step */}
      {!isComplete && currentStep && (
        <div className="mb-2">
          <div className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs text-blue-700">
            <Circle className="h-3 w-3" />
            <span className="font-medium">Current:</span> {formatStepName(currentStep)}
          </div>
        </div>
      )}

      {/* Pending Actions Indicator */}
      {hasActions && actionCount > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <ArrowRight className="h-4 w-4" />
          <span>
            <span className="font-medium">{actionCount}</span> suggested action
            {actionCount > 1 ? 's' : ''} available
          </span>
        </div>
      )}

      {/* Completion Badge */}
      {isComplete && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-xs text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <span className="font-medium">Workflow completed successfully</span>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for inline display
 */
export function WorkflowProgressCompact({
  workflowId,
  state,
  className = '',
}: Omit<WorkflowProgressProps, 'workflowName'>) {
  if (workflowId === 'general' || !state.currentStep) {
    return null;
  }

  const { currentStep, progress, isComplete } = state;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-xs text-gray-600">
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-medium">{progress}%</span>
      </div>
      {!isComplete && <span className="text-xs text-gray-500">{formatStepName(currentStep)}</span>}
      {isComplete && <span className="text-xs font-medium text-green-600">✓ Complete</span>}
    </div>
  );
}
