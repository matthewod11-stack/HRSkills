'use client';

import { memo } from 'react';
import { WorkflowProgress } from '../WorkflowProgress';
import { ActionButtons } from '../ActionButtons';
import MessageMarkdown from './MessageMarkdown';
import { WorkflowBadge } from './WorkflowBadge';
import { Message, WorkflowState } from './ChatContext';

/**
 * Props for the MessageContent component
 */
export interface MessageContentProps {
  /** The message to display */
  message: Message;
  /** The current conversation ID (needed for ActionButtons) */
  conversationId: string;
  /** Callback when a suggested follow-up is clicked */
  onFollowUp: (text: string) => void;
}

/**
 * MessageContent - Renders the complete content of a message
 *
 * This component handles all the content sections of a message:
 * - Workflow badge (if workflow detected)
 * - Workflow progress indicator
 * - Suggested action buttons
 * - Suggested follow-up questions
 * - Markdown-rendered message content
 *
 * Memoized to prevent re-parsing markdown when parent updates.
 *
 * @example
 * ```tsx
 * <MessageContent
 *   message={message}
 *   conversationId="conv_123"
 *   onFollowUp={(text) => handleFollowUp(text)}
 * />
 * ```
 */
export const MessageContent = memo(function MessageContent({
  message,
  conversationId,
  onFollowUp
}: MessageContentProps) {
  return (
    <>
      {/* Workflow Detection Badge */}
      <WorkflowBadge
        workflowType={message.detectedWorkflow || ''}
        confidence={message.workflowConfidence}
      />

      {/* Workflow Progress Indicator */}
      {message.workflowState && message.role === 'assistant' && (
        <div className="mb-3">
          <WorkflowProgress
            workflowId={message.detectedWorkflow || 'general'}
            state={message.workflowState}
          />
        </div>
      )}

      {/* Suggested Action Buttons */}
      {message.suggestedActions &&
        message.suggestedActions.length > 0 &&
        message.role === 'assistant' && (
          <div className="mb-3">
            <ActionButtons
              actions={message.suggestedActions}
              conversationId={conversationId}
              workflowId={message.detectedWorkflow || 'general'}
            />
          </div>
        )}

      {/* Suggested Follow-up Questions */}
      {message.suggestedFollowUps &&
        message.suggestedFollowUps.length > 0 &&
        message.role === 'assistant' && (
          <div className="mb-3">
            <p className="text-xs text-secondary font-medium mb-2">Suggested follow-ups</p>
            <div className="flex flex-wrap gap-2">
              {message.suggestedFollowUps.map((followUp, index) => (
                <button
                  key={index}
                  onClick={() => onFollowUp(followUp)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-xs transition-premium"
                >
                  {followUp}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Message Content (Markdown) */}
      <MessageMarkdown content={message.content} />
    </>
  );
});

MessageContent.displayName = 'MessageContent';
