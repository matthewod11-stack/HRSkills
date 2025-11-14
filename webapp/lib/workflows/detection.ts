/**
 * Workflow Detection Engine
 *
 * Automatically detects which workflow (if any) should handle a user's message.
 * Uses pattern matching with confidence scoring and context-based routing.
 *
 * Target: 95%+ accuracy with smart fallback to general chat when confidence is low.
 */

import type {
  WorkflowId,
  WorkflowMatch,
  DetectionContext,
  WorkflowTrigger,
  ConversationMessage,
} from './types';
import { WORKFLOWS, getWorkflow } from './workflows.config';

// Confidence thresholds
const MIN_SCORE_THRESHOLD = 7; // Minimum raw score to trigger workflow
const HIGH_CONFIDENCE_THRESHOLD = 90; // Very confident match
const CONTEXT_BOOST = 10; // Points added when context hints match
const CONVERSATION_HISTORY_BOOST = 15; // Points when workflow is already active
const CONFIDENCE_SCALE = 10; // Multiplier to convert score -> confidence

/**
 * Detect which workflow should handle this message
 *
 * @param context - Detection context including message and conversation history
 * @returns WorkflowMatch with confidence score and matched workflow
 */
export function detectWorkflow(context: DetectionContext): WorkflowMatch {
  const { message, conversationHistory, currentWorkflow } = context;

  // Normalize message for matching
  const normalizedMessage = message.toLowerCase().trim();
  const tokens = normalizedMessage.split(/\s+/);

  // If conversation is already in a workflow, boost that workflow's score
  const workflowBoost =
    currentWorkflow && currentWorkflow !== 'general' ? CONVERSATION_HISTORY_BOOST : 0;

  // Score all workflows
  const scores: Array<{
    workflowId: WorkflowId;
    score: number;
    matchedTriggers: WorkflowTrigger[];
    contextFactors: string[];
  }> = [];

  // Iterate through all workflows (skip 'general' fallback)
  for (const [workflowId, workflow] of Object.entries(WORKFLOWS)) {
    if (workflowId === 'general' || !workflow.triggers) continue;

    let score = 0;
    const matchedTriggers: WorkflowTrigger[] = [];
    const contextFactors: string[] = [];

    // Test each trigger pattern
    for (const trigger of workflow.triggers) {
      const match = trigger.pattern.test(normalizedMessage);

      if (match) {
        score += trigger.weight;
        matchedTriggers.push(trigger);

        // Check for context hints
        if (trigger.contextHints) {
          for (const hint of trigger.contextHints) {
            if (normalizedMessage.includes(hint.toLowerCase())) {
              score += CONTEXT_BOOST;
              contextFactors.push(`context_hint: ${hint}`);
              break; // Only count one context hint per trigger
            }
          }
        }

        // Track what matched
        contextFactors.push(`pattern: ${trigger.pattern.source}`);
      }
    }

    // Apply conversation history boost
    if (workflowId === currentWorkflow && score > 0) {
      score += workflowBoost;
      contextFactors.push('conversation_continuity');
    }

    if (
      workflow.keywords &&
      workflow.keywords.some((keyword) => tokens.includes(keyword.toLowerCase()))
    ) {
      score += CONTEXT_BOOST;
      contextFactors.push('keyword_boost');
    }

    // Only include workflows with at least one match
    if (score > 0) {
      scores.push({
        workflowId: workflowId as WorkflowId,
        score,
        matchedTriggers,
        contextFactors,
      });
    }
  }

  // Sort by score (highest first)
  scores.sort((a, b) => b.score - a.score);

  // If no matches or top score is below threshold, return general
  if (scores.length === 0 || scores[0].score < MIN_SCORE_THRESHOLD) {
    return {
      workflowId: 'general',
      confidence: 0,
      matchedTriggers: [],
      contextFactors:
        scores.length === 0 ? ['no_patterns_matched'] : ['confidence_below_threshold'],
    };
  }

  // Return top match
  const topMatch = scores[0];

  // Normalize confidence to 0-100 scale using multiplier
  const confidence = Math.min(Math.round(topMatch.score * CONFIDENCE_SCALE), 100);

  return {
    workflowId: topMatch.workflowId,
    confidence,
    matchedTriggers: topMatch.matchedTriggers,
    contextFactors: topMatch.contextFactors,
  };
}

/**
 * Context-based routing for multi-workflow capabilities
 *
 * Some capabilities (like document generation) span multiple workflows.
 * This function determines which workflow should handle based on document type.
 *
 * @param message - User message
 * @returns Capability-specific workflow ID or null
 */
