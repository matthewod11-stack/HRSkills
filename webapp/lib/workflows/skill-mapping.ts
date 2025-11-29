/**
 * Legacy Skill to Workflow Mapping
 *
 * Maps the 27 original skills to the new 8 workflows for backward compatibility.
 * This allows existing conversations, bookmarks, or references to old skill IDs
 * to continue working seamlessly.
 */

import type { SkillToWorkflowMapping, WorkflowId } from './types';

/**
 * Complete mapping of legacy skill IDs to new workflow IDs
 */
export const SKILL_TO_WORKFLOW_MAP: Record<string, SkillToWorkflowMapping> = {
  // ========================================================================
  // HIRING WORKFLOW
  // ========================================================================

  'job-description-writer': {
    skillId: 'job-description-writer',
    workflowId: 'hiring',
    capability: 'job_descriptions',
    notes: 'Primary skill for job description creation',
  },

  'interview-guide-creator': {
    skillId: 'interview-guide-creator',
    workflowId: 'hiring',
    capability: 'interview_guides',
    notes: 'Creates structured interview guides and scorecards',
  },

  'interview-hiring': {
    skillId: 'interview-hiring',
    workflowId: 'hiring',
    capability: 'interview_guides',
    notes: 'Duplicate of interview-guide-creator',
  },

  'headcount-planner': {
    skillId: 'headcount-planner',
    workflowId: 'hiring',
    capability: 'headcount_planning',
    notes: 'Workforce planning for hiring needs',
  },

  // ========================================================================
  // PERFORMANCE WORKFLOW
  // ========================================================================

  'performance-insights-analyst': {
    skillId: 'performance-insights-analyst',
    workflowId: 'performance',
    capability: 'performance_reviews',
    notes: 'Analyzes performance data and reviews',
  },

  'pip-builder-monitor': {
    skillId: 'pip-builder-monitor',
    workflowId: 'performance',
    capability: 'pip_creation',
    notes: 'Creates and monitors performance improvement plans',
  },

  'one-on-one-guide': {
    skillId: 'one-on-one-guide',
    workflowId: 'performance',
    capability: 'one_on_ones',
    notes: '1:1 meeting frameworks and agendas',
  },

  'manager-effectiveness-coach': {
    skillId: 'manager-effectiveness-coach',
    workflowId: 'performance',
    capability: 'coaching_plans',
    notes: 'Manager training and coaching programs',
  },

  'recognition-rewards-manager': {
    skillId: 'recognition-rewards-manager',
    workflowId: 'performance',
    capability: 'recognition_programs',
    notes: 'Employee recognition and rewards programs',
  },

  'skills-gap-analyzer': {
    skillId: 'skills-gap-analyzer',
    workflowId: 'performance',
    capability: 'coaching_plans',
    notes: 'Maps to performance for development plans; also used in hiring',
  },

  'career-path-planner': {
    skillId: 'career-path-planner',
    workflowId: 'performance',
    capability: 'coaching_plans',
    notes: 'Career development and progression planning',
  },

  'lnd-program-designer': {
    skillId: 'lnd-program-designer',
    workflowId: 'performance',
    capability: 'coaching_plans',
    notes: 'Learning & development program design',
  },

  // ========================================================================
  // ANALYTICS WORKFLOW
  // ========================================================================

  'hr-metrics-analyst': {
    skillId: 'hr-metrics-analyst',
    workflowId: 'analytics',
    capability: 'hr_metrics',
    notes: 'Primary HR metrics and analytics skill',
  },

  'survey-analyzer-action-planner': {
    skillId: 'survey-analyzer-action-planner',
    workflowId: 'analytics',
    capability: 'survey_analysis',
    notes: 'Engagement survey analysis and action planning',
  },

  // ========================================================================
  // ONBOARDING WORKFLOW
  // ========================================================================

  'onboarding-program-builder': {
    skillId: 'onboarding-program-builder',
    workflowId: 'onboarding',
    capability: 'onboarding_plans',
    notes: 'Comprehensive onboarding program creation',
  },

  // ========================================================================
  // OFFBOARDING WORKFLOW
  // ========================================================================

  'offboarding-exit-builder': {
    skillId: 'offboarding-exit-builder',
    workflowId: 'offboarding',
    capability: 'exit_processes',
    notes: 'Exit processes and knowledge transfer',
  },

  'workforce-reduction-planner': {
    skillId: 'workforce-reduction-planner',
    workflowId: 'offboarding',
    capability: 'rif_planning',
    notes: 'RIF and layoff planning with WARN Act compliance',
  },

  'corporate-communications-strategist': {
    skillId: 'corporate-communications-strategist',
    workflowId: 'offboarding',
    notes: 'RIF announcements and crisis communications (primarily offboarding)',
  },

  // ========================================================================
  // COMPENSATION WORKFLOW
  // ========================================================================

  'comp-band-designer': {
    skillId: 'comp-band-designer',
    workflowId: 'compensation',
    capability: 'salary_bands',
    notes: 'Salary band and compensation structure design',
  },

  'compensation-review-cycle-manager': {
    skillId: 'compensation-review-cycle-manager',
    workflowId: 'compensation',
    capability: 'merit_cycles',
    notes: 'Merit review and raise cycles',
  },

  // ========================================================================
  // EMPLOYEE RELATIONS WORKFLOW
  // ========================================================================

  'employee-relations-case-manager': {
    skillId: 'employee-relations-case-manager',
    workflowId: 'employee_relations',
    capability: 'er_case_management',
    notes: 'ER case management and investigations',
  },

  'benefits-leave-coordinator': {
    skillId: 'benefits-leave-coordinator',
    workflowId: 'employee_relations',
    capability: 'leave_administration',
    notes: 'FMLA, parental leave, and benefits coordination',
  },

  'policy-lifecycle-manager': {
    skillId: 'policy-lifecycle-manager',
    workflowId: 'employee_relations',
    capability: 'policy_management',
    notes: 'Employee handbook and policy management',
  },

  // ========================================================================
  // COMPLIANCE WORKFLOW
  // ========================================================================

  'dei-program-designer': {
    skillId: 'dei-program-designer',
    workflowId: 'compliance',
    capability: 'eeo_reporting',
    notes: 'DEI programs, pay equity, EEO compliance (spans multiple workflows)',
  },

  // ========================================================================
  // MULTI-WORKFLOW DOCUMENT GENERATION
  // ========================================================================

  'hr-document-generator': {
    skillId: 'hr-document-generator',
    workflowId: 'hiring', // Default, but context-based routing applies
    notes:
      'Routes to appropriate workflow based on document type: offer letter→hiring, PIP→performance, termination→offboarding',
  },

  // ========================================================================
  // ORGANIZATIONAL DESIGN (GENERAL)
  // ========================================================================

  'org-design-consultant': {
    skillId: 'org-design-consultant',
    workflowId: 'general',
    notes: "Org charts and reporting structures - doesn't fit cleanly into a single workflow",
  },

  // ========================================================================
  // INTEGRATIONS (NOT SKILLS)
  // ========================================================================

  'rippling-integration': {
    skillId: 'rippling-integration',
    workflowId: 'general',
    notes: 'Integration, not a skill - kept for reference only',
  },
};

