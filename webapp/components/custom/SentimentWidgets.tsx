'use client'

import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Minus, Smile, Frown, Meh, AlertCircle, CheckCircle } from 'lucide-react'
import type { SentimentResult } from '@/lib/ai-services/nlp-service'

interface SentimentScoreProps {
  sentiment: SentimentResult
  label?: string
  showDetails?: boolean
  className?: string
}

/**
 * Display a single sentiment score with visual indicators
 */
export function SentimentScore({ sentiment, label, showDetails = true, className = '' }: SentimentScoreProps) {
  const getIcon = () => {
    switch (sentiment.sentiment) {
      case 'very_positive':
      case 'positive':
        return <Smile className="w-6 h-6 text-green-400" />
      case 'very_negative':
      case 'negative':
        return <Frown className="w-6 h-6 text-red-400" />
      default:
        return <Meh className="w-6 h-6 text-yellow-400" />
    }
  }

  const getColor = () => {
    if (sentiment.score > 0.25) return 'from-green-500/20 to-emerald-500/20 border-green-500/50'
    if (sentiment.score < -0.25) return 'from-red-500/20 to-rose-500/20 border-red-500/50'
    return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/50'
  }

  const getTextColor = () => {
    if (sentiment.score > 0.25) return 'text-green-400'
    if (sentiment.score < -0.25) return 'text-red-400'
    return 'text-yellow-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`bg-gradient-to-br ${getColor()} border-2 rounded-xl p-4 ${className}`}
    >
      <div className="flex items-center gap-3">
        {getIcon()}
        <div className="flex-1">
          {label && <p className="text-sm text-gray-400 mb-1">{label}</p>}
          <p className={`text-2xl font-bold ${getTextColor()}`}>
            {sentiment.score > 0 ? '+' : ''}{sentiment.score.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {sentiment.sentiment.replace('_', ' ')}
          </p>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Magnitude:</span>
            <span className="text-white">{sentiment.magnitude.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Confidence:</span>
            <span className="text-white capitalize">{sentiment.confidence}</span>
          </div>
        </div>
      )}
    </motion.div>
  )
}

interface SentimentDistributionProps {
  distribution: {
    veryPositive: number
    positive: number
    neutral: number
    negative: number
    veryNegative: number
  }
  total: number
  className?: string
}

/**
 * Show sentiment distribution as a stacked bar
 */