export function detectDocumentType(message: string): {
  workflowId: WorkflowId;
  documentType: string;
} | null {
  const normalizedMessage = message.toLowerCase();

  // Map document types to workflows
  const documentMappings: Array<{
    patterns: RegExp[];
    workflowId: WorkflowId;
    documentType: string;
  }> = [
    // HIRING documents
    {
      patterns: [/offer\s+letter/, /employment\s+offer/, /offer\s+package/],
      workflowId: 'hiring',
      documentType: 'offer_letter',
    },
    {
      patterns: [/job\s+description/, /\bjd\b/, /job\s+posting/],
      workflowId: 'hiring',
      documentType: 'job_description',
    },

    // PERFORMANCE documents
    {
      patterns: [/\bpip\b/, /performance\s+improvement/, /improvement\s+plan/],
      workflowId: 'performance',
      documentType: 'pip',
    },
    {
      patterns: [/performance\s+review/, /review\s+document/, /evaluation/],
      workflowId: 'performance',
      documentType: 'performance_review',
    },

    // OFFBOARDING documents
    {
      patterns: [/termination\s+letter/, /separation\s+letter/, /exit\s+letter/],
      workflowId: 'offboarding',
      documentType: 'termination_letter',
    },
    {
      patterns: [/exit\s+checklist/, /offboarding\s+checklist/],
      workflowId: 'offboarding',
      documentType: 'exit_checklist',
    },

    // ONBOARDING documents
    {
      patterns: [/onboarding\s+plan/, /welcome\s+packet/, /new\s+hire\s+guide/],
      workflowId: 'onboarding',
      documentType: 'onboarding_plan',
    },

    // COMPLIANCE documents
    {
      patterns: [/policy/, /handbook/, /code\s+of\s+conduct/],
      workflowId: 'compliance',
      documentType: 'policy_document',
    },

    // COMPENSATION documents
    {
      patterns: [/compensation\s+proposal/, /salary\s+proposal/, /raise\s+proposal/],
      workflowId: 'compensation',
      documentType: 'compensation_proposal',
    },

    // EMPLOYEE_RELATIONS documents
    {
      patterns: [/investigation\s+report/, /er\s+case/, /complaint\s+report/],
      workflowId: 'employee_relations',
      documentType: 'investigation_report',
    },
  ];

  // Find first matching document type
  for (const mapping of documentMappings) {
    for (const pattern of mapping.patterns) {
      if (pattern.test(normalizedMessage)) {
        return {
          workflowId: mapping.workflowId,
          documentType: mapping.documentType,
        };
      }
    }
  }

  return null;
}

/**
 * Detect if a message is asking about a specific employee
 *
 * @param message - User message
 * @returns Employee name or null
 */
export function detectEmployeeMention(message: string): string | null {
  const directMatch = message.match(/([A-Z][a-z]+\s+[A-Z][a-z]+)/);
  if (directMatch) {
    const candidate = directMatch[1];
    return candidate;
  }
  return null;
}

/**
 * Detect department mention
 *
 * @param message - User message
 * @returns Department name or null
 */
export function detectDepartmentMention(message: string): string | null {
  const normalizedMessage = message.toLowerCase();

  const departments = [
    'engineering',
    'sales',
    'marketing',
    'product',
    'finance',
    'hr',
    'operations',
    'customer success',
    'design',
    'legal',
    'it',
    'admin',
  ];

  for (const dept of departments) {
    if (normalizedMessage.includes(dept)) {
      return dept.charAt(0).toUpperCase() + dept.slice(1);
    }
  }

  return null;
}

/**
 * Detect if user wants to take an action (vs. just get information)
 *
 * @param message - User message
 * @returns true if action-oriented
 */
export function isActionIntent(message: string): boolean {
  const actionVerbs = [
    /create/i,
    /make/i,
    /generate/i,
    /draft/i,
    /write/i,
    /send/i,
    /schedule/i,
    /set\s+up/i,
    /build/i,
    /design/i,
    /help\s+me\s+(?:create|make|draft|write)/i,
  ];

  return actionVerbs.some((pattern) => pattern.test(message));
}

/**
 * Detect if user is asking for analysis/insights (vs. raw data)
 *
 * @param message - User message
 * @returns true if analysis-oriented
 */
export function isAnalysisIntent(message: string): boolean {
  const analysisPatterns = [
    /why/i,
    /analyze/i,
    /explain/i,
    /insight/i,
    /trend/i,
    /pattern/i,
    /what.*happening/i,
    /what.*changed/i,
    /compare/i,
    /how.*different/i,
  ];

  return analysisPatterns.some((pattern) => pattern.test(message));
}

/**
 * Build detection context from conversation
 *
 * @param message - Current user message
 * @param conversationHistory - Previous messages in conversation
 * @param currentWorkflow - Currently active workflow (if any)
 * @returns DetectionContext object
 */
export function buildDetectionContext(
  message: string,
  conversationHistory?: ConversationMessage[],
  currentWorkflow?: WorkflowId
): DetectionContext {
  return {
    message,
    conversationHistory,
    currentWorkflow,
  };
}

/**
 * Get workflow priority score (for debugging/logging)
 *
 * Helper to understand why a particular workflow was chosen
 */
export function getWorkflowScores(message: string): Array<{
  workflowId: WorkflowId;
  score: number;
  confidence: number;
}> {
  const context = buildDetectionContext(message);
  const result = detectWorkflow(context);

  // This is a simplified version - in production you'd want the full scoring breakdown
  return [
    {
      workflowId: result.workflowId,
      score: result.confidence,
      confidence: result.confidence,
    },
  ];
}

/**
 * Validate workflow detection with test cases
 *
 * Used for unit testing and validation
 */
export function validateDetection(
  testCases: Array<{
    message: string;
    expectedWorkflow: WorkflowId;
  }>
): {
  accuracy: number;
  failures: Array<{
    message: string;
    expected: WorkflowId;
    actual: WorkflowId;
    confidence: number;
  }>;
} {
  let correct = 0;
  const failures: Array<{
    message: string;
    expected: WorkflowId;
    actual: WorkflowId;
    confidence: number;
  }> = [];

  for (const testCase of testCases) {
    const context = buildDetectionContext(testCase.message);
    const result = detectWorkflow(context);

    if (result.workflowId === testCase.expectedWorkflow) {
      correct++;
    } else {
      failures.push({
        message: testCase.message,
        expected: testCase.expectedWorkflow,
        actual: result.workflowId,
        confidence: result.confidence,
      });
    }
  }

  const accuracy = (correct / testCases.length) * 100;

  return { accuracy, failures };
}
