/**
 * Resume Parser API
 *
 * Endpoint: POST /api/ai/parse-resume
 *
 * Parses uploaded resume PDFs/images and extracts structured data:
 * - Personal information (name, email, phone, address)
 * - Work experience with dates and descriptions
 * - Education history
 * - Skills and certifications
 * - Languages and awards
 *
 * Input: FormData with 'resume' file (PDF, PNG, JPG, TIFF)
 * Output: Structured ResumeData object
 *
 * Rate limit: 30 requests/minute (shared with other AI endpoints)
 * Cost: $10/1000 pages (1000 pages/month free)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth/session'
import { applyRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit'
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response'
import {
  parseResume,
  isDocumentAIAvailable,
  calculateDocumentCost,
  mapResumeToEmployee,
  extractContactInfo,
  type ResumeData,
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
    const resumeFile = formData.get('resume') as File
    const mapToEmployee = formData.get('mapToEmployee') === 'true'
    const extractContactOnly = formData.get('extractContactOnly') === 'true'

    if (!resumeFile) {
      return createErrorResponse('Missing resume file', 400)
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

    if (!allowedTypes.includes(resumeFile.type)) {
      return createErrorResponse(
        `Invalid file type: ${resumeFile.type}. Allowed types: PDF, PNG, JPG, TIFF`,
        400
      )
    }

    // Check file size
    const arrayBuffer = await resumeFile.arrayBuffer()
    const resumeBuffer = Buffer.from(arrayBuffer)

    if (resumeBuffer.length > MAX_FILE_SIZE) {
      return createErrorResponse(
        `File too large: ${(resumeBuffer.length / 1024 / 1024).toFixed(2)}MB. Max size: 10MB`,
        400
      )
    }

    // Parse resume
    const resumeData = await parseResume(resumeBuffer, {
      skipHumanReview: true,
    })

    // Calculate cost (estimate 1 page for images, check PDF page count)
    const estimatedPages = resumeFile.type === 'application/pdf' ? 2 : 1
    const cost = calculateDocumentCost(estimatedPages, 'resume')

    // Prepare response based on options
    let responseData: any = {
      resume: resumeData,
    }

    if (extractContactOnly) {
      responseData = {
        contact: extractContactInfo(resumeData),
      }
    } else if (mapToEmployee) {
      responseData = {
        resume: resumeData,
        employeeMapping: mapResumeToEmployee(resumeData),
      }
    }

    const processingTime = Date.now() - startTime

    return createSuccessResponse({
      success: true,
      data: responseData,
      metadata: {
        fileName: resumeFile.name,
        fileSize: resumeBuffer.length,
        fileType: resumeFile.type,
        confidence: resumeData.confidence,
        processingTime,
        estimatedCost: cost,
        extractedFields: {
          hasName: !!resumeData.name,
          hasEmail: !!resumeData.email,
          hasPhone: !!resumeData.phone,
          experienceCount: resumeData.experience.length,
          educationCount: resumeData.education.length,
          skillsCount: resumeData.skills.length,
        },
      },
    })
  } catch (error) {
    console.error('Resume parsing error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to parse resume',
      500
    )
  }
}

/**
 * GET endpoint to check if resume parser is available
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
        maxFileSize: '10MB',
        pricing: {
          freePages: 1000,
          costPer1000Pages: 10,
          unit: 'USD',
        },
      },
    })
  } catch (error) {
    return createErrorResponse('Failed to check resume parser status', 500)
  }
}
