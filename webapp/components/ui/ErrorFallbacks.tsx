'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home, Mail } from 'lucide-react';

/**
 * Specialized error fallback components for different scenarios
 */

interface ErrorFallbackProps {
  error?: Error;
  onReset?: () => void;
  onRetry?: () => void;
}

/**
 * Data loading error fallback
 * Use when API calls or data fetching fails
 */
export function DataLoadingError({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Failed to Load Data
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        {error?.message || "We couldn't load the data you requested. This might be a temporary issue."}
      </p>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

/**
 * Chart rendering error fallback
 * Use when data visualization components fail
 */
export function ChartRenderError({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/20">
      <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Chart Unavailable
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        The chart couldn't be displayed. This might be due to invalid data format or a rendering issue.
      </p>

      <div className="flex gap-3">
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reload Chart
        </button>
      </div>

      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-4 text-left w-full max-w-md">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
            Error details (dev only)
          </summary>
          <pre className="mt-2 text-xs bg-gray-900 dark:bg-gray-950 text-red-400 p-3 rounded overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Form submission error fallback
 * Use when form operations fail
 */
export function FormSubmissionError({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
            Submission Failed
          </h3>

          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            {error?.message || "Your form couldn't be submitted. Please check your entries and try again."}
          </p>

          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Submission
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Authentication error fallback
 * Use when authentication/authorization fails
 */
export function AuthenticationError({ error }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
        </div>

        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Authentication Required
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          {error?.message || "You need to be authenticated to access this content. Please sign in to continue."}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/api/auth/signin'}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Sign In
          </button>

          <button
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 font-medium rounded-lg transition-colors inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Network error fallback
 * Use when network connectivity issues occur
 */
export function NetworkError({ onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Connection Lost
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
        It looks like you're offline or experiencing network issues. Please check your connection and try again.
      </p>

      <button
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <RefreshCw className="w-4 h-4" />
        Check Connection
      </button>
    </div>
  );
}

/**
 * Generic section error fallback
 * Use for non-critical section errors that don't need specialized handling
 */
export function SectionError({ error, onReset }: ErrorFallbackProps) {
  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Section Unavailable
          </h3>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            This section couldn't load properly. You can continue using other parts of the application.
          </p>

          <button
            onClick={onReset}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Contact support component
 * Reusable component for directing users to support
 */
export function ContactSupport() {
  return (
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900 rounded-lg">
      <div className="flex items-start gap-3">
        <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />

        <div>
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
            Need Help?
          </h4>

          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
            If this problem persists, please contact our support team.
          </p>

          <a
            href="mailto:support@hrcommandcenter.com"
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            support@hrcommandcenter.com
          </a>
        </div>
      </div>
    </div>
  );
}
