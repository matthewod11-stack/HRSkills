/**
 * Recharts Data Transformation Helpers
 *
 * Utilities for transforming Chart.js data format to Recharts format.
 * Recharts expects flat objects with named properties, while Chart.js
 * uses a labels + datasets structure.
 */

export interface ChartJsDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
}

export interface ChartJsData {
  labels: string[];
  datasets: ChartJsDataset[];
}

export type RechartsDataPoint = Record<string, string | number>;

/**
 * Transform Chart.js data format to Recharts format
 *
 * @example
 * // Input (Chart.js):
 * {
 *   labels: ['Q1', 'Q2', 'Q3'],
 *   datasets: [{
 *     label: 'Revenue',
 *     data: [100, 200, 150]
 *   }]
 * }
 *
 * // Output (Recharts):
 * [
 *   { name: 'Q1', Revenue: 100 },
 *   { name: 'Q2', Revenue: 200 },
 *   { name: 'Q3', Revenue: 150 }
 * ]
 */
export function chartJsToRecharts(chartJsData: ChartJsData): RechartsDataPoint[] {
  const { labels, datasets } = chartJsData;

  return labels.map((label: string, index: number) => {
    const dataPoint: RechartsDataPoint = { name: label };

    datasets.forEach((dataset) => {
      dataPoint[dataset.label] = dataset.data[index];
    });

    return dataPoint;
  });
}

/**
 * Get color for chart component (dark theme optimized)
 */
export function getChartColor(index: number): string {
  const colors = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#06b6d4', // cyan-500
    '#84cc16', // lime-500
  ];
  return colors[index % colors.length];
}

/**
 * Format number for chart display
 */
export function formatChartValue(
  value: number,
  type?: 'number' | 'percentage' | 'currency'
): string {
  if (type === 'percentage') {
    return `${value}%`;
  }
  if (type === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return value.toLocaleString();
}
