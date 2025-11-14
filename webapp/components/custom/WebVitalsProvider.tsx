/**
 * Web Vitals Provider Component
 *
 * Client-side component that initializes Web Vitals monitoring.
 * Must be a client component because web-vitals uses browser APIs.
 */

'use client';

import { useEffect } from 'react';
import { initWebVitals } from '@/lib/web-vitals';

export function WebVitalsProvider() {
  useEffect(() => {
    // Initialize Web Vitals monitoring on mount
    initWebVitals();
  }, []);

  // This component doesn't render anything
  return null;
}
