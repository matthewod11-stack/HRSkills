import { useCallback } from 'react';
import type { Message } from '@/components/custom/chat/ChatContext';

/**
 * Options for useGoogleDocsExport hook
 */
export interface UseGoogleDocsExportOptions {
  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders: () => Record<string, string>;

  /**
   * Handle API errors
   */
  onError?: (error: Error, userMessage: string) => void;
}

/**
 * Return value from useGoogleDocsExport hook
 */
export interface UseGoogleDocsExportReturn {
  /**
   * Export a message to Google Docs
   * @param message - The message containing content to export
   */
  exportToGoogleDocs: (message: Message) => Promise<void>;

  /**
   * Detect document type from message content and workflow
   * @param message - The message to analyze
   * @returns Detected document type
   */
  detectDocumentType: (message: Message) => string;

  /**
   * Generate a document title from message metadata
   * @param documentType - The type of document
   * @param timestamp - The document timestamp
   * @returns Generated title
   */
  generateDocumentTitle: (documentType: string, timestamp: Date) => string;
}

/**
 * Workflow to document type mapping
 */
const WORKFLOW_DOCUMENT_TYPES: { [key: string]: string } = {
  hiring: 'Job Description',
  performance: 'Performance Document',
  onboarding: 'Onboarding Plan',
  offboarding: 'Exit Document',
  compliance: 'Policy Document',
  employee_relations: 'ER Document',
  compensation: 'Compensation Document',
  analytics: 'Analytics Report',
};

/**
 * Content-based document type detection patterns
 */
const CONTENT_PATTERNS: Array<{ keywords: string[]; type: string }> = [
  { keywords: ['offer letter', 'offer of employment'], type: 'Offer Letter' },
  { keywords: ['performance improvement plan', 'pip'], type: 'PIP' },
  { keywords: ['termination', 'separation'], type: 'Termination Letter' },
  { keywords: ['reference letter'], type: 'Reference Letter' },
  { keywords: ['promotion'], type: 'Promotion Letter' },
  { keywords: ['transfer'], type: 'Transfer Letter' },
  { keywords: ['job description', 'jd'], type: 'Job Description' },
];

/**
 * Custom hook for exporting messages to Google Docs
 *
 * Handles the complete export workflow:
 * 1. Document type detection (workflow-based + content-based)
 * 2. Title generation
 * 3. API request with authentication
 * 4. OAuth flow handling
 * 5. Error handling
 *
 * @example
 * ```tsx
 * const { exportToGoogleDocs } = useGoogleDocsExport({
 *   getAuthHeaders: () => ({ Authorization: `Bearer ${token}` }),
 *   onError: (error, userMessage) => {
 *     console.error('Export failed:', error);
 *     alert(userMessage);
 *   },
 * });
 *
 * // In message actions:
 * await exportToGoogleDocs(message);
 * ```
 *
 * @param options - Configuration options
 * @returns Google Docs export utilities
 */
export function useGoogleDocsExport(
  options: UseGoogleDocsExportOptions
): UseGoogleDocsExportReturn {
  const { getAuthHeaders, onError } = options;

  /**
   * Detect document type from message content and workflow
   */
  const detectDocumentType = useCallback((message: Message): string => {
    // First, try workflow-based detection
    if (message.detectedWorkflow) {
      const workflowType = WORKFLOW_DOCUMENT_TYPES[message.detectedWorkflow];
      if (workflowType) {
        return workflowType;
      }
    }

    // Then, try content-based detection
    const content = message.content.toLowerCase();
    for (const pattern of CONTENT_PATTERNS) {
      if (pattern.keywords.some((keyword) => content.includes(keyword))) {
        return pattern.type;
      }
    }

    // Default fallback
    return 'Document';
  }, []);

  /**
   * Generate a document title from metadata
   */
  const generateDocumentTitle = useCallback(
    (documentType: string, timestamp: Date): string => {
      const dateStr = timestamp.toISOString().split('T')[0];
      return `${documentType}_${dateStr}`;
    },
    []
  );

  /**
   * Export a message to Google Docs
   */
  const exportToGoogleDocs = useCallback(
    async (message: Message) => {
      try {
        // Detect document type
        const documentType = detectDocumentType(message);

        // Generate title
        const timestamp = message.timestamp || new Date();
        const title = generateDocumentTitle(documentType, timestamp);

        // Call export API
        const response = await fetch('/api/documents/export-to-google-docs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            title,
            content: message.content,
            documentType,
            metadata: {
              date: timestamp.toISOString().split('T')[0],
            },
          }),
        });

        const data = await response.json();

        // Handle authentication required
        if (data.needsAuth) {
          const shouldConnect = confirm(
            'You need to connect your Google account to export documents. You will be redirected to Google. Connect now?'
          );
          if (shouldConnect) {
            window.location.href = '/api/auth/google';
          }
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Export failed');
        }

        // Open the document in a new tab
        window.open(data.editLink, '_blank');

        console.log('Document exported successfully:', data.webViewLink);
      } catch (error: any) {
        const userMessage = `Failed to export document: ${error.message}`;

        if (onError) {
          onError(error, userMessage);
        } else {
          // Fallback error handling if no handler provided
          console.error('Google Docs export error:', error);
          alert(userMessage);
        }
      }
    },
    [getAuthHeaders, detectDocumentType, generateDocumentTitle, onError]
  );

  return {
    exportToGoogleDocs,
    detectDocumentType,
    generateDocumentTitle,
  };
}
