import { NextRequest, NextResponse } from 'next/server'
import { getAggregatedMetrics } from '@/lib/performance-monitor'
import { requireAuth, authErrorResponse } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return authErrorResponse(authResult)
  }

  try {
    // Get last 24 hours of metrics
    const metrics = getAggregatedMetrics(24 * 60)

    if (metrics.sampleCount === 0) {
      // No data yet - return empty state
      return NextResponse.json({
        cacheHitRate: 0,
        avgCachedTokens: 0,
        avgInputTokens: 0,
        avgOutputTokens: 0,
        totalCost: 0,
        estimatedMonthlyCost: 0,
        savingsVsBaseline: 0,
        sampleCount: 0,
        periodStart: metrics.periodStart,
        periodEnd: metrics.periodEnd
      })
    }

    // Calculate monthly projections
    // Assume current usage pattern continues
    const requestsPerDay = 200 // Conservative estimate from optimization report
    const daysPerMonth = 30

    // Calculate cost per request based on current average
    const avgCostPerRequest = metrics.totalTokenCost / metrics.sampleCount

    // Project monthly cost
    const totalMonthlyRequests = requestsPerDay * daysPerMonth
    const monthlyCost = avgCostPerRequest * totalMonthlyRequests

    // Baseline cost before optimizations: $4,800/month (from optimization report)
    const baselineMonthlyCost = 4800
    const savings = baselineMonthlyCost - monthlyCost

    return NextResponse.json({
      cacheHitRate: metrics.cacheHitRate,
      avgCachedTokens: metrics.avgCachedTokens,
      avgInputTokens: metrics.avgInputTokens,
      avgOutputTokens: metrics.avgOutputTokens,
      totalCost: metrics.totalTokenCost,
      estimatedMonthlyCost: monthlyCost,
      savingsVsBaseline: Math.max(0, savings), // Don't show negative savings
      sampleCount: metrics.sampleCount,
      periodStart: metrics.periodStart,
      periodEnd: metrics.periodEnd
    })
  } catch (error) {
    console.error('Failed to calculate AI cost metrics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
