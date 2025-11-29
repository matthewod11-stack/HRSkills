'use client';

import { createContext, type ReactNode, useCallback, useContext, useState } from 'react';

/**
 * Represents the state of a workflow/skill being executed
 */
export interface WorkflowState {
  currentStep: string | null;
  progress: number;
  completedSteps: string[];
  isComplete: boolean;
  hasActions: boolean;
  actionCount: number;
}

/**
 * Represents a single chat message in the conversation
 */
export interface Message {
  /** Unique identifier - string for new messages, number for legacy compatibility */
  id: string | number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isEditing?: boolean;
  editedContent?: string;
  detectedWorkflow?: string;
  workflowConfidence?: number;
  workflowState?: WorkflowState;
  suggestedActions?: any[];
  suggestedFollowUps?: string[];
}

/**
 * The context value that will be shared across all chat components
 */
export interface ChatContextValue {
  messages: Message[];
  isTyping: boolean;
  conversationId: string;
  addMessage: (message: Message) => void;
  updateMessage: (id: string | number, updates: Partial<Message>) => void;
  deleteMessage: (id: string | number) => void;
  clearMessages: () => void;
  toggleEdit: (id: string | number) => void;
  updateEdit: (id: string | number, content: string) => void;
  saveEdit: (id: string | number) => void;
  setIsTyping: (typing: boolean) => void;
  resetConversation: () => void;
}

/**
 * Props for the ChatProvider component
 */
export interface ChatProviderProps {
  children: ReactNode;
  initialConversationId?: string;
  initialMessages?: Message[];
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

/**
 * Generates a unique conversation ID
 */
const createConversationId = () => `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

/**
 * ChatProvider - Manages shared state for the entire chat interface
 *
 * This context provides:
 * - Message array state
 * - Typing indicator state
 * - Conversation ID
 * - Message manipulation functions (add, update, delete, edit)
 *
 * Usage:
 * ```tsx
 * <ChatProvider>
 *   <ChatInterface />
 * </ChatProvider>
 * ```
 */
export function ChatProvider({
  children,
  initialConversationId,
  initialMessages = [],
}: ChatProviderProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState(
    () => initialConversationId || createConversationId()
  );

  /**
   * Add a new message to the conversation
   */
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  /**
   * Update an existing message with partial updates
   */
  const updateMessage = useCallback((id: string | number, updates: Partial<Message>) => {
    setMessages((prev) => prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)));
  }, []);

  /**
   * Delete a message from the conversation
   */
  const deleteMessage = useCallback((id: string | number) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  /**
   * Clear all messages (used for chat reset)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Toggle edit mode for a specific message
   */
  const toggleEdit = useCallback((id: string | number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              isEditing: !msg.isEditing,
              editedContent: msg.isEditing ? undefined : msg.content,
            }
          : msg
      )
    );
  }, []);

  /**
   * Update the edited content of a message while in edit mode
   */
  const updateEdit = useCallback((id: string | number, content: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, editedContent: content } : msg))
    );
  }, []);

  /**
   * Save the edited content and exit edit mode
   */
  const saveEdit = useCallback((id: string | number) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === id
          ? {
              ...msg,
              content: msg.editedContent || msg.content,
              isEditing: false,
              editedContent: undefined,
            }
          : msg
      )
    );
  }, []);

  /**
   * Reset the entire conversation (new ID, clear messages, reset typing)
   */
  const resetConversation = useCallback(() => {
    setMessages([]);
    setIsTyping(false);
    setConversationId(createConversationId());
  }, []);

  const value: ChatContextValue = {
    messages,
    isTyping,
    conversationId,
    addMessage,
    updateMessage,
    deleteMessage,
    clearMessages,
    toggleEdit,
    updateEdit,
    saveEdit,
    setIsTyping,
    resetConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Custom hook to access chat context
 *
 * @throws {Error} If used outside of ChatProvider
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   const { messages, addMessage } = useChatContext();
 *   // ...
 * }
 * ```
 */
export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider');
  }
  return context;
}
