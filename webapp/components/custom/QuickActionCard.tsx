'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
  href?: string;
}

/**
 * QuickActionCard Component
 *
 * Displays a clickable action card with icon and gradient styling.
 * Memoized to prevent unnecessary re-renders in grid layouts.
 *
 * @remarks
 * This component is frequently rendered in lists/grids on the dashboard.
 * React.memo prevents re-renders when title, description, icon, gradient, or href haven't changed.
 */
export const QuickActionCard = memo(function QuickActionCard({
  title,
  description,
  icon: Icon,
  gradient,
  delay = 0,
  href,
}: QuickActionCardProps) {
  const content = (
    <div className="relative group cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-br from-violet/20 to-violet-light/20 rounded-2xl blur-xl group-hover:blur-2xl transition-premium opacity-50 group-hover:opacity-70" />

      <div className="relative backdrop-blur-xl bg-card border border-border rounded-2xl p-6 hover:border-violet/50 shadow-soft hover:shadow-panel-hover transition-premium flex flex-col justify-center">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet to-violet-light flex items-center justify-center mb-4 shadow-glow-accent">
          <Icon className="w-7 h-7" />
        </div>
        <h3 className="text-lg mb-2 font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-secondary font-medium">{description}</p>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
});
