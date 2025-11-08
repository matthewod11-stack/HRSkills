'use client'

import { useEffect, useState } from 'react'
import { TrendingDown, Zap, DollarSign, Database, Activity, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth/auth-context'

interface MetricsSummary {
  cacheHitRate: number
  avgCachedTokens: number
  avgInputTokens: number
  avgOutputTokens: number
  totalCost: number
  estimatedMonthlyCost: number
  savingsVsBaseline: number
  sampleCount: number
  periodStart: string
  periodEnd: string
}

export function AIMetricsDashboard() {
  const { getAuthHeaders } = useAuth()
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMetrics = async () => {
    try {
      setError(null)
      const response = await fetch('/api/metrics/ai-costs', {
        headers: getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`)
      }

      const data = await response.json()
      setMetrics(data)
      setLastUpdated(new Date())
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch AI metrics:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading && !metrics) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/5 rounded-lg w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-white/5 rounded-lg"></div>
            ))}
          </div>
          <div className="h-48 bg-white/5 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error && !metrics) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-red-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-400 mb-1">Failed to Load Metrics</h3>
            <p className="text-sm text-gray-300">{error}</p>
            <button
              onClick={fetchMetrics}
              className="mt-3 text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded border border-red-500/30 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!metrics || metrics.sampleCount === 0) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-blue-400 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-blue-400 mb-1">No Data Yet</h3>
            <p className="text-sm text-gray-300">
              No metrics available yet. Start using the chat to collect AI cost data.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Metrics are collected from the last 24 hours of chat activity.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const metricCards = [
    {
      icon: Zap,
      label: 'Cache Hit Rate',
      value: `${metrics.cacheHitRate.toFixed(1)}%`,
      target: '85%',
      color: 'from-blue-500 to-cyan-500',
      status: metrics.cacheHitRate >= 85 ? 'excellent' : metrics.cacheHitRate >= 70 ? 'good' : 'warning',
      description: 'Percentage of requests using cached prompts'
    },
    {
      icon: Database,
      label: 'Avg Cached Tokens',
      value: metrics.avgCachedTokens.toLocaleString(),
      target: '10,000+',
      color: 'from-purple-500 to-pink-500',
      status: metrics.avgCachedTokens >= 10000 ? 'excellent' : metrics.avgCachedTokens >= 5000 ? 'good' : 'warning',
      description: 'Average tokens read from cache per request'
    },
    {
      icon: DollarSign,
      label: 'Est. Monthly Cost',
      value: `$${metrics.estimatedMonthlyCost.toFixed(0)}`,
      target: '$1,100',
      color: 'from-green-500 to-emerald-500',
      status: metrics.estimatedMonthlyCost <= 1500 ? 'excellent' : metrics.estimatedMonthlyCost <= 3000 ? 'good' : 'warning',
      description: 'Projected cost for the month at current usage'
    },
    {
      icon: TrendingDown,
      label: 'Monthly Savings',
      value: `$${metrics.savingsVsBaseline.toFixed(0)}`,
      target: '$3,700',
      color: 'from-orange-500 to-red-500',
      status: metrics.savingsVsBaseline >= 500 ? 'excellent' : 'good',
      description: 'Estimated savings vs pre-optimization baseline'
    }
  ]

  const statusColors: Record<string, string> = {
    excellent: 'bg-green-500/20 text-green-400',
    good: 'bg-blue-500/20 text-blue-400',
    warning: 'bg-yellow-500/20 text-yellow-400'
  }

  const statusLabels: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Good',
    warning: 'Monitor'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Real-Time AI Cost Metrics
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Last 24 hours • {metrics.sampleCount} requests •
            {lastUpdated && ` Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded border border-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-black/40 to-black/20 border border-white/10 rounded-lg p-4 hover:border-white/20 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-xs px-2 py-0.5 rounded ${statusColors[card.status]}`}>
                {statusLabels[card.status]}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">{card.value}</div>
            <div className="text-xs text-gray-400 mb-2">{card.label}</div>
            <div className="text-xs text-gray-500">Target: {card.target}</div>
            <div className="text-xs text-gray-500 mt-2 opacity-70">{card.description}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-black/40 border border-white/10 rounded-lg p-6">
        <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Token Usage Breakdown
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Avg Input Tokens:</span>
              <span className="font-mono text-sm font-medium">{metrics.avgInputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Avg Output Tokens:</span>
              <span className="font-mono text-sm font-medium">{metrics.avgOutputTokens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Avg Cached Tokens:</span>
              <span className="font-mono text-sm font-medium text-green-400">{metrics.avgCachedTokens.toLocaleString()}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Cache Hit Rate:</span>
              <span className="font-mono text-sm font-medium">{metrics.cacheHitRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Current Period Cost:</span>
              <span className="font-mono text-sm font-medium">${metrics.totalCost.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-white/10 pt-3">
              <span className="text-sm font-bold">Est. Monthly Cost:</span>
              <span className="font-mono text-lg font-bold">${metrics.estimatedMonthlyCost.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-6">
        <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-green-400">
          <TrendingDown className="w-4 h-4" />
          Optimization Impact
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-gray-400 mb-1">Baseline (Pre-Optimization)</div>
            <div className="text-2xl font-bold text-red-400">$4,800/mo</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Current (Optimized)</div>
            <div className="text-2xl font-bold text-green-400">${metrics.estimatedMonthlyCost.toFixed(0)}/mo</div>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-1">Monthly Savings</div>
            <div className="text-2xl font-bold text-emerald-400">${metrics.savingsVsBaseline.toFixed(0)}</div>
            <div className="text-xs text-gray-500 mt-1">
              {((metrics.savingsVsBaseline / 4800) * 100).toFixed(1)}% reduction
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-xs text-yellow-400">⚠️ {error}</p>
        </div>
      )}
    </div>
  )
}
