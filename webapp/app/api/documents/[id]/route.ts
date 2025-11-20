/**
 * Documents API - Single Document Operations
 *
 * GET    /api/documents/[id] - Fetch single document
 * PATCH  /api/documents/[id] - Update document (content, status, metadata)
 * DELETE /api/documents/[id] - Delete document
 *
 * Request Body (PATCH):
 *   {
 *     title?: string
 *     content?: string
 *     status?: 'draft' | 'final'
 *     employeeId?: string
 *     metadataJson?: string
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import {
  handleApiError,
  createSuccessResponse,
  validationError,
  notFoundError,
  HttpStatus,
} from '@/lib/api-helpers/error-handler';
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter';
import {
  getDocument,
  updateDocument,
  deleteDocument,
  type UpdateDocumentInput,
} from '@/lib/services/document-service';
import { logAuditEvent, getRequestMetadata } from '@/lib/security/audit-logger';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const updateDocumentSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(['draft', 'final']).optional(),
  employeeId: z.string().optional().nullable(),
  metadataJson: z.string().optional().nullable(),
  googleDocId: z.string().optional().nullable(),
  googleDriveUrl: z.string().optional().nullable(),
});

// ============================================================================
// GET /api/documents/[id] - Fetch Single Document
// ============================================================================

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.standard);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // 2. Authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode || 401 }
      );
    }

    // 3. Single-user model: authenticated = authorized

    // 4. Fetch document
    const document = await getDocument((await params).id);

    if (!document) {
      return notFoundError('Document');
    }

    return createSuccessResponse({ document }, undefined, HttpStatus.OK);
  } catch (error) {
    return handleApiError(error, {
      endpoint: `/api/documents/${(await params).id}`,
      method: 'GET',
      userId: 'unknown',
    });
  }
}

// ============================================================================
// PATCH /api/documents/[id] - Update Document
// ============================================================================

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.standard);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // 2. Authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode || 401 }
      );
    }

    // 3. Single-user model: authenticated = authorized

    // 4. Verify document exists
    const existingDocument = await getDocument((await params).id);
    if (!existingDocument) {
      return notFoundError('Document');
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const validation = updateDocumentSchema.safeParse(body);

    if (!validation.success) {
      return validationError('Invalid update data', {
        errors: validation.error.issues,
      });
    }

    // 6. Check if trying to transition from final back to draft (not allowed)
    if (existingDocument.status === 'final' && validation.data.status === 'draft') {
      return validationError('Cannot change status from final to draft', {
        reason: 'Finalized documents cannot be reverted to draft status',
      });
    }

    // 7. Update document
    const updateData: UpdateDocumentInput = validation.data;
    const document = await updateDocument((await params).id, updateData);

    return createSuccessResponse({ document }, 'Document updated successfully', HttpStatus.OK);
  } catch (error) {
    return handleApiError(error, {
      endpoint: `/api/documents/${(await params).id}`,
      method: 'PATCH',
      userId: 'unknown',
    });
  }
}

// ============================================================================
// DELETE /api/documents/[id] - Delete Document
// ============================================================================

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.standard);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response;
    }

    // 2. Authentication
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode || 401 }
      );
    }

    // 3. Single-user model: authenticated = authorized

    // 4. Verify document exists
    const existingDocument = await getDocument((await params).id);
    if (!existingDocument) {
      return notFoundError('Document');
    }

    // 5. Log audit event before deletion (document info will be gone after deletion)
    const requestMeta = getRequestMetadata(request);
    await logAuditEvent({
      eventType: 'data.delete',
      severity: 'warning',
      userId: authResult.user.userId,
      userEmail: authResult.user.email,
      userRoles: [authResult.user.role], // Convert string role to array
      sessionId: authResult.user.sessionId,
      resource: 'document',
      action: 'delete',
      success: true,
      message: `Document deleted: ${existingDocument.title}`,
      metadata: {
        documentId: (await params).id,
        documentType: existingDocument.type,
        documentTitle: existingDocument.title,
        employeeId: existingDocument.employeeId || null,
        documentStatus: existingDocument.status,
      },
      ...requestMeta,
    });

    // 6. Delete document
    await deleteDocument((await params).id);

    return createSuccessResponse({ id: (await params).id }, 'Document deleted successfully', HttpStatus.OK);
  } catch (error) {
    return handleApiError(error, {
      endpoint: `/api/documents/${(await params).id}`,
      method: 'DELETE',
      userId: 'unknown',
    });
  }
}
