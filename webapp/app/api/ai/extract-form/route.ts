/**
 * Form Extraction API
 *
 * Endpoint: POST /api/ai/extract-form
 *
 * Extracts structured data from HR forms:
 * - W-4 (Employee's Withholding Certificate)
 * - I-9 (Employment Eligibility Verification)
 * - W-2 (Wage and Tax Statement)
 * - Performance review forms
 * - Custom HR forms
 *
 * Features:
 * - Field extraction with confidence scores
 * - Table extraction
 * - Form type detection
 * - Checkbox and signature detection
 *
 * Input: FormData with 'form' file (PDF, PNG, JPG, TIFF)
 * Output: FormParseResult with fields and tables
 *
 * Rate limit: 30 requests/minute (shared with other AI endpoints)
 * Cost: $10/1000 pages (1000 pages/month free)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth/session'
import { applyRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit'
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response'
import {
  parseForm,
  isDocumentAIAvailable,
  calculateDocumentCost,
  type FormParseResult,
  type FormField,
} from '@/lib/ai-services/document-ai-service'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitResult = await applyRateLimit(request, RateLimitPresets.ai)
    if (!rateLimitResult.success) {
      return createErrorResponse('Too many requests', 429, {
        retryAfter: rateLimitResult.retryAfter,
      })
    }

    // Authentication
    const authResult = await requireAuth(request)
    if (!authResult.authenticated) {
      return createErrorResponse('Unauthorized', 401)
    }

    // Authorization - require employees:write or data_upload:write
    if (
      !hasPermission(authResult.user, 'employees', 'write') &&
      !hasPermission(authResult.user, 'data_upload', 'write')
    ) {
      return createErrorResponse('Forbidden: Requires employees:write or data_upload:write permission', 403)
    }

    // Check if Document AI is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_DOCUMENT_AI !== 'true') {
      return createErrorResponse('Document AI is not enabled', 503)
    }

    // Check if Document AI is available
    const isAvailable = await isDocumentAIAvailable()
    if (!isAvailable) {
      return createErrorResponse('Document AI service is not available', 503)
    }

    // Parse FormData
    const formData = await request.formData()
    const formFile = formData.get('form') as File
    const extractTables = formData.get('extractTables') !== 'false' // Default true

    if (!formFile) {
      return createErrorResponse('Missing form file', 400)
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/tiff',
      'image/tif',
    ]

    if (!allowedTypes.includes(formFile.type)) {
      return createErrorResponse(
        `Invalid file type: ${formFile.type}. Allowed types: PDF, PNG, JPG, TIFF`,
        400
      )
    }

    // Check file size
    const arrayBuffer = await formFile.arrayBuffer()
    const formBuffer = Buffer.from(arrayBuffer)

    if (formBuffer.length > MAX_FILE_SIZE) {
      return createErrorResponse(
        `File too large: ${(formBuffer.length / 1024 / 1024).toFixed(2)}MB. Max size: 10MB`,
        400
      )
    }

    // Parse form
    const formResult = await parseForm(formBuffer, {
      extractTables,
      skipHumanReview: true,
    })

    // Group fields by type for easier access
    const fieldsByType = groupFieldsByType(formResult.fields)

    // Calculate cost (estimate based on file type)
    const estimatedPages = formFile.type === 'application/pdf' ? 2 : 1
    const cost = calculateDocumentCost(estimatedPages, 'form')

    const processingTime = Date.now() - startTime

    return createSuccessResponse({
      success: true,
      data: {
        formType: formResult.formType,
        fields: formResult.fields,
        fieldsByType,
        tables: formResult.tables,
        rawText: formResult.rawText,
        confidence: formResult.confidence,
      },
      metadata: {
        fileName: formFile.name,
        fileSize: formBuffer.length,
        fileType: formFile.type,
        processingTime,
        estimatedCost: cost,
        extractedData: {
          fieldCount: formResult.fields.length,
          tableCount: formResult.tables?.length || 0,
          textLength: formResult.rawText?.length || 0,
          detectedFormType: formResult.formType,
        },
      },
    })
  } catch (error) {
    console.error('Form extraction error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to extract form data',
      500
    )
  }
}

/**
 * Group form fields by their type for easier access
 */
function groupFieldsByType(fields: FormField[]): Record<string, FormField[]> {
  const grouped: Record<string, FormField[]> = {
    text: [],
    number: [],
    date: [],
    checkbox: [],
    signature: [],
  }

  for (const field of fields) {
    grouped[field.type].push(field)
  }

  return grouped
}

/**
 * GET endpoint to check if form parser is available
 */
export async function GET(request: NextRequest) {
  try {
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_DOCUMENT_AI === 'true'
    const isAvailable = isEnabled ? await isDocumentAIAvailable() : false

    return NextResponse.json({
      success: true,
      data: {
        enabled: isEnabled,
        available: isAvailable,
        supportedFormats: ['PDF', 'PNG', 'JPG', 'TIFF'],
        supportedForms: [
          'W-4 (Employee Withholding)',
          'I-9 (Employment Eligibility)',
          'W-2 (Wage and Tax Statement)',
          'Performance Review Forms',
          'Custom HR Forms',
        ],
        maxFileSize: '10MB',
        features: [
          'Field extraction with confidence scores',
          'Table extraction',
          'Automatic form type detection',
          'Checkbox and signature detection',
        ],
        pricing: {
          freePages: 1000,
          costPer1000Pages: 10,
          unit: 'USD',
        },
      },
    })
  } catch (error) {
    return createErrorResponse('Failed to check form parser status', 500)
  }
}
