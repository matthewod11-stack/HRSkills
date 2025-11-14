/**
 * DocumentEditorSkeleton Component
 *
 * Loading skeleton for DocumentEditorPanel component.
 * Displays while document editor initializes or Google Drive integration loads.
 */

import { FileText } from 'lucide-react';

export function DocumentEditorSkeleton() {
  return (
    <div className="flex flex-col h-full bg-slate-900/50 rounded-lg border border-white/10 p-6 animate-pulse">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="h-6 bg-white/10 rounded w-48 mb-2" />
            <div className="h-4 bg-white/10 rounded w-32" />
          </div>
        </div>

        {/* Action buttons skeleton */}
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-white/10 rounded-lg" />
          <div className="h-9 w-32 bg-white/10 rounded-lg" />
        </div>
      </div>

      {/* Document Content Area */}
      <div className="flex-1 bg-white/5 border border-white/10 rounded-lg p-6 overflow-hidden">
        {/* Document lines simulation */}
        <div className="space-y-3">
          <div className="h-5 bg-white/10 rounded w-3/4" />
          <div className="h-5 bg-white/10 rounded w-full" />
          <div className="h-5 bg-white/10 rounded w-5/6" />
          <div className="h-5 bg-white/10 rounded w-full" />
          <div className="h-5 bg-white/10 rounded w-4/5" />

          <div className="h-8" /> {/* Spacer */}

          <div className="h-5 bg-white/10 rounded w-2/3" />
          <div className="h-5 bg-white/10 rounded w-full" />
          <div className="h-5 bg-white/10 rounded w-5/6" />
          <div className="h-5 bg-white/10 rounded w-3/4" />

          <div className="h-8" /> {/* Spacer */}

          <div className="h-5 bg-white/10 rounded w-full" />
          <div className="h-5 bg-white/10 rounded w-4/5" />
          <div className="h-5 bg-white/10 rounded w-5/6" />
        </div>
      </div>

      {/* Footer Section */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-white/10 rounded-full" />
          <div className="h-4 bg-white/10 rounded w-40" />
        </div>
        <div className="h-4 bg-white/10 rounded w-24" />
      </div>

      {/* Loading message */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <FileText className="w-12 h-12 text-emerald-400 animate-pulse mx-auto mb-2" />
          <p className="text-sm text-gray-400">Loading document editor...</p>
        </div>
      </div>
    </div>
  );
}
