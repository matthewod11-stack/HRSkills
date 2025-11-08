/**
 * DialogSkeleton Component
 *
 * Loading skeleton for dialog/modal components.
 * Provides visual feedback while dialog content loads.
 */

export function DialogSkeleton() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 animate-pulse" />

      {/* Dialog content */}
      <div className="relative bg-gray-900 border-2 border-white/20 rounded-2xl p-8 max-w-2xl w-full mx-4 animate-pulse">
        {/* Header skeleton */}
        <div className="space-y-4 mb-6">
          <div className="h-8 bg-white/10 rounded w-1/3" />
          <div className="h-4 bg-white/10 rounded w-2/3" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-3 mb-6">
          <div className="h-4 bg-white/10 rounded w-full" />
          <div className="h-4 bg-white/10 rounded w-5/6" />
          <div className="h-4 bg-white/10 rounded w-4/6" />
        </div>

        {/* Button skeleton */}
        <div className="flex justify-end gap-3">
          <div className="h-10 w-24 bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
