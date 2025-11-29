/**
 * Chart Color System
 *
 * Centralized color constants for data visualization components.
 * These colors are designed to work harmoniously with the warm earth-tone
 * design system defined in tailwind.config.js.
 *
 * Color meanings:
 * - Sage (#8B9D83): Primary data, neutral metrics, headcount
 * - Success (#6B8E6F): Positive trends, high performers, promoters
 * - Terracotta (#E07856): Attention areas, voluntary attrition
 * - Error (#C87F5D): Negative trends, at-risk, detractors
 * - Amber (#E6A852): Warnings, neutral sentiment, medium performers
 */

// Primary data visualization colors
export const CHART_COLORS = {
  // Headcount and general metrics
  headcount: {
    primary: '#8B9D83', // sage
    secondary: '#A8B89B', // sage-light
    tertiary: '#C5D4BC', // sage-soft
  },

  // Attrition and turnover
  attrition: {
    primary: '#C87F5D', // error (warm red)
    secondary: '#E07856', // terracotta
    tertiary: '#F0A58F', // terracotta-light
  },

  // Performance ratings
  performance: {
    positive: '#6B8E6F', // success
    neutral: '#E6A852', // amber
    negative: '#C87F5D', // error
  },

  // Survey sentiment
  sentiment: {
    positive: '#6B8E6F', // success
    neutral: '#E6A852', // amber
    negative: '#C87F5D', // error
  },
} as const;

// 9-Box Grid color mapping
export const NINE_BOX_COLORS = {
  'High-High': '#6B8E6F', // success - Stars
  'High-Medium': '#8B9D83', // sage - High performers
  'High-Low': '#A8B89B', // sage-light - Consistent performers
  'Medium-High': '#A8B89B', // sage-light - High potentials
  'Medium-Medium': '#C5D4BC', // sage-soft - Core employees
  'Medium-Low': '#E6A852', // amber - Inconsistent
  'Low-High': '#E07856', // terracotta - Enigmas
  'Low-Medium': '#D4704A', // terracotta-dark - Underperformers
  'Low-Low': '#C87F5D', // error - At risk
} as const;

// Multi-color palette for pie charts and categorical data
export const PIE_COLORS = [
  '#8B9D83', // sage
  '#E07856', // terracotta
  '#E6A852', // amber
  '#A8B89B', // sage-light
  '#D4704A', // terracotta-dark
  '#F0A58F', // terracotta-light
  '#6B8E6F', // success
  '#C5D4BC', // sage-soft
] as const;

// Line chart colors with matching fill opacity
export const LINE_COLORS = {
  primary: {
    stroke: '#8B9D83',
    fill: 'rgba(139, 157, 131, 0.1)',
  },
  secondary: {
    stroke: '#E07856',
    fill: 'rgba(224, 120, 86, 0.1)',
  },
  tertiary: {
    stroke: '#E6A852',
    fill: 'rgba(230, 168, 82, 0.1)',
  },
} as const;

// Helper function to get chart color by metric type
export function getChartColor(
  metric: 'headcount' | 'attrition' | 'performance' | 'sentiment',
  variant: 'primary' | 'secondary' | 'tertiary' | 'positive' | 'neutral' | 'negative' = 'primary'
): string {
  const colors = CHART_COLORS[metric];
  if (!colors) return CHART_COLORS.headcount.primary;

  if (variant in colors) {
    return colors[variant as keyof typeof colors];
  }

  return 'primary' in colors ? colors.primary : CHART_COLORS.headcount.primary;
}

// Helper function to get 9-box cell color
export function getNineBoxColor(performance: string, potential: string): string {
  const key = `${performance}-${potential}` as keyof typeof NINE_BOX_COLORS;
  return NINE_BOX_COLORS[key] || NINE_BOX_COLORS['Medium-Medium'];
}

// Get pie colors array for a given number of segments
export function getPieColors(count: number): string[] {
  const colors = [...PIE_COLORS];
  while (colors.length < count) {
    colors.push(...PIE_COLORS);
  }
  return colors.slice(0, count);
}
