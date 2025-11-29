/**
 * ENPSSkeleton Component
 *
 * Loading skeleton for ENPSPanel component (Employee Net Promoter Score).
 * Displays while eNPS data loads or panel initializes.
 */

import { Smile } from 'lucide-react';

export function ENPSSkeleton() {
  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-lg border border-white/10 p-6 animate-pulse">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Smile className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <div className="h-6 bg-white/10 rounded w-64 mb-2" />
            <div className="h-4 bg-white/10 rounded w-48" />
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 mb-6 pb-4 border-b border-white/10">
        <div className="h-9 w-24 bg-white/10 rounded-lg" />
        <div className="h-9 w-32 bg-white/10 rounded-lg" />
        <div className="h-9 w-28 bg-white/10 rounded-lg" />
      </div>

      {/* eNPS Score Card Skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-white/10 rounded w-32" />
          <div className="h-4 bg-white/10 rounded w-24" />
        </div>

        {/* Large score display */}
        <div className="flex items-center justify-center py-6">
          <div className="h-20 w-32 bg-white/10 rounded-lg" />
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-white/10 rounded w-16 mx-auto mb-2" />
              <div className="h-4 bg-white/10 rounded w-20 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Response Distribution Skeleton */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
        <div className="h-5 bg-white/10 rounded w-40 mb-4" />

        {/* Progress bars for score distribution */}
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 bg-white/10 rounded w-24" />
              <div
                className="flex-1 h-6 bg-white/10 rounded"
                style={{
                  animation: `pulse 2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
              <div className="h-4 bg-white/10 rounded w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Comments Section Skeleton */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-5 bg-white/10 rounded w-48" />
          <div className="h-4 bg-white/10 rounded w-16" />
        </div>

        {/* Comment cards */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
              style={{
                animation: `pulse 2s ease-in-out ${i * 0.3}s infinite`,
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/10 rounded-full" />
                <div className="h-4 bg-white/10 rounded w-32" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-white/10 rounded w-full" />
                <div className="h-4 bg-white/10 rounded w-5/6" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
              </div>
              <div className="flex gap-2 mt-3">
                <div className="h-6 w-16 bg-white/10 rounded-full" />
                <div className="h-6 w-20 bg-white/10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loading message overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center bg-slate-900/80 rounded-lg p-4">
          <Smile className="w-12 h-12 text-blue-400 animate-pulse mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading eNPS data...</p>
        </div>
      </div>
    </div>
  );
}
