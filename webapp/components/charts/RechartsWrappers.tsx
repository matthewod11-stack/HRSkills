'use client';

/**
 * Recharts Wrapper Components
 *
 * Simplified, reusable chart components built on Recharts.
 * Optimized for dark theme and HRSkills analytics dashboard.
 */

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getChartColor, formatChartValue, type RechartsDataPoint } from '@/lib/charts/recharts-helpers';

interface BaseChartProps {
  data: RechartsDataPoint[];
  height?: number;
}

interface SimpleBarChartProps extends BaseChartProps {
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
}

interface SimpleLineChartProps extends BaseChartProps {
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
}

interface SimplePieChartProps extends BaseChartProps {
  dataKey: string;
  nameKey?: string;
}

/**
 * Simple Bar Chart Component
 */
export function SimpleBarChart({
  data,
  dataKey,
  xAxisKey = 'name',
  color = '#3b82f6',
  height = 300,
  valueFormatter,
}: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
        <XAxis
          dataKey={xAxisKey}
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
        />
        <YAxis
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          tickFormatter={(value) => (valueFormatter ? valueFormatter(value) : formatChartValue(value))}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#f3f4f6' }}
          itemStyle={{ color: '#f3f4f6' }}
          formatter={(value: number) => (valueFormatter ? valueFormatter(value) : formatChartValue(value))}
        />
        <Legend
          wrapperStyle={{ color: '#9ca3af' }}
          iconType="square"
        />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Simple Line Chart Component
 */
export function SimpleLineChart({
  data,
  dataKey,
  xAxisKey = 'name',
  color = '#10b981',
  height = 300,
  valueFormatter,
}: SimpleLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
        <XAxis
          dataKey={xAxisKey}
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
        />
        <YAxis
          stroke="#9ca3af"
          tick={{ fill: '#9ca3af', fontSize: 12 }}
          tickFormatter={(value) => (valueFormatter ? valueFormatter(value) : formatChartValue(value))}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#f3f4f6' }}
          itemStyle={{ color: '#f3f4f6' }}
          formatter={(value: number) => (valueFormatter ? valueFormatter(value) : formatChartValue(value))}
        />
        <Legend
          wrapperStyle={{ color: '#9ca3af' }}
          iconType="circle"
        />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          dot={{ fill: color, r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Simple Pie Chart Component
 */
export function SimplePieChart({
  data,
  dataKey,
  nameKey = 'name',
  height = 300,
}: SimplePieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey={dataKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          outerRadius={100}
          label={(entry: any) => `${entry[nameKey]}: ${formatChartValue(entry[dataKey])}`}
          labelLine={{ stroke: '#9ca3af' }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getChartColor(index)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#f3f4f6' }}
          itemStyle={{ color: '#f3f4f6' }}
          formatter={(value: number) => formatChartValue(value)}
        />
        <Legend
          wrapperStyle={{ color: '#9ca3af' }}
          iconType="circle"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
