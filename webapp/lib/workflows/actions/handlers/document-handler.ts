/**
 * Document Creation Action Handler
 *
 * Handles creation of HR documents (job descriptions, offer letters, PIPs, etc.)
 * Saves to SQLite database with optional Google Drive export.
 */

import type {
  ActionHandler,
  BaseAction,
  ActionContext,
  ActionResult,
  ActionValidationResult,
  CreateDocumentPayload
} from '../types'
import { createDocument, type CreateDocumentInput } from '@/lib/services/document-service'

/**
 * Document creation handler
 */
export const documentHandler: ActionHandler<CreateDocumentPayload> = {
  type: 'create_document',

  /**
   * Validate document creation action
   */
  async validate(
    action: BaseAction,
    context: ActionContext
  ): Promise<ActionValidationResult> {
    const errors = []
    const warnings = []
    const payload = action.payload as CreateDocumentPayload

    // Check required fields
    if (!payload.title) {
      errors.push({
        field: 'title',
        message: 'Document title is required',
        code: 'missing_required'
      })
    }

    if (!payload.content) {
      errors.push({
        field: 'content',
        message: 'Document content is required',
        code: 'missing_required'
      })
    }

    if (!payload.documentType) {
      errors.push({
        field: 'documentType',
        message: 'Document type is required',
        code: 'missing_required'
      })
    }

    // Validate document type
    const validTypes = [
      'job_description',
      'offer_letter',
      'pip',
      'termination_letter',
      'interview_guide',
      'performance_review',
      'onboarding_checklist',
      'custom'
    ]

    if (payload.documentType && !validTypes.includes(payload.documentType)) {
      errors.push({
        field: 'documentType',
        message: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
        code: 'invalid_value'
      })
    }

    // Check permissions for Google Drive
    if (payload.destination?.type === 'google_drive') {
      if (!context.userPermissions.includes('documents:write')) {
        errors.push({
          field: 'permissions',
          message: 'User does not have permission to create documents in Google Drive',
          code: 'permission_denied'
        })
      }

      warnings.push({
        field: 'destination',
        message: 'Google Drive integration not yet implemented. Document will be saved locally.'
      })
    }

    // Validate content length
    if (payload.content && payload.content.length < 10) {
      warnings.push({
        field: 'content',
        message: 'Document content is very short. Consider adding more details.'
      })
    }

    if (payload.content && payload.content.length > 100000) {
      warnings.push({
        field: 'content',
        message: 'Document content is very long (>100KB). This may take longer to process.'
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  },

  /**
   * Execute document creation
   */
  async execute(
    action: BaseAction,
    context: ActionContext
  ): Promise<ActionResult> {
    const startTime = Date.now()
    const payload = action.payload as CreateDocumentPayload

    try {
      // Format content based on format type
      let formattedContent = payload.content

      if (payload.format === 'html') {
        formattedContent = this.convertMarkdownToHtml(payload.content)
      } else if (payload.format === 'plain') {
        formattedContent = this.stripMarkdown(payload.content)
      }

      // Prepare metadata
      const metadata = {
        format: payload.format || 'markdown',
        workflowId: context.workflowId,
        userId: context.userId,
        destination: payload.destination,
      }

      // Create document in database (defaults to 'draft' status)
      const documentData: CreateDocumentInput = {
        type: payload.documentType,
        title: payload.title,
        content: formattedContent,
        employeeId: payload.employeeId || null,
        status: 'draft', // Always create as draft from chat
        metadataJson: JSON.stringify(metadata),
      }

      const document = await createDocument(documentData)

      // Build document URL
      const documentUrl = `/documents/${document.id}`

      const output = {
        documentId: document.id,
        url: documentUrl,
        title: document.title,
        documentType: document.type,
        status: document.status,
        format: payload.format || 'markdown',
        size: formattedContent.length,
        createdAt: document.createdAt,
        message: `Document "${payload.title}" created successfully as draft`
      }

      return {
        success: true,
        actionId: action.id,
        executedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        output,
        metadata: {
          workflowId: context.workflowId,
          userId: context.userId,
          documentType: payload.documentType,
          documentId: document.id
        }
      }
    } catch (error: any) {
      return {
        success: false,
        actionId: action.id,
        executedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: {
          code: 'document_creation_failed',
          message: error.message || 'Failed to create document',
          details: error
        }
      }
    }
  },

  /**
   * Estimate execution time
   */
  estimateDuration(): number {
    return 2000 // 2 seconds average
  },

  /**
   * Convert markdown to HTML (simple implementation)
   */
  convertMarkdownToHtml(markdown: string): string {
    // Simple markdown to HTML conversion
    // In production, use a proper markdown library
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gim, '<p>$1</p>')
  },

  /**
   * Strip markdown formatting
   */
  stripMarkdown(markdown: string): string {
    return markdown
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/`(.*?)`/g, '$1')
  },

  /**
   * Delay helper
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Register document handler with executor
 */
export function registerDocumentHandler(executor: any) {
  executor.registerHandler(documentHandler, {
    enabled: true,
    requiredPermissions: ['documents:write'],
    rateLimitPerHour: 100
  })
}