export function SentimentDistribution({ distribution, total, className = '' }: SentimentDistributionProps) {
  const percentages = {
    veryPositive: (distribution.veryPositive / total) * 100,
    positive: (distribution.positive / total) * 100,
    neutral: (distribution.neutral / total) * 100,
    negative: (distribution.negative / total) * 100,
    veryNegative: (distribution.veryNegative / total) * 100,
  }

  return (
    <div className={`bg-black/40 border-2 border-white/20 rounded-xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>

      {/* Stacked bar */}
      <div className="w-full h-8 rounded-full overflow-hidden bg-gray-800/50 flex mb-4">
        {percentages.veryPositive > 0 && (
          <div
            className="bg-gradient-to-r from-green-600 to-green-500 h-full transition-all"
            style={{ width: `${percentages.veryPositive}%` }}
            title={`Very Positive: ${distribution.veryPositive} (${percentages.veryPositive.toFixed(1)}%)`}
          />
        )}
        {percentages.positive > 0 && (
          <div
            className="bg-gradient-to-r from-green-500 to-green-400 h-full transition-all"
            style={{ width: `${percentages.positive}%` }}
            title={`Positive: ${distribution.positive} (${percentages.positive.toFixed(1)}%)`}
          />
        )}
        {percentages.neutral > 0 && (
          <div
            className="bg-gradient-to-r from-yellow-500 to-yellow-400 h-full transition-all"
            style={{ width: `${percentages.neutral}%` }}
            title={`Neutral: ${distribution.neutral} (${percentages.neutral.toFixed(1)}%)`}
          />
        )}
        {percentages.negative > 0 && (
          <div
            className="bg-gradient-to-r from-orange-500 to-orange-600 h-full transition-all"
            style={{ width: `${percentages.negative}%` }}
            title={`Negative: ${distribution.negative} (${percentages.negative.toFixed(1)}%)`}
          />
        )}
        {percentages.veryNegative > 0 && (
          <div
            className="bg-gradient-to-r from-red-600 to-red-700 h-full transition-all"
            style={{ width: `${percentages.veryNegative}%` }}
            title={`Very Negative: ${distribution.veryNegative} (${percentages.veryNegative.toFixed(1)}%)`}
          />
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span className="text-gray-300">Very Positive</span>
          <span className="text-gray-500 ml-auto">{distribution.veryPositive}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-gray-300">Positive</span>
          <span className="text-gray-500 ml-auto">{distribution.positive}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="text-gray-300">Neutral</span>
          <span className="text-gray-500 ml-auto">{distribution.neutral}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-gray-300">Negative</span>
          <span className="text-gray-500 ml-auto">{distribution.negative}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-700" />
          <span className="text-gray-300">Very Negative</span>
          <span className="text-gray-500 ml-auto">{distribution.veryNegative}</span>
        </div>
      </div>
    </div>
  )
}

interface SentimentTrendProps {
  currentScore: number
  previousScore?: number
  label?: string
  className?: string
}

/**
 * Show sentiment trend compared to previous period
 */
export function SentimentTrend({ currentScore, previousScore, label = 'Current Sentiment', className = '' }: SentimentTrendProps) {
  const change = previousScore !== undefined ? currentScore - previousScore : 0
  const hasChange = previousScore !== undefined

  const getTrendIcon = () => {
    if (!hasChange || Math.abs(change) < 0.05) return <Minus className="w-5 h-5 text-gray-400" />
    if (change > 0) return <TrendingUp className="w-5 h-5 text-green-400" />
    return <TrendingDown className="w-5 h-5 text-red-400" />
  }

  const getTrendColor = () => {
    if (!hasChange || Math.abs(change) < 0.05) return 'text-gray-400'
    return change > 0 ? 'text-green-400' : 'text-red-400'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-black/40 border-2 border-white/20 rounded-xl p-6 ${className}`}
    >
      <p className="text-sm text-gray-400 mb-2">{label}</p>
      <div className="flex items-end gap-4">
        <p className="text-4xl font-bold">
          {currentScore > 0 ? '+' : ''}{currentScore.toFixed(2)}
        </p>
        {hasChange && (
          <div className={`flex items-center gap-1 pb-2 ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium">
              {change > 0 ? '+' : ''}{change.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      {previousScore !== undefined && (
        <p className="text-xs text-gray-500 mt-2">
          Previous: {previousScore > 0 ? '+' : ''}{previousScore.toFixed(2)}
        </p>
      )}
    </motion.div>
  )
}

interface ActionableInsightsProps {
  insights: string[]
  className?: string
}

/**
 * Display actionable insights from sentiment analysis
 */
export function ActionableInsights({ insights, className = '' }: ActionableInsightsProps) {
  if (insights.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-black/40 border-2 border-white/20 rounded-xl p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-blue-400" />
        Actionable Insights
      </h3>
      <ul className="space-y-3">
        {insights.map((insight, idx) => {
          const isWarning = insight.includes('⚠️') || insight.includes('📉')
          const isPositive = insight.includes('✅')

          return (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                isWarning
                  ? 'bg-red-500/10 border border-red-500/30'
                  : isPositive
                  ? 'bg-green-500/10 border border-green-500/30'
                  : 'bg-blue-500/10 border border-blue-500/30'
              }`}
            >
              <span className="text-lg flex-shrink-0">
                {isWarning ? '⚠️' : isPositive ? '✅' : '💡'}
              </span>
              <p className="text-sm text-gray-200 flex-1">{insight.replace(/[⚠️✅📉🎯🏢💡]/g, '').trim()}</p>
            </motion.li>
          )
        })}
      </ul>
    </motion.div>
  )
}

