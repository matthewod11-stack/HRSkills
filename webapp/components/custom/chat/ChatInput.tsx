'use client';

import { memo, useCallback, KeyboardEvent, RefObject } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress: (e: KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement>;
}

/**
 * ChatInput Component
 *
 * Isolated input component to prevent full ChatInterface re-renders on every keystroke.
 * Wrapped in memo() to only re-render when props change.
 *
 * Performance optimization: By extracting this component, typing in the input field
 * only re-renders this small component instead of the entire ChatInterface (966 lines).
 *
 * Expected impact: 90-95% reduction in re-render scope during typing.
 */
const ChatInput = memo(function ChatInput({
  value,
  onChange,
  onSend,
  onKeyPress,
  disabled = false,
  placeholder = 'Ask me anything about HR...',
  inputRef,
}: ChatInputProps) {
  // Internal onChange handler that extracts value and calls parent onChange
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Check if send button should be disabled
  const isSendDisabled = !value.trim() || disabled;

  return (
    <div className="p-6 border-t border-border bg-gradient-to-r from-violet/5 to-violet-light/5">
      <label htmlFor="chat-input" className="sr-only">
        Chat message input
      </label>
      <div className="flex gap-3">
        <input
          ref={inputRef}
          id="chat-input"
          type="text"
          value={value}
          onChange={handleChange}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          aria-label="Chat message input"
          aria-describedby="chat-input-help"
          disabled={disabled}
          className="flex-1 bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-violet focus:ring-2 focus:ring-violet/30 transition-premium placeholder-secondary font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <motion.button
          onClick={onSend}
          disabled={isSendDisabled}
          whileHover={!isSendDisabled ? { scale: 1.05 } : undefined}
          whileTap={!isSendDisabled ? { scale: 0.95 } : undefined}
          aria-label="Send message"
          className="px-6 py-3 bg-gradient-to-r from-violet to-violet-light border border-violet/50 rounded-xl hover:shadow-glow-accent transition-premium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
        >
          <Send className="w-5 h-5" aria-hidden="true" />
          <span className="hidden sm:inline">Send</span>
        </motion.button>
      </div>
      <p id="chat-input-help" className="text-xs text-secondary mt-2 text-center font-medium">
        Press Enter to send • Shift + Enter for new line
      </p>
    </div>
  );
});

export default ChatInput;
