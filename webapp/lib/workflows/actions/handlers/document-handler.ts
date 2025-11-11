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
  CreateDocumentPayload,
} from '../types';
import { createDocument, type CreateDocumentInput } from '@/lib/services/document-service';
import { getServiceAccountClient, getOAuthClient } from '@/lib/google/workspace-client';
import { Readable } from 'stream';

/**
 * Helper functions for document handling
 */

/**
 * Convert markdown to HTML (simple implementation)
 */
function convertMarkdownToHtml(markdown: string): string {
  // Simple markdown to HTML conversion
  // In production, use a proper markdown library
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*)\*/gim, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gim, '<p>$1</p>');
}

/**
 * Strip markdown formatting
 */
function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/`(.*?)`/g, '$1');
}

/**
 * Get folder name based on document type
 */
function getFolderNameForDocumentType(documentType: string): string {
  const folderMap: Record<string, string> = {
    job_description: 'Job Descriptions',
    offer_letter: 'Offer Letters',
    pip: 'Performance Improvement Plans',
    termination_letter: 'Termination Letters',
    interview_guide: 'Interview Guides',
    performance_review: 'Performance Reviews',
    onboarding_checklist: 'Onboarding Checklists',
    custom: 'HR Documents',
  };

  return folderMap[documentType] || 'HR Documents';
}

/**
 * Find or create a folder in Google Drive
 */
async function findOrCreateFolder(drive: any, folderName: string): Promise<string> {
  // Search for existing folder
  const searchResponse = await drive.files.list({
    q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  // Return existing folder if found
  if (searchResponse.data.files && searchResponse.data.files.length > 0) {
    return searchResponse.data.files[0].id;
  }

  // Create new folder
  const folderMetadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  return folder.data.id;
}

/**
 * Export document to Google Drive
 */
async function exportToGoogleDrive(
  documentId: string,
  title: string,
  content: string,
  documentType: string,
  destination: any,
  context: ActionContext
): Promise<{
  fileId: string;
  webViewLink: string;
  folderId?: string;
  sharedWith?: string[];
}> {
  // Get appropriate client based on available credentials
  let client;
  const hasServiceAccount = process.env.GOOGLE_CREDENTIALS_PATH;

  if (hasServiceAccount) {
    client = getServiceAccountClient();
  } else if (context.userId) {
    client = getOAuthClient(context.userId);
  } else {
    throw new Error('No Google Workspace authentication available');
  }

  const drive = await client.getDrive();

  // Determine folder based on document type
  const folderName = getFolderNameForDocumentType(documentType);
  let folderId = destination.folderId;

  // Create or find folder if not specified
  if (!folderId && folderName) {
    folderId = await findOrCreateFolder(drive, folderName);
  }

  // Create the document as a Google Doc
  const fileMetadata: any = {
    name: title,
    mimeType: 'application/vnd.google-apps.document',
  };

  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  // Convert content to text for upload
  const media = {
    mimeType: 'text/plain',
    body: Readable.from([content]),
  };

  // Upload to Drive
  const file = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });

  if (!file.data.id) {
    throw new Error('Failed to create file in Google Drive');
  }

  // Share with specified users if provided
  const sharedWith: string[] = [];
  if (destination.shareWith && Array.isArray(destination.shareWith)) {
    for (const email of destination.shareWith) {
      try {
        await drive.permissions.create({
          fileId: file.data.id,
          requestBody: {
            type: 'user',
            role: destination.sharePermission || 'writer',
            emailAddress: email,
          },
          sendNotificationEmail: destination.sendNotification !== false,
        });
        sharedWith.push(email);
      } catch (shareError) {
        console.error(`Failed to share with ${email}:`, shareError);
      }
    }
  }

  return {
    fileId: file.data.id,
    webViewLink: file.data.webViewLink || '',
    folderId,
    sharedWith: sharedWith.length > 0 ? sharedWith : undefined,
  };
}

/**
 * Document creation handler
 */
