'use client';

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatColor = 'primary' | 'secondary' | 'muted' | 'success' | 'warning' | 'error';

interface PanelStatProps {
  label: string;
  value: string | number;
  color?: StatColor;
  className?: string;
}

const colorMap: Record<StatColor, string> = {
  primary: 'text-sage',
  secondary: 'text-sage-light',
  muted: 'text-charcoal-soft',
  success: 'text-success',
  warning: 'text-amber',
  error: 'text-error',
};

/**
 * PanelStat - Individual statistic display for side panels
 *
 * Colors:
 * - primary: Default sage color for neutral stats
 * - secondary: Lighter sage for secondary metrics
 * - muted: Gray for unavailable/placeholder values
 * - success: Green for positive indicators
 * - warning: Amber for attention items
 * - error: Warm red for negative indicators
 */
export function PanelStat({ label, value, color = 'primary', className }: PanelStatProps) {
  return (
    <div className={cn('text-center', className)}>
      <p className={cn('panel-stat-value', colorMap[color])}>{value}</p>
      <p className="panel-stat-label">{label}</p>
    </div>
  );
}

interface PanelStatsProps {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

/**
 * PanelStats - Container for displaying multiple statistics in a grid
 *
 * Wraps PanelStat components in a responsive grid layout with
 * consistent spacing and visual separation.
 */
export function PanelStats({ children, columns = 3, className }: PanelStatsProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };

  return (
    <div
      className={cn(
        'grid gap-4 py-4 border-t border-sage/20',
        gridCols[columns],
        className
      )}
    >
      {children}
    </div>
  );
}

interface PanelStatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: StatColor;
  className?: string;
}

/**
 * PanelStatCard - Boxed statistic with optional icon
 *
 * A more prominent stat display with background color and border,
 * typically used in summary sections.
 */
export function PanelStatCard({
  label,
  value,
  icon,
  color = 'primary',
  className,
}: PanelStatCardProps) {
  const bgColorMap: Record<StatColor, string> = {
    primary: 'bg-sage/10 border-sage/30',
    secondary: 'bg-sage-light/10 border-sage-light/30',
    muted: 'bg-charcoal-soft/10 border-charcoal-soft/30',
    success: 'bg-success/10 border-success/30',
    warning: 'bg-amber/10 border-amber/30',
    error: 'bg-error/10 border-error/30',
  };

  const iconColorMap: Record<StatColor, string> = {
    primary: 'text-sage',
    secondary: 'text-sage-light',
    muted: 'text-charcoal-soft',
    success: 'text-success',
    warning: 'text-amber',
    error: 'text-error',
  };

  return (
    <div
      className={cn(
        'rounded-xl p-4 border shadow-soft',
        bgColorMap[color],
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon && <span className={cn('w-4 h-4', iconColorMap[color])}>{icon}</span>}
        <span className="text-xs text-charcoal-light">{label}</span>
      </div>
      <p className={cn('text-2xl font-bold', colorMap[color])}>{value}</p>
    </div>
  );
}

export default PanelStats;
