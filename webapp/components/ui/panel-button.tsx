'use client';

import { type ButtonHTMLAttributes, forwardRef, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PanelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline';
  size?: 'sm' | 'md';
  children: ReactNode;
}

/**
 * PanelButton - Consistent button styling for side panel modules
 *
 * Variants:
 * - primary: Terracotta accent, used for primary actions (Export, Save)
 * - ghost: Transparent with hover state, used for secondary actions (Edit, Refresh)
 * - outline: Bordered style for neutral actions
 *
 * Sizes:
 * - sm: Compact size for dense UIs (default)
 * - md: Standard size for prominent actions
 */
export const PanelButton = forwardRef<HTMLButtonElement, PanelButtonProps>(
  ({ className, variant = 'ghost', size = 'sm', children, disabled, ...props }, ref) => {
    const variants = {
      primary:
        'bg-terracotta/10 hover:bg-terracotta hover:text-cream-white border-terracotta/50 hover:border-terracotta text-charcoal',
      ghost:
        'bg-transparent hover:bg-sage/10 border-transparent hover:border-sage/30 text-charcoal',
      outline:
        'bg-cream-white border-warm hover:border-sage text-charcoal hover:bg-sage/5',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'rounded-xl border font-medium transition-all flex items-center gap-1.5 shadow-soft hover:shadow-warm',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-soft',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

PanelButton.displayName = 'PanelButton';

export default PanelButton;
