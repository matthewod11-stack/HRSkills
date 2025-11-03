import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // TODO: Pull real data from Rippling
    // For now, return mock data
    const metrics = {
      headcount: 150,
      turnoverRate: 8.5,
      openPositions: 12,
      timeToFill: 32,
      newHiresThisMonth: 5,
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json(metrics)
  } catch (error: any) {
    console.error('Metrics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics', details: error.message },
      { status: 500 }
    )
  }
}
