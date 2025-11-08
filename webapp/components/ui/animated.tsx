'use client'

import { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// ANIMATED BUTTON - Replaces motion.button with whileHover/whileTap
// ============================================================================

interface AnimatedButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function AnimatedButton({
  children,
  className,
  disabled,
  type = 'button',
  ...props
}: AnimatedButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'transition-all duration-200 ease-out',
        'hover:scale-105 active:scale-95',
        'disabled:hover:scale-100 disabled:active:scale-100',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================================================
// ANIMATED DIV - Replaces motion.div with hover effects
// ============================================================================

interface AnimatedDivProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverScale?: number;
}

export function AnimatedDiv({
  children,
  className,
  hoverScale = 1.05,
  ...props
}: AnimatedDivProps) {
  const scaleClass = hoverScale === 1.02 ? 'hover:scale-102' : 'hover:scale-105';

  return (
    <div
      className={cn(
        'transition-all duration-200 ease-out',
        scaleClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// FADE IN - Replaces initial/animate pattern
// ============================================================================

interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
  ...props
}: FadeInProps) {
  const directionClass = {
    up: 'animate-fade-in-up',
    down: 'animate-fade-in-down',
    left: 'animate-fade-in-left',
    right: 'animate-fade-in-right',
    none: 'animate-fade-in'
  }[direction];

  return (
    <div
      className={cn(directionClass, className)}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SCALE IN - Replaces scale animations
// ============================================================================

interface ScaleInProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  ...props
}: ScaleInProps) {
  return (
    <div
      className={cn('animate-scale-in', className)}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SLIDE IN - Replaces slide animations
// ============================================================================

interface SlideInProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  direction?: 'left' | 'right';
  delay?: number;
}

export function SlideIn({
  children,
  className,
  direction = 'left',
  delay = 0,
  ...props
}: SlideInProps) {
  const animationClass = direction === 'left' ? 'animate-slide-in-left' : 'animate-slide-in-right';

  return (
    <div
      className={cn(animationClass, className)}
      style={{ animationDelay: `${delay}ms` }}
      {...props}
    >
      {children}
    </div>
  );
}

// ============================================================================
// STAGGERED LIST - Replaces AnimatePresence with stagger
// ============================================================================

interface StaggeredListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({
  children,
  className,
  staggerDelay = 50
}: StaggeredListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// PULSE - Replaces pulse animations (for loading states)
// ============================================================================

interface PulseProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Pulse({ children, className, ...props }: PulseProps) {
  return (
    <div className={cn('animate-pulse', className)} {...props}>
      {children}
    </div>
  );
}

// ============================================================================
// SPIN - Replaces rotate animations (for loading spinners)
// ============================================================================

interface SpinProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  speed?: 'slow' | 'normal' | 'fast';
}

export function Spin({
  children,
  className,
  speed = 'normal',
  ...props
}: SpinProps) {
  const speedClass = {
    slow: 'animate-spin-slow',
    normal: 'animate-spin',
    fast: 'animate-spin-fast'
  }[speed];

  return (
    <div className={cn(speedClass, className)} {...props}>
      {children}
    </div>
  );
}
