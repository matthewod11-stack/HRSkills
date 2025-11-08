'use client';

import { useEffect } from 'react';
import { initMonitoring } from '@/lib/monitoring';

/**
 * Monitoring Provider Component
 *
 * Initializes performance monitoring and error tracking.
 * Must be a client component since it uses browser APIs.
 *
 * Usage:
 * Add to root layout to monitor entire application.
 */
export function MonitoringProvider() {
  useEffect(() => {
    // Initialize monitoring on client-side
    initMonitoring();
  }, []);

  // This component doesn't render anything
  return null;
}
