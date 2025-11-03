'use client'

import { useEffect, useState } from 'react'

interface Metrics {
  headcount: number
  turnoverRate: number
  openPositions: number
  timeToFill: number
  newHiresThisMonth: number
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/metrics')
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card">
        <p className="text-gray-600">Loading metrics...</p>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="card">
        <p className="text-gray-600">Failed to load metrics. Check API configuration.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MetricCard
        label="Total Headcount"
        value={metrics.headcount}
        trend="+2.5%"
        trendUp
      />
      <MetricCard
        label="Turnover Rate"
        value={`${metrics.turnoverRate}%`}
        trend="-0.5%"
        trendUp={false}
      />
      <MetricCard
        label="Open Positions"
        value={metrics.openPositions}
        trend="+3"
      />
      <MetricCard
        label="Avg Time to Fill"
        value={`${metrics.timeToFill} days`}
        trend="-5 days"
        trendUp={false}
      />
      <MetricCard
        label="New Hires (This Month)"
        value={metrics.newHiresThisMonth}
      />
    </div>
  )
}

function MetricCard({
  label,
  value,
  trend,
  trendUp
}: {
  label: string
  value: string | number
  trend?: string
  trendUp?: boolean
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        {trend && (
          <div
            className={`text-sm font-medium ${
              trendUp ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend}
          </div>
        )}
      </div>
    </div>
  )
}