export const documentHandler: ActionHandler<CreateDocumentPayload> = {
  type: 'create_document',

  /**
   * Validate document creation action
   */
  async validate(action: BaseAction, context: ActionContext): Promise<ActionValidationResult> {
    const errors = [];
    const warnings = [];
    const payload = action.payload as CreateDocumentPayload;

    // Check required fields
    if (!payload.title) {
      errors.push({
        field: 'title',
        message: 'Document title is required',
        code: 'missing_required',
      });
    }

    if (!payload.content) {
      errors.push({
        field: 'content',
        message: 'Document content is required',
        code: 'missing_required',
      });
    }

    if (!payload.documentType) {
      errors.push({
        field: 'documentType',
        message: 'Document type is required',
        code: 'missing_required',
      });
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
      'custom',
    ];

    if (payload.documentType && !validTypes.includes(payload.documentType)) {
      errors.push({
        field: 'documentType',
        message: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
        code: 'invalid_value',
      });
    }

    // Check permissions for Google Drive
    if (payload.destination?.type === 'google_drive') {
      if (!context.userPermissions.includes('documents:write')) {
        errors.push({
          field: 'permissions',
          message: 'User does not have permission to create documents in Google Drive',
          code: 'permission_denied',
        });
      }

      // Check for Google credentials
      const hasServiceAccount = process.env.GOOGLE_CREDENTIALS_PATH;
      const hasOAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

      if (!hasServiceAccount && !hasOAuth) {
        warnings.push({
          field: 'destination',
          message: 'Google Workspace credentials not configured. Document will be saved to database only.',
        });
      }
    }

    // Validate content length
    if (payload.content && payload.content.length < 10) {
      warnings.push({
        field: 'content',
        message: 'Document content is very short. Consider adding more details.',
      });
    }

    if (payload.content && payload.content.length > 100000) {
      warnings.push({
        field: 'content',
        message: 'Document content is very long (>100KB). This may take longer to process.',
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Execute document creation
   */
  async execute(action: BaseAction, context: ActionContext): Promise<ActionResult> {
    const startTime = Date.now();
    const payload = action.payload as CreateDocumentPayload;

    try {
      // Format content based on format type
      let formattedContent = payload.content;

      if (payload.format === 'html') {
        formattedContent = convertMarkdownToHtml(payload.content);
      } else if (payload.format === 'plain') {
        formattedContent = stripMarkdown(payload.content);
      }

      // Prepare metadata
      const metadata = {
        format: payload.format || 'markdown',
        workflowId: context.workflowId,
        userId: context.userId,
        destination: payload.destination,
      };

      // Create document in database (defaults to 'draft' status)
      const documentData: CreateDocumentInput = {
        type: payload.documentType,
        title: payload.title,
        content: formattedContent,
        employeeId: payload.employeeId || null,
        status: 'draft', // Always create as draft from chat
        metadataJson: JSON.stringify(metadata),
      };

      const document = await createDocument(documentData);

      // Build document URL
      const documentUrl = `/documents/${document.id}`;

      // Initialize output
      const output: any = {
        documentId: document.id,
        url: documentUrl,
        title: document.title,
        documentType: document.type,
        status: document.status,
        format: payload.format || 'markdown',
        size: formattedContent.length,
        createdAt: document.createdAt,
        message: `Document "${payload.title}" created successfully as draft`,
      };

      // Export to Google Drive if requested
      if (payload.destination?.type === 'google_drive') {
        try {
          const driveResult = await exportToGoogleDrive(
            document.id,
            payload.title,
            formattedContent,
            payload.documentType,
            payload.destination,
            context
          );

          output.googleDrive = driveResult;
          output.message = `Document "${payload.title}" created and exported to Google Drive`;
        } catch (driveError: any) {
          // Don't fail the entire action if Drive export fails
          output.googleDriveError = driveError.message;
          output.message = `Document "${payload.title}" created but Google Drive export failed: ${driveError.message}`;
        }
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
          documentId: document.id,
          googleDriveFileId: output.googleDrive?.fileId,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        actionId: action.id,
        executedAt: new Date().toISOString(),
        duration: Date.now() - startTime,
        error: {
          code: 'document_creation_failed',
          message: error.message || 'Failed to create document',
          details: error,
        },
      };
    }
  },

  /**
   * Estimate execution time
   */
  estimateDuration(): number {
    return 2000; // 2 seconds average
  },
};

/**
 * Register document handler with executor
 */
export function registerDocumentHandler(executor: any) {
  executor.registerHandler(documentHandler, {
    enabled: true,
    requiredPermissions: ['documents:write'],
    rateLimitPerHour: 100,
  });
}
