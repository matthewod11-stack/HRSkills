'use client';

import { ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

/**
 * Client-side wrapper for root-level error boundary
 * Used in app/layout.tsx to catch errors in the entire app
 */
export function RootErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="app">{children}</ErrorBoundary>;
}
