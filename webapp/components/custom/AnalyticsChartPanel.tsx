'use client';

import { motion } from 'framer-motion';
import { BarChart3, Download, LineChart, PieChart, RefreshCw, ScatterChart } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SimpleBarChart,
  SimpleLineChart,
  SimplePieChart,
  SimpleScatterChart,
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
  const [displayMode, setDisplayMode] = useState<'line' | 'scatter' | 'bar'>('line');
  const chartContainerRef = useRef<HTMLDivElement>(null);

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
      setLoading(false);
      setError(null);
      return;
    }
    setChartConfigState(null);
    fetchAnalyticsData();
  }, [chartConfig, fetchAnalyticsData]);

  const handleDownloadChart = () => {
    const chartSvg = chartContainerRef.current?.querySelector('svg');
    if (!chartSvg) {
      console.error("Couldn't find chart SVG to download");
      return;
    }

    const svgString = new XMLSerializer().serializeToString(chartSvg);
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Add a small border for better aesthetics
      const border = 20;
      canvas.width = img.width + border * 2;
      canvas.height = img.height + border * 2;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white'; // Or your desired background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, border, border);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${metric}_chart.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = (err) => {
      console.error('Failed to load SVG image for download', err);
      URL.revokeObjectURL(url);
    };
    img.src = url;
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

  const chartJsData = chartConfigState ? chartConfigState.data : getChartData();
  const rechartsData = transformDataForRecharts(chartJsData);
  const resolvedChartType = chartConfigState?.type || chartType;

  // Get the dataKey for Recharts (first dataset label or default)
  const dataKey = chartJsData?.datasets?.[0]?.label || 'value';

  const chartColor = metric === 'attrition' ? '#C87F5D' : metric === 'performance' ? '#6B8E6F' : '#8B9D83';

  return (
    <div className="flex flex-col h-full p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-charcoal-light">
          {department && `${department} • `}
          {dateRange?.replace(/_/g, ' ')}
        </p>

        {/* Download Button */}
        <button
          onClick={handleDownloadChart}
          className="px-3 py-1.5 bg-sage/10 hover:bg-sage hover:text-cream-white border border-sage/20 hover:border-sage rounded-lg text-xs transition-all flex items-center gap-1.5 font-medium"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>

      {/* Chart Type Toggle */}
      <div className="flex items-center justify-center gap-1 mb-4">
        <button
          onClick={() => setDisplayMode('line')}
          className={`p-2 rounded-lg transition-all ${
            displayMode === 'line'
              ? 'bg-sage/20 text-sage border border-sage/40'
              : 'bg-cream hover:bg-sage/10 text-charcoal-light border border-transparent'
          }`}
          title="Line chart"
        >
          <LineChart className="w-4 h-4" />
        </button>
        <button
          onClick={() => setDisplayMode('scatter')}
          className={`p-2 rounded-lg transition-all ${
            displayMode === 'scatter'
              ? 'bg-sage/20 text-sage border border-sage/40'
              : 'bg-cream hover:bg-sage/10 text-charcoal-light border border-transparent'
          }`}
          title="Scatter chart"
        >
          <ScatterChart className="w-4 h-4" />
        </button>
        <button
          onClick={() => setDisplayMode('bar')}
          className={`p-2 rounded-lg transition-all ${
            displayMode === 'bar'
              ? 'bg-sage/20 text-sage border border-sage/40'
              : 'bg-cream hover:bg-sage/10 text-charcoal-light border border-transparent'
          }`}
          title="Bar chart"
        >
          <BarChart3 className="w-4 h-4" />
        </button>
      </div>

      {/* Chart Area - fills available space */}
      <div className="flex-1 min-h-[200px]" ref={chartContainerRef}>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 animate-spin text-terracotta" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-error">
            <p>Error: {error}</p>
          </div>
        ) : rechartsData.length > 0 ? (
          <motion.div
            key={displayMode}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {displayMode === 'line' && (
              <SimpleLineChart data={rechartsData} dataKey={dataKey} color={chartColor} />
            )}
            {displayMode === 'scatter' && (
              <SimpleScatterChart data={rechartsData} dataKey={dataKey} color={chartColor} />
            )}
            {displayMode === 'bar' && (
              <SimpleBarChart data={rechartsData} dataKey={dataKey} color={chartColor} />
            )}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-charcoal-soft">
            <p>No data available</p>
          </div>
        )}
      </div>

      {/* Summary Stats - Only for direct API data, not AI responses */}
      {!loading && !chartConfigState && data && (
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-sage/20">
          {metric === 'headcount' && (
            <>
              <div className="text-center">
                <p className="text-xl font-bold text-sage">{data.total}</p>
                <p className="text-[10px] text-charcoal-light">Total</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-sage-light">
                  {Object.keys(data.byDepartment || {}).length}
                </p>
                <p className="text-[10px] text-charcoal-light">Depts</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-bold ${data.spanOfControl?.average ? 'text-sage' : 'text-charcoal-soft'}`}>
                  {data.spanOfControl?.average?.toFixed(1) ?? '—'}
                </p>
                <p className="text-[10px] text-charcoal-light">Span</p>
              </div>
            </>
          )}
          {metric === 'attrition' && data.overall && (
            <>
              <div className="text-center">
                <p className="text-xl font-bold text-error">{data.overall.attritionRate}%</p>
                <p className="text-[10px] text-charcoal-light">Attrition</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-terracotta">{data.overall.voluntaryRate}%</p>
                <p className="text-[10px] text-charcoal-light">Voluntary</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-amber">{data.overall.involuntaryRate}%</p>
                <p className="text-[10px] text-charcoal-light">Involuntary</p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
