import { useCallback } from 'react';
import { detectContext } from '@/lib/workflows/context-detector';
import type { Message } from '@/components/custom/chat/ChatContext';
import type { ContextPanelData } from '@/components/custom/ContextPanel';

/**
 * Options for useChatAPI hook
 */
export interface UseChatAPIOptions {
  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders: () => Record<string, string>;

  /**
   * Conversation ID for tracking
   */
  conversationId: string;

  /**
   * Current messages in the conversation
   */
  messages: Message[];

  /**
   * Add a message to the conversation
   */
  addMessage: (message: Message) => void;

  /**
   * Handle API errors
   */
  onError: (error: Error, context: { apiType: 'analytics' | 'chat' }) => void;

  /**
   * Update context panel after response
   */
  onPanelUpdate: (userMessage: string, assistantReply: string, serverPanel?: ContextPanelData) => void;
}

/**
 * Return value from useChatAPI hook
 */
export interface UseChatAPIReturn {
  /**
   * Send a message through the appropriate chat API
   * @param message - The user message text
   * @param userMessage - The user message object (for including in history)
   * @returns Promise that resolves when the API call completes
   */
  sendMessage: (message: string, userMessage: Message) => Promise<void>;
}

/**
 * Response from analytics chat API
 */
interface AnalyticsChatResponse {
  success: boolean;
  error?: { message: string };
  data: {
    content: string;
    suggestedFollowUps?: string[];
    chartConfig?: {
      type: string;
      [key: string]: any;
    };
    metadata?: Record<string, any>;
  };
}

/**
 * Response from general chat API
 */
interface GeneralChatResponse {
  error?: string;
  reply: string;
  detectedWorkflow?: string;
  workflowConfidence?: number;
  workflowState?: Record<string, any>;
  suggestedActions?: Array<{ label: string; action: string }>;
  contextPanel?: ContextPanelData;
}

/**
 * Custom hook for chat API routing and message handling
 *
 * Handles the dual-route chat system:
 * 1. Analytics queries → /api/analytics/chat
 * 2. General queries → /api/chat
 *
 * Features:
 * - Automatic route detection based on query content
 * - Different payload structures for each API
 * - Different response handling
 * - Context panel updates
 * - Error handling with context
 *
 * @example
 * ```tsx
 * const { sendMessage } = useChatAPI({
 *   getAuthHeaders,
 *   conversationId,
 *   messages,
 *   addMessage,
 *   onError: handleApiError,
 *   onPanelUpdate: detectAndUpdatePanel,
 * });
 *
 * // In handleSend:
 * await sendMessage(finalText);
 * ```
 *
 * @param options - Configuration options
 * @returns Chat API utilities
 */
export function useChatAPI(options: UseChatAPIOptions): UseChatAPIReturn {
  const { getAuthHeaders, conversationId, messages, addMessage, onError, onPanelUpdate } = options;

  /**
   * Send message to analytics chat API
   */
  const sendAnalyticsMessage = useCallback(
    async (message: string, userMessage: Message, contextDetection: ReturnType<typeof detectContext>) => {
      // Prepare conversation history (last 4 messages including current)
      const historyWithCurrent = [...messages, userMessage];
      const historyPayload = historyWithCurrent.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message,
          sessionId: conversationId,
          conversationHistory: historyPayload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          (errorData as { error?: { message?: string } }).error?.message ||
          (errorData as { error?: string }).error ||
          `Analytics API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const result: AnalyticsChatResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'Analytics assistant error');
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: result.data.content,
        timestamp: new Date(),
        detectedWorkflow: 'analytics',
        workflowConfidence: 100,
        suggestedFollowUps: result.data.suggestedFollowUps || [],
      };

      addMessage(assistantMessage);

      // Build analytics panel data
      const analyticsPanel: ContextPanelData = {
        type: 'analytics',
        title: 'Analytics Insight',
        config: {
          chartType:
            result.data.chartConfig?.type ||
            contextDetection.panelData?.config?.chartType ||
            'bar',
          filters: contextDetection.panelData?.config?.filters,
        },
        data: {
          metric: contextDetection.panelData?.data?.metric || 'headcount',
          chartConfig: result.data.chartConfig,
          analysisSummary: result.data.content,
          suggestedFollowUps: result.data.suggestedFollowUps || [],
          metadata: result.data.metadata,
        },
      };

      // Update context panel
      onPanelUpdate(message, result.data.content, analyticsPanel);
    },
    [getAuthHeaders, conversationId, messages, addMessage, onPanelUpdate]
  );

  /**
   * Send message to general chat API
   */
  const sendGeneralMessage = useCallback(
    async (message: string, userMessage: Message) => {
      // Prepare full conversation history (including current)
      const historyWithCurrent = [...messages, userMessage];
      const historyPayload = historyWithCurrent.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message,
          conversationId,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Handle error response format: { success: false, error: "...", ... }
        const errorMessage =
          (errorData as { error?: string }).error ||
          `Chat API error: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      const data: GeneralChatResponse = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Create assistant message
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        detectedWorkflow: data.detectedWorkflow,
        workflowConfidence: data.workflowConfidence,
        workflowState: data.workflowState,
        suggestedActions: data.suggestedActions,
      };

      addMessage(assistantMessage);

      // Update context panel (server-side detection if available)
      onPanelUpdate(message, data.reply, data.contextPanel);
    },
    [getAuthHeaders, conversationId, messages, addMessage, onPanelUpdate]
  );

  /**
   * Send message through appropriate API based on content
   */
  const sendMessage = useCallback(
    async (message: string, userMessage: Message) => {
      // Detect if this is an analytics query
      const contextDetection = detectContext(message);

      if (contextDetection.panelData?.type === 'analytics') {
        // Route to analytics API
        try {
          await sendAnalyticsMessage(message, userMessage, contextDetection);
        } catch (error) {
          onError(error as Error, { apiType: 'analytics' });
        }
      } else {
        // Route to general chat API
        try {
          await sendGeneralMessage(message, userMessage);
        } catch (error) {
          onError(error as Error, { apiType: 'chat' });
        }
      }
    },
    [sendAnalyticsMessage, sendGeneralMessage, onError]
  );

  return {
    sendMessage,
  };
}
