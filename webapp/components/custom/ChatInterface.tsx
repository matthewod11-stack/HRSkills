'use client';

import { motion } from 'framer-motion';
import { Bot, Sparkles } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useChatAPI } from '@/lib/hooks/useChatAPI';
import { useChatErrorHandler } from '@/lib/hooks/useChatErrorHandler';
import { useContextPanelDetection } from '@/lib/hooks/useContextPanelDetection';
import { useExternalPrompt } from '@/lib/hooks/useExternalPrompt';
import { usePIIDetection } from '@/lib/hooks/usePIIDetection';
import type { ContextPanelData } from './ContextPanel';
import { ChatProvider, type Message, useChatContext } from './chat/ChatContext';
import { ChatHeader } from './chat/ChatHeader';
import ChatInput from './chat/ChatInput';
import { MessageList } from './chat/MessageList';
import { PIIWarningModal } from './chat/PIIWarningModal';
import { SuggestionCards } from './chat/SuggestionCards';

/**
 * External prompt configuration
 */
type ExternalChatPrompt = {
  id: number;
  text: string;
};

/**
 * Props for the ChatInterface component
 */
interface ChatInterfaceProps {
  onContextPanelChange?: (panelData: ContextPanelData | null) => void;
  externalPrompt?: ExternalChatPrompt | null;
  onExternalPromptConsumed?: (promptId: number) => void;
}

/**
 * ChatInterfaceInner - The actual implementation (needs context)
 */
