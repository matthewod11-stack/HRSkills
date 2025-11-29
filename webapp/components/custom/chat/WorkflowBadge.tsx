'use client';

import { Sparkles } from 'lucide-react';
import { memo } from 'react';

/**
 * Props for the WorkflowBadge component
 */
export interface WorkflowBadgeProps {
  /** The type of workflow detected (e.g., 'offer_letter', 'pip', 'jd') */
  workflowType: string;
  /** Confidence percentage (0-100) of the workflow detection */
  confidence?: number;
}

/**
 * WorkflowBadge - Displays detected workflow type and confidence
 *
 * Shows a badge indicating which HR workflow/skill was detected
 * in the conversation, along with optional confidence percentage.
 *
 * Memoized to prevent unnecessary re-renders when parent updates.
 *
 * @example
 * ```tsx
 * <WorkflowBadge
 *   workflowType="offer_letter"
 *   confidence={95}
 * />
 * ```
 */
export const WorkflowBadge = memo(function WorkflowBadge({
  workflowType,
  confidence,
}: WorkflowBadgeProps) {
  // Don't show badge for general/undetected workflows
  if (!workflowType || workflowType === 'general') {
    return null;
  }

  // Format workflow name (replace underscores with spaces, capitalize)
  const formattedWorkflow = workflowType.replace(/_/g, ' ');

  return (
    <div className="mb-2 pb-2 border-b border-border">
      <p className="text-xs text-violet-light flex items-center gap-1 font-medium">
        <Sparkles className="w-3 h-3" />
        Workflow: {formattedWorkflow}
        {confidence && ` (${confidence}% confidence)`}
      </p>
    </div>
  );
});

WorkflowBadge.displayName = 'WorkflowBadge';
