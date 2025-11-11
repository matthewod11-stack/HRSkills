/**
 * Promotion Prediction API
 *
 * Endpoint: POST /api/ai/predict/promotion
 *
 * Predicts employee promotion readiness using Vertex AI.
 * Analyzes performance, tenure, skills, and development to forecast
 * when employees are ready for promotion.
 *
 * Features:
 * - Promotion readiness assessment (not_ready/developing/ready/overdue)
 * - Probability of promotion in next 12 months
 * - Estimated time until promotion ready
 * - Strength and development area identification
 * - Personalized career development plans
 *
 * Input: { employeeId } or { employeeIds: [...] } or { all: true }
 * Output: PromotionPrediction or PromotionPrediction[]
 *
 * Rate limit: 30 requests/minute (shared with other AI endpoints)
 * Cost: $0.000002 per prediction
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import { createSuccessResponse, handleApiError } from '@/lib/api-helpers'
import {
  predictPromotion,
  isVertexAIAvailable,
  calculatePredictionCost,
  type PromotionPrediction,
} from '@/lib/ai-services/vertex-ai-service'
import { readFile } from 'fs/promises'
import { join } from 'path'

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

    // Authorization - require analytics:read permission
    if (!hasPermission(authResult.user, 'analytics', 'read')) {
      return createErrorResponse('Forbidden: Requires analytics:read permission', 403)
    }

    // Check if Vertex AI is enabled
    if (process.env.NEXT_PUBLIC_ENABLE_VERTEX_AI !== 'true') {
      return createErrorResponse('Vertex AI is not enabled', 503)
    }

    // Parse request body
    const body = await request.json()
    const { employeeId, employeeIds, all = false } = body

    // Load employee data
    const dataPath = join(process.cwd(), '..', 'data', 'master-employees.json')
    let employeesData: any[]

    try {
      const fileContent = await readFile(dataPath, 'utf-8')
      employeesData = JSON.parse(fileContent)
    } catch (error) {
      return createErrorResponse('Failed to load employee data', 500)
    }

    let predictions: PromotionPrediction[]

    if (employeeId) {
      // Single employee prediction
      const employee = employeesData.find((emp: any) => emp.id === employeeId || emp.employee_id === employeeId)

      if (!employee) {
        return createErrorResponse('Employee not found', 404)
      }

      const prediction = await predictPromotion(employee)
      predictions = [prediction]
    } else if (employeeIds && Array.isArray(employeeIds)) {
      // Batch prediction for specific employees
      const employees = employeesData.filter((emp: any) =>
        employeeIds.includes(emp.id || emp.employee_id)
      )

      if (employees.length === 0) {
        return createErrorResponse('No employees found for provided IDs', 404)
      }

      predictions = await Promise.all(employees.map(emp => predictPromotion(emp)))
    } else if (all) {
      // Predict for all employees
      predictions = await Promise.all(employeesData.map(emp => predictPromotion(emp)))
    } else {
      return createErrorResponse('Must provide employeeId, employeeIds, or all=true', 400)
    }

    // Calculate statistics
    const readinessDistribution = {
      overdue: predictions.filter(p => p.promotionReadiness === 'overdue').length,
      ready: predictions.filter(p => p.promotionReadiness === 'ready').length,
      developing: predictions.filter(p => p.promotionReadiness === 'developing').length,
      not_ready: predictions.filter(p => p.promotionReadiness === 'not_ready').length,
    }

    const avgProbability = predictions.reduce((sum, p) => sum + p.probabilityOfPromotion, 0) / predictions.length

    // Calculate cost
    const cost = calculatePredictionCost(predictions.length)

    const processingTime = Date.now() - startTime

    return createSuccessResponse({
      success: true,
      data: {
        predictions: employeeId ? predictions[0] : predictions,
        summary: {
          totalEmployees: predictions.length,
          readinessDistribution,
          averageProbability: avgProbability.toFixed(3),
          promotionReady: readinessDistribution.overdue + readinessDistribution.ready,
          needsDevelopment: readinessDistribution.developing + readinessDistribution.not_ready,
        },
      },
      metadata: {
        processingTime,
        estimatedCost: cost,
        modelType: 'promotion',
        modelVersion: '1.0.0',
        usedMLModel: !!process.env.VERTEX_AI_PROMOTION_ENDPOINT_ID,
      },
    })
  } catch (error) {
    console.error('Promotion prediction error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to predict promotion readiness',
      500
    )
  }
}

/**
 * GET endpoint to check if promotion prediction is available
 */
export async function GET(request: NextRequest) {
  try {
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_VERTEX_AI === 'true'
    const isAvailable = isEnabled ? await isVertexAIAvailable() : false
    const hasEndpoint = !!process.env.VERTEX_AI_PROMOTION_ENDPOINT_ID

    return NextResponse.json({
      success: true,
      data: {
        enabled: isEnabled,
        available: isAvailable,
        modelDeployed: hasEndpoint,
        modelType: 'AutoML Binary Classification',
        features: [
          'Promotion readiness assessment (not_ready/developing/ready/overdue)',
          'Probability of promotion in next 12 months',
          'Estimated months until promotion ready',
          'Strengths and development areas',
          'Personalized career development recommendations',
        ],
        predictionFactors: [
          'Performance review ratings',
          'Tenure in current role',
          'Time since last promotion',
          'Skills and training investment',
          'Leadership indicators',
          'Employee engagement',
          'Team size and management experience',
        ],
        pricing: {
          costPerPrediction: 0.000002,
          estimatedMonthlyCost: '~$0.02 for 10,000 predictions',
          unit: 'USD',
        },
      },
    })
  } catch (error) {
    return createErrorResponse('Failed to check promotion prediction status', 500)
  }
}
