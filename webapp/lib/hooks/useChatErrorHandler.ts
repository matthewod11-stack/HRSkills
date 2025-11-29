import { useCallback } from 'react';
import type { Message } from '@/components/custom/chat/ChatContext';

/**
 * Context for error handling
 */
export interface ErrorContext {
  /**
   * Type of API that failed
   * - 'analytics': Analytics chat API
   * - 'chat': General chat API
   * - 'export': Google Docs export API
   */
  apiType: 'analytics' | 'chat' | 'export';

  /**
   * Custom user-facing error message
   * If not provided, a default message will be generated
   */
  userMessage?: string;

  /**
   * Whether to add error message to chat
   * - true: Add error message to chat history (default for analytics/chat)
   * - false: Don't add to chat (default for export - uses alert instead)
   */
  shouldAddToChat?: boolean;
}

/**
 * Options for useChatErrorHandler hook
 */
export interface UseChatErrorHandlerOptions {
  /**
   * Function to add message to chat
   */
  addMessage: (message: Message) => void;

  /**
   * Function to reset typing indicator
   */
  setIsTyping: (typing: boolean) => void;

  /**
   * Current messages array (for generating new message IDs)
   */
  messages: Message[];
}

/**
 * Return value from useChatErrorHandler hook
 */
export interface UseChatErrorHandlerReturn {
  /**
   * Handle API error with context-aware response
   * @param error - The caught error object
   * @param context - Error context (API type, custom message, etc.)
   */
  handleApiError: (error: Error, context: ErrorContext) => void;

  /**
   * Create an error message object
   * @param error - The error object
   * @param customMessage - Optional custom message
   * @returns Message object for the error
   */
  createErrorMessage: (error: Error, customMessage?: string) => Message;

  /**
   * Format error for user display
   * @param error - The error object
   * @param apiType - Type of API that failed
   * @returns User-friendly error message
   */
  formatErrorForUser: (error: Error, apiType: string) => string;
}

/**
 * Default error messages by API type
 */
const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  analytics: "Sorry, I couldn't run that analysis: {error}. Please try again later.",
  chat: 'Sorry, I encountered an error. Please try again.',
  export: 'Failed to export document: {error}',
};

/**
 * Custom hook for consistent error handling across chat API calls
 *
 * Provides centralized error handling logic with:
 * - Consistent error messaging
 * - Structured error logging
 * - Automatic typing indicator reset
 * - Context-aware response (chat message vs alert)
 * - Future: Error tracking service integration
 *
 * @example
 * ```tsx
 * const { handleApiError } = useChatErrorHandler({
 *   addMessage,
 *   setIsTyping,
 *   messages,
 * });
 *
 * try {
 *   await fetch('/api/analytics/chat', { ... });
 * } catch (error) {
 *   handleApiError(error as Error, {
 *     apiType: 'analytics',
 *     shouldAddToChat: true,
 *   });
 * }
 * ```
 *
 * @param options - Configuration options
 * @returns Error handling utilities
 */
export function useChatErrorHandler(
  options: UseChatErrorHandlerOptions
): UseChatErrorHandlerReturn {
  const { addMessage, setIsTyping, messages } = options;

  /**
   * Format error for user display
   */
  const formatErrorForUser = useCallback((error: Error, apiType: string): string => {
    const template = DEFAULT_ERROR_MESSAGES[apiType] || DEFAULT_ERROR_MESSAGES.chat;
    const errorMsg = error.message || 'Unknown error';
    return template.replace('{error}', errorMsg);
  }, []);

  /**
   * Create an error message object
   */
  const createErrorMessage = useCallback(
    (error: Error, customMessage?: string): Message => {
      const content = customMessage || error.message || 'An error occurred';

      return {
        id: `error_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
      };
    },
    []
  );

  /**
   * Handle API error with context-aware response
   */
  const handleApiError = useCallback(
    (error: Error, context: ErrorContext) => {
      const { apiType, userMessage, shouldAddToChat } = context;

      // Determine if we should add to chat (default: true for analytics/chat, false for export)
      const addToChatHistory = shouldAddToChat ?? apiType !== 'export';

      // Log error with context
      console.error(`${apiType.charAt(0).toUpperCase() + apiType.slice(1)} error:`, error);

      // Format user-facing message
      const formattedMessage = userMessage || formatErrorForUser(error, apiType);

      if (addToChatHistory) {
        // Add error message to chat
        const errorMessage = createErrorMessage(error, formattedMessage);
        addMessage(errorMessage);
      } else {
        // Show alert for non-chat errors (e.g., export failures)
        alert(formattedMessage);
      }

      // Always reset typing indicator
      setIsTyping(false);

      // Future: Send to error tracking service
      // trackError({ error, context, apiType });
    },
    [addMessage, setIsTyping, formatErrorForUser, createErrorMessage]
  );

  return {
    handleApiError,
    createErrorMessage,
    formatErrorForUser,
  };
}
