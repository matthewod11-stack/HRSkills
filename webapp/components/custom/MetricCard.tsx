'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  icon: LucideIcon;
  progress: number;
  delay?: number;
  onClick?: () => void;
}

/**
 * MetricCard Component
 *
 * Displays metric information with animated progress circle and hover effects.
 * Memoized to prevent unnecessary re-renders when props haven't changed.
 *
 * @remarks
 * This component is expensive to render due to SVG animations and motion effects.
 * React.memo prevents re-renders unless title, value, change, isPositive, progress, or onClick change.
 */
export const MetricCard = memo(function MetricCard({
  title,
  value,
  change,
  isPositive,
  icon: Icon,
  progress,
  delay = 0,
  onClick,
}: MetricCardProps) {
  // Memoize expensive calculations
  const { circumference, strokeDashoffset } = useMemo(() => {
    const circ = 2 * Math.PI * 36;
    const offset = circ - (progress / 100) * circ;
    return { circumference: circ, strokeDashoffset: offset };
  }, [progress]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      className="relative group cursor-pointer h-full"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet/10 to-violet-light/10 rounded-2xl blur-xl group-hover:blur-2xl transition-premium opacity-0 group-hover:opacity-100" />

      <div className="relative backdrop-blur-xl bg-card border border-border rounded-2xl p-6 hover:border-violet/50 shadow-soft hover:shadow-panel-hover transition-premium h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-secondary text-sm mb-2 font-medium">{title}</p>
            <p className="text-3xl mb-1 font-semibold text-foreground">{value}</p>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isPositive ? 'text-success' : 'text-error'}`}>
                {change}
              </span>
            </div>
          </div>

          <div className="relative w-20 h-20">
            <svg className="transform -rotate-90 w-20 h-20">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-white/10"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="36"
                stroke="url(#gradient)"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, delay: delay + 0.3, ease: 'easeOut' }}
                style={{
                  strokeDasharray: circumference,
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="w-6 h-6 text-violet-light" />
            </div>
          </div>
        </div>

        <motion.div
          className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-auto"
          initial={{ opacity: 0 }}
        >
          <button
            onClick={onClick}
            className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 border border-border hover:border-violet/50 hover:shadow-glow-accent rounded-lg text-xs font-medium transition-premium cursor-pointer"
          >
            View Details
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
});