function ChatInterfaceInner({
  onContextPanelChange,
  externalPrompt,
  onExternalPromptConsumed,
}: ChatInterfaceProps) {
  const { getAuthHeaders } = useAuth();
  const {
    messages,
    isTyping,
    conversationId,
    addMessage,
    setIsTyping,
    clearMessages: _clearMessages,
    resetConversation,
  } = useChatContext();

  // Local state (not in context - orchestration-specific)
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Phase 1 Hooks: Extract simple, isolated concerns
  const { piiWarning, checkForPII, handleEditMessage, handleProceedWithPII, resetPIIWarning } =
    usePIIDetection({
      inputRef,
      onSendWithBypass: (text) => handleSend(text, true),
      onEdit: (text) => setInput(text),
    });

  const { handleApiError } = useChatErrorHandler({
    addMessage,
    setIsTyping,
    messages,
  });

  // Phase 2 Hooks: Extract medium complexity concerns
  const { detectAndUpdatePanel } = useContextPanelDetection({
    onPanelChange: onContextPanelChange,
    confidenceThreshold: 70,
  });

  // Phase 3 Hook: Extract dual routing API logic
  const { sendMessage: sendChatMessage } = useChatAPI({
    getAuthHeaders,
    conversationId,
    messages,
    addMessage,
    onError: handleApiError,
    onPanelUpdate: detectAndUpdatePanel,
  });

  /**
   * Main message send handler
   * Now simplified - hooks handle PII, routing, and panel updates
   */
  const handleSend = useCallback(
    async (messageText?: string, bypassPII: boolean = false) => {
      const finalText = messageText || input.trim();
      if (!finalText) return;

      // PII detection (unless bypassed) - Phase 1 hook
      if (!bypassPII && checkForPII(finalText)) {
        return; // Blocked by PII detection
      }

      // Create and add user message with unique ID
      const userMessage: Message = {
        id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        role: 'user',
        content: finalText,
        timestamp: new Date(),
      };

      addMessage(userMessage);
      setInput('');
      setIsTyping(true);

      // Send message through API (handles routing, responses, and panels) - Phase 3 hook
      // Pass userMessage object so hook can include it in conversation history
      await sendChatMessage(finalText, userMessage);

      // Reset typing indicator (will be set to false in hook's finally or error handler)
      setIsTyping(false);
    },
    [input, messages, addMessage, setIsTyping, checkForPII, sendChatMessage]
  );

  /**
   * Handle suggestion card clicks
   */
  const handleSuggestionClick = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

  /**
   * Handle Enter key press in input
   */
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /**
   * Handle copy to clipboard
   */
  const handleCopy = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  /**
   * Handle suggested follow-up clicks
   */
  const handleFollowUp = useCallback(
    (text: string) => {
      handleSend(text);
    },
    [handleSend]
  );

  /**
   * Handle chat reset - fully resets conversation state
   */
  const handleResetChat = useCallback(() => {
    resetConversation(); // Clears messages, resets typing, generates new ID
    setInput('');
    resetPIIWarning(); // Clear PII warning via hook
    onContextPanelChange?.(null);
  }, [resetConversation, resetPIIWarning, onContextPanelChange]);

  /**
   * Process external prompts from other components - using hook
   */
  useExternalPrompt(externalPrompt || null, {
    onPromptReceived: (text) => handleSend(text, true),
    onPromptConsumed: onExternalPromptConsumed,
    isProcessing: isTyping,
  });

  /**
   * Memoize last message workflow to prevent re-computation
   */
  const lastMessageWorkflow = useMemo(() => {
    if (messages.length === 0) return null;
    const lastMessage = messages[messages.length - 1];
    const workflow = lastMessage.detectedWorkflow;
    return workflow && workflow !== 'general' ? workflow : null;
  }, [messages]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative group h-full flex flex-col"
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-terracotta/8 via-amber/8 to-sage/8 rounded-3xl blur-2xl group-hover:blur-3xl transition-premium opacity-60" />

      <div className="relative backdrop-blur-2xl bg-cream-white border-2 border-sage/20 rounded-3xl flex flex-col h-full max-h-[calc(100vh-250px)] overflow-hidden hover:border-sage/40 hover:shadow-warm transition-premium">
        {/* Header with branding and reset button */}
        <div className="p-6 border-b border-warm bg-gradient-to-r from-terracotta/10 to-amber/10 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta to-amber flex items-center justify-center shadow-warm">
                <Bot className="w-7 h-7 text-cream-white" />
              </div>
              <div>
                <h2 className="text-xl flex items-center gap-2 font-bold text-charcoal">
                  Chief People Officer
                  <Sparkles className="w-5 h-5 text-amber" />
                </h2>
                <p className="text-sm text-charcoal-light font-medium">
                  &ldquo;More People, More Problems&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastMessageWorkflow && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-terracotta/10 border border-terracotta/20 rounded-xl">
                  <Sparkles className="w-3.5 h-3.5 text-terracotta" />
                  <span className="text-xs font-medium text-terracotta capitalize">
                    {lastMessageWorkflow.replace('_', ' ')} workflow
                  </span>
                </div>
              )}
              <ChatHeader conversationId={conversationId} onReset={handleResetChat} />
            </div>
          </div>
        </div>

        {/* Message List with typing indicator */}
        <div className="flex-1 overflow-y-auto">
          <MessageList
            conversationId={conversationId}
            onCopy={handleCopy}
            onFollowUp={handleFollowUp}
          />

          {/* Typing indicator */}
          {isTyping && (
            <div className="px-6 pb-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet to-violet-light flex items-center justify-center flex-shrink-0 shadow-glow-accent">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl shadow-soft">
                  <div className="flex gap-1">
                    <motion.div
                      className="w-2 h-2 bg-violet rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-violet-light rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div
                      className="w-2 h-2 bg-violet rounded-full"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Suggestion Cards (shown when no messages) */}
        {messages.length === 0 && <SuggestionCards onSuggestionClick={handleSuggestionClick} />}

        {/* Input */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onKeyPress={handleKeyPress}
          disabled={isTyping}
          inputRef={inputRef}
        />
      </div>

      {/* PII Warning Modal */}
      <PIIWarningModal
        isOpen={piiWarning.show}
        detectedTypes={piiWarning.types}
        message={piiWarning.message}
        onEdit={handleEditMessage}
        onSendAnyway={handleProceedWithPII}
        onClose={resetPIIWarning}
      />
    </motion.div>
  );
}

/**
 * ChatInterface - Main chat orchestrator component
 *
 * Orchestrates the entire chat experience by:
 * - Managing API calls (dual routes: analytics vs general chat)
 * - Handling PII detection and warnings
 * - Processing external prompts from other components
 * - Detecting and triggering context panels
 * - Coordinating Google Docs export
 * - Managing conversation state via ChatContext
 *
 * This component has been refactored from 945 lines to ~400 lines by
 * extracting 10 sub-components while maintaining all functionality.
 *
 * Sub-components:
 * - ChatContext: Shared state management
 * - ChatHeader: Reset button and conversation metadata
 * - MessageList: Scrollable message rendering
 * - MessageItem: Individual message bubbles
 * - MessageContent: Markdown rendering
 * - MessageActions: Copy/Edit/Export buttons
 * - WorkflowBadge: Workflow detection indicator
 * - SuggestionCards: Quick action cards
 * - ChatInput: Input field and send button
 * - PIIWarningModal: PII detection warning dialog
 */
export function ChatInterface(props: ChatInterfaceProps) {
  return (
    <ChatProvider>
      <ChatInterfaceInner {...props} />
    </ChatProvider>
  );
}
