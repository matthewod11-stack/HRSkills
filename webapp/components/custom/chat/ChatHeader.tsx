'use client';

import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { memo } from 'react';

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
export const ChatHeader = memo(function ChatHeader({ conversationId, onReset }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-end mb-4">
      {/* Reset Chat Button */}
      <motion.button
        onClick={onReset}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center gap-2 px-3 py-1.5 bg-terracotta/10 hover:bg-terracotta hover:text-cream-white border border-warm hover:border-terracotta rounded-xl text-sm font-medium transition-premium shadow-soft hover:shadow-warm"
        aria-label="Start a new chat"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Reset chat</span>
      </motion.button>
    </div>
  );
});

ChatHeader.displayName = 'ChatHeader';
