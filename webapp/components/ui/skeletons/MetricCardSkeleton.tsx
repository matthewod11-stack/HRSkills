/**
 * MetricCardSkeleton Component
 *
 * Loading skeleton for MetricCard component.
 * Displays a placeholder while the actual metric data loads.
 */

export function MetricCardSkeleton() {
  return (
    <div className="relative backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Title skeleton */}
          <div className="h-4 w-24 bg-white/10 rounded mb-3" />

          {/* Value skeleton */}
          <div className="h-8 w-16 bg-white/10 rounded mb-2" />

          {/* Change skeleton */}
          <div className="h-4 w-12 bg-white/10 rounded" />
        </div>

        {/* Icon circle skeleton */}
        <div className="w-20 h-20 rounded-full bg-white/10" />
      </div>

      {/* Button skeleton */}
      <div className="h-9 w-full bg-white/5 border-2 border-white/30 rounded-lg" />
    </div>
  );
}
