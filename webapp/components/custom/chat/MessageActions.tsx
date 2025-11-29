'use client';

import { Copy, Edit3 } from 'lucide-react';
import { memo } from 'react';
import type { Message } from './ChatContext';

/**
 * Props for the MessageActions component
 */
export interface MessageActionsProps {
  /** The message these actions apply to */
  message: Message;
  /** Callback to copy message content to clipboard */
  onCopy: (content: string) => void;
  /** Callback to toggle edit mode */
  onToggleEdit: (id: number) => void;
}

/**
 * MessageActions - Action buttons for assistant messages
 *
 * Provides Copy and Edit actions for AI assistant messages.
 * Only shown for assistant role messages.
 *
 * Memoized to prevent re-renders when parent updates.
 *
 * @example
 * ```tsx
 * <MessageActions
 *   message={message}
 *   onCopy={(content) => navigator.clipboard.writeText(content)}
 *   onToggleEdit={(id) => toggleEditMode(id)}
 * />
 * ```
 */
export const MessageActions = memo(function MessageActions({
  message,
  onCopy,
  onToggleEdit,
}: MessageActionsProps) {
  // Only show actions for assistant messages
  if (message.role !== 'assistant') {
    return null;
  }

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
      {/* Timestamp */}
      <p className="text-xs text-secondary">
        {message.timestamp.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </p>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {/* Copy to Clipboard */}
        <button
          type="button"
          onClick={() => onCopy(message.content)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-premium"
          title="Copy to clipboard"
          aria-label="Copy message to clipboard"
        >
          <Copy className="w-4 h-4" />
        </button>

        {/* Edit Document */}
        <button
          type="button"
          onClick={() => onToggleEdit(message.id)}
          className="p-1.5 hover:bg-white/10 rounded-lg transition-premium"
          title="Edit document"
          aria-label="Edit message"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

MessageActions.displayName = 'MessageActions';
