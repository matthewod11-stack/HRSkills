import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  loadSkill,
  loadSkillWithDriveTemplates,
  buildSkillSystemPrompt,
  generateCacheableSkillsCatalog,
} from '@/lib/skills';
import { readMetadata, loadDataFileByType } from '@/lib/analytics/utils';
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware';
import { generateEmployeeContext, type Employee } from '@/lib/employee-context';
import { trackMetric } from '@/lib/performance-monitor';
import { handleApiError, createSuccessResponse, validateRequiredFields } from '@/lib/api-helpers';
import { createMessage, extractTextContent } from '@/lib/api-helpers/anthropic-client';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';
import type { Anthropic } from '@/lib/api-helpers/anthropic-client';
import { deidentifyText, DLP_INFO_TYPE_PRESETS } from '@/lib/security/dlp-service';
import { detectWorkflow, buildDetectionContext } from '@/lib/workflows/detection';
import {
  loadWorkflow,
  buildWorkflowSystemPrompt,
  buildWorkflowCatalog,
} from '@/lib/workflows/loader';
import type { WorkflowId, WorkflowState } from '@/lib/workflows/types';
import {
  determineStateMode,
  loadConversationState,
  saveConversationState,
  initializeWorkflowState,
  createStateSnapshot,
} from '@/lib/workflows/state-machine/persistence';
import { createStateMachine, loadStateMachine } from '@/lib/workflows/state-machine/machine';
import type { WorkflowStateMachine } from '@/lib/workflows/state-machine/machine';
import { checkQuota, trackQuotaUsage, getAnthropicKey } from '@/lib/ai/shared-key-manager';
import { suggestActions, suggestFollowUpQuestions } from '@/lib/workflows/actions/suggestions';
import type { SuggestionContext } from '@/lib/workflows/actions/suggestions';
import { detectContext } from '@/lib/workflows/context-detector';
import type { ContextPanelData } from '@/components/custom/ContextPanel';
import { fetchBestTemplateForDocumentType } from '@/lib/templates-drive';
import { env } from '@/env.mjs';

// In-memory response cache (OPTIMIZATION: saves $1,350/month on repeated queries)
interface CachedResponse {
  reply: string;
  detectedWorkflow?: WorkflowId;
  workflowConfidence?: number;
  contextPanel?: ContextPanelData | null;
  timestamp: number;
  dataHash: string;
}

const responseCache = new Map<string, CachedResponse>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Limit cache size

// Clean old cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      responseCache.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

// Dynamic max_tokens estimation based on query type (OPTIMIZATION: saves $100/month)
function estimateMaxTokens(message: string): number {
  const messageLower = message.toLowerCase();

  // Short answers - lists, counts, simple questions
  if (/^(show|list|count|what is|who is|how many)/i.test(message)) {
    return 512;
  }

  // Medium answers - analysis, comparisons, explanations
  if (/analyze|compare|explain|recommend|suggest|review/i.test(messageLower)) {
    return 2048;
  }

  // Long-form content - writing, drafting, creating documents
  if (/write|draft|create|generate|compose|prepare/i.test(messageLower)) {
    return 4096;
  }

  // Default for unknown query types
  return 1024;
}

// Legacy function - now deprecated in favor of workflow detection
// Kept for backward compatibility during migration period
function detectSkill(message: string): string {
  console.warn('[DEPRECATED] detectSkill() is deprecated. Use detectWorkflow() instead.');

  // Map to workflow detection as fallback
  const context = buildDetectionContext(message);
  const workflowMatch = detectWorkflow(context);

  // Return workflow ID as "skill" for backward compatibility
  return workflowMatch.workflowId;
}

async function enrichDocumentPanelWithTemplate(
  panelData: ContextPanelData | null,
  userId: string
): Promise<ContextPanelData | null> {
  if (!panelData || panelData.type !== 'document') {
    return panelData;
  }

  const documentType = panelData.config?.documentType || 'general';
  const existingData = panelData.data || {};
  const existingGenerated =
    existingData.generatedContent ?? existingData.content ?? '';

  try {
    const match = await fetchBestTemplateForDocumentType(userId, documentType);
    if (!match) {
      return {
        ...panelData,
        data: {
          ...existingData,
          generatedContent: existingGenerated,
        },
      };
    }

    return {
      ...panelData,
      data: {
        ...existingData,
        content: match.content,
        generatedContent: existingGenerated,
        driveTemplate: {
          id: match.templateId,
          name: match.name,
          skillName: match.skillName,
          webViewLink: match.webViewLink,
          matchConfidence: match.matchConfidence,
          matchReason: match.matchReason,
          source: match.source,
          content: match.content,
        },
      },
    };
  } catch (error: any) {
    const message = error?.message || 'Failed to load Google Drive template';
    const needsAuth =
      typeof message === 'string' &&
      /auth|oauth|credential|token/i.test(message);

    return {
      ...panelData,
      data: {
        ...existingData,
        generatedContent: existingGenerated,
        driveTemplateError: message,
        driveTemplateNeedsAuth: needsAuth,
      },
    };
  }
}

