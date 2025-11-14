import { useEffect, useRef } from 'react';

/**
 * External prompt object structure
 */
export interface ExternalPrompt {
  /**
   * Unique identifier for the prompt
   * Used for deduplication to prevent processing the same prompt twice
   */
  id: number;

  /**
   * The text content to send
   */
  text: string;
}

/**
 * Options for useExternalPrompt hook
 */
export interface UseExternalPromptOptions {
  /**
   * Callback when a new prompt is received
   * Should trigger message send logic
   * @param text - The prompt text to send
   */
  onPromptReceived: (text: string) => Promise<void>;

  /**
   * Callback when prompt processing is complete
   * Notifies parent component that prompt has been consumed
   * @param promptId - The ID of the consumed prompt
   */
  onPromptConsumed?: (promptId: number) => void;

  /**
   * Whether the system is currently processing
   * If true, external prompts will be ignored until processing completes
   * @default false
   */
  isProcessing?: boolean;
}

/**
 * Return value from useExternalPrompt hook
 */
export interface UseExternalPromptReturn {
  /**
   * Currently active prompt ID (null if none)
   */
  activePromptId: number | null;

  /**
   * Manually reset the active prompt
   * Useful for error recovery or manual cleanup
   */
  resetActivePrompt: () => void;
}

/**
 * Custom hook for processing external prompts from other components
 *
 * Handles the automatic processing of prompts triggered by other UI elements
 * (e.g., suggestion cards, quick action buttons, context menu items).
 *
 * Features:
 * - Automatic deduplication (same prompt ID won't be processed twice)
 * - Respects processing state (won't trigger if system is busy)
 * - Cleanup on completion (notifies parent and resets state)
 * - Async handling with error safety
 *
 * @example
 * ```tsx
 * const { activePromptId } = useExternalPrompt(externalPrompt, {
 *   onPromptReceived: (text) => handleSend(text, true), // Bypass PII for quick actions
 *   onPromptConsumed: (id) => clearExternalPrompt(id),
 *   isProcessing: isTyping,
 * });
 *
 * // In parent component:
 * <SuggestionCard onClick={() => setExternalPrompt({ id: Date.now(), text: 'Create offer letter' })} />
 * ```
 *
 * @param externalPrompt - The prompt to process (null if none)
 * @param options - Configuration options
 * @returns Active prompt state and utilities
 */
export function useExternalPrompt(
  externalPrompt: ExternalPrompt | null,
  options: UseExternalPromptOptions
): UseExternalPromptReturn {
  const { onPromptReceived, onPromptConsumed, isProcessing = false } = options;

  // Track active prompt ID to prevent duplicate processing
  const activePromptIdRef = useRef<number | null>(null);

  /**
   * Manually reset the active prompt
   */
  const resetActivePrompt = () => {
    activePromptIdRef.current = null;
  };

  /**
   * Process external prompts automatically
   */
  useEffect(() => {
    // No prompt to process
    if (!externalPrompt) return;

    // System is busy (typing)
    if (isProcessing) return;

    // Already processed this prompt (deduplication)
    if (activePromptIdRef.current === externalPrompt.id) return;

    // Mark prompt as active
    activePromptIdRef.current = externalPrompt.id;

    // Capture values in closure (for cleanup)
    const promptId = externalPrompt.id;
    const promptText = externalPrompt.text;

    // Process prompt asynchronously
    void (async () => {
      try {
        await onPromptReceived(promptText);
      } catch (error) {
        // Silently handle errors - parent can handle them in onPromptReceived
        // We just need to ensure cleanup happens
        console.error('External prompt processing failed:', error);
      } finally {
        // Always notify parent and cleanup, even on error
        onPromptConsumed?.(promptId);

        // Reset if this is still the active prompt
        // (protect against rapid prompt changes)
        if (activePromptIdRef.current === promptId) {
          activePromptIdRef.current = null;
        }
      }
    })();
  }, [externalPrompt, isProcessing, onPromptReceived, onPromptConsumed]);

  return {
    activePromptId: activePromptIdRef.current,
    resetActivePrompt,
  };
}
