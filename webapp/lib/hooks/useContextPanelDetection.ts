import { useCallback, useState } from 'react';
import { detectContext } from '@/lib/workflows/context-detector';
import type { ContextPanelData } from '@/components/custom/ContextPanel';

/**
 * Options for useContextPanelDetection hook
 */
export interface UseContextPanelDetectionOptions {
  /**
   * Callback when panel should be displayed
   * @param panelData - The panel data to display (null to clear)
   */
  onPanelChange?: (panelData: ContextPanelData | null) => void;

  /**
   * Minimum confidence threshold for client-side detection
   * @default 70
   */
  confidenceThreshold?: number;
}

/**
 * Return value from useContextPanelDetection hook
 */
export interface UseContextPanelDetectionReturn {
  /**
   * Detect context and update panel
   * Uses server-side detection if available, falls back to client-side
   * @param message - User message
   * @param response - Assistant response
   * @param serverPanel - Server-detected panel data (optional)
   */
  detectAndUpdatePanel: (
    message: string,
    response: string,
    serverPanel?: ContextPanelData
  ) => void;

  /**
   * Enhance panel data with timestamp and sanitization
   * @param panelData - Raw panel data
   * @returns Enhanced panel data
   */
  enhancePanelData: (panelData: ContextPanelData | null) => ContextPanelData | null;

  /**
   * Sanitize document content based on type
   * Currently handles PIP document sanitization
   * @param content - Raw content
   * @param documentType - Type of document
   * @returns Sanitized content
   */
  sanitizeDocumentContent: (content: string, documentType: string) => string;

  /**
   * Last detected panel data
   */
  lastDetectedPanel: ContextPanelData | null;

  /**
   * Last detection confidence score
   */
  lastConfidence: number;
}

/**
 * Sanitize PIP (Performance Improvement Plan) content to ensure quality
 *
 * Requirements for valid PIP content:
 * - Must contain "Performance Improvement Plan" marker
 * - Must include all required sections
 * - Must have at least 10 lines
 * - Removes AI prompts and closing phrases
 */
function sanitizePipContent(rawContent: string): string {
  if (!rawContent) return '';

  // Normalize line endings
  const normalized = rawContent.replace(/\r\n/g, '\n');
  const lower = normalized.toLowerCase();

  // Find PIP marker
  const markerIndex = lower.indexOf('performance improvement plan');
  if (markerIndex === -1) return '';

  // Find start of line containing marker
  let startIndex = markerIndex;
  while (startIndex > 0 && normalized[startIndex - 1] !== '\n') {
    startIndex--;
  }

  // Extract content from marker onwards
  let pipBody = normalized.slice(startIndex).trimStart();

  // Remove AI prompts/closing phrases
  const closingPhrases = [
    'give me those details',
    'share those details',
    'once you provide the details',
  ];

  for (const phrase of closingPhrases) {
    const closingIndex = pipBody.toLowerCase().lastIndexOf(phrase);
    if (closingIndex !== -1) {
      pipBody = pipBody.slice(0, closingIndex).replace(/\s*$/, '');
      break;
    }
  }

  // Remove trailing separators
  pipBody = pipBody.replace(/\n-{3,}\s*$/g, '').trim();

  // Validate required sections
  const requiredSections = [
    '## performance issues',
    '## improvement goals',
    '## support & resources',
    '## check-in schedule',
  ];

  const hasAllSections = requiredSections.every((section) =>
    pipBody.toLowerCase().includes(section)
  );

  return hasAllSections ? pipBody : '';
}

/**
 * Custom hook for context panel detection and enhancement
 *
 * Manages the two-tier detection system:
 * 1. Server-side detection (priority) - from API response
 * 2. Client-side fallback - using pattern matching with confidence threshold
 *
 * Also handles:
 * - Panel data enhancement (timestamps)
 * - Content sanitization (PIP documents)
 * - Confidence-based filtering
 *
 * @example
 * ```tsx
 * const { detectAndUpdatePanel, enhancePanelData } = useContextPanelDetection({
 *   onPanelChange: setPanelData,
 *   confidenceThreshold: 70,
 * });
 *
 * // In API response handler:
 * if (data.contextPanel) {
 *   // Server-side detection
 *   detectAndUpdatePanel(userMessage, data.reply, data.contextPanel);
 * } else {
 *   // Client-side fallback
 *   detectAndUpdatePanel(userMessage, data.reply);
 * }
 * ```
 *
 * @param options - Configuration options
 * @returns Context panel detection utilities
 */
export function useContextPanelDetection(
  options?: UseContextPanelDetectionOptions
): UseContextPanelDetectionReturn {
  const { onPanelChange, confidenceThreshold = 70 } = options || {};

  const [lastDetectedPanel, setLastDetectedPanel] = useState<ContextPanelData | null>(null);
  const [lastConfidence, setLastConfidence] = useState<number>(0);

  /**
   * Sanitize document content based on type
   */
  const sanitizeDocumentContent = useCallback((content: string, documentType: string): string => {
    if (documentType === 'pip') {
      return sanitizePipContent(content);
    }
    // Add more document types here as needed
    return content;
  }, []);

  /**
   * Enhance panel data with timestamp and sanitization
   */
  const enhancePanelData = useCallback(
    (panelData: ContextPanelData | null): ContextPanelData | null => {
      if (!panelData) return null;

      // Add timestamp
      const enhanced = {
        ...panelData,
        timestamp: new Date().toISOString(),
      };

      // Sanitize PIP content if applicable
      if (panelData.type === 'document' && panelData.config?.documentType === 'pip') {
        const rawContent = panelData.data?.content ?? '';
        const sanitized = sanitizeDocumentContent(rawContent, 'pip');

        // Validate sanitized content (must have at least 10 lines)
        if (!sanitized || sanitized.trim().split('\n').length < 10) {
          return {
            ...enhanced,
            data: { ...panelData.data, content: '' },
          };
        }

        return {
          ...enhanced,
          data: { ...panelData.data, content: sanitized },
        };
      }

      return enhanced;
    },
    [sanitizeDocumentContent]
  );

  /**
   * Detect context and update panel
   * Priority: server-side detection > client-side fallback
   */
  const detectAndUpdatePanel = useCallback(
    (message: string, response: string, serverPanel?: ContextPanelData) => {
      let panelToUse: ContextPanelData | null = null;
      let confidence = 0;

      if (serverPanel) {
        // Server-side detection takes priority
        panelToUse = serverPanel;
        confidence = 100; // Server detection is always high confidence
      } else {
        // Client-side fallback detection
        const detection = detectContext(message, response);
        if (detection.panelData && detection.confidence >= confidenceThreshold) {
          panelToUse = detection.panelData;
          confidence = detection.confidence;
        }
      }

      // Update state
      setLastDetectedPanel(panelToUse);
      setLastConfidence(confidence);

      // Enhance and notify parent
      if (onPanelChange) {
        const enhanced = enhancePanelData(panelToUse);
        onPanelChange(enhanced);
      }
    },
    [confidenceThreshold, onPanelChange, enhancePanelData]
  );

  return {
    detectAndUpdatePanel,
    enhancePanelData,
    sanitizeDocumentContent,
    lastDetectedPanel,
    lastConfidence,
  };
}
