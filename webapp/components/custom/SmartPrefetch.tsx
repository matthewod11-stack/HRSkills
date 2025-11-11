/**
 * SmartPrefetch Component
 *
 * Intelligent route prefetching based on current page.
 * Preloads likely next pages during idle time for instant navigation.
 *
 * @remarks
 * This component runs client-side only and uses requestIdleCallback
 * to avoid impacting main thread performance.
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Prefetch mapping:
 * - Key: Current route
 * - Value: Array of routes likely to be visited next
 *
 * Based on user behavior analytics and logical navigation paths.
 */
const PREFETCH_MAP: Record<string, string[]> = {
  // From homepage, users likely go to analytics or data sources
  '/': ['/analytics', '/data-sources', '/nine-box'],

  // From analytics, likely to check nine-box or upload more data
  '/analytics': ['/nine-box', '/data-sources', '/employees'],

  // From data sources, likely to view analytics or employee table
  '/data-sources': ['/analytics', '/employees'],

  // From nine-box, likely to check analytics or individual employees
  '/nine-box': ['/analytics', '/employees'],

  // From employees, likely to go to performance or analytics
  '/employees': ['/analytics', '/nine-box'],

  // From team-time, likely to return home or check employees
  '/team-time': ['/', '/employees'],

  // From settings, likely to return home
  '/settings': ['/'],

  // From documents, likely to return home or check employees
  '/documents': ['/', '/employees'],

  // From accessibility, likely to return home
  '/accessibility': ['/'],
};

/**
 * Prefetch strategy configurations
 */
const PREFETCH_CONFIG = {
  // Wait this long before starting prefetch (ms)
  delay: 1000,

  // Maximum number of routes to prefetch per page
  maxPrefetchCount: 3,

  // Only prefetch on fast connections
  minEffectiveType: '4g' as const,

  // Only prefetch if user is not on save-data mode
  respectSaveData: true,
} as const;

export function SmartPrefetch() {
  const pathname = usePathname();

  useEffect(() => {
    // Only run in production for real benefit
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Check network conditions
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      // Respect save-data preference
      if (PREFETCH_CONFIG.respectSaveData && connection.saveData) {
        return;
      }

      // Only prefetch on fast connections
      if (
        connection.effectiveType &&
        connection.effectiveType !== PREFETCH_CONFIG.minEffectiveType &&
        connection.effectiveType !== '3g'
      ) {
        return;
      }
    }

    // Get routes to prefetch for current page
    const routesToPrefetch = (PREFETCH_MAP[pathname] || []).slice(
      0,
      PREFETCH_CONFIG.maxPrefetchCount
    );

    if (routesToPrefetch.length === 0) {
      return;
    }

    // Delay prefetch to avoid competing with critical resources
    const timeoutId = setTimeout(() => {
      routesToPrefetch.forEach((route, index) => {
        // Stagger prefetch requests
        const prefetchDelay = index * 200;

        setTimeout(() => {
          // Use requestIdleCallback if available
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              prefetchRoute(route);
            });
          } else {
            // Fallback to setTimeout
            setTimeout(() => {
              prefetchRoute(route);
            }, 0);
          }
        }, prefetchDelay);
      });
    }, PREFETCH_CONFIG.delay);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null; // This component doesn't render anything
}

/**
 * Prefetch a route by creating a link element
 */
function prefetchRoute(route: string) {
  // Check if already prefetched
  const existing = document.querySelector(`link[rel="prefetch"][href="${route}"]`);
  if (existing) {
    return;
  }

  // Create prefetch link
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  link.as = 'document';

  // Add to head
  document.head.appendChild(link);

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[SmartPrefetch] Prefetched: ${route}`);
  }
}

/**
 * Hook for manual prefetching (e.g., on hover)
 */
export function usePrefetch() {
  return (route: string) => {
    prefetchRoute(route);
  };
}
