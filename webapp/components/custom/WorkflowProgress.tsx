'use client';

/**
 * WorkflowProgress Component
 *
 * Displays workflow state progress with step tracking and visual indicators.
 * Shows current step, completed steps, and overall progress percentage.
 */

import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';

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

  if (workflowId === 'general' || !state.currentStep) {
    return null;
  }

  const { currentStep, progress, completedSteps, isComplete, hasActions, actionCount } = state;

  const allSteps = [...completedSteps, currentStep];

  return (
    <div
      className={`workflow-progress rounded-lg border border-white/10 bg-white/5 p-6 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">{displayName}</h3>
          <p className="text-xs text-gray-400">
            {isComplete ? 'Workflow Complete' : `In Progress`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-blue-400">{progress}%</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {allSteps.map((step, index) => {
          const isCompleted = completedSteps.includes(step);
          const isCurrent = step === currentStep && !isComplete;
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4 text-green-400" />
              ) : (
                <Circle className="h-4 w-4 text-blue-400" />
              )}
              <span className={`${isCurrent ? 'font-bold text-white' : 'text-gray-400'}`}>
                {formatStepName(step)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pending Actions Indicator */}
      {hasActions && actionCount > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <ArrowRight className="h-4 w-4" />
          <span>
            <span className="font-medium">{actionCount}</span> suggested action
            {actionCount > 1 ? 's' : ''} available
          </span>
        </div>
      )}

      {/* Completion Badge */}
      {isComplete && (
        <div className="mt-4 flex items-center gap-2 rounded-md bg-green-500/10 px-3 py-2 text-xs text-green-300">
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
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-medium text-gray-300">{progress}%</span>
      </div>
      {!isComplete && <span className="text-xs text-gray-400">{formatStepName(currentStep)}</span>}
      {isComplete && <span className="text-xs font-medium text-green-400">✓ Complete</span>}
    </div>
  );
}