/**
 * Get workflow ID for a legacy skill ID
 *
 * @param skillId - Legacy skill ID
 * @returns Workflow ID or null if not found
 */
export function getWorkflowForSkill(skillId: string): WorkflowId | null {
  const mapping = SKILL_TO_WORKFLOW_MAP[skillId];
  return mapping ? mapping.workflowId : null;
}

/**
 * Get all skills mapped to a specific workflow
 *
 * @param workflowId - Workflow ID
 * @returns Array of skill IDs that map to this workflow
 */
export function getSkillsForWorkflow(workflowId: WorkflowId): string[] {
  return Object.entries(SKILL_TO_WORKFLOW_MAP)
    .filter(([_, mapping]) => mapping.workflowId === workflowId)
    .map(([skillId, _]) => skillId);
}

/**
 * Get capability for a legacy skill ID
 *
 * @param skillId - Legacy skill ID
 * @returns Capability ID or null
 */
export function getCapabilityForSkill(skillId: string): string | null {
  const mapping = SKILL_TO_WORKFLOW_MAP[skillId];
  return mapping?.capability || null;
}

/**
 * Check if a skill ID is valid (exists in mapping)
 *
 * @param skillId - Legacy skill ID
 * @returns true if valid skill ID
 */
export function isValidSkillId(skillId: string): boolean {
  return skillId in SKILL_TO_WORKFLOW_MAP;
}

/**
 * Get all skill IDs
 *
 * @returns Array of all legacy skill IDs
 */
export function getAllSkillIds(): string[] {
  return Object.keys(SKILL_TO_WORKFLOW_MAP);
}

/**
 * Get migration summary for a skill
 *
 * @param skillId - Legacy skill ID
 * @returns Migration information or null
 */
export function getSkillMigrationInfo(skillId: string): SkillToWorkflowMapping | null {
  return SKILL_TO_WORKFLOW_MAP[skillId] || null;
}

/**
 * Get workflow statistics
 *
 * @returns Statistics about skill-to-workflow mapping
 */
export function getWorkflowMappingStats(): {
  totalSkills: number;
  skillsByWorkflow: Record<WorkflowId, number>;
  multiWorkflowSkills: string[];
} {
  const totalSkills = Object.keys(SKILL_TO_WORKFLOW_MAP).length;

  const skillsByWorkflow: Record<string, number> = {};
  for (const mapping of Object.values(SKILL_TO_WORKFLOW_MAP)) {
    const workflowId = mapping.workflowId;
    skillsByWorkflow[workflowId] = (skillsByWorkflow[workflowId] || 0) + 1;
  }

  // Skills that could map to multiple workflows (based on notes)
  const multiWorkflowSkills = Object.entries(SKILL_TO_WORKFLOW_MAP)
    .filter(([_, mapping]) => mapping.notes?.includes('also') || mapping.notes?.includes('spans'))
    .map(([skillId, _]) => skillId);

  return {
    totalSkills,
    skillsByWorkflow: skillsByWorkflow as Record<WorkflowId, number>,
    multiWorkflowSkills,
  };
}
