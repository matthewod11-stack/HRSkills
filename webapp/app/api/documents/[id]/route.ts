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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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
    const document = await getDocument(params.id);

    if (!document) {
      return notFoundError('Document');
    }

    return createSuccessResponse({ document }, undefined, HttpStatus.OK);
  } catch (error) {
    return handleApiError(error, {
      endpoint: `/api/documents/${params.id}`,
      method: 'GET',
      userId: 'unknown',
    });
  }
}

// ============================================================================
// PATCH /api/documents/[id] - Update Document
// ============================================================================

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const existingDocument = await getDocument(params.id);
    if (!existingDocument) {
      return notFoundError('Document');
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const validation = updateDocumentSchema.safeParse(body);

    if (!validation.success) {
      return validationError('Invalid update data', {
        errors: validation.error.errors,
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
    const document = await updateDocument(params.id, updateData);

    return createSuccessResponse({ document }, 'Document updated successfully', HttpStatus.OK);
  } catch (error) {
    return handleApiError(error, {
      endpoint: `/api/documents/${params.id}`,
      method: 'PATCH',
      userId: 'unknown',
    });
  }
}

// ============================================================================
// DELETE /api/documents/[id] - Delete Document
// ============================================================================

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
    const existingDocument = await getDocument(params.id);
    if (!existingDocument) {
      return notFoundError('Document');
    }

    // 5. Delete document
    await deleteDocument(params.id);

    // TODO: Add audit log entry
    // await logAuditEvent({
    //   action: 'document.deleted',
    //   userId: authResult.user.userId,
    //   resourceId: params.id,
    //   metadata: { documentType: existingDocument.type, title: existingDocument.title }
    // })

    return createSuccessResponse({ id: params.id }, 'Document deleted successfully', HttpStatus.OK);
  } catch (error) {
    return handleApiError(error, {
      endpoint: `/api/documents/${params.id}`,
      method: 'DELETE',
      userId: 'unknown',
    });
  }
}
