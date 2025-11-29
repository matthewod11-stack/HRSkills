'use client';

import {
  AlertCircle,
  Loader2,
  MessageSquare,
  Minus,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ENPSData {
  score: number;
  currentQuarter: string;
  distribution: {
    promoters: number;
    passives: number;
    detractors: number;
    promoterPercentage: number;
    passivePercentage: number;
    detractorPercentage: number;
    total: number;
  };
  trends: Array<{
    quarter: string;
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
    total: number;
    change?: number;
  }>;
  byDepartment: Array<{
    department: string;
    score: number;
    promoters: number;
    passives: number;
    detractors: number;
    total: number;
    promoterPercentage: number;
    passivePercentage: number;
    detractorPercentage: number;
  }>;
  summary: {
    averageScore: number;
    totalResponses: number;
    quarterCount: number;
    trendDirection: 'up' | 'down' | 'stable';
    trendChange: number;
  };
}

interface SentimentData {
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
  };
  topPositive: Array<{
    employeeId: string;
    comment: string;
    score: number;
    quarter: string;
    confidence: number;
  }>;
  topNegative: Array<{
    employeeId: string;
    comment: string;
    score: number;
    quarter: string;
    confidence: number;
  }>;
  byDepartment: Array<{
    department: string;
    positive: number;
    neutral: number;
    negative: number;
    total: number;
    positivePercentage: number;
    neutralPercentage: number;
    negativePercentage: number;
  }>;
}

interface ENPSPanelProps {
  data?: unknown;
}

function scoreColor(score: number) {
  if (score >= 50) return 'text-success';
  if (score >= 30) return 'text-sage';
  if (score >= 10) return 'text-amber';
  if (score >= 0) return 'text-terracotta';
  return 'text-error';
}

function scoreLabel(score: number) {
  if (score >= 50) return 'Excellent';
  if (score >= 30) return 'Great';
  if (score >= 10) return 'Good';
  if (score >= 0) return 'Needs Improvement';
  return 'At Risk';
}

const TAB_ORDER = ['overview', 'sentiment', 'departments'] as const;
type TabKey = (typeof TAB_ORDER)[number];

