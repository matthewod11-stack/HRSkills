/**
 * Documents API - List and Create
 *
 * GET  /api/documents - List documents with filters
 * POST /api/documents - Create a new document
 *
 * Query Parameters (GET):
 *   - type: Filter by document type (offer_letter, pip, etc.)
 *   - status: Filter by status (draft, final)
 *   - employeeId: Filter by employee
 *   - search: Search in title and content
 *   - limit: Number of results (default 20)
 *   - offset: Pagination offset (default 0)
 *
 * Request Body (POST):
 *   {
 *     type: string (required)
 *     title: string (required)
 *     content: string (required)
 *     employeeId?: string
 *     status?: 'draft' | 'final' (default: 'draft')
 *     metadataJson?: string
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth/middleware'
import {
  handleApiError,
  createSuccessResponse,
  validationError,
  HttpStatus,
} from '@/lib/api-helpers/error-handler'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import {
  createDocument,
  listDocuments,
  type CreateDocumentInput,
  type DocumentFilters,
} from '@/lib/services/document-service'
import { z } from 'zod'

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createDocumentSchema = z.object({
  type: z.string().min(1, 'Document type is required'),
  title: z.string().min(1, 'Title is required').max(500, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  employeeId: z.string().optional().nullable(),
  status: z.enum(['draft', 'final']).optional().default('draft'),
  metadataJson: z.string().optional().nullable(),
})

// ============================================================================
// GET /api/documents - List Documents
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.standard)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response
    }

    // 2. Authentication
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode || 401 }
      )
    }

    // 3. Authorization check
    if (!hasPermission(authResult.user, 'documents', 'read')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to read documents' },
        { status: 403 }
      )
    }

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url)
    const filters: DocumentFilters = {
      type: searchParams.get('type') || undefined,
      status: (searchParams.get('status') as 'draft' | 'final') || undefined,
      employeeId: searchParams.get('employeeId') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    }

    // 5. Fetch documents
    const result = await listDocuments(filters)

    return createSuccessResponse(
      {
        documents: result.documents,
        pagination: {
          total: result.total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: result.hasMore,
        },
      },
      undefined,
      HttpStatus.OK
    )
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/documents',
      method: 'GET',
      userId: 'unknown',
    })
  }
}

// ============================================================================
// POST /api/documents - Create Document
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting (stricter for creation)
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.standard)
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response
    }

    // 2. Authentication
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.statusCode || 401 }
      )
    }

    // 3. Authorization check
    if (!hasPermission(authResult.user, 'documents', 'write')) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create documents' },
        { status: 403 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validation = createDocumentSchema.safeParse(body)

    if (!validation.success) {
      return validationError('Invalid document data', {
        errors: validation.error.errors,
      })
    }

    // 5. Create document
    const documentData: CreateDocumentInput = validation.data
    const document = await createDocument(documentData)

    return createSuccessResponse(
      { document, id: document.id, url: `/documents/${document.id}` },
      'Document created successfully',
      HttpStatus.CREATED
    )
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/documents',
      method: 'POST',
      userId: 'unknown',
    })
  }
}
