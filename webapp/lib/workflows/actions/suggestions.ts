/**
 * Action Suggestion System
 *
 * Generates smart action suggestions based on conversation context, workflow, and user intent.
 * This is used by the chat endpoint to suggest follow-up actions after AI responses.
 */

import type {
  BaseAction,
  CreateDocumentPayload,
  SendEmailPayload,
  SendSlackMessagePayload,
} from './types';
import type { WorkflowId } from '../types';

// ============================================================================
// Suggestion Context
// ============================================================================

export interface SuggestionContext {
  workflowId: WorkflowId;
  message: string;
  aiResponse: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  extractedData?: Record<string, any>;
  userId: string;
  userPermissions: string[];
}

// ============================================================================
// Action Suggestion Rules
// ============================================================================

interface SuggestionRule {
  workflowId: WorkflowId;
  triggers: RegExp[];
  generator: (context: SuggestionContext) => Partial<BaseAction>[];
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Action suggestion rules by workflow
 */
const SUGGESTION_RULES: SuggestionRule[] = [
  // ========================================================================
  // HIRING WORKFLOW
  // ========================================================================
  {
    workflowId: 'hiring',
    triggers: [/job description|jd/i, /position|role|opening/i],
    generator: (ctx) => {
      const actions: Partial<BaseAction>[] = [];

      // If JD is mentioned, suggest saving to Drive + posting to Slack
      if (/job description|jd/i.test(ctx.message) || /job description|jd/i.test(ctx.aiResponse)) {
        actions.push({
          type: 'create_document',
          label: 'Save job description to Google Drive',
          description: 'Save this job description to the Hiring folder in Google Drive',
          priority: 'high',
          requiresApproval: false,
          payload: {
            documentType: 'job_description',
            title: 'Job Description - [Extract from response]',
            content: ctx.aiResponse,
            format: 'markdown',
            destination: {
              type: 'google_drive',
              folderPath: '/Hiring/Job Descriptions',
            },
          } as CreateDocumentPayload,
        });

        actions.push({
          type: 'send_slack_message',
          label: 'Post to #hiring channel',
          description: 'Share this JD with the hiring team on Slack',
          priority: 'medium',
          requiresApproval: false,
          payload: {
            channel: 'hiring',
            text: `New job description ready: ${extractTitle(ctx.aiResponse)}`,
          } as SendSlackMessagePayload,
        });
      }

      // If candidate mentioned, suggest scheduling interview
      if (/candidate|applicant|interview/i.test(ctx.message)) {
        actions.push({
          type: 'create_calendar_event',
          label: 'Schedule interview',
          description: 'Set up an interview with this candidate',
          priority: 'medium',
          requiresApproval: true,
          payload: {
            title: 'Interview - [Candidate Name]',
            description: 'Interview for [Position]',
            attendees: [],
            conferenceData: {
              createRequest: true,
            },
          },
        });
      }

      return actions;
    },
  },

  // ========================================================================
  // HIRING - Offer Letters
  // ========================================================================
  {
    workflowId: 'hiring',
    triggers: [/offer letter|offer/i, /compensation|salary|package/i],
    generator: (ctx) => {
      const actions: Partial<BaseAction>[] = [];

      if (/offer/i.test(ctx.message) || /offer/i.test(ctx.aiResponse)) {
        actions.push({
          type: 'create_document',
          label: 'Generate offer letter PDF',
          description: 'Create a formal offer letter document',
          priority: 'high',
          requiresApproval: true,
          payload: {
            documentType: 'offer_letter',
            title: 'Offer Letter - [Candidate Name]',
            content: ctx.aiResponse,
            format: 'html',
            destination: {
              type: 'google_drive',
              folderPath: '/Hiring/Offer Letters',
            },
          } as CreateDocumentPayload,
        });

        actions.push({
          type: 'send_email',
          label: 'Email offer letter to candidate',
          description: 'Send the offer letter to the candidate',
          priority: 'high',
          requiresApproval: true,
          payload: {
            to: [],
            subject: 'Job Offer - [Position]',
            body: ctx.aiResponse,
            format: 'html',
          } as SendEmailPayload,
        });
      }

      return actions;
    },
  },

  // ========================================================================
  // PERFORMANCE WORKFLOW
  // ========================================================================
  {
    workflowId: 'performance',
    triggers: [/review|feedback|evaluation/i, /performance|rating/i],
    generator: (ctx) => {
      const actions: Partial<BaseAction>[] = [];

      // Performance review document
      if (/review/i.test(ctx.message)) {
        actions.push({
          type: 'create_document',
          label: 'Save performance review',
          description: 'Save this review to Google Drive and employee record',
          priority: 'high',
          requiresApproval: false,
          payload: {
            documentType: 'performance_review',
            title: 'Performance Review - [Employee Name]',
            content: ctx.aiResponse,
            format: 'markdown',
            destination: {
              type: 'google_drive',
              folderPath: '/Performance Reviews',
            },
          } as CreateDocumentPayload,
        });

        actions.push({
          type: 'send_email',
          label: 'Email review to employee',
          description: 'Send performance review to employee for acknowledgment',
          priority: 'medium',
          requiresApproval: true,
          payload: {
            to: [],
            subject: 'Performance Review - [Period]',
            body: 'Please see your performance review attached.',
            format: 'html',
          } as SendEmailPayload,
        });
      }

      // PIP (Performance Improvement Plan)
      if (/pip|improvement plan|underperform/i.test(ctx.message) || /pip/i.test(ctx.aiResponse)) {
        actions.push({
          type: 'create_document',
          label: 'Create PIP document',
          description: 'Generate formal Performance Improvement Plan',
          priority: 'high',
          requiresApproval: true,
          payload: {
            documentType: 'pip',
            title: 'PIP - [Employee Name]',
            content: ctx.aiResponse,
            format: 'html',
            destination: {
              type: 'google_drive',
              folderPath: '/Performance/PIPs',
            },
          } as CreateDocumentPayload,
        });

        actions.push({
          type: 'create_calendar_event',
          label: 'Schedule PIP kickoff meeting',
          description: 'Set up meeting to discuss improvement plan',
          priority: 'high',
          requiresApproval: true,
          payload: {
            title: 'PIP Kickoff - [Employee Name]',
            description: 'Discuss performance improvement plan and expectations',
            attendees: [],
          },
        });
      }

      return actions;
    },
  },

  // ========================================================================
  // ANALYTICS WORKFLOW
  // ========================================================================
  {
    workflowId: 'analytics',
    triggers: [/headcount|turnover|attrition/i, /report|dashboard|metrics/i],
    generator: (ctx) => {
      const actions: Partial<BaseAction>[] = [];

      // Export to Google Sheets
      if (/report|export|share/i.test(ctx.message)) {
        actions.push({
          type: 'api_call',
          label: 'Export to Google Sheets',
          description: 'Export this data to a Google Sheet',
          priority: 'medium',
          requiresApproval: false,
          payload: {
            url: '/api/analytics/export',
            method: 'POST',
            body: {
              format: 'sheets',
              metric: extractMetric(ctx.message),
            },
          },
        });
      }

      // Schedule dashboard email
      if (/dashboard|monitor|track/i.test(ctx.message)) {
        actions.push({
          type: 'send_email',
          label: 'Schedule weekly dashboard email',
          description: 'Get this dashboard emailed to you every week',
          priority: 'low',
          requiresApproval: false,
          payload: {
            to: [],
            subject: 'Weekly HR Dashboard',
            body: 'Your weekly HR metrics dashboard',
            format: 'html',
          } as SendEmailPayload,
        });
      }

      return actions;
    },
  },

  // ========================================================================
  // ONBOARDING WORKFLOW
  // ========================================================================
  {
    workflowId: 'onboarding',
    triggers: [/onboarding|new hire|first day/i],
    generator: (ctx) => {
      const actions: Partial<BaseAction>[] = [];

      actions.push({
        type: 'create_document',
        label: 'Create onboarding checklist',
        description: 'Generate comprehensive onboarding checklist',
        priority: 'high',
        requiresApproval: false,
        payload: {
          documentType: 'onboarding_checklist',
          title: 'Onboarding Checklist - [Employee Name]',
          content: ctx.aiResponse,
          format: 'markdown',
          destination: {
            type: 'google_drive',
            folderPath: '/Onboarding',
          },
        } as CreateDocumentPayload,
      });

      actions.push({
        type: 'send_slack_message',
        label: 'Create onboarding Slack channel',
        description: 'Set up dedicated channel for new hire',
        priority: 'medium',
        requiresApproval: false,
        payload: {
          createChannel: {
            name: 'onboarding-[employee-name]',
            isPrivate: false,
            members: [],
          },
          text: 'Welcome channel created for new hire onboarding!',
        } as SendSlackMessagePayload,
      });

      actions.push({
        type: 'send_email',
        label: 'Send welcome email',
        description: 'Email welcome package to new hire',
        priority: 'high',
        requiresApproval: false,
        payload: {
          to: [],
          subject: 'Welcome to [Company]!',
          body: "Welcome aboard! Here's everything you need to get started.",
          format: 'html',
        } as SendEmailPayload,
      });

      return actions;
    },
  },

  // ========================================================================
  // OFFBOARDING WORKFLOW
  // ========================================================================
  {
    workflowId: 'offboarding',
    triggers: [/offboarding|exit|termination|resignation/i],
    generator: (ctx) => {
      const actions: Partial<BaseAction>[] = [];

      // Termination letter
      if (/termination|terminate/i.test(ctx.message)) {
        actions.push({
          type: 'create_document',
          label: 'Generate termination letter',
          description: 'Create formal termination documentation',
          priority: 'high',
          requiresApproval: true,
          payload: {
            documentType: 'termination_letter',
            title: 'Termination Letter - [Employee Name]',
            content: ctx.aiResponse,
            format: 'html',
            destination: {
              type: 'google_drive',
              folderPath: '/Offboarding/Terminations',
            },
          } as CreateDocumentPayload,
        });
      }

      // Exit interview
      actions.push({
        type: 'create_calendar_event',
        label: 'Schedule exit interview',
        description: 'Set up exit interview meeting',
        priority: 'medium',
        requiresApproval: false,
        payload: {
          title: 'Exit Interview - [Employee Name]',
          description: 'Exit interview and feedback session',
          attendees: [],
        },
      });

      // Offboarding checklist
      actions.push({
        type: 'create_document',
        label: 'Create offboarding checklist',
        description: 'Generate comprehensive offboarding task list',
        priority: 'high',
        requiresApproval: false,
        payload: {
          documentType: 'custom',
          title: 'Offboarding Checklist - [Employee Name]',
          content: ctx.aiResponse,
          format: 'markdown',
        } as CreateDocumentPayload,
      });

      return actions;
    },
  },

  // ========================================================================
  // COMPENSATION WORKFLOW
  // ========================================================================
  {
    workflowId: 'compensation',
    triggers: [/salary|compensation|raise|promotion/i, /equity|bonus|benefits/i],
    generator: (ctx) => {
      const actions: Partial<BaseAction>[] = [];

      // Comp adjustment letter
      if (/raise|promotion|adjustment/i.test(ctx.message)) {
        actions.push({
          type: 'create_document',
          label: 'Generate compensation change letter',
          description: 'Create formal compensation adjustment documentation',
          priority: 'high',
          requiresApproval: true,
          payload: {
            documentType: 'custom',
            title: 'Compensation Change - [Employee Name]',
            content: ctx.aiResponse,
            format: 'html',
          } as CreateDocumentPayload,
        });

        actions.push({
          type: 'update_database',
          label: 'Update employee compensation',
          description: 'Update compensation in employee database',
          priority: 'high',
          requiresApproval: true,
          payload: {
            table: 'employees',
            operation: 'update',
            data: {
              // Will be populated from context
            },
            where: {},
          },
        });
      }

      return actions;
    },
  },

  // ========================================================================
  // EMPLOYEE_RELATIONS WORKFLOW
  // ========================================================================
  {
    workflowId: 'employee_relations',
    triggers: [/complaint|grievance|investigation/i, /accommodation|ada|disability/i],
    generator: (ctx) => {
      const actions: Partial<BaseAction>[] = [];

      // Investigation documentation
      if (/investigation|complaint/i.test(ctx.message)) {
        actions.push({
          type: 'create_document',
          label: 'Create investigation file',
          description: 'Start formal investigation documentation',
          priority: 'high',
          requiresApproval: true,
          payload: {
            documentType: 'custom',
            title: 'Investigation - [Case Number]',
            content: ctx.aiResponse,
            format: 'html',
            destination: {
              type: 'google_drive',
              folderPath: '/Employee Relations/Investigations',
            },
          } as CreateDocumentPayload,
        });
      }

      return actions;
    },
  },
];

// ============================================================================
// Action Suggestion Engine
// ============================================================================

/**
 * Generate action suggestions based on context
 */
export function suggestActions(context: SuggestionContext): BaseAction[] {
  const suggestions: BaseAction[] = [];

  // Find matching rules for this workflow
  const matchingRules = SUGGESTION_RULES.filter((rule) => {
    if (rule.workflowId !== context.workflowId && rule.workflowId !== 'general') {
      return false;
    }

    // Check if any trigger matches
    return rule.triggers.some(
      (trigger) => trigger.test(context.message) || trigger.test(context.aiResponse)
    );
  });

  // Generate suggestions from matching rules
  for (const rule of matchingRules) {
    try {
      const partialActions = rule.generator(context);

      for (const partial of partialActions) {
        // Convert partial action to full BaseAction
        const action: BaseAction = {
          id: generateActionId(),
          type: partial.type!,
          label: partial.label!,
          description: partial.description!,
          priority: partial.priority || 'medium',
          requiresApproval: partial.requiresApproval ?? true,
          requiredPermissions: partial.requiredPermissions || getRequiredPermissions(partial.type!),
          status: 'pending',
          createdAt: new Date().toISOString(),
          payload: partial.payload || {},
          metadata: {
            workflowId: context.workflowId,
            userId: context.userId,
            generatedBy: 'suggestion-engine',
            ...partial.metadata,
          },
        };

        // Check if user has required permissions
        if (hasRequiredPermissions(action, context.userPermissions)) {
          suggestions.push(action);
        }
      }
    } catch (error) {
      console.error(`Failed to generate suggestions for rule:`, error);
    }
  }

  // Sort by priority
  return sortByPriority(suggestions);
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateActionId(): string {
  return `action_${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

function getRequiredPermissions(actionType: string): string[] {
  const permissionMap: Record<string, string[]> = {
    create_document: ['chat', 'uploadData'],
    send_email: ['chat', 'takeActions'],
    send_slack_message: ['chat', 'takeActions'],
    create_calendar_event: ['chat', 'takeActions'],
    update_database: ['editEmployees'],
    api_call: ['chat'],
    webhook: ['chat', 'takeActions'],
  };

  return permissionMap[actionType] || ['chat'];
}

function hasRequiredPermissions(action: BaseAction, userPermissions: string[]): boolean {
  if (!action.requiredPermissions || action.requiredPermissions.length === 0) {
    return true;
  }

  return action.requiredPermissions.every((required) => userPermissions.includes(required));
}

function sortByPriority(actions: BaseAction[]): BaseAction[] {
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };

  return actions.sort((a, b) => {
    const aPriority = priorityOrder[a.priority || 'medium'];
    const bPriority = priorityOrder[b.priority || 'medium'];
    return aPriority - bPriority;
  });
}

function extractTitle(text: string): string {
  // Try to extract a title from markdown headers
  const match = text.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1];
  }

  // Try to extract from "Position:" or "Title:" lines
  const posMatch = text.match(/(?:Position|Title|Role):\s*(.+)/i);
  if (posMatch) {
    return posMatch[1].trim();
  }

  // Default
  return 'Untitled';
}

function extractMetric(message: string): string {
  if (/headcount/i.test(message)) return 'headcount';
  if (/turnover|attrition/i.test(message)) return 'attrition';
  if (/diversity/i.test(message)) return 'diversity';
  if (/performance/i.test(message)) return 'performance';
  if (/engagement/i.test(message)) return 'engagement';
  return 'general';
}

// ============================================================================
// Advanced Suggestion Strategies
// ============================================================================

/**
 * Generate contextual suggestions based on extracted entities
 */
export function generateContextualSuggestions(
  context: SuggestionContext,
  entities?: {
    employees?: string[];
    documents?: string[];
    dates?: string[];
    emails?: string[];
  }
): BaseAction[] {
  const suggestions: BaseAction[] = [];

  // If employees mentioned, suggest relevant actions
  if (entities?.employees && entities.employees.length > 0) {
    suggestions.push({
      id: generateActionId(),
      type: 'api_call',
      label: 'View employee details',
      description: `See full details for ${entities.employees.join(', ')}`,
      priority: 'low',
      requiresApproval: false,
      requiredPermissions: ['viewEmployees'],
      status: 'pending',
      createdAt: new Date().toISOString(),
      payload: {
        url: `/api/employees/${entities.employees[0]}`,
        method: 'GET',
      },
    });
  }

  // If documents mentioned, suggest opening them
  if (entities?.documents && entities.documents.length > 0) {
    suggestions.push({
      id: generateActionId(),
      type: 'api_call',
      label: 'Open document',
      description: `View ${entities.documents[0]}`,
      priority: 'low',
      requiresApproval: false,
      requiredPermissions: ['chat'],
      status: 'pending',
      createdAt: new Date().toISOString(),
      payload: {
        url: `/api/documents/${entities.documents[0]}`,
        method: 'GET',
      },
    });
  }

  return suggestions;
}

/**
 * Generate follow-up question suggestions
 */
export function suggestFollowUpQuestions(context: SuggestionContext): string[] {
  const questions: string[] = [];

  switch (context.workflowId) {
    case 'hiring':
      questions.push(
        'Create an interview guide for this position',
        'Draft an offer letter for a candidate',
        'Show me hiring pipeline metrics'
      );
      break;

    case 'performance':
      questions.push(
        'Generate a performance review template',
        'Show me top performers',
        'Analyze performance trends'
      );
      break;

    case 'analytics':
      questions.push(
        'Show me department breakdown',
        'Compare to last quarter',
        'Export to Google Sheets'
      );
      break;

    case 'onboarding':
      questions.push(
        'Create onboarding schedule',
        'Generate welcome email',
        'Set up IT access requests'
      );
      break;

    default:
      questions.push('Tell me more', 'Show me related data', 'What else should I know?');
  }

  return questions;
}
