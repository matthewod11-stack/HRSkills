/**
 * Workflow Loader
 *
 * Loads workflow configurations and builds system prompts with context.
 * Replaces the legacy skill loading system.
 */

import type { Workflow, WorkflowContext, WorkflowState, WorkflowTemplate } from './types';
import { getWorkflow, WORKFLOWS } from './workflows.config';
import type { WorkflowId } from './types';

/**
 * Load workflow configuration
 *
 * @param workflowId - Workflow ID to load
 * @returns Workflow configuration or null if not found
 */
export function loadWorkflow(workflowId: WorkflowId): Workflow | null {
  return getWorkflow(workflowId);
}

/**
 * Build complete workflow context including templates and data
 *
 * @param workflowId - Workflow ID
 * @param options - Optional context data
 * @returns Complete workflow context
 */
export async function buildWorkflowContext(
  workflowId: WorkflowId,
  options?: {
    state?: WorkflowState;
    employeeData?: any[];
    analyticsData?: any;
    userPermissions?: string[];
  }
): Promise<WorkflowContext | null> {
  const workflow = loadWorkflow(workflowId);
  if (!workflow) return null;

  return {
    workflow,
    state: options?.state,
    employeeData: options?.employeeData,
    analyticsData: options?.analyticsData,
    templates: [], // Templates loaded separately if needed
    userPermissions: options?.userPermissions,
  };
}

/**
 * Build system prompt for workflow with context injection
 *
 * @param workflow - Workflow configuration
 * @param context - Context data to inject
 * @returns Complete system prompt with context
 */
export function buildWorkflowSystemPrompt(
  workflow: Workflow,
  context?: {
    state?: WorkflowState;
    employeeContext?: string;
    analyticsData?: string;
    companyInfo?: string;
  }
): string {
  let systemPrompt = workflow.systemPrompt;

  // Replace context placeholders
  if (context?.employeeContext) {
    systemPrompt = systemPrompt.replace(
      '{{EMPLOYEE_CONTEXT}}',
      `\n## Employee Data\n\n${context.employeeContext}\n`
    );
  } else {
    systemPrompt = systemPrompt.replace('{{EMPLOYEE_CONTEXT}}', '');
  }

  if (context?.analyticsData) {
    systemPrompt = systemPrompt.replace(
      '{{ANALYTICS_DATA}}',
      `\n## Analytics Data\n\n${context.analyticsData}\n`
    );
  } else {
    systemPrompt = systemPrompt.replace('{{ANALYTICS_DATA}}', '');
  }

  if (context?.companyInfo) {
    systemPrompt = systemPrompt.replace(
      '{{COMPANY_INFO}}',
      `\n## Company Information\n\n${context.companyInfo}\n`
    );
  } else {
    systemPrompt = systemPrompt.replace('{{COMPANY_INFO}}', '');
  }

  // Replace workflow state placeholder
  if (context?.state) {
    const stateDescription = formatWorkflowState(context.state);
    systemPrompt = systemPrompt.replace('{{WORKFLOW_STATE}}', stateDescription);
  } else {
    systemPrompt = systemPrompt.replace('{{WORKFLOW_STATE}}', 'No active workflow state');
  }

  // Replace any remaining placeholders with empty string
  systemPrompt = systemPrompt.replace(/\{\{[A-Z_]+\}\}/g, '');

  return systemPrompt;
}

/**
 * Format workflow state for inclusion in system prompt
 *
 * @param state - Workflow state
 * @returns Formatted state description with management instructions
 */
function formatWorkflowState(state: WorkflowState): string {
  let output = '## Active Workflow State\n\n';

  // Current state summary
  output += '### Current State\n\n';
  output += `- **Workflow:** ${state.workflowId}\n`;
  output += `- **Current Step:** ${state.step}\n`;
  output += `- **Progress:** ${state.completedSteps.length} steps completed\n`;

  if (state.completedSteps.length > 0) {
    output += `- **Completed Steps:** ${state.completedSteps.join(', ')}\n`;
  }

  if (state.data && Object.keys(state.data).length > 0) {
    output += `- **Collected Data:** ${Object.keys(state.data).length} fields (${Object.keys(state.data).join(', ')})\n`;
  }

  // Pending actions
  if (state.nextActions && state.nextActions.length > 0) {
    output += '\n### Pending Actions\n\n';
    output += `You have ${state.nextActions.length} suggested action(s) from the previous step:\n\n`;
    state.nextActions.forEach((action, i) => {
      output += `${i + 1}. **${action.label}** - ${action.description}\n`;
    });
  }

  // State management instructions
  output += '\n### State Management Instructions\n\n';
  output += '**Your Responsibilities:**\n\n';
  output += '1. **Track Progress** - Remember what has been completed and what remains\n';
  output += '2. **Collect Data** - Gather required information at each step before advancing\n';
  output += '3. **Suggest Actions** - After drafting content, suggest concrete next steps\n';
  output += '4. **Maintain Context** - Reference previously collected data to avoid repetition\n';
  output += "5. **Guide the User** - Clearly explain what step you're on and what comes next\n\n";

  output += '**State Transitions:**\n\n';
  output +=
    '- When the user provides information, acknowledge it and store it in the workflow state\n';
  output +=
    '- Before moving to the next step, ensure all required data for the current step is collected\n';
  output +=
    '- When suggesting actions, use the `<suggested_actions>` format shown in your capabilities\n';
  output +=
    '- If the user requests to skip a step or go back, acknowledge and adjust accordingly\n\n';

  output += '**Example Workflow Progression:**\n\n';
  output += '```\n';
  output += 'User: "I need to hire a senior engineer"\n';
  output += 'You: [gather_requirements] "Let me understand the role..."\n';
  output += '  → Ask about team, tech stack, experience level\n';
  output += '\n';
  output += 'User: [provides details]\n';
  output += 'You: [draft_documents] "Great! I\'ll create the job description..."\n';
  output += '  → Draft JD, interview guide, offer letter\n';
  output += '  → Suggest actions to save to Drive, post to careers page\n';
  output += '\n';
  output += 'User: [approves content]\n';
  output += 'You: [execute_actions] "I\'ve suggested 3 actions..."\n';
  output += '  → Present action buttons for user to execute\n';
  output += '```\n';

  return output;
}

