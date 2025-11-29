'use client';

import { AnimatePresence } from 'framer-motion';
import { memo, useCallback, useEffect, useRef } from 'react';
import { useChatContext } from './ChatContext';
import { MessageItem } from './MessageItem';

/**
 * Props for the MessageList component
 */
export interface MessageListProps {
  /** The current conversation ID */
  conversationId: string;
  /** Callback to copy message content to clipboard */
  onCopy: (content: string) => void;
  /** Callback when a suggested follow-up is clicked */
  onFollowUp: (text: string) => void;
}

/**
 * MessageList - Scrollable list of chat messages
 *
 * Renders all messages in the conversation with:
 * - Auto-scroll to bottom when new messages arrive
 * - Smooth entry/exit animations via AnimatePresence
 * - MessageItem components for each message
 *
 * Consumes messages from ChatContext and automatically
 * scrolls to the latest message when the message count changes.
 *
 * Memoized to prevent unnecessary re-renders.
 *
 * @example
 * ```tsx
 * <MessageList
 *   conversationId="conv_123"
 *   onCopy={(content) => navigator.clipboard.writeText(content)}
 *   onFollowUp={(text) => handleFollowUp(text)}
 * />
 * ```
 */
export const MessageList = memo(function MessageList({
  conversationId,
  onCopy,
  onFollowUp,
}: MessageListProps) {
  const { messages, toggleEdit, updateEdit, saveEdit } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Scroll to the bottom of the message list
   */
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  /**
   * Auto-scroll when new messages are added
   */
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      <AnimatePresence initial={false}>
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            conversationId={conversationId}
            onToggleEdit={toggleEdit}
            onUpdateEdit={updateEdit}
            onSaveEdit={saveEdit}
            onCopy={onCopy}
            onFollowUp={onFollowUp}
          />
        ))}
      </AnimatePresence>

      {/* Invisible element to scroll to */}
      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = 'MessageList';
