'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'app' | 'page' | 'section';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

/**
 * ErrorBoundary component to catch and handle React errors gracefully
 * Prevents entire app crashes by containing errors to specific boundaries
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Store error info for display
    this.setState({ errorInfo });

    // TODO: Send to error monitoring service (e.g., Sentry, LogRocket)
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on boundary level
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          level={this.props.level || 'section'}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI component
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  onReset,
  level,
}: {
  error?: Error;
  errorInfo?: ErrorInfo;
  onReset: () => void;
  level: 'app' | 'page' | 'section';
}) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Different styling based on boundary level
  const containerClasses = {
    app: 'min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8',
    page: 'min-h-[60vh] flex items-center justify-center p-8',
    section:
      'p-8 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20',
  };

  return (
    <div className={containerClasses[level]} role="alert" aria-live="assertive">
      <div className="max-w-2xl w-full text-center">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <svg
            className="w-16 h-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {level === 'app' ? 'Application Error' : 'Something went wrong'}
        </h2>

        {/* Error Description */}
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {level === 'app'
            ? "We're sorry, but the application encountered an unexpected error."
            : "This section couldn't load properly. Try refreshing or contact support if the problem persists."}
        </p>

        {/* Error Details (only in development) */}
        {!isProduction && error && (
          <details className="mb-6 text-left bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <summary className="cursor-pointer font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Error Details (Development Only)
            </summary>
            <div className="text-sm text-red-600 dark:text-red-400 font-mono space-y-2">
              <p>
                <strong>Error:</strong> {error.message}
              </p>
              {error.stack && (
                <pre className="text-xs overflow-auto max-h-40 bg-gray-900 dark:bg-gray-950 text-gray-100 p-2 rounded">
                  {error.stack}
                </pre>
              )}
              {errorInfo?.componentStack && (
                <pre className="text-xs overflow-auto max-h-40 bg-gray-900 dark:bg-gray-950 text-gray-100 p-2 rounded">
                  {errorInfo.componentStack}
                </pre>
              )}
            </div>
          </details>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={onReset}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Try Again
          </button>

          {level === 'app' && (
            <button
              onClick={() => (window.location.href = '/')}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
            >
              Go to Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manually trigger error boundary (for testing)
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}
