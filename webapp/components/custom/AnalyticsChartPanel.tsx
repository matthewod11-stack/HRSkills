'use client';

import { motion } from 'framer-motion';
import { BarChart3, Download, LineChart, PieChart, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  SimpleBarChart,
  SimpleLineChart,
  SimplePieChart,
} from '@/components/charts/RechartsWrappers';
import { useAuth } from '@/lib/auth/auth-context';
import { chartJsToRecharts } from '@/lib/charts/recharts-helpers';

/** Chart.js dataset configuration */
interface ChartDataset {
  label?: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  tension?: number;
}

/** Chart.js data format */
interface ChartJsData {
  labels: string[];
  datasets: ChartDataset[];
}

/** Chart configuration from AI responses */
interface ChartConfig {
  type?: 'bar' | 'line' | 'pie' | 'scatter';
  data?: ChartJsData;
  options?: Record<string, unknown>;
}

/** Trend data point */
interface TrendPoint {
  date: string;
  count: number;
}

/** Department attrition data */
interface DepartmentAttrition {
  attritionRate: number;
  terminations?: number;
}

/** Analytics API response data */
interface AnalyticsApiData {
  total?: number;
  byDepartment?: Record<string, number | DepartmentAttrition>;
  trends?: TrendPoint[];
  spanOfControl?: { average?: number };
  overall?: { attritionRate: number; voluntaryRate: number; involuntaryRate: number };
  distribution?: Record<string, number>;
}

/** Chart panel metadata */
interface ChartMetadata {
  rowsReturned?: number;
  metadata?: { rowsReturned?: number };
}

interface AnalyticsChartPanelProps {
  metric: string;
  chartType?: 'bar' | 'line' | 'pie' | 'scatter';
  department?: string;
  dateRange?: string;
  chartConfig?: ChartConfig;
  analysisSummary?: string;
  metadata?: ChartMetadata;
}

