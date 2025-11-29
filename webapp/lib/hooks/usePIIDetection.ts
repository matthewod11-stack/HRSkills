import { type RefObject, useCallback, useState } from 'react';
import { detectSensitivePII } from '@/lib/pii-detector';

/**
 * PII Warning State
 */
export interface PIIWarning {
  show: boolean;
  types: string[];
  message: string;
  pendingText: string;
}

/**
 * Options for usePIIDetection hook
 */
export interface UsePIIDetectionOptions {
  /**
   * Reference to input field (for auto-focus on edit)
   */
  inputRef?: RefObject<HTMLInputElement | null>;

  /**
   * Callback when user chooses "Send Anyway" option
   * Should trigger message send with bypass=true
   */
  onSendWithBypass?: (text: string) => void;

  /**
   * Callback when user chooses "Edit" option
   * Should restore text to input field
   */
  onEdit?: (text: string) => void;
}

/**
 * Return value from usePIIDetection hook
 */
export interface UsePIIDetectionReturn {
  /**
   * Current PII warning state
   */
  piiWarning: PIIWarning;

  /**
   * Check if text contains PII and show warning if detected
   * @param text - Text to check for PII
   * @returns true if PII detected (send should be blocked), false otherwise
   */
  checkForPII: (text: string) => boolean;

  /**
   * Handle "Edit Message" button click
   * Returns text to input field for user to edit
   */
  handleEditMessage: () => void;

  /**
   * Handle "Send Anyway" button click
   * Proceeds with send despite PII detection
   */
  handleProceedWithPII: () => void;

  /**
   * Dismiss PII warning without action
   */
  dismissPIIWarning: () => void;

  /**
   * Reset PII warning state (for chat reset)
   */
  resetPIIWarning: () => void;

  /**
   * Check if there's a pending PII warning
   */
  hasPendingPII: boolean;

  /**
   * Get detected PII types
   */
  piiTypes: string[];
}

/**
 * Custom hook for PII (Personally Identifiable Information) detection and handling
 *
 * Manages the complete PII detection lifecycle:
 * - Pre-send scanning for sensitive data (SSN, credit cards, etc.)
 * - Modal state management for warnings
 * - Edit/Send Anyway user flow
 * - Bypass mechanism for trusted operations
 *
 * @example
 * ```tsx
 * const { checkForPII, piiWarning, handleEditMessage, handleProceedWithPII } = usePIIDetection({
 *   inputRef,
 *   onSendWithBypass: (text) => handleSend(text, true),
 *   onEdit: (text) => setInput(text)
 * });
 *
 * // In handleSend:
 * if (!bypassPII && checkForPII(finalText)) {
 *   return; // Blocked by PII detection
 * }
 *
 * // In modal:
 * <PIIWarningModal
 *   isOpen={piiWarning.show}
 *   detectedTypes={piiWarning.types}
 *   message={piiWarning.message}
 *   onEdit={handleEditMessage}
 *   onSendAnyway={handleProceedWithPII}
 * />
 * ```
 *
 * @param options - Configuration options
 * @returns PII detection state and handlers
 */
export function usePIIDetection(options?: UsePIIDetectionOptions): UsePIIDetectionReturn {
  const { inputRef, onSendWithBypass, onEdit } = options || {};

  // PII warning state
  const [piiWarning, setPiiWarning] = useState<PIIWarning>({
    show: false,
    types: [],
    message: '',
    pendingText: '',
  });

  /**
   * Check if text contains PII and show warning if detected
   */
  const checkForPII = useCallback((text: string): boolean => {
    const piiResult = detectSensitivePII(text);

    if (piiResult.detected) {
      setPiiWarning({
        show: true,
        types: piiResult.types,
        message: piiResult.message,
        pendingText: text,
      });
      return true; // PII detected - block send
    }

    return false; // No PII - allow send
  }, []);

  /**
   * Handle "Edit Message" button click
   * Returns text to input field for user to edit
   */
  const handleEditMessage = useCallback(() => {
    const textToEdit = piiWarning.pendingText;

    // Clear warning state
    setPiiWarning({
      show: false,
      types: [],
      message: '',
      pendingText: '',
    });

    // Call optional callback (to update parent input state)
    if (onEdit) {
      onEdit(textToEdit);
    }

    // Focus input field
    inputRef?.current?.focus();
  }, [piiWarning.pendingText, inputRef, onEdit]);

  /**
   * Handle "Send Anyway" button click
   * Proceeds with send despite PII detection
   */
  const handleProceedWithPII = useCallback(() => {
    const textToSend = piiWarning.pendingText;

    // Clear warning state
    setPiiWarning({
      show: false,
      types: [],
      message: '',
      pendingText: '',
    });

    // Trigger send with bypass flag
    if (onSendWithBypass) {
      onSendWithBypass(textToSend);
    }
  }, [piiWarning.pendingText, onSendWithBypass]);

  /**
   * Dismiss PII warning without action
   */
  const dismissPIIWarning = useCallback(() => {
    setPiiWarning({
      show: false,
      types: [],
      message: '',
      pendingText: '',
    });
  }, []);

  /**
   * Reset PII warning state (for chat reset)
   */
  const resetPIIWarning = useCallback(() => {
    setPiiWarning({
      show: false,
      types: [],
      message: '',
      pendingText: '',
    });
  }, []);

  return {
    piiWarning,
    checkForPII,
    handleEditMessage,
    handleProceedWithPII,
    dismissPIIWarning,
    resetPIIWarning,
    hasPendingPII: piiWarning.show,
    piiTypes: piiWarning.types,
  };
}
