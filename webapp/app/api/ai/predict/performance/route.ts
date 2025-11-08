/**
 * Performance Prediction API
 *
 * Endpoint: POST /api/ai/predict/performance
 *
 * Predicts employee performance in next review cycle using Vertex AI.
 * Analyzes historical reviews, engagement, training, and other factors
 * to forecast future performance ratings.
 *
 * Features:
 * - Next review rating prediction (1-5 scale)
 * - Performance trend analysis (improve/maintain/decline)
 * - Influencing factor identification
 * - Personalized development recommendations
 * - Comparison with current performance
 *
 * Input: { employeeId } or { employeeIds: [...] } or { all: true }
 * Output: PerformancePrediction or PerformancePrediction[]
 *
 * Rate limit: 30 requests/minute (shared with other AI endpoints)
 * Cost: $0.000002 per prediction
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth/session'
import { applyRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit'
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response'
import {
  predictPerformance,
  isVertexAIAvailable,
  calculatePredictionCost,
  type PerformancePrediction,
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

    let predictions: PerformancePrediction[]

    if (employeeId) {
      // Single employee prediction
      const employee = employeesData.find((emp: any) => emp.id === employeeId || emp.employee_id === employeeId)

      if (!employee) {
        return createErrorResponse('Employee not found', 404)
      }

      const prediction = await predictPerformance(employee)
      predictions = [prediction]
    } else if (employeeIds && Array.isArray(employeeIds)) {
      // Batch prediction for specific employees
      const employees = employeesData.filter((emp: any) =>
        employeeIds.includes(emp.id || emp.employee_id)
      )

      if (employees.length === 0) {
        return createErrorResponse('No employees found for provided IDs', 404)
      }

      predictions = await Promise.all(employees.map(emp => predictPerformance(emp)))
    } else if (all) {
      // Predict for all employees
      predictions = await Promise.all(employeesData.map(emp => predictPerformance(emp)))
    } else {
      return createErrorResponse('Must provide employeeId, employeeIds, or all=true', 400)
    }

    // Calculate statistics
    const ratingDistribution = {
      '5': predictions.filter(p => p.predictedRating >= 4.5).length,
      '4': predictions.filter(p => p.predictedRating >= 3.5 && p.predictedRating < 4.5).length,
      '3': predictions.filter(p => p.predictedRating >= 2.5 && p.predictedRating < 3.5).length,
      '2': predictions.filter(p => p.predictedRating >= 1.5 && p.predictedRating < 2.5).length,
      '1': predictions.filter(p => p.predictedRating < 1.5).length,
    }

    const trendDistribution = {
      improve: predictions.filter(p => p.expectedChange === 'improve').length,
      maintain: predictions.filter(p => p.expectedChange === 'maintain').length,
      decline: predictions.filter(p => p.expectedChange === 'decline').length,
    }

    const avgPredictedRating = predictions.reduce((sum, p) => sum + p.predictedRating, 0) / predictions.length

    // Calculate cost
    const cost = calculatePredictionCost(predictions.length)

    const processingTime = Date.now() - startTime

    return createSuccessResponse({
      success: true,
      data: {
        predictions: employeeId ? predictions[0] : predictions,
        summary: {
          totalEmployees: predictions.length,
          averagePredictedRating: avgPredictedRating.toFixed(2),
          ratingDistribution,
          trendDistribution,
          highPerformers: ratingDistribution['5'] + ratingDistribution['4'],
          needsSupport: ratingDistribution['1'] + ratingDistribution['2'],
        },
      },
      metadata: {
        processingTime,
        estimatedCost: cost,
        modelType: 'performance',
        modelVersion: '1.0.0',
        usedMLModel: !!process.env.VERTEX_AI_PERFORMANCE_ENDPOINT_ID,
      },
    })
  } catch (error) {
    console.error('Performance prediction error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to predict performance',
      500
    )
  }
}

/**
 * GET endpoint to check if performance prediction is available
 */
export async function GET(request: NextRequest) {
  try {
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_VERTEX_AI === 'true'
    const isAvailable = isEnabled ? await isVertexAIAvailable() : false
    const hasEndpoint = !!process.env.VERTEX_AI_PERFORMANCE_ENDPOINT_ID

    return NextResponse.json({
      success: true,
      data: {
        enabled: isEnabled,
        available: isAvailable,
        modelDeployed: hasEndpoint,
        modelType: 'AutoML Regression',
        features: [
          'Next review rating prediction (1-5 scale)',
          'Performance trend analysis (improve/maintain/decline)',
          'Influencing factor identification',
          'Development recommendations',
          'Comparison with current performance',
        ],
        predictionFactors: [
          'Historical review scores',
          'Review sentiment analysis',
          'Employee engagement (eNPS)',
          'Training and development hours',
          'Tenure and experience',
          'Manager feedback patterns',
          'Team dynamics',
        ],
        pricing: {
          costPerPrediction: 0.000002,
          estimatedMonthlyCost: '~$0.02 for 10,000 predictions',
          unit: 'USD',
        },
      },
    })
  } catch (error) {
    return createErrorResponse('Failed to check performance prediction status', 500)
  }
}
