/**
 * ChartSkeleton Component
 *
 * Loading skeleton for chart/graph components.
 * Displays while chart data loads or chart library initializes.
 */

interface ChartSkeletonProps {
  height?: number;
  title?: boolean;
}

export function ChartSkeleton({ height = 300, title = true }: ChartSkeletonProps) {
  return (
    <div className="animate-pulse">
      {title && (
        <div className="mb-4">
          <div className="h-6 bg-white/10 rounded w-1/4 mb-2" />
          <div className="h-4 bg-white/10 rounded w-1/3" />
        </div>
      )}

      {/* Chart area */}
      <div
        className="bg-white/5 border border-white/10 rounded-lg flex items-center justify-center"
        style={{ height: `${height}px` }}
      >
        {/* Bars representation */}
        <div className="flex items-end justify-around w-full h-full p-8 gap-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white/10 rounded-t w-full"
              style={{
                height: `${Math.random() * 60 + 40}%`,
                animation: `pulse 2s ease-in-out ${i * 0.1}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Legend skeleton */}
      <div className="flex gap-4 mt-4 justify-center">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white/10 rounded" />
            <div className="h-4 w-16 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
