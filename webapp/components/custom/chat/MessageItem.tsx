'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, Check } from 'lucide-react';
import { Message } from './ChatContext';
import { MessageContent } from './MessageContent';
import { MessageActions } from './MessageActions';

/**
 * Props for the MessageItem component
 */
export interface MessageItemProps {
  /** The message to display */
  message: Message;
  /** The current conversation ID */
  conversationId: string;
  /** Callback to toggle edit mode for this message */
  onToggleEdit: (id: number) => void;
  /** Callback to update the edited content while in edit mode */
  onUpdateEdit: (id: number, content: string) => void;
  /** Callback to save edited content and exit edit mode */
  onSaveEdit: (id: number) => void;
  /** Callback to copy message content to clipboard */
  onCopy: (content: string) => void;
  /** Async callback to export message to Google Docs */
  onExportToGoogleDocs: (message: Message) => Promise<void>;
  /** Callback when a suggested follow-up is clicked */
  onFollowUp: (text: string) => void;
}

/**
 * MessageItem - A single message in the chat conversation
 *
 * Renders a complete message with:
 * - Avatar (user or bot)
 * - Message bubble with role-specific styling
 * - Edit mode (textarea with save/cancel)
 * - Display mode (content + actions)
 * - Smooth entry animations via Framer Motion
 *
 * This component is heavily memoized to prevent unnecessary re-renders
 * and re-parsing of markdown content when other messages are added.
 *
 * @example
 * ```tsx
 * <MessageItem
 *   message={message}
 *   conversationId="conv_123"
 *   onToggleEdit={(id) => toggleEdit(id)}
 *   onUpdateEdit={(id, content) => updateEdit(id, content)}
 *   onSaveEdit={(id) => saveEdit(id)}
 *   onCopy={(content) => navigator.clipboard.writeText(content)}
 *   onExportToGoogleDocs={async (msg) => await exportToGoogleDocs(msg)}
 *   onFollowUp={(text) => handleFollowUp(text)}
 * />
 * ```
 */
export const MessageItem = memo(function MessageItem({
  message,
  conversationId,
  onToggleEdit,
  onUpdateEdit,
  onSaveEdit,
  onCopy,
  onExportToGoogleDocs,
  onFollowUp,
}: MessageItemProps) {
  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow-accent ${
          message.role === 'user'
            ? 'bg-gradient-to-br from-success to-success'
            : 'bg-gradient-to-br from-violet to-violet-light'
        }`}
      >
        {message.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Message Bubble */}
      <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
        <div
          className={`max-w-[80%] p-4 rounded-2xl transition-premium ${
            message.role === 'user'
              ? 'bg-gradient-to-br from-success/20 to-success/10 border border-success/50'
              : 'bg-card border border-border shadow-soft'
          }`}
        >
          {message.isEditing ? (
            /* Edit Mode */
            <div className="space-y-2">
              <textarea
                value={message.editedContent || message.content}
                onChange={(e) => onUpdateEdit(message.id, e.target.value)}
                className="w-full min-h-[200px] p-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-violet transition-premium resize-y"
                aria-label="Edit message content"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onSaveEdit(message.id)}
                  className="px-3 py-1 bg-violet hover:bg-violet-light rounded-lg text-sm transition-premium flex items-center gap-1 font-medium shadow-glow-accent"
                  aria-label="Save changes"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => onToggleEdit(message.id)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-premium font-medium"
                  aria-label="Cancel editing"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Display Mode */
            <>
              <MessageContent
                message={message}
                conversationId={conversationId}
                onFollowUp={onFollowUp}
              />
              <MessageActions
                message={message}
                onCopy={onCopy}
                onToggleEdit={onToggleEdit}
                onExportToGoogleDocs={onExportToGoogleDocs}
              />
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});

MessageItem.displayName = 'MessageItem';