/**
 * Get workflow capabilities that require specific integrations
 *
 * @param workflowId - Workflow ID
 * @returns Array of required integrations
 */
export function getWorkflowRequirements(workflowId: WorkflowId): string[] {
  const workflow = loadWorkflow(workflowId);
  if (!workflow) return [];

  const requirements = new Set<string>();

  for (const capability of workflow.capabilities) {
    if (capability.requirements) {
      capability.requirements.forEach((req) => requirements.add(req));
    }
  }

  return Array.from(requirements);
}

/**
 * Check if user has permissions for workflow
 *
 * @param workflowId - Workflow ID
 * @param userPermissions - User's permissions
 * @returns true if user can access workflow
 */
export function canAccessWorkflow(workflowId: WorkflowId, userPermissions: string[]): boolean {
  // For now, all workflows are accessible to authenticated users
  // In the future, this could check specific permissions
  return userPermissions.includes('chat:read');
}

/**
 * Get workflow by capability
 *
 * @param capabilityId - Capability ID
 * @returns Workflow ID or null
 */
export function getWorkflowByCapability(capabilityId: string): WorkflowId | null {
  for (const [workflowId, workflow] of Object.entries(WORKFLOWS)) {
    if (workflow.capabilities) {
      const hasCapability = workflow.capabilities.some((cap) => cap.id === capabilityId);
      if (hasCapability) {
        return workflowId as WorkflowId;
      }
    }
  }
  return null;
}

/**
 * Get all workflow IDs that have a specific requirement
 *
 * @param requirement - Requirement to check (e.g., 'employee_data', 'google_drive')
 * @returns Array of workflow IDs
 */
export function getWorkflowsByRequirement(requirement: string): WorkflowId[] {
  const workflowIds: WorkflowId[] = [];

  for (const [workflowId, workflow] of Object.entries(WORKFLOWS)) {
    if (workflow.capabilities) {
      const hasRequirement = workflow.capabilities.some((cap) =>
        cap.requirements?.includes(requirement)
      );
      if (hasRequirement) {
        workflowIds.push(workflowId as WorkflowId);
      }
    }
  }

  return workflowIds;
}

/**
 * Get workflow summary for user-facing display
 *
 * @param workflowId - Workflow ID
 * @returns Summary object or null
 */
export function getWorkflowSummary(workflowId: WorkflowId): {
  id: WorkflowId;
  name: string;
  description: string;
  capabilityCount: number;
  requiresIntegrations: boolean;
} | null {
  const workflow = loadWorkflow(workflowId);
  if (!workflow) return null;

  const requirements = getWorkflowRequirements(workflowId);

  return {
    id: workflow.id,
    name: workflow.name,
    description: workflow.description,
    capabilityCount: workflow.capabilities?.length || 0,
    requiresIntegrations: requirements.length > 0,
  };
}

/**
 * Get all workflow summaries
 *
 * @returns Array of workflow summaries
 */
export function getAllWorkflowSummaries(): Array<{
  id: WorkflowId;
  name: string;
  description: string;
  capabilityCount: number;
  requiresIntegrations: boolean;
}> {
  return Object.keys(WORKFLOWS)
    .filter((id) => id !== 'general') // Exclude general fallback
    .map((id) => getWorkflowSummary(id as WorkflowId))
    .filter(Boolean) as Array<{
    id: WorkflowId;
    name: string;
    description: string;
    capabilityCount: number;
    requiresIntegrations: boolean;
  }>;
}

/**
 * Build skills catalog for Claude's context (for prompt caching)
 *
 * This replaces the legacy skill catalog generation
 *
 * @returns Markdown-formatted workflow catalog
 */
export function buildWorkflowCatalog(): string {
  const summaries = getAllWorkflowSummaries();

  let catalog = '# Available HR Workflows\n\n';
  catalog += 'You have access to the following specialized workflows:\n\n';

  for (const summary of summaries) {
    const workflow = loadWorkflow(summary.id);
    if (!workflow) continue;

    catalog += `## ${summary.name}\n\n`;
    catalog += `${summary.description}\n\n`;

    if (workflow.capabilities && workflow.capabilities.length > 0) {
      catalog += '**Capabilities:**\n';
      for (const capability of workflow.capabilities) {
        catalog += `- **${capability.name}**: ${capability.description}\n`;
      }
      catalog += '\n';
    }
  }

  catalog += '---\n\n';
  catalog +=
    'When users ask questions, automatically detect which workflow is most appropriate and use its specialized knowledge.\n';

  return catalog;
}

/**
 * Legacy compatibility: Load skill by ID (maps to workflow)
 *
 * @param skillId - Legacy skill ID
 * @returns Workflow or null
 * @deprecated Use loadWorkflow() instead
 */
export function loadSkillById(skillId: string): Workflow | null {
  // This function is kept for backward compatibility
  // In practice, we should migrate all callers to use workflows
  const { getWorkflowForSkill } = require('./skill-mapping');
  const workflowId = getWorkflowForSkill(skillId);
  return workflowId ? loadWorkflow(workflowId) : null;
}