interface ThemeCloudProps {
  themes: Array<{ theme: string; count: number; avgSentiment: number }>
  className?: string
}

/**
 * Display extracted themes as a word cloud
 */
export function ThemeCloud({ themes, className = '' }: ThemeCloudProps) {
  if (themes.length === 0) {
    return (
      <div className={`bg-black/40 border-2 border-white/20 rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-4">Key Themes</h3>
        <p className="text-gray-500 text-center py-8">No themes identified</p>
      </div>
    )
  }

  // Sort by count descending
  const sortedThemes = [...themes].sort((a, b) => b.count - a.count)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-black/40 border-2 border-white/20 rounded-xl p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold mb-4">Key Themes</h3>
      <div className="flex flex-wrap gap-2">
        {sortedThemes.slice(0, 15).map((theme, idx) => {
          const isNegative = theme.avgSentiment < -0.25
          const fontSize = Math.max(12, Math.min(24, 12 + (theme.count * 2)))

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className={`px-4 py-2 rounded-full border-2 ${
                isNegative
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
              }`}
              style={{ fontSize: `${fontSize}px` }}
              title={`Mentioned ${theme.count} times, avg sentiment: ${theme.avgSentiment.toFixed(2)}`}
            >
              {theme.theme}
              <span className="ml-2 text-xs opacity-60">{theme.count}</span>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

interface QuickStatsProps {
  stats: {
    label: string
    value: string | number
    trend?: number
    icon?: React.ReactNode
  }[]
  className?: string
}

/**
 * Display quick stats grid for sentiment metrics
 */
export function QuickStats({ stats, className = '' }: QuickStatsProps) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {stats.map((stat, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-2 border-white/20 rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{stat.label}</p>
            {stat.icon}
          </div>
          <p className="text-2xl font-bold mb-1">{stat.value}</p>
          {stat.trend !== undefined && (
            <div className="flex items-center gap-1 text-xs">
              {stat.trend > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-400" />
                  <span className="text-green-400">+{stat.trend.toFixed(1)}%</span>
                </>
              ) : stat.trend < 0 ? (
                <>
                  <TrendingDown className="w-3 h-3 text-red-400" />
                  <span className="text-red-400">{stat.trend.toFixed(1)}%</span>
                </>
              ) : (
                <span className="text-gray-400">No change</span>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

interface DepartmentSentimentProps {
  departments: Record<string, {
    count: number
    avgSentiment: number
    topConcerns: string[]
  }>
  className?: string
}

/**
 * Show sentiment breakdown by department
 */
export function DepartmentSentiment({ departments, className = '' }: DepartmentSentimentProps) {
  const sortedDepts = Object.entries(departments)
    .sort(([, a], [, b]) => a.avgSentiment - b.avgSentiment)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-black/40 border-2 border-white/20 rounded-xl p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold mb-4">Department Sentiment</h3>
      <div className="space-y-3">
        {sortedDepts.map(([dept, data], idx) => {
          const isNegative = data.avgSentiment < -0.25
          const isPositive = data.avgSentiment > 0.25

          return (
            <motion.div
              key={dept}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="border-2 border-white/10 rounded-lg p-3 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{dept}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${
                    isPositive ? 'text-green-400' :
                    isNegative ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {data.avgSentiment > 0 ? '+' : ''}{data.avgSentiment.toFixed(2)}
                  </span>
                  {isPositive && <CheckCircle className="w-4 h-4 text-green-400" />}
                  {isNegative && <AlertCircle className="w-4 h-4 text-red-400" />}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    isPositive ? 'bg-green-500' :
                    isNegative ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}
                  style={{
                    width: `${Math.min(100, Math.abs(data.avgSentiment) * 100)}%`,
                    marginLeft: data.avgSentiment < 0 ? `${50 - Math.abs(data.avgSentiment) * 50}%` : '50%'
                  }}
                />
              </div>

              <p className="text-xs text-gray-500 mt-1">{data.count} responses</p>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