export default function ENPSPanel({ data: _initialData }: ENPSPanelProps) {
  const [enpsData, setEnpsData] = useState<ENPSData | null>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const enpsResponse = await fetch('/api/analytics?metric=enps');
        if (!enpsResponse.ok) throw new Error('Failed to fetch eNPS data');
        const enpsJson = await enpsResponse.json();
        if (enpsJson.success && enpsJson.data) {
          setEnpsData(enpsJson.data);
        } else {
          throw new Error(enpsJson.error || 'No eNPS data available');
        }

        const sentimentResponse = await fetch('/api/analytics/enps-sentiment');
        if (sentimentResponse.ok) {
          const sentimentJson = await sentimentResponse.json();
          if (sentimentJson.success && sentimentJson.data) {
            setSentimentData(sentimentJson.data);
          }
        }
      } catch (err) {
        console.error('Error fetching eNPS data:', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-charcoal-light">
        <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
        Loading eNPS insights…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <AlertCircle className="h-8 w-8 text-error" />
        <p className="text-sm font-medium text-charcoal">Unable to load eNPS analytics</p>
        <p className="max-w-sm text-xs text-charcoal-light">{error}</p>
      </div>
    );
  }

  if (!enpsData) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-charcoal-light">
        <Users className="h-8 w-8 text-terracotta" />
        <p className="text-sm font-medium text-charcoal">No eNPS data yet</p>
        <p className="max-w-xs text-xs">
          Import the latest engagement survey to unlock satisfaction insights.
        </p>
      </div>
    );
  }

  const topTrends = enpsData.trends.slice(0, 4);
  const topDepartments = enpsData.byDepartment.slice(0, 5);
  const positiveHighlights = sentimentData?.topPositive.slice(0, 2) ?? [];
  const negativeHighlights = sentimentData?.topNegative.slice(0, 2) ?? [];
  const trendChange = topTrends[0]?.change ?? 0;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as TabKey)}
      className="flex h-full flex-col"
    >
        <div className="flex-shrink-0 flex items-center justify-center gap-3 mb-4 pb-4 border-b border-sage/20">
          <TabsList className="border border-warm bg-cream/50 p-1">
            <TabsTrigger
              value="overview"
              className="px-3 py-1.5 text-xs data-[state=active]:bg-terracotta data-[state=active]:text-cream-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="sentiment"
              className="px-3 py-1.5 text-xs data-[state=active]:bg-terracotta data-[state=active]:text-cream-white"
            >
              Sentiment
            </TabsTrigger>
            <TabsTrigger
              value="departments"
              className="px-3 py-1.5 text-xs data-[state=active]:bg-terracotta data-[state=active]:text-cream-white"
            >
              Departments
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="flex-1 overflow-y-auto outline-none">
          <div className="grid gap-6">
            <Card className="border-warm bg-cream-white shadow-soft">
              <CardContent className="flex items-start justify-between gap-4 p-6">
                <div>
                  <p className="text-xs uppercase tracking-wide text-secondary">Current Score</p>
                  <p
                    className={`mt-1 text-3xl font-semibold tracking-tight ${scoreColor(
                      enpsData.score
                    )}`}
                  >
                    {enpsData.score >= 0 ? '+' : ''}
                    {enpsData.score}
                  </p>
                  <p className="text-xs font-medium text-secondary">
                    {scoreLabel(enpsData.score)} • {enpsData.currentQuarter || 'Current quarter'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-wide text-secondary">vs last quarter</p>
                  <div className="mt-1 flex items-center justify-end gap-1 text-sm font-semibold">
                    {trendChange > 0 && <TrendingUp className="h-4 w-4 text-success" />}
                    {trendChange < 0 && <TrendingDown className="h-4 w-4 text-error" />}
                    {trendChange === 0 && <Minus className="h-4 w-4 text-secondary" />}
                    <span
                      className={
                        trendChange > 0
                          ? 'text-success'
                          : trendChange < 0
                            ? 'text-error'
                            : 'text-secondary'
                      }
                    >
                      {trendChange > 0 ? `+${trendChange}` : trendChange}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-secondary">
                    {enpsData.summary.totalResponses.toLocaleString()} responses this quarter
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-warm bg-cream-white shadow-soft">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="text-sm font-semibold text-charcoal">Score Mix</CardTitle>
                <CardDescription>Promoters vs passives vs detractors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                {[
                  {
                    label: 'Promoters',
                    value: enpsData.distribution.promoters,
                    percent: enpsData.distribution.promoterPercentage,
                    tone: 'bg-success',
                  },
                  {
                    label: 'Passives',
                    value: enpsData.distribution.passives,
                    percent: enpsData.distribution.passivePercentage,
                    tone: 'bg-amber',
                  },
                  {
                    label: 'Detractors',
                    value: enpsData.distribution.detractors,
                    percent: enpsData.distribution.detractorPercentage,
                    tone: 'bg-error',
                  },
                ].map((item) => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-secondary">{item.label}</span>
                      <span className="text-charcoal">
                        {Math.round(item.percent)}% • {item.value}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-sage/20">
                      <div
                        className={`h-full rounded-full ${item.tone}`}
                        style={{
                          width: `${Math.min(100, Math.max(0, Math.round(item.percent)))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-warm bg-cream-white shadow-soft">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="text-sm font-semibold text-charcoal">Trend Snapshot</CardTitle>
                <CardDescription>Most recent quarters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-6">
                {topTrends.map((trend) => (
                  <div
                    key={trend.quarter}
                    className="flex items-center justify-between rounded-xl border border-warm bg-cream px-3 py-2 text-xs"
                  >
                    <div>
                      <p className="font-medium text-charcoal">{trend.quarter}</p>
                      <p className="text-secondary">{trend.total.toLocaleString()} responses</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${scoreColor(trend.score)}`}>
                        {trend.score >= 0 ? '+' : ''}
                        {trend.score}
                      </p>
                      {typeof trend.change === 'number' && trend.change !== 0 && (
                        <p
                          className={`mt-1 text-[11px] ${
                            trend.change > 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {trend.change > 0 ? '+' : ''}
                          {trend.change} vs prior
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-warm bg-cream-white shadow-soft">
              <CardContent className="grid grid-cols-2 gap-4 p-6 text-xs">
                <div className="rounded-xl border border-warm bg-cream p-3">
                  <p className="text-secondary uppercase tracking-wide">Quarter Avg</p>
                  <p
                    className={`mt-1 text-lg font-semibold ${scoreColor(
                      enpsData.summary.averageScore
                    )}`}
                  >
                    {enpsData.summary.averageScore >= 0 ? '+' : ''}
                    {enpsData.summary.averageScore}
                  </p>
                </div>
                <div className="rounded-xl border border-warm bg-cream p-3">
                  <p className="text-secondary uppercase tracking-wide">Momentum</p>
                  <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-charcoal">
                    {enpsData.summary.trendDirection === 'up' && (
                      <TrendingUp className="h-4 w-4 text-success" />
                    )}
                    {enpsData.summary.trendDirection === 'down' && (
                      <TrendingDown className="h-4 w-4 text-error" />
                    )}
                    {enpsData.summary.trendDirection === 'stable' && (
                      <Minus className="h-4 w-4 text-secondary" />
                    )}
                    <span
                      className={
                        enpsData.summary.trendDirection === 'up'
                          ? 'text-success'
                          : enpsData.summary.trendDirection === 'down'
                            ? 'text-error'
                            : 'text-secondary'
                      }
                    >
                      {enpsData.summary.trendChange > 0 ? '+' : ''}
                      {enpsData.summary.trendChange}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sentiment" className="flex-1 overflow-y-auto outline-none">
          {sentimentData ? (
            <div className="grid gap-6">
              <Card className="border-warm bg-cream-white shadow-soft">
                <CardHeader className="px-6 pt-6">
                  <CardTitle className="text-sm font-semibold text-charcoal">
                    Comment Sentiment
                  </CardTitle>
                  <CardDescription>Breakdown of classified responses</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 p-6 text-center text-xs">
                  {[
                    {
                      label: 'Positive',
                      value: sentimentData.distribution.positivePercentage,
                      total: sentimentData.distribution.positive,
                      tone: 'text-success',
                    },
                    {
                      label: 'Neutral',
                      value: sentimentData.distribution.neutralPercentage,
                      total: sentimentData.distribution.neutral,
                      tone: 'text-amber',
                    },
                    {
                      label: 'Negative',
                      value: sentimentData.distribution.negativePercentage,
                      total: sentimentData.distribution.negative,
                      tone: 'text-error',
                    },
                  ].map((block) => (
                    <div
                      key={block.label}
                      className="rounded-xl border border-warm bg-cream px-3 py-4"
                    >
                      <p className="text-secondary uppercase tracking-wide">{block.label}</p>
                      <p className={`mt-2 text-xl font-semibold ${block.tone}`}>
                        {Math.round(block.value)}%
                      </p>
                      <p className="mt-1 text-[11px] text-secondary">
                        {block.total.toLocaleString()} comments
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-warm bg-cream-white shadow-soft">
                <CardHeader className="px-6 pt-6">
                  <CardTitle className="text-sm font-semibold text-charcoal">
                    Highlights & Wins
                  </CardTitle>
                  <CardDescription>Representative positive feedback</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-6 text-xs">
                  {positiveHighlights.map((item, index) => (
                    <div
                      key={`${item.employeeId}-${index}`}
                      className="rounded-xl border border-success/30 bg-success/5 p-3 text-left"
                    >
                      <p className="text-charcoal">{item.comment}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-secondary">
                        <span>Score {item.score}/10</span>
                        <span>{item.quarter}</span>
                        <span>{Math.round(item.confidence * 100)}% confidence</span>
                      </div>
                    </div>
                  ))}
                  {positiveHighlights.length === 0 && (
                    <p className="text-secondary">No positive highlights available yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-warm bg-cream-white shadow-soft">
                <CardHeader className="px-6 pt-6">
                  <CardTitle className="text-sm font-semibold text-charcoal">
                    Attention Areas
                  </CardTitle>
                  <CardDescription>Top detractor themes</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-6 text-xs">
                  {negativeHighlights.map((item, index) => (
                    <div
                      key={`${item.employeeId}-${index}`}
                      className="rounded-xl border border-error/30 bg-error/5 p-3 text-left"
                    >
                      <p className="text-charcoal">{item.comment}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-secondary">
                        <span>Score {item.score}/10</span>
                        <span>{item.quarter}</span>
                        <span>{Math.round(item.confidence * 100)}% confidence</span>
                      </div>
                    </div>
                  ))}
                  {negativeHighlights.length === 0 && (
                    <p className="text-secondary">No detractor feedback captured yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-warm bg-cream-white shadow-soft">
              <CardContent className="flex flex-col items-center justify-center gap-3 px-8 py-12 text-center text-secondary">
                <MessageSquare className="h-8 w-8 text-terracotta" />
                <p className="text-sm font-medium text-charcoal">No sentiment analysis available</p>
                <p className="text-xs">
                  Connect survey comments or rerun the classifier to unlock sentiment insights.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="departments" className="flex-1 overflow-y-auto outline-none">
          <div className="grid gap-6">
            <Card className="border-warm bg-cream-white shadow-soft">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="text-sm font-semibold text-charcoal">Department Pulse</CardTitle>
                <CardDescription>Top 5 segments by response volume</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-6 text-xs">
                {topDepartments.map((dept) => (
                  <div
                    key={dept.department}
                    className="flex items-center justify-between rounded-xl border border-warm bg-cream px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-charcoal">{dept.department}</p>
                      <p className="text-secondary">{dept.total.toLocaleString()} responses</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${scoreColor(dept.score)}`}>
                        {dept.score >= 0 ? '+' : ''}
                        {dept.score}
                      </p>
                      <p className="text-[11px] text-secondary">
                        {Math.round(dept.promoterPercentage)}% promoters
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {sentimentData && sentimentData.byDepartment.length > 0 && (
              <Card className="border-warm bg-cream-white shadow-soft">
                <CardHeader className="px-6 pt-6">
                  <CardTitle className="text-sm font-semibold text-charcoal">
                    Department Sentiment
                  </CardTitle>
                  <CardDescription>Percent of comments by tone</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 p-6 text-xs">
                  {sentimentData.byDepartment.slice(0, 4).map((dept) => (
                    <div key={dept.department} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-charcoal">{dept.department}</p>
                        <p className="text-[11px] text-secondary">
                          {dept.total.toLocaleString()} comments
                        </p>
                      </div>
                      <div className="flex gap-1 text-[11px] text-secondary">
                        <span className="text-success">
                          {Math.round(dept.positivePercentage)}% pos
                        </span>
                        <span className="text-amber">
                          {Math.round(dept.neutralPercentage)}% neut
                        </span>
                        <span className="text-error">
                          {Math.round(dept.negativePercentage)}% neg
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
    </Tabs>
  );
}