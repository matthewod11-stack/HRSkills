/**
 * OCR Image API
 *
 * Endpoint: POST /api/ai/ocr-image
 *
 * Performs Optical Character Recognition (OCR) on images and PDFs:
 * - Extract text from scanned documents
 * - Extract tables from images
 * - Detect entities (names, dates, organizations)
 * - Multi-language support (100+ languages)
 * - Page-level text extraction
 *
 * Use cases:
 * - Digitize paper documents
 * - Extract text from screenshots
 * - Parse scanned employee records
 * - OCR evidence documents for ER cases
 * - Extract data from email screenshots
 *
 * Input: FormData with 'image' file (PDF, PNG, JPG, TIFF)
 * Output: OCRResult with text, tables, and entities
 *
 * Rate limit: 30 requests/minute (shared with other AI endpoints)
 * Cost: $1.50/1000 pages (1000 pages/month free)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth/session'
import { applyRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit'
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response'
import {
  performOCR,
  isDocumentAIAvailable,
  calculateDocumentCost,
  type OCRResult,
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

    // Authorization - require employees:read or data_upload:read
    if (
      !hasPermission(authResult.user, 'employees', 'read') &&
      !hasPermission(authResult.user, 'data_upload', 'read')
    ) {
      return createErrorResponse('Forbidden: Requires employees:read or data_upload:read permission', 403)
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
    const imageFile = formData.get('image') as File
    const extractTables = formData.get('extractTables') === 'true'
    const extractEntities = formData.get('extractEntities') === 'true'
    const languages = formData.get('languages') as string | null

    if (!imageFile) {
      return createErrorResponse('Missing image file', 400)
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/tiff',
      'image/tif',
      'image/gif',
      'image/bmp',
      'image/webp',
    ]

    if (!allowedTypes.includes(imageFile.type)) {
      return createErrorResponse(
        `Invalid file type: ${imageFile.type}. Allowed types: PDF, PNG, JPG, TIFF, GIF, BMP, WebP`,
        400
      )
    }

    // Check file size
    const arrayBuffer = await imageFile.arrayBuffer()
    const imageBuffer = Buffer.from(arrayBuffer)

    if (imageBuffer.length > MAX_FILE_SIZE) {
      return createErrorResponse(
        `File too large: ${(imageBuffer.length / 1024 / 1024).toFixed(2)}MB. Max size: 10MB`,
        400
      )
    }

    // Parse OCR languages
    const ocrLanguages = languages ? languages.split(',').map(l => l.trim()) : undefined

    // Perform OCR
    const ocrResult = await performOCR(imageBuffer, {
      extractTables,
      extractEntities,
      ocrLanguages,
      skipHumanReview: true,
    })

    // Calculate statistics
    const wordCount = ocrResult.text.split(/\s+/).filter(w => w.length > 0).length
    const lineCount = ocrResult.text.split('\n').filter(l => l.trim().length > 0).length

    // Calculate cost (estimate 1 page per image, check PDF page count)
    const estimatedPages = imageFile.type === 'application/pdf' ? ocrResult.pages.length : 1
    const cost = calculateDocumentCost(estimatedPages, 'ocr')

    const processingTime = Date.now() - startTime

    return createSuccessResponse({
      success: true,
      data: {
        text: ocrResult.text,
        pages: ocrResult.pages,
        tables: ocrResult.tables,
        entities: ocrResult.entities,
        confidence: ocrResult.confidence,
      },
      metadata: {
        fileName: imageFile.name,
        fileSize: imageBuffer.length,
        fileType: imageFile.type,
        processingTime,
        estimatedCost: cost,
        statistics: {
          pageCount: ocrResult.pages.length,
          wordCount,
          lineCount,
          characterCount: ocrResult.text.length,
          tableCount: ocrResult.tables?.length || 0,
          entityCount: ocrResult.entities?.length || 0,
          averageConfidence: ocrResult.confidence,
        },
      },
    })
  } catch (error) {
    console.error('OCR error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to perform OCR',
      500
    )
  }
}

/**
 * GET endpoint to check if OCR is available
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
        supportedFormats: ['PDF', 'PNG', 'JPG', 'TIFF', 'GIF', 'BMP', 'WebP'],
        features: [
          'Text extraction from images',
          'Table extraction',
          'Entity detection (names, dates, organizations)',
          '100+ language support',
          'Page-level text extraction',
          'Confidence scores',
        ],
        maxFileSize: '10MB',
        languageSupport: '100+ languages including English, Spanish, French, German, Chinese, Japanese, etc.',
        pricing: {
          freePages: 1000,
          costPer1000Pages: 1.5,
          unit: 'USD',
        },
      },
    })
  } catch (error) {
    return createErrorResponse('Failed to check OCR status', 500)
  }
}
