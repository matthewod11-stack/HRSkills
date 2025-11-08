'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Users,
  Loader2,
  ChevronRight,
  Info,
  RefreshCw,
  Download,
  Filter,
} from 'lucide-react'
import type { AttritionPrediction } from '@/lib/ai-services/vertex-ai-service'

interface FlightRiskWidgetProps {
  className?: string
  maxEmployees?: number
  autoRefresh?: boolean
  refreshInterval?: number // in milliseconds
}

/**
 * Flight Risk Dashboard Widget
 *
 * Displays top at-risk employees with actionable insights
 */
export function FlightRiskWidget({
  className = '',
  maxEmployees = 10,
  autoRefresh = false,
  refreshInterval = 300000, // 5 minutes
}: FlightRiskWidgetProps) {
  const [predictions, setPredictions] = useState<AttritionPrediction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all')
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchPredictions = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/predict/attrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to load predictions')
      }

      // Get predictions and filter for high risk
      const allPredictions = result.data.predictions
      const highRiskPredictions = allPredictions
        .filter((p: AttritionPrediction) =>
          filter === 'all'
            ? (p.flightRisk === 'critical' || p.flightRisk === 'high' || p.flightRisk === 'medium')
            : p.flightRisk === filter
        )
        .slice(0, maxEmployees)

      setPredictions(highRiskPredictions)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Flight risk prediction error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load flight risk data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPredictions()

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchPredictions, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [filter])

  const getRiskColor = (risk: AttritionPrediction['flightRisk']) => {
    switch (risk) {
      case 'critical': return 'from-red-500 to-red-600'
      case 'high': return 'from-orange-500 to-orange-600'
      case 'medium': return 'from-yellow-500 to-amber-600'
      default: return 'from-blue-500 to-blue-600'
    }
  }

  const getRiskBadgeColor = (risk: AttritionPrediction['flightRisk']) => {
    switch (risk) {
      case 'critical': return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'high': return 'bg-orange-500/20 border-orange-500/50 text-orange-400'
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      default: return 'bg-blue-500/20 border-blue-500/50 text-blue-400'
    }
  }

  const handleDownload = () => {
    const csv = [
      ['Employee Name', 'Flight Risk', 'Probability', 'Timeframe', 'Top Risk Factors'],
      ...predictions.map(p => [
        p.employeeName,
        p.flightRisk,
        (p.probabilityToLeave * 100).toFixed(1) + '%',
        p.predictedTimeframe,
        p.topRiskFactors.map(f => f.factor).join('; '),
      ])
    ]

    const csvContent = csv.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `flight-risk-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`bg-black/40 border-2 border-white/20 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Flight Risk Employees</h2>
              <p className="text-sm text-gray-400">
                {predictions.length} employees at risk • Updated {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Download CSV"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => fetchPredictions()}
              disabled={isLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-white/20 border border-white/30'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            All Risk Levels
          </button>
          <button
            onClick={() => setFilter('critical')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'critical'
                ? 'bg-red-500/20 border border-red-500/50 text-red-400'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            Critical Only
          </button>
          <button
            onClick={() => setFilter('high')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'high'
                ? 'bg-orange-500/20 border border-orange-500/50 text-orange-400'
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
          >
            High Risk Only
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/20 border-2 border-red-500/50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-400">Failed to load predictions</p>
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && predictions.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
            <p className="text-gray-400">No high-risk employees found</p>
            <p className="text-sm text-gray-500 mt-1">Great news! Your workforce retention looks healthy.</p>
          </div>
        )}

        {!isLoading && !error && predictions.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence>
              {predictions.map((prediction, index) => (
                <EmployeeRiskCard key={prediction.employeeId} prediction={prediction} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Individual employee risk card
 */
function EmployeeRiskCard({
  prediction,
  index
}: {
  prediction: AttritionPrediction
  index: number
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getRiskColor = (risk: AttritionPrediction['flightRisk']) => {
    switch (risk) {
      case 'critical': return 'from-red-500 to-red-600'
      case 'high': return 'from-orange-500 to-orange-600'
      case 'medium': return 'from-yellow-500 to-amber-600'
      default: return 'from-blue-500 to-blue-600'
    }
  }

  const getRiskBadgeColor = (risk: AttritionPrediction['flightRisk']) => {
    switch (risk) {
      case 'critical': return 'bg-red-500/20 border-red-500/50 text-red-400'
      case 'high': return 'bg-orange-500/20 border-orange-500/50 text-orange-400'
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
      default: return 'bg-blue-500/20 border-blue-500/50 text-blue-400'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-2 border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors"
    >
      {/* Card Header */}
      <div
        className="p-4 bg-white/5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-2 h-12 bg-gradient-to-b ${getRiskColor(prediction.flightRisk)} rounded-full`} />

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-bold">{prediction.employeeName}</h4>
                <span className={`px-2 py-1 ${getRiskBadgeColor(prediction.flightRisk)} border rounded-full text-xs font-medium uppercase`}>
                  {prediction.flightRisk}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span>
                  {(prediction.probabilityToLeave * 100).toFixed(0)}% probability
                </span>
                <span>•</span>
                <span>{prediction.predictedTimeframe}</span>
              </div>
            </div>
          </div>

          <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Risk Factors */}
              <div>
                <h5 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Top Risk Factors
                </h5>
                <div className="space-y-2">
                  {prediction.topRiskFactors.map((factor, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 bg-black/40 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{factor.factor}</p>
                        <p className="text-xs text-gray-400">{factor.description}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {(factor.importance * 100).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Actions */}
              <div>
                <h5 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Recommended Actions
                </h5>
                <ul className="space-y-2">
                  {prediction.recommendedActions.map((action, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-400 mt-1">•</span>
                      <span className="text-gray-300">{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all text-sm font-medium">
                Create Retention Plan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
