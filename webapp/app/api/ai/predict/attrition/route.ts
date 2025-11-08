/**
 * Attrition Prediction API
 *
 * Endpoint: POST /api/ai/predict/attrition
 *
 * Predicts employee flight risk using Vertex AI machine learning models.
 * Analyzes factors like eNPS, tenure, compensation, performance reviews,
 * and generates actionable recommendations.
 *
 * Features:
 * - Individual employee prediction
 * - Batch prediction for entire workforce
 * - Risk factor identification
 * - Personalized retention recommendations
 * - Flight risk categorization (low/medium/high/critical)
 *
 * Input: { employeeId } or { employeeIds: [...] } or { all: true }
 * Output: AttritionPrediction or AttritionPrediction[]
 *
 * Rate limit: 30 requests/minute (shared with other AI endpoints)
 * Cost: $0.000002 per prediction (~$0.02 for 10,000 predictions)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission } from '@/lib/auth/session'
import { applyRateLimit, RateLimitPresets } from '@/lib/middleware/rate-limit'
import { createSuccessResponse, createErrorResponse } from '@/lib/utils/api-response'
import {
  predictAttrition,
  batchPredictAttrition,
  isVertexAIAvailable,
  calculatePredictionCost,
  type AttritionPrediction,
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

    let predictions: AttritionPrediction[]

    if (employeeId) {
      // Single employee prediction
      const employee = employeesData.find((emp: any) => emp.id === employeeId || emp.employee_id === employeeId)

      if (!employee) {
        return createErrorResponse('Employee not found', 404)
      }

      const prediction = await predictAttrition(employee)
      predictions = [prediction]
    } else if (employeeIds && Array.isArray(employeeIds)) {
      // Batch prediction for specific employees
      const employees = employeesData.filter((emp: any) =>
        employeeIds.includes(emp.id || emp.employee_id)
      )

      if (employees.length === 0) {
        return createErrorResponse('No employees found for provided IDs', 404)
      }

      predictions = await batchPredictAttrition(employees)
    } else if (all) {
      // Predict for all employees
      predictions = await batchPredictAttrition(employeesData)
    } else {
      return createErrorResponse('Must provide employeeId, employeeIds, or all=true', 400)
    }

    // Calculate statistics
    const riskDistribution = {
      critical: predictions.filter(p => p.flightRisk === 'critical').length,
      high: predictions.filter(p => p.flightRisk === 'high').length,
      medium: predictions.filter(p => p.flightRisk === 'medium').length,
      low: predictions.filter(p => p.flightRisk === 'low').length,
    }

    const avgProbability = predictions.reduce((sum, p) => sum + p.probabilityToLeave, 0) / predictions.length

    // Calculate cost
    const cost = calculatePredictionCost(predictions.length)

    const processingTime = Date.now() - startTime

    return createSuccessResponse({
      success: true,
      data: {
        predictions: employeeId ? predictions[0] : predictions,
        summary: {
          totalEmployees: predictions.length,
          riskDistribution,
          averageProbability: avgProbability.toFixed(3),
          highRiskCount: riskDistribution.critical + riskDistribution.high,
        },
      },
      metadata: {
        processingTime,
        estimatedCost: cost,
        modelType: 'attrition',
        modelVersion: '1.0.0',
        usedMLModel: !!process.env.VERTEX_AI_ATTRITION_ENDPOINT_ID,
      },
    })
  } catch (error) {
    console.error('Attrition prediction error:', error)
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to predict attrition',
      500
    )
  }
}

/**
 * GET endpoint to check if attrition prediction is available
 */
export async function GET(request: NextRequest) {
  try {
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_VERTEX_AI === 'true'
    const isAvailable = isEnabled ? await isVertexAIAvailable() : false
    const hasEndpoint = !!process.env.VERTEX_AI_ATTRITION_ENDPOINT_ID

    return NextResponse.json({
      success: true,
      data: {
        enabled: isEnabled,
        available: isAvailable,
        modelDeployed: hasEndpoint,
        modelType: 'AutoML Binary Classification',
        features: [
          'Flight risk prediction (low/medium/high/critical)',
          'Risk factor identification',
          'Personalized retention recommendations',
          'Batch prediction support',
          'Real-time predictions',
        ],
        predictionFactors: [
          'Employee Net Promoter Score (eNPS)',
          'Tenure in months',
          'Compensation percentile',
          'Months since last raise',
          'Performance review sentiment',
          'Review rating trends',
          'Sick days and PTO usage',
          'Training hours',
          'Promotion history',
        ],
        pricing: {
          costPerPrediction: 0.000002,
          estimatedMonthlyCost: '~$0.02 for 10,000 predictions',
          unit: 'USD',
        },
      },
    })
  } catch (error) {
    return createErrorResponse('Failed to check attrition prediction status', 500)
  }
}
