'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Offline Fallback Page
 *
 * This page is shown when the user is offline and tries to access
 * a page that isn't cached by the service worker.
 *
 * Features:
 * - Auto-retry when connection is restored
 * - Manual retry button
 * - List of available cached pages
 * - Connection status indicator
 */
export default function OfflinePage() {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-retry when coming back online
      setTimeout(() => {
        router.back();
      }, 500);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [router]);

  const handleRetry = () => {
    setRetrying(true);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Offline Icon */}
        <div className="mb-8">
          <svg
            className="w-24 h-24 mx-auto text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>

        {/* Status */}
        <div className="mb-6">
          {isOnline ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/20 text-green-400 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Back online
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 text-gray-400 text-sm">
              <div className="w-2 h-2 rounded-full bg-gray-500" />
              No internet connection
            </div>
          )}
        </div>

        {/* Main Message */}
        <h1 className="text-3xl font-bold mb-4">You&apos;re offline</h1>
        <p className="text-gray-400 mb-8">
          It looks like you&apos;ve lost your internet connection. Check your connection and try again.
        </p>

        {/* Retry Button */}
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
        >
          {retrying ? 'Retrying...' : 'Try again'}
        </button>

        {/* Available Pages */}
        <div className="text-left bg-white/5 rounded-lg p-6 border border-white/10">
          <h2 className="text-sm font-medium text-gray-400 mb-3">Available while offline:</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="/" className="text-blue-400 hover:text-blue-300 transition-colors">
                → Home
              </a>
            </li>
            <li>
              <a href="/analytics" className="text-blue-400 hover:text-blue-300 transition-colors">
                → Analytics (if previously visited)
              </a>
            </li>
            <li>
              <a href="/nine-box" className="text-blue-400 hover:text-blue-300 transition-colors">
                → Nine-Box Grid (if previously visited)
              </a>
            </li>
            <li>
              <a href="/employees" className="text-blue-400 hover:text-blue-300 transition-colors">
                → Employees (if previously visited)
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
