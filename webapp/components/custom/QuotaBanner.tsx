'use client';

/**
 * Quota Banner Component
 *
 * Displays API quota status for users on the shared Anthropic key.
 * Shows:
 * - Requests remaining today
 * - Quota reset time
 * - Upgrade prompt when approaching limit
 * - Call-to-action to add personal API key
 */

import { AlertCircle, ArrowUpRight, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export interface QuotaStatus {
  hasPersonalKey: boolean;
  usingSharedKey: boolean;
  requestsToday: number;
  requestsRemaining: number;
  quotaLimit: number;
  quotaResetAt: Date | string;
  isQuotaExceeded: boolean;
}

interface QuotaBannerProps {
  quotaStatus?: QuotaStatus;
  className?: string;
}

export function QuotaBanner({ quotaStatus, className = '' }: QuotaBannerProps) {
  const [timeUntilReset, setTimeUntilReset] = useState('');

  // Calculate time until reset
  useEffect(() => {
    // Don't run if no quota status or user has personal key
    if (!quotaStatus || quotaStatus.hasPersonalKey) {
      return;
    }
    const updateTimeUntilReset = () => {
      if (!quotaStatus?.quotaResetAt) return;

      const resetDate =
        typeof quotaStatus.quotaResetAt === 'string'
          ? new Date(quotaStatus.quotaResetAt)
          : quotaStatus.quotaResetAt;

      const now = new Date();
      const diff = resetDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilReset('soon');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        setTimeUntilReset(`${hours}h ${minutes}m`);
      } else {
        setTimeUntilReset(`${minutes}m`);
      }
    };

    updateTimeUntilReset();
    const interval = setInterval(updateTimeUntilReset, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [quotaStatus?.quotaResetAt, quotaStatus]);

  // Don't show banner if user has personal API key
  if (!quotaStatus || quotaStatus.hasPersonalKey) {
    return null;
  }

  // Calculate usage percentage
  const usagePercent = Math.round((quotaStatus.requestsToday / quotaStatus.quotaLimit) * 100);

  // Determine warning level
  const isWarning = usagePercent >= 70;
  const isCritical = usagePercent >= 90;
  const isExceeded = quotaStatus.isQuotaExceeded;

  // Don't show if usage is low (< 50%) and user hasn't been warned
  if (usagePercent < 50 && !isExceeded) {
    return null;
  }

  const containerClasses = [
    'w-full',
    'rounded-xl',
    'border',
    'p-4',
    'shadow-sm',
    'bg-white/70',
    'dark:bg-slate-900/60',
    isExceeded
      ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
      : isCritical
        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
        : isWarning
          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/15'
          : 'border-slate-200 dark:border-slate-700',
  ];

  const indicatorColor = isExceeded
    ? 'bg-red-600 dark:bg-red-400'
    : isCritical
      ? 'bg-orange-600 dark:bg-orange-400'
      : 'bg-blue-600 dark:bg-blue-400';

  const usageDisplayPercent = Math.min(Math.max(usagePercent, 0), 100);

  return (
    <div className={`${containerClasses.join(' ')} ${className}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {isExceeded ? (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          ) : (
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>

        <div className="flex-1 space-y-3 text-sm">
          {isExceeded ? (
            <div className="space-y-2">
              <p className="font-semibold text-red-900 dark:text-red-100">Daily quota exceeded</p>
              <p className="text-red-800 dark:text-red-200">
                You&apos;ve used all {quotaStatus.quotaLimit} free requests today. Add your own API
                key for unlimited usage, or wait for quota reset.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {quotaStatus.requestsRemaining} of {quotaStatus.quotaLimit} free requests remaining
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                You&apos;re using a shared API key. Add your own Anthropic API key in Settings for
                unlimited usage.
              </p>
            </div>
          )}

          {!isExceeded && (
            <div className="space-y-1">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className={`h-full transition-all duration-300 ${indicatorColor}`}
                  style={{ width: `${usageDisplayPercent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                <span>
                  {quotaStatus.requestsToday} / {quotaStatus.quotaLimit} used
                </span>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Resets in {timeUntilReset}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Link
              href="/settings?tab=ai"
              className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isExceeded
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'border border-slate-300 text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Zap className="h-4 w-4" />
              {isExceeded ? 'Add API Key Now' : 'Upgrade to Unlimited'}
              <ArrowUpRight className="h-3 w-3" />
            </Link>

            {!isExceeded && (
              <Link
                href="/settings?tab=ai"
                className="inline-flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              >
                Learn More
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for header/nav display
 */
export function QuotaBadge({ quotaStatus }: { quotaStatus?: QuotaStatus }) {
  if (!quotaStatus || quotaStatus.hasPersonalKey) {
    return null;
  }

  const usagePercent = Math.round((quotaStatus.requestsToday / quotaStatus.quotaLimit) * 100);

  // Only show if approaching limit (70%+) or exceeded
  if (usagePercent < 70) {
    return null;
  }

  const isExceeded = quotaStatus.isQuotaExceeded;

  return (
    <Link
      href="/settings?tab=ai"
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        transition-colors
        ${
          isExceeded
            ? 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-950 dark:text-red-200'
            : 'bg-orange-100 text-orange-800 hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-200'
        }
      `}
    >
      <AlertCircle className="h-3 w-3" />
      {isExceeded ? 'Quota exceeded' : `${quotaStatus.requestsRemaining} left`}
    </Link>
  );
}
