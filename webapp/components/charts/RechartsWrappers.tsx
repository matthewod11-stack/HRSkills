'use client';

/**
 * Recharts Wrapper Components
 *
 * Simplified, reusable chart components built on Recharts.
 * Optimized for dark theme and HRSkills analytics dashboard.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  formatChartValue,
  getChartColor,
  type RechartsDataPoint,
} from '@/lib/charts/recharts-helpers';

interface BaseChartProps {
  data: RechartsDataPoint[];
  height?: number | string;
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

interface SimpleScatterChartProps extends BaseChartProps {
  dataKey: string;
  xAxisKey?: string;
  color?: string;
  valueFormatter?: (value: number) => string;
}

/**
 * Simple Bar Chart Component
 */
export function SimpleBarChart({
  data,
  dataKey,
  xAxisKey = 'name',
  color = '#8B9D83',
  height = '100%',
  valueFormatter,
}: SimpleBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" opacity={0.5} />
        <XAxis dataKey={xAxisKey} stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} />
        <YAxis
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          width={40}
          tickFormatter={(value) =>
            valueFormatter ? valueFormatter(value) : formatChartValue(value)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#faf8f5',
            border: '1px solid #e5e2dc',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#2d3436' }}
          itemStyle={{ color: '#2d3436' }}
          formatter={(value: number) =>
            valueFormatter ? valueFormatter(value) : formatChartValue(value)
          }
        />
        <Legend wrapperStyle={{ color: '#6b7280' }} iconType="square" />
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
  color = '#8B9D83',
  height = '100%',
  valueFormatter,
}: SimpleLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" opacity={0.5} />
        <XAxis dataKey={xAxisKey} stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} />
        <YAxis
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          width={40}
          tickFormatter={(value) =>
            valueFormatter ? valueFormatter(value) : formatChartValue(value)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#faf8f5',
            border: '1px solid #e5e2dc',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#2d3436' }}
          itemStyle={{ color: '#2d3436' }}
          formatter={(value: number) =>
            valueFormatter ? valueFormatter(value) : formatChartValue(value)
          }
        />
        <Legend wrapperStyle={{ color: '#6b7280' }} iconType="circle" />
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
 * Simple Scatter Chart Component (dots only, no connecting line)
 */
export function SimpleScatterChart({
  data,
  dataKey,
  xAxisKey = 'name',
  color = '#8B9D83',
  height = '100%',
  valueFormatter,
}: SimpleScatterChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" opacity={0.5} />
        <XAxis dataKey={xAxisKey} stroke="#6b7280" tick={{ fill: '#6b7280', fontSize: 11 }} />
        <YAxis
          stroke="#6b7280"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          width={40}
          tickFormatter={(value) =>
            valueFormatter ? valueFormatter(value) : formatChartValue(value)
          }
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#faf8f5',
            border: '1px solid #e5e2dc',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#2d3436' }}
          itemStyle={{ color: '#2d3436' }}
          formatter={(value: number) =>
            valueFormatter ? valueFormatter(value) : formatChartValue(value)
          }
        />
        <Legend wrapperStyle={{ color: '#6b7280' }} iconType="circle" />
        <Line
          type="monotone"
          dataKey={dataKey}
          stroke="transparent"
          strokeWidth={0}
          dot={{ fill: color, r: 5, strokeWidth: 0 }}
          activeDot={{ r: 7, fill: color }}
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
  height = '100%',
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
          label={(entry: RechartsDataPoint) =>
            `${entry[nameKey]}: ${formatChartValue(entry[dataKey] as number)}`
          }
          labelLine={{ stroke: '#6b7280' }}
        >
          {data.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={getChartColor(index)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: '#faf8f5',
            border: '1px solid #e5e2dc',
            borderRadius: '8px',
          }}
          labelStyle={{ color: '#2d3436' }}
          itemStyle={{ color: '#2d3436' }}
          formatter={(value: number) => formatChartValue(value)}
        />
        <Legend wrapperStyle={{ color: '#6b7280' }} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
