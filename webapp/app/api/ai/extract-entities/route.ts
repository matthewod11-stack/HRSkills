import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import { analyzeWithAI } from '@/lib/ai/router'
import type { AnalysisTask } from '@/lib/ai/types'

/**
 * POST /api/ai/extract-entities
 * Extract entities (people, places, organizations) from text using unified AI provider
 * Requires: Authentication + analytics read permission
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (AI endpoints: 30 req/min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.ai)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response
  }

  // Authenticate
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return authErrorResponse(authResult)
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'analytics', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to access AI services' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { text } = body

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: '"text" must be a non-empty string' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    const task: AnalysisTask = {
      type: 'entities',
      text,
    }

    const result = await analyzeWithAI(task, {
      userId: authResult.user.userId,
      endpoint: '/api/ai/extract-entities',
    })

    const response = {
      success: true,
      data: result.result,
      metadata: {
        processingTime: Date.now() - startTime,
        model: result.model,
        provider: result.provider,
      },
    }

    return createSuccessResponse(response)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/extract-entities',
      method: 'POST',
      userId: authResult.user.userId,
    })
  }
}