export function AnalyticsChartPanel({
  metric = 'headcount',
  chartType = 'bar',
  department,
  dateRange = 'last_12_months',
  chartConfig,
  analysisSummary,
  metadata,
}: AnalyticsChartPanelProps) {
  const { getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsApiData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chartConfigState, setChartConfigState] = useState<ChartConfig | null>(chartConfig || null);
  const [analysis, setAnalysis] = useState<string>(analysisSummary || '');

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ metric });
      if (department) params.set('department', department);
      if (dateRange) params.set('dateRange', dateRange);

      const response = await fetch(`/api/analytics?${params}`, {
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setData(result.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [metric, department, dateRange, getAuthHeaders]);

  useEffect(() => {
    if (chartConfig) {
      setChartConfigState(chartConfig);
      setAnalysis(analysisSummary || '');
      setLoading(false);
      setError(null);
      return;
    }
    setChartConfigState(null);
    setAnalysis('');
    fetchAnalyticsData();
  }, [chartConfig, analysisSummary, fetchAnalyticsData]);

  const handleExportCSV = async () => {
    const params = new URLSearchParams({ metric, format: 'csv' });
    if (department) params.set('department', department);
    if (dateRange) params.set('dateRange', dateRange);

    const response = await fetch(`/api/analytics?${params}`, {
      headers: getAuthHeaders(),
    });

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${metric}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getChartData = () => {
    if (!data) return null;

    switch (metric) {
      case 'headcount':
        if (chartType === 'line' && data.trends) {
          return {
            labels: data.trends.map((t: TrendPoint) => t.date),
            datasets: [
              {
                label: 'Headcount',
                data: data.trends.map((t: TrendPoint) => t.count),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
              },
            ],
          };
        }
        if (chartType === 'bar' && data.byDepartment) {
          return {
            labels: Object.keys(data.byDepartment),
            datasets: [
              {
                label: 'Employees',
                data: Object.values(data.byDepartment),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 2,
              },
            ],
          };
        }
        if (chartType === 'pie' && data.byDepartment) {
          return {
            labels: Object.keys(data.byDepartment),
            datasets: [
              {
                data: Object.values(data.byDepartment),
                backgroundColor: [
                  'rgba(59, 130, 246, 0.8)',
                  'rgba(139, 92, 246, 0.8)',
                  'rgba(236, 72, 153, 0.8)',
                  'rgba(34, 197, 94, 0.8)',
                  'rgba(251, 146, 60, 0.8)',
                  'rgba(14, 165, 233, 0.8)',
                ],
              },
            ],
          };
        }
        break;

      case 'attrition':
        if (data.byDepartment && chartType === 'bar') {
          return {
            labels: Object.keys(data.byDepartment),
            datasets: [
              {
                label: 'Attrition Rate (%)',
                data: Object.values(data.byDepartment).map((d) =>
                  typeof d === 'object' && 'attritionRate' in d ? d.attritionRate : 0
                ),
                backgroundColor: 'rgba(239, 68, 68, 0.6)',
                borderColor: 'rgb(239, 68, 68)',
                borderWidth: 2,
              },
            ],
          };
        }
        break;

      case 'performance':
        if (data.distribution && chartType === 'bar') {
          return {
            labels: Object.keys(data.distribution),
            datasets: [
              {
                label: 'Employee Count',
                data: Object.values(data.distribution),
                backgroundColor: 'rgba(34, 197, 94, 0.6)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 2,
              },
            ],
          };
        }
        break;
    }

    return null;
  };

  // Transform Chart.js data to Recharts format
  const transformDataForRecharts = (chartJsData: ChartJsData | null) => {
    if (!chartJsData) return [];
    return chartJsToRecharts(chartJsData);
  };

  const getChartIcon = () => {
    switch (chartType) {
      case 'line':
        return <LineChart className="w-4 h-4" />;
      case 'pie':
        return <PieChart className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getMetricTitle = () => {
    const titles: Record<string, string> = {
      headcount: 'Headcount Analytics',
      attrition: 'Attrition Rate',
      diversity: 'Diversity Metrics',
      performance: 'Performance Distribution',
      compensation: 'Compensation Analysis',
    };
    return titles[metric] || 'Analytics';
  };

  const chartJsData = chartConfigState ? chartConfigState.data : getChartData();
  const rechartsData = transformDataForRecharts(chartJsData);
  const resolvedChartType = chartConfigState?.type || chartType;

  // Get the dataKey for Recharts (first dataset label or default)
  const dataKey = chartJsData?.datasets?.[0]?.label || 'value';

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          {getChartIcon()}
          <div>
            <h4 className="font-medium">{getMetricTitle()}</h4>
            <p className="text-xs text-gray-400">
              {department && `${department} • `}
              {dateRange?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          {!chartConfigState && (
            <button
              onClick={fetchAnalyticsData}
              disabled={loading}
              className="px-3 py-1.5 bg-terracotta/10 hover:bg-terracotta hover:text-cream-white border border-warm hover:border-terracotta rounded-xl text-xs transition-all flex items-center gap-1 disabled:opacity-50 font-medium shadow-soft hover:shadow-warm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}

          {/* Export CSV */}
          {!chartConfigState && (
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-sage/10 hover:bg-sage hover:text-cream-white border border-warm hover:border-sage rounded-xl text-xs transition-all flex items-center gap-1 font-medium shadow-soft hover:shadow-warm"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-terracotta" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-400">
            <p>Error: {error}</p>
          </div>
        ) : rechartsData.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full"
          >
            {resolvedChartType === 'line' && (
              <SimpleLineChart data={rechartsData} dataKey={dataKey} color="#3b82f6" />
            )}
            {resolvedChartType === 'pie' && (
              <SimplePieChart data={rechartsData} dataKey={dataKey} />
            )}
            {(resolvedChartType === 'bar' || !resolvedChartType) && (
              <SimpleBarChart
                data={rechartsData}
                dataKey={dataKey}
                color={
                  metric === 'attrition'
                    ? '#ef4444'
                    : metric === 'performance'
                      ? '#22c55e'
                      : '#3b82f6'
                }
              />
            )}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No data available for visualization</p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {!loading && !chartConfigState && data && (
        <div className="flex-shrink-0 mt-4 pt-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            {metric === 'headcount' && (
              <>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{data.total}</p>
                  <p className="text-xs text-gray-400">Total Employees</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-400">
                    {Object.keys(data.byDepartment || {}).length}
                  </p>
                  <p className="text-xs text-gray-400">Departments</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-400">
                    {data.spanOfControl?.average?.toFixed(1) || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400">Avg Span of Control</p>
                </div>
              </>
            )}
            {metric === 'attrition' && data.overall && (
              <>
                <div>
                  <p className="text-2xl font-bold text-red-400">{data.overall.attritionRate}%</p>
                  <p className="text-xs text-gray-400">Attrition Rate</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">
                    {data.overall.voluntaryRate}%
                  </p>
                  <p className="text-xs text-gray-400">Voluntary</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-400">
                    {data.overall.involuntaryRate}%
                  </p>
                  <p className="text-xs text-gray-400">Involuntary</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {!loading && chartConfigState && analysis && (
        <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-200 whitespace-pre-line">
          {analysis}
        </div>
      )}

      {!loading && chartConfigState && metadata && (
        <div className="mt-3 text-xs text-gray-400">
          Rows returned: {metadata.rowsReturned ?? metadata?.metadata?.rowsReturned ?? '—'}
        </div>
      )}
    </div>
  );
}