// Load HR capabilities documentation
function loadHRCapabilities(): string {
  try {
    const capabilitiesPath = path.join(process.cwd(), '..', 'quick-reference-card.md');
    return fs.readFileSync(capabilitiesPath, 'utf-8');
  } catch (error) {
    console.error('Failed to load HR capabilities:', error);
    return `You are an HR assistant powered by Claude. You help with:
- Creating HR documents (offer letters, PIPs, termination letters)
- Recruiting and interviewing
- Performance management
- HR analytics and reporting
- Employee relations

Be professional, helpful, and ensure all advice is legally sound.`;
  }
}

export async function POST(request: NextRequest) {
  // Apply rate limiting (AI endpoints: 30 req/min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.ai);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response;
  }

  // Authenticate
  const authResult = await requireAuth(request);
  if (!authResult.success) {
    return authErrorResponse(authResult);
  }

  // Single-user model: authenticated = authorized

  // Check API quota (for shared key users)
  const quotaCheck = await checkQuota(authResult.user.userId);
  if (!quotaCheck.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: quotaCheck.message,
        quotaExceeded: true,
        quotaStatus: quotaCheck.status,
      },
      { status: 429 } // Too Many Requests
    );
  }

  try {
    const startTime = Date.now(); // Track request start time
    const payload = await request.json();

    const rawMessage = payload?.message;
    if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return NextResponse.json({ success: false, error: 'message is required' }, { status: 400 });
    }

    const message = rawMessage.trim();
    const skill = payload?.skill;
    const history: Array<{
      role: string;
      content: string;
      workflowId?: WorkflowId;
      timestamp?: string;
    }> =
      Array.isArray(payload?.history)
        ? payload.history.filter(
            (entry: any): entry is {
              role: string;
              content: string;
              workflowId?: WorkflowId;
              timestamp?: string;
            } =>
              entry &&
              typeof entry === 'object' &&
              typeof entry.role === 'string' &&
              typeof entry.content === 'string'
          )
        : [];

    const conversationId: string | undefined =
      typeof payload?.conversationId === 'string' && payload.conversationId.length > 0
        ? payload.conversationId
        : undefined;

    const cacheable = history.length === 0;

    // Generate cache key from message + employee data hash
    const crypto = require('crypto');
    let dataHash = 'no-data';

    try {
      const employeeData = await loadDataFileByType('employee_master');
      if (employeeData && employeeData.length > 0) {
        dataHash = crypto
          .createHash('sha256')
          .update(JSON.stringify(employeeData.slice(0, 10))) // Hash first 10 employees for speed
          .digest('hex')
          .slice(0, 8);
      }
    } catch (e) {
      // No employee data available
    }

    const cacheKey = `${crypto.createHash('sha256').update(message).digest('hex')}:${dataHash}`;

    // Check cache (only for simple queries, not for complex conversations)
    if ((!history || history.length === 0) && responseCache.has(cacheKey)) {
      const cached = responseCache.get(cacheKey)!;
      const age = Date.now() - cached.timestamp;

      if (age < CACHE_TTL && cached.dataHash === dataHash) {
        console.log(
          `Cache hit for query: "${message.substring(0, 50)}..." (age: ${Math.round(age / 1000)}s)`
        );

        // Track cache hit metric
        trackMetric({
          apiLatency: Date.now() - startTime,
          cacheHit: true,
          tokensUsed: { input: 0, output: 0, cached: 0 },
          endpoint: '/api/chat',
          timestamp: Date.now(),
          userId: authResult.user.userId,
        });

        return NextResponse.json({
          reply: cached.reply,
          detectedWorkflow: cached.detectedWorkflow,
          workflowConfidence: cached.workflowConfidence,
          contextPanel: cached.contextPanel,
          cached: true,
          suggestedActions: [], // Cache hits don't generate actions
          followUpQuestions: [],
        });
      } else {
        // Expired or data changed, remove from cache
        responseCache.delete(cacheKey);
      }
    }

    // Workflow detection (automatic - replaces skill selection)
    // Extract current workflow from conversation history if available
    let currentWorkflow: WorkflowId | undefined;
    if (history && history.length > 0) {
      // Check if previous messages had a workflow context
      const lastUserMessage = history.filter((msg: any) => msg.role === 'user').pop();
      if (lastUserMessage && lastUserMessage.workflowId) {
        currentWorkflow = lastUserMessage.workflowId;
      }
    }

    // Detect workflow from message
    const detectionHistory = history.map((item, index) => ({
      role: (item.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: item.content,
      timestamp:
        item.timestamp ||
        new Date(Date.now() - (history.length - index) * 1000).toISOString(),
      workflowId: item.workflowId,
    }));
    const detectionContext = buildDetectionContext(message, detectionHistory, currentWorkflow);
    const workflowMatch = detectWorkflow(detectionContext);

    console.log(
      `Workflow detection: ${workflowMatch.workflowId} (confidence: ${workflowMatch.confidence}%)`
    );
    if (workflowMatch.contextFactors && workflowMatch.contextFactors.length > 0) {
      console.log(`  Context factors: ${workflowMatch.contextFactors.join(', ')}`);
    }

    // ========================================================================
    // STATE MANAGEMENT (Hybrid Approach with State Machine)
    // ========================================================================

    // Determine if we should use stateful mode
    const messageCount = history ? history.length + 1 : 1;
    const stateMode = determineStateMode(
      workflowMatch.workflowId,
      workflowMatch.confidence,
      messageCount
    );

    console.log(`State mode: ${stateMode.mode} (${stateMode.reason})`);

    let workflowState: WorkflowState | null = null;
    let stateMachine: WorkflowStateMachine | null = null;

    // For stateful mode, load or initialize state machine
    if (stateMode.mode === 'stateful') {
      // Generate or use provided conversationId
      const activeConversationId =
        conversationId || `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Try to load existing state from database
      const existingState = conversationId ? await loadConversationState(conversationId) : null;

      if (existingState && existingState.workflowId === workflowMatch.workflowId) {
        // Load state machine from existing state
        console.log(`Loading existing workflow state for ${workflowMatch.workflowId}`);
        stateMachine = await loadStateMachine(activeConversationId, existingState);
        workflowState = existingState;
      } else {
        // Create new state machine
        console.log(`Creating new workflow state machine for ${workflowMatch.workflowId}`);
        stateMachine = await createStateMachine(workflowMatch.workflowId, activeConversationId);

        if (stateMachine) {
          workflowState = stateMachine.getState();
          // Save initial state to database
          if (conversationId) {
            await saveConversationState(activeConversationId, workflowState!);
          }
        }
      }

      if (!stateMachine) {
        console.warn('Failed to create/load state machine, falling back to stateless mode');
      }
    }

    // Build system prompt based on workflow
    let systemPrompt = '';

    // Load the detected workflow
    const workflow = loadWorkflow(workflowMatch.workflowId);
    if (workflow && workflow.id !== 'general') {
      console.log(`Loading workflow: ${workflow.name}`);

      // For analytics workflow, include data availability info
      if (workflow.id === 'analytics') {
        try {
          const metadata = await readMetadata();

          let analyticsContext = '';
          if (metadata.files && metadata.files.length > 0) {
            analyticsContext += `\n\n---\n\n# Available Data Files\n\n`;
            analyticsContext += `The user has uploaded the following data files:\n\n`;

            const filesByType: Record<string, number> = {};
            metadata.files.forEach((file) => {
              filesByType[file.fileType] = (filesByType[file.fileType] || 0) + 1;
            });

            Object.entries(filesByType).forEach(([type, count]) => {
              analyticsContext += `- **${type}**: ${count} file(s) uploaded\n`;
            });

            analyticsContext += `\nYou can use the analytics endpoints to access pre-calculated metrics from this data.\n`;
          } else {
            analyticsContext += `\n\n---\n\n# Data Status\n\n`;
            analyticsContext += `**No data files uploaded yet.**\n\n`;
            analyticsContext += `The user needs to upload data files to use analytics features. Direct them to:\n`;
            analyticsContext += `1. Click the "Data Sources" button in the top-right corner\n`;
            analyticsContext += `2. Upload their employee_master.csv and other relevant files\n\n`;
            analyticsContext += `See the DATA_SOURCES_GUIDE.md for file format requirements.\n`;
          }

          // Build workflow prompt with analytics context and state
          systemPrompt = buildWorkflowSystemPrompt(workflow, {
            companyInfo: analyticsContext,
            state: workflowState || undefined,
          });
        } catch (error) {
          console.error('Failed to load data metadata:', error);
          systemPrompt = buildWorkflowSystemPrompt(workflow, {
            state: workflowState || undefined,
          });
        }
      } else {
        // Build standard workflow prompt with state
        systemPrompt = buildWorkflowSystemPrompt(workflow, {
          state: workflowState || undefined,
        });
      }
    }

    // If no skill or skill failed to load, use general context
    if (!systemPrompt) {
      const hrCapabilities = loadHRCapabilities();

      systemPrompt = `${hrCapabilities}

---

# Chief People Officer (AI Persona)

You are the Chief People Officer of an early-stage tech startup (think: messy engineering culture, brilliant but chaotic founders, web3 + AI frontier work).

You're not a corporate HR executive — you're a builder and truth-teller. You understand that startups are unpredictable, people are complex, and growth comes from aligned autonomy, not rules.

## Your style:
- Plainspoken, candid, zero-fluff.
- Human-centric but business-minded.
- You listen, then challenge assumptions.
- You don't lecture; you coach and co-design systems that actually fit startup reality.

## Your priorities:
- Design scalable people systems that don't kill creativity.
- Help leadership mature without killing their edge.
- Shape culture through clarity, feedback, and trust — not handbooks.
- Spot and develop real leaders early.
- Handle conflict head-on, with empathy and facts.
- Make sure talent strategy, values, and velocity align.

You can swear lightly if it fits the tone — but never sound performative or "LinkedIn-inspirational."

You're not here to be a babysitter, parent, or therapist. You're here to build an environment where adults do the best work of their lives.

The CEO makes the final call — your role is to surface trade-offs, offer honest perspective, and design experiments to validate what works.

## When responding:
- Speak like an operator, not a consultant.
- Use concrete examples, not vague HR speak.
- Avoid "corporate jargon" — no "synergies," "stakeholders," or "paradigm shifts."
- Think in terms of systems, feedback loops, and incentives.
- Be provocative when needed, but always constructive.

Your goal: Help this startup scale its people, culture, and leadership with the same rigor it applies to product and engineering — without losing its soul.`;
    }

    // Load employee data to provide context for questions (optimized)
    try {
      const employeeData = await loadDataFileByType('employee_master');

      if (employeeData && employeeData.length > 0) {
        // Use intelligent context generation to minimize token usage
        let employeeContext = generateEmployeeContext(employeeData as Employee[], message);

        // DLP: Optionally de-identify PII before sending to Claude API
        // This protects sensitive data but may reduce Claude's accuracy
        // Enable via NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT=true
        const enableDlpDeidentification = env.NEXT_PUBLIC_DLP_DEIDENTIFY_CHAT;

        if (enableDlpDeidentification) {
          try {
            console.log('[DLP] De-identifying employee context before sending to Claude...');
            employeeContext = await deidentifyText(employeeContext, DLP_INFO_TYPE_PRESETS.CONTACT);
          } catch (dlpError) {
            console.warn('[DLP] De-identification failed, using original context:', dlpError);
            // Fail open: continue with original context if DLP unavailable
          }
        }

        systemPrompt += employeeContext;
      }
    } catch (error) {
      console.error('Failed to load employee data for chat context:', error);
    }

    const messages = [
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: 'user',
        content: message,
      },
    ];

    // Use prompt caching to reduce costs by 82%
    // Split system prompt into cacheable static blocks and dynamic employee data
    const cacheableSystemBlocks = [];

    // Extract employee data context (dynamic, changes when data updates)
    const employeeDataMatch = systemPrompt.match(/---\n\n# Employee Data Context\n\n[\s\S]*$/);
    const staticPrompt = employeeDataMatch
      ? systemPrompt.substring(0, employeeDataMatch.index)
      : systemPrompt;
    const employeeDataContext = employeeDataMatch ? employeeDataMatch[0] : '';

    // Static content blocks with caching enabled
    if (staticPrompt) {
      cacheableSystemBlocks.push({
        type: 'text' as const,
        text: staticPrompt,
        cache_control: { type: 'ephemeral' as const },
      });
    }

    // Add workflow catalog (static, ~15,000 tokens, cacheable)
    // This replaces the legacy skills catalog with the new workflow system
    const workflowCatalog = buildWorkflowCatalog();
    if (workflowCatalog) {
      cacheableSystemBlocks.push({
        type: 'text' as const,
        text: workflowCatalog,
        cache_control: { type: 'ephemeral' as const },
      });
    }

    // Dynamic employee data (not cached, changes frequently)
    if (employeeDataContext) {
      cacheableSystemBlocks.push({
        type: 'text' as const,
        text: employeeDataContext,
      });
    }

    // ========================================================================
    // ON-DEMAND ANALYTICS (Pre-process analytical queries with real data)
    // ========================================================================

    // Check if this is a flight risk query
    const isFlightRiskQuery = /flight\s*risk|at[-\s]*risk\s+employee|retention\s+concern|who.*leave|turnover\s+risk/i.test(message);

    // Check if this is a hiring bottleneck query
    const isHiringBottleneckQuery = /hiring.*bottleneck|slow.*hiring|time[-\s]*to[-\s]*fill|stalled.*position|open.*req|recruiting.*issue/i.test(message);

    // If it's an analytical query, run the analysis first and inject results
    if (isFlightRiskQuery || isHiringBottleneckQuery) {
      try {
        let analyticsResult = '';

        if (isFlightRiskQuery) {
          const { detectFlightRisks, formatFlightRiskForChat } = await import('@/lib/analytics/flight-risk-detector');
          const department = message.match(/\b(engineering|product|sales|marketing|finance|hr)\b/i)?.[1];
          const analysis = await detectFlightRisks({
            department,
            minRiskLevel: 'medium',
            limit: 50,
          });
          analyticsResult = formatFlightRiskForChat(analysis);
        }

        if (isHiringBottleneckQuery) {
          const { analyzeHiringBottlenecks, formatHiringBottlenecksForChat } = await import('@/lib/analytics/hiring-bottlenecks');
          const department = message.match(/\b(engineering|product|sales|marketing|finance|hr)\b/i)?.[1];
          const analysis = await analyzeHiringBottlenecks({
            department,
            minDaysOpen: 30,
            includeStalled: true,
          });
          analyticsResult = formatHiringBottlenecksForChat(analysis);
        }

        // If we got analytics results, use them directly instead of calling Claude
        if (analyticsResult) {
          console.log('[OnDemandAnalytics] Using pre-calculated analytics instead of AI call');

          // Still track as chat interaction
          trackMetric({
            apiLatency: Date.now() - startTime,
            cacheHit: false,
            tokensUsed: { input: 0, output: 0, cached: 0 },
            endpoint: '/api/chat',
            timestamp: Date.now(),
            userId: authResult.user.userId,
          });

          // Detect context panel
          const contextDetection = detectContext(message, analyticsResult);
          let contextPanelData =
            contextDetection.confidence >= 70 ? contextDetection.panelData : null;
          contextPanelData = await enrichDocumentPanelWithTemplate(
            contextPanelData,
            authResult.user.userId
          );

          return NextResponse.json({
            reply: analyticsResult,
            detectedWorkflow: 'analytics',
            workflowConfidence: 100,
            contextPanel: contextPanelData,
            suggestedActions: [],
            followUpQuestions: [],
            analyticsMode: true, // Flag to indicate this was pre-calculated
          });
        }
      } catch (analyticsError) {
        console.error('[OnDemandAnalytics] Failed to run analytics, falling back to AI:', analyticsError);
        // Fall through to normal AI call if analytics fails
      }
    }

    // ========================================================================
    // AI CALL (Standard Claude response for non-analytical queries)
    // ========================================================================

    // Use dynamic max_tokens to save costs
    const maxTokens = estimateMaxTokens(message);

    const response = await createMessage({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: cacheableSystemBlocks,
      messages,
    });

    const reply = extractTextContent(response);

    // Track quota usage (for shared key users)
    const totalTokens = response.usage.input_tokens + response.usage.output_tokens;
    await trackQuotaUsage(authResult.user.userId, totalTokens);

    // Track performance metrics
    const latency = Date.now() - startTime;
    trackMetric({
      apiLatency: latency,
      cacheHit: false,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
        cached: (response.usage as any).cache_read_input_tokens || 0,
        cacheCreation: (response.usage as any).cache_creation_input_tokens || 0,
      },
      endpoint: '/api/chat',
      timestamp: Date.now(),
      userId: authResult.user.userId,
    });

    // ========================================================================
    // ACTION SUGGESTION SYSTEM (Smart Routing Enhancement)
    // ========================================================================

    // Get user permissions for action filtering
    const rolePermissions = (authResult.user as any)?.role?.permissions as
      | Record<string, boolean>
      | undefined;

    const userPermissions = rolePermissions
      ? Object.entries(rolePermissions)
          .filter(([, allowed]) => Boolean(allowed))
          .map(([perm]) => perm)
      : [];

    // Generate action suggestions based on workflow and context
    const suggestionContext: SuggestionContext = {
      workflowId: workflowMatch.workflowId,
      message,
      aiResponse: reply,
      conversationHistory: history,
      userId: authResult.user.userId,
      userPermissions,
    };

    const suggestedActions = suggestActions(suggestionContext);

    // Generate follow-up question suggestions
    const followUpQuestions = suggestFollowUpQuestions(suggestionContext);

    // ========================================================================
    // CONTEXT PANEL DETECTION (Smart UI Rendering)
    // ========================================================================

    // Detect if we should show a context panel based on workflow and response
    let contextPanelData: ContextPanelData | null = null;

    const contextDetection = detectContext(message, reply);
    if (contextDetection.panelData && contextDetection.confidence >= 70) {
      contextPanelData = contextDetection.panelData;
      console.log(
        `Context panel detected: ${contextDetection.panelData.type} (${contextDetection.confidence}% confidence)`
      );
    }

    contextPanelData = await enrichDocumentPanelWithTemplate(
      contextPanelData,
      authResult.user.userId
    );

    // Store in cache (only for simple queries without history)
    if (cacheable) {
      if (responseCache.size >= MAX_CACHE_SIZE) {
        const firstKey = responseCache.keys().next().value;
        if (firstKey) {
          responseCache.delete(firstKey);
        }
      }

      responseCache.set(cacheKey, {
        reply,
        detectedWorkflow: workflowMatch.workflowId,
        workflowConfidence: workflowMatch.confidence,
        contextPanel: contextPanelData,
        timestamp: Date.now(),
        dataHash,
      });

      console.log(
        `Cached response for query: "${message.substring(0, 50)}..." (workflow: ${workflowMatch.workflowId}, panel: ${contextPanelData?.type || 'none'}, cache size: ${responseCache.size})`
      );
    }

    // Build response with workflow state information
    const apiResponse: any = {
      reply,
      detectedWorkflow: workflowMatch.workflowId,
      workflowConfidence: workflowMatch.confidence,
      cached: false,
      quotaStatus: quotaCheck.status, // Include quota info for UI display
      suggestedActions: suggestedActions.slice(0, 4), // Limit to top 4 suggestions
      followUpQuestions: followUpQuestions.slice(0, 3), // Limit to 3 follow-up questions
      contextPanel: contextPanelData, // NEW: Include context panel data if detected
    };

    // Include state machine summary if available
    if (stateMachine) {
      const summary = stateMachine.getSummary();
      apiResponse.workflowState = {
        currentStep: summary.currentStep,
        progress: summary.progress,
        completedSteps: summary.completedSteps,
        isComplete: summary.isComplete,
        hasActions: summary.nextActions > 0,
        actionCount: summary.nextActions,
      };

      // Merge state machine actions with generated suggestions
      const stateActions = stateMachine.getNextActions();
      if (stateActions.length > 0) {
        // Prioritize state machine actions (they're workflow-specific)
        apiResponse.suggestedActions = [
          ...stateActions,
          ...suggestedActions.filter(
            (a) => !stateActions.some((sa) => sa.type === a.type && sa.label === a.label)
          ),
        ].slice(0, 4); // Keep max 4 total actions
      }
    }

    return NextResponse.json(apiResponse);
  } catch (error: any) {
    return handleApiError(error, {
      endpoint: '/api/chat',
      method: 'POST',
      userId: authResult?.user?.userId || 'UNKNOWN',
      requestBody: {}, // Body parsing may have failed, so we can't safely access it here
    });
  }
}
