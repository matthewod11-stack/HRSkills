/**
 * PerformanceGridSkeleton Component
 *
 * Loading skeleton for PerformanceGridPanel component (9-box grid).
 * Displays while performance data loads or grid initializes.
 */

import { Grid3x3 } from 'lucide-react';

export function PerformanceGridSkeleton() {
  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-lg border border-white/10 p-6 animate-pulse">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-500/20 rounded-lg flex items-center justify-center">
            <Grid3x3 className="w-5 h-5 text-violet-400 animate-pulse" />
          </div>
          <div>
            <div className="h-6 bg-white/10 rounded w-56 mb-2" />
            <div className="h-4 bg-white/10 rounded w-40" />
          </div>
        </div>

        {/* Filter controls skeleton */}
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-white/10 rounded-lg" />
        </div>
      </div>

      {/* 9-Box Grid Structure */}
      <div className="flex-1 grid grid-cols-3 gap-3">
        {/* Generate 9 cells (3x3 grid) */}
        {Array.from({ length: 9 }).map((_, index) => {
          // Vary the cell heights for visual interest
          const employeeCount = Math.floor(Math.random() * 4);
          const cellColors = [
            'bg-red-500/10 border-red-500/20',
            'bg-yellow-500/10 border-yellow-500/20',
            'bg-green-500/10 border-green-500/20',
            'bg-blue-500/10 border-blue-500/20',
          ];
          const colorClass = cellColors[index % 4];

          return (
            <div
              key={index}
              className={`relative rounded-lg border ${colorClass} p-3 flex flex-col`}
              style={{
                animation: `pulse 2s ease-in-out ${index * 0.1}s infinite`,
              }}
            >
              {/* Cell header */}
              <div className="flex items-center justify-between mb-3">
                <div className="h-4 bg-white/10 rounded w-20" />
                <div className="h-5 w-8 bg-white/10 rounded-full" />
              </div>

              {/* Employee avatars skeleton */}
              <div className="flex flex-wrap gap-2 mt-auto">
                {Array.from({ length: employeeCount }).map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-white/10 rounded-full" />
                ))}
                {employeeCount === 0 && <div className="h-4 bg-white/10 rounded w-16 mx-auto" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Axis Labels Skeleton */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="h-4 bg-white/10 rounded w-24" />
          <div className="h-4 bg-white/10 rounded w-32" />
        </div>
        <div className="flex items-center gap-2 justify-end">
          <div className="h-4 bg-white/10 rounded w-32" />
          <div className="h-4 bg-white/10 rounded w-24" />
        </div>
      </div>

      {/* Legend Skeleton */}
      <div className="flex gap-6 mt-4 pt-4 border-t border-white/10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/10 rounded" />
            <div className="h-4 w-24 bg-white/10 rounded" />
          </div>
        ))}
      </div>

      {/* Loading message overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center bg-slate-900/80 rounded-lg p-4">
          <Grid3x3 className="w-12 h-12 text-violet-400 animate-pulse mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading performance grid...</p>
        </div>
      </div>
    </div>
  );
}
