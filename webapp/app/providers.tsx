'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // Create a client instance per component tree (not singleton)
  // This prevents state sharing between different server-rendered pages
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Match current SWR behavior from the codebase
            refetchOnWindowFocus: false,
            // Data considered fresh for 1 minute (reduce API calls)
            staleTime: 60 * 1000,
            // Keep unused data in cache for 5 minutes
            gcTime: 5 * 60 * 1000,
            // Retry failed requests once (matches project resilience patterns)
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development, auto-excluded in production build */}
      {/* Use process.env instead of T3 env (client-safe) */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  );
}
