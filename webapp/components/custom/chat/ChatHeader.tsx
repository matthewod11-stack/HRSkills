'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';

/**
 * Props for the ChatHeader component
 */
export interface ChatHeaderProps {
  /** The current conversation ID */
  conversationId: string;
  /** Callback to reset/clear the current chat */
  onReset: () => void;
}

/**
 * ChatHeader - Header section for the chat interface
 *
 * Displays conversation metadata and provides a reset button
 * to clear the chat and start fresh.
 *
 * Memoized to prevent re-renders when messages are added.
 *
 * @example
 * ```tsx
 * <ChatHeader
 *   conversationId="conv_123"
 *   onReset={() => clearChat()}
 * />
 * ```
 */
export const ChatHeader = memo(function ChatHeader({
  conversationId,
  onReset
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      {/* Conversation ID (optional - could be removed or made conditional) */}
      <div className="text-xs text-secondary/50 font-mono">
        {conversationId.replace(/\s+/g, ' ')}
      </div>

      {/* Reset Chat Button */}
      <motion.button
        onClick={onReset}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-medium transition-premium"
        aria-label="Start a new chat"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset chat</span>
      </motion.button>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';
