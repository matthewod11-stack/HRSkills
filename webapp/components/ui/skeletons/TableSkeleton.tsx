/**
 * TableSkeleton Component
 *
 * Loading skeleton for data tables.
 * Displays while table data is loading.
 */

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      {/* Table header */}
      <div className="bg-white/5 border border-white/10 rounded-t-lg p-4">
        <div className="flex gap-4">
          {[...Array(columns)].map((_, i) => (
            <div key={i} className="h-4 bg-white/10 rounded flex-1" />
          ))}
        </div>
      </div>

      {/* Table rows */}
      <div className="bg-white/5 border-x border-b border-white/10 rounded-b-lg">
        {[...Array(rows)].map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 border-b border-white/10 last:border-b-0">
            <div className="flex gap-4">
              {[...Array(columns)].map((_, colIndex) => (
                <div
                  key={colIndex}
                  className="h-4 bg-white/10 rounded flex-1"
                  style={{
                    animation: `pulse 2s ease-in-out ${(rowIndex + colIndex) * 0.1}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
