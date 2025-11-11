/**
 * ChatMessageSkeleton Component
 *
 * Loading skeleton for chat messages.
 * Used while streaming or loading message content.
 */

interface ChatMessageSkeletonProps {
  isUser?: boolean;
}

export function ChatMessageSkeleton({ isUser = false }: ChatMessageSkeletonProps) {
  return (
    <div className={`flex gap-4 mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        // Avatar skeleton for assistant
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 shrink-0 animate-pulse" />
      )}

      <div className={`flex-1 max-w-[80%] ${isUser ? 'flex justify-end' : ''}`}>
        <div
          className={`rounded-2xl p-4 animate-pulse ${
            isUser
              ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20'
              : 'bg-white/5 border border-white/10'
          }`}
        >
          {/* Message content skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-5/6" />
            <div className="h-4 bg-white/10 rounded w-4/6" />
          </div>
        </div>
      </div>

      {isUser && (
        // Avatar skeleton for user
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 shrink-0 animate-pulse" />
      )}
    </div>
  );
}
