'use client';

import { useEffect, useState } from 'react';
import { TrendingDown, Zap, DollarSign, Database, Activity, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';

interface MetricsSummary {
  cacheHitRate: number;
  avgCachedTokens: number;
  avgInputTokens: number;
  avgOutputTokens: number;
  totalCost: number;
  estimatedMonthlyCost: number;
  savingsVsBaseline: number;
  sampleCount: number;
  periodStart: string;
  periodEnd: string;
}

export function AIMetricsDashboard() {
  const { getAuthHeaders } = useAuth();
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMetrics = async () => {
    try {
      setError(null);
      const response = await fetch('/api/metrics?type=ai-costs', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch metrics: ${response.statusText}`);
      }

      const data = await response.json();
      setMetrics(data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch AI metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-cream rounded-2xl w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-cream rounded-2xl"></div>
            ))}
          </div>
          <div className="h-48 bg-cream rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="bg-error/10 border-2 border-error/30 rounded-2xl p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-error mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-error mb-1">Failed to Load Metrics</h3>
            <p className="text-sm text-charcoal">{error}</p>
            <button
              onClick={fetchMetrics}
              className="mt-3 text-xs px-3 py-2 bg-error/10 hover:bg-error hover:text-cream-white rounded-xl border border-error/30 hover:border-error transition-all flex items-center gap-2 font-medium shadow-soft hover:shadow-warm"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics || metrics.sampleCount === 0) {
    return (
      <div className="bg-amber/10 border-2 border-amber/30 rounded-2xl p-6 shadow-soft">
        <div className="flex items-start gap-3">
          <Activity className="w-5 h-5 text-amber mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber mb-1">No Data Yet</h3>
            <p className="text-sm text-charcoal">
              No metrics available yet. Start using the chat to collect AI cost data.
            </p>
            <p className="text-xs text-charcoal-light mt-2">
              Metrics are collected from the last 24 hours of chat activity.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const metricCards = [
    {
      icon: Zap,
      label: 'Cache Hit Rate',
      value: `${metrics.cacheHitRate.toFixed(1)}%`,
      target: '85%',
      color: 'from-amber to-terracotta',
      iconBg: 'bg-gradient-to-br from-amber to-terracotta',
      status:
        metrics.cacheHitRate >= 85 ? 'excellent' : metrics.cacheHitRate >= 70 ? 'good' : 'warning',
      description: 'Percentage of requests using cached prompts',
    },
    {
      icon: Database,
      label: 'Avg Cached Tokens',
      value: metrics.avgCachedTokens.toLocaleString(),
      target: '10,000+',
      color: 'from-terracotta to-terracotta-dark',
      iconBg: 'bg-gradient-to-br from-terracotta to-terracotta-dark',
      status:
        metrics.avgCachedTokens >= 10000
          ? 'excellent'
          : metrics.avgCachedTokens >= 5000
            ? 'good'
            : 'warning',
      description: 'Average tokens read from cache per request',
    },
    {
      icon: DollarSign,
      label: 'Est. Monthly Cost',
      value: `$${metrics.estimatedMonthlyCost.toFixed(0)}`,
      target: '$1,100',
      color: 'from-sage to-sage-light',
      iconBg: 'bg-gradient-to-br from-sage to-sage-light',
      status:
        metrics.estimatedMonthlyCost <= 1500
          ? 'excellent'
          : metrics.estimatedMonthlyCost <= 3000
            ? 'good'
            : 'warning',
      description: 'Projected cost for the month at current usage',
    },
    {
      icon: TrendingDown,
      label: 'Monthly Savings',
      value: `$${metrics.savingsVsBaseline.toFixed(0)}`,
      target: '$3,700',
      color: 'from-terracotta to-amber',
      iconBg: 'bg-gradient-to-br from-terracotta to-amber',
      status: metrics.savingsVsBaseline >= 500 ? 'excellent' : 'good',
      description: 'Estimated savings vs pre-optimization baseline',
    },
  ];

  const statusColors: Record<string, string> = {
    excellent: 'bg-sage/20 text-sage',
    good: 'bg-amber/20 text-amber',
    warning: 'bg-error/20 text-error',
  };

  const statusLabels: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Good',
    warning: 'Monitor',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold flex items-center gap-2 text-charcoal">
            <Activity className="w-4 h-4" />
            Real-Time AI Cost Metrics
          </h3>
          <p className="text-xs text-charcoal-light mt-1">
            Last 24 hours • {metrics.sampleCount} requests •
            {lastUpdated && ` Updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="text-xs px-3 py-1.5 bg-terracotta/10 hover:bg-terracotta hover:text-cream-white rounded-xl border border-warm hover:border-terracotta transition-all flex items-center gap-2 disabled:opacity-50 font-medium shadow-soft hover:shadow-warm text-charcoal"
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
            className="bg-cream border-2 border-warm rounded-2xl p-4 hover:border-terracotta/30 transition-all shadow-soft hover:shadow-warm"
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center shadow-warm`}
              >
                <card.icon className="w-5 h-5 text-cream-white" />
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${statusColors[card.status]}`}>
                {statusLabels[card.status]}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1 text-charcoal">{card.value}</div>
            <div className="text-xs text-charcoal-light mb-2 font-medium">{card.label}</div>
            <div className="text-xs text-charcoal-soft">Target: {card.target}</div>
            <div className="text-xs text-charcoal-soft mt-2">{card.description}</div>
          </motion.div>
        ))}
      </div>

      <div className="bg-cream border-2 border-warm rounded-2xl p-6 shadow-soft">
        <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-charcoal">
          <Database className="w-4 h-4" />
          Token Usage Breakdown
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal-light font-medium">Avg Input Tokens:</span>
              <span className="font-mono text-sm font-bold text-charcoal">
                {metrics.avgInputTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal-light font-medium">Avg Output Tokens:</span>
              <span className="font-mono text-sm font-bold text-charcoal">
                {metrics.avgOutputTokens.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal-light font-medium">Avg Cached Tokens:</span>
              <span className="font-mono text-sm font-bold text-sage">
                {metrics.avgCachedTokens.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal-light font-medium">Cache Hit Rate:</span>
              <span className="font-mono text-sm font-bold text-charcoal">
                {metrics.cacheHitRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-charcoal-light font-medium">Current Period Cost:</span>
              <span className="font-mono text-sm font-bold text-charcoal">${metrics.totalCost.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center border-t-2 border-warm pt-3">
              <span className="text-sm font-bold text-charcoal">Est. Monthly Cost:</span>
              <span className="font-mono text-lg font-bold text-charcoal">
                ${metrics.estimatedMonthlyCost.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-sage/10 to-sage-light/10 border-2 border-sage/30 rounded-2xl p-6 shadow-soft">
        <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-sage">
          <TrendingDown className="w-4 h-4" />
          Optimization Impact
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-charcoal-light mb-1 font-medium">Baseline (Pre-Optimization)</div>
            <div className="text-2xl font-bold text-error">$4,800/mo</div>
          </div>
          <div>
            <div className="text-xs text-charcoal-light mb-1 font-medium">Current (Optimized)</div>
            <div className="text-2xl font-bold text-sage">
              ${metrics.estimatedMonthlyCost.toFixed(0)}/mo
            </div>
          </div>
          <div>
            <div className="text-xs text-charcoal-light mb-1 font-medium">Monthly Savings</div>
            <div className="text-2xl font-bold text-sage">
              ${metrics.savingsVsBaseline.toFixed(0)}
            </div>
            <div className="text-xs text-charcoal-soft mt-1">
              {((metrics.savingsVsBaseline / 4800) * 100).toFixed(1)}% reduction
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-error/10 border-2 border-error/30 rounded-2xl p-4 shadow-soft">
          <p className="text-xs text-error font-medium">⚠️ {error}</p>
        </div>
      )}
    </div>
  );
}
