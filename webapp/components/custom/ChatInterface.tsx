'use client'

import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Zap, FileText, Users as UsersIcon, BookOpen, Edit3, Copy, Check, Shield, AlertTriangle, FileUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { detectSensitivePII } from '@/lib/pii-detector';
import { useAuth } from '@/lib/auth/auth-context';
import { WorkflowProgress } from './WorkflowProgress';
import { ActionButtons } from './ActionButtons';
import { ContextPanelData } from './ContextPanel';
import { detectContext } from '@/lib/workflows/context-detector';

interface WorkflowState {
  currentStep: string | null;
  progress: number;
  completedSteps: string[];
  isComplete: boolean;
  hasActions: boolean;
  actionCount: number;
}

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isEditing?: boolean;
  editedContent?: string;
  detectedWorkflow?: string;
  workflowConfidence?: number;
  workflowState?: WorkflowState;
  suggestedActions?: any[];
}

const initialMessages: Message[] = [];

const suggestions = [
  { icon: FileText, text: 'Generate an offer', gradient: 'from-blue-500 to-cyan-500' },
  { icon: UsersIcon, text: 'Create a PIP', gradient: 'from-purple-500 to-pink-500' },
  { icon: Zap, text: 'Write a JD', gradient: 'from-green-500 to-emerald-500' },
];

// Skills array removed - workflow detection is now automatic

/**
 * MessageItem Component
 *
 * Individual message bubble component, memoized to prevent re-renders
 * when other messages are added to the chat.
 *
 * @remarks
 * This component is expensive due to ReactMarkdown rendering and motion animations.
 * Memoization prevents re-rendering existing messages when new ones arrive.
 */
const MessageItem = memo(function MessageItem({
  message,
  conversationId,
  onToggleEdit,
  onUpdateEdit,
  onSaveEdit,
  onCopy,
  onExportToGoogleDocs
}: {
  message: Message;
  conversationId: string;
  onToggleEdit: (id: number) => void;
  onUpdateEdit: (id: number, content: string) => void;
  onSaveEdit: (id: number) => void;
  onCopy: (content: string) => void;
  onExportToGoogleDocs: (message: Message) => Promise<void>;
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExportToGoogleDocs(message);
    } finally {
      setIsExporting(false);
    }
  };
  return (
    <motion.div
      key={message.id}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow-accent ${
        message.role === 'user'
          ? 'bg-gradient-to-br from-success to-success'
          : 'bg-gradient-to-br from-violet to-violet-light'
      }`}>
        {message.role === 'user' ? (
          <User className="w-5 h-5" />
        ) : (
          <Bot className="w-5 h-5" />
        )}
      </div>
      <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
        <div className={`max-w-[80%] p-4 rounded-2xl transition-premium ${
          message.role === 'user'
            ? 'bg-gradient-to-br from-success/20 to-success/10 border border-success/50'
            : 'bg-card border border-border shadow-soft'
        }`}>
          {message.isEditing ? (
            <div className="space-y-2">
              <textarea
                value={message.editedContent || message.content}
                onChange={(e) => onUpdateEdit(message.id, e.target.value)}
                className="w-full min-h-[200px] p-3 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-violet transition-premium resize-y"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => onSaveEdit(message.id)}
                  className="px-3 py-1 bg-violet hover:bg-violet-light rounded-lg text-sm transition-premium flex items-center gap-1 font-medium shadow-glow-accent"
                >
                  <Check className="w-4 h-4" />
                  Save
                </button>
                <button
                  onClick={() => onToggleEdit(message.id)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-premium font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {message.detectedWorkflow && message.detectedWorkflow !== 'general' && (
                <div className="mb-2 pb-2 border-b border-border">
                  <p className="text-xs text-violet-light flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3" />
                    Workflow: {message.detectedWorkflow.replace('_', ' ')}
                    {message.workflowConfidence && ` (${message.workflowConfidence}% confidence)`}
                  </p>
                </div>
              )}
              {message.workflowState && message.role === 'assistant' && (
                <div className="mb-3">
                  <WorkflowProgress
                    workflowId={message.detectedWorkflow || 'general'}
                    state={message.workflowState}
                  />
                </div>
              )}
              {message.suggestedActions && message.suggestedActions.length > 0 && message.role === 'assistant' && (
                <div className="mb-3">
                  <ActionButtons
                    actions={message.suggestedActions}
                    conversationId={conversationId}
                    workflowId={message.detectedWorkflow || 'general'}
                  />
                </div>
              )}
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {message.content}
                </ReactMarkdown>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <p className="text-xs text-secondary">
                  {message.timestamp.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                {message.role === 'assistant' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onCopy(message.content)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-premium"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onToggleEdit(message.id)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-premium"
                      title="Edit document"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={isExporting}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-premium disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Export to Google Docs"
                    >
                      {isExporting ? (
                        <div className="w-4 h-4 border-2 border-violet border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <FileUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
});

interface ChatInterfaceProps {
  onContextPanelChange?: (panelData: ContextPanelData | null) => void;
}

export function ChatInterface({ onContextPanelChange }: ChatInterfaceProps = {}) {
  const { getAuthHeaders } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId] = useState<string>(() => `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  const [piiWarning, setPiiWarning] = useState<{ show: boolean; types: string[]; message: string; pendingText: string }>({
    show: false,
    types: [],
    message: '',
    pendingText: ''
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (text?: string, bypassPII = false) => {
    const messageText = text || input.trim();
    if (!messageText) return;

    // Check for PII before sending (unless bypassing)
    if (!bypassPII) {
      const piiResult = detectSensitivePII(messageText);
      if (piiResult.detected) {
        setPiiWarning({
          show: true,
          types: piiResult.types,
          message: piiResult.message,
          pendingText: messageText
        });
        return; // Don't send yet, wait for user decision
      }
    }

    const userMessage: Message = {
      id: messages.length + 1,
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Call chat API - workflow detection is automatic
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          message: messageText,
          conversationId,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
        detectedWorkflow: data.detectedWorkflow,
        workflowConfidence: data.workflowConfidence,
        workflowState: data.workflowState,
        suggestedActions: data.suggestedActions,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Detect context and update panel if callback provided
      if (onContextPanelChange) {
        // Check if API response includes contextPanel data
        if (data.contextPanel) {
          onContextPanelChange(data.contextPanel);
        } else {
          // Fallback: client-side detection
          const detection = detectContext(messageText, data.reply);
          if (detection.panelData && detection.confidence >= 70) {
            onContextPanelChange(detection.panelData);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleProceedWithPII = () => {
    setPiiWarning({ show: false, types: [], message: '', pendingText: '' });
    handleSend(piiWarning.pendingText, true); // Bypass PII check
  };

  const handleEditMessage = () => {
    setInput(piiWarning.pendingText);
    setPiiWarning({ show: false, types: [], message: '', pendingText: '' });
    inputRef.current?.focus();
  };

  const handleSuggestionClick = (text: string) => {
    handleSend(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Memoize callbacks to prevent MessageItem re-renders
  const toggleEdit = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, isEditing: !msg.isEditing, editedContent: msg.editedContent || msg.content }
        : msg
    ));
  }, []);

  const updateEditedContent = useCallback((messageId: number, content: string) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, editedContent: content }
        : msg
    ));
  }, []);

  const saveEdit = useCallback((messageId: number) => {
    setMessages(prev => prev.map(msg =>
      msg.id === messageId
        ? { ...msg, content: msg.editedContent || msg.content, isEditing: false }
        : msg
    ));
  }, []);

  const copyToClipboard = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  const exportToGoogleDocs = useCallback(async (message: Message) => {
    try {
      // Detect document type from the message content or detected workflow
      let documentType = 'Document';

      if (message.detectedWorkflow) {
        const workflowMapping: { [key: string]: string } = {
          'hiring': 'Job Description',
          'performance': 'Performance Document',
          'onboarding': 'Onboarding Plan',
          'offboarding': 'Exit Document',
          'compliance': 'Policy Document',
          'employee_relations': 'ER Document',
          'compensation': 'Compensation Document',
          'analytics': 'Analytics Report'
        };
        documentType = workflowMapping[message.detectedWorkflow] || 'Document';
      }

      // Try to extract document type from content
      const content = message.content.toLowerCase();
      if (content.includes('offer letter') || content.includes('offer of employment')) {
        documentType = 'Offer Letter';
      } else if (content.includes('performance improvement plan') || content.includes('pip')) {
        documentType = 'PIP';
      } else if (content.includes('termination') || content.includes('separation')) {
        documentType = 'Termination Letter';
      } else if (content.includes('reference letter')) {
        documentType = 'Reference Letter';
      } else if (content.includes('promotion')) {
        documentType = 'Promotion Letter';
      } else if (content.includes('transfer')) {
        documentType = 'Transfer Letter';
      } else if (content.includes('job description') || content.includes('jd')) {
        documentType = 'Job Description';
      }

      // Generate title from timestamp
      const timestamp = message.timestamp || new Date();
      const title = `${documentType}_${timestamp.toISOString().split('T')[0]}`;

      // Call export API
      const response = await fetch('/api/documents/export-to-google-docs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          title,
          content: message.content,
          documentType,
          metadata: {
            date: timestamp.toISOString().split('T')[0]
          }
        })
      });

      const data = await response.json();

      // Handle authentication required
      if (data.needsAuth) {
        const shouldConnect = confirm('You need to connect your Google account to export documents. You will be redirected to Google. Connect now?');
        if (shouldConnect) {
          // Use same tab to avoid popup blockers
          window.location.href = '/api/auth/google';
        }
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Export failed');
      }

      // Open the document in a new tab
      window.open(data.editLink, '_blank');

      // Success!
      console.log('Document exported successfully:', data.webViewLink);

    } catch (error: any) {
      console.error('Failed to export to Google Docs:', error);
      alert(`Failed to export document: ${error.message}`);
    }
  }, [getAuthHeaders]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative group h-full flex flex-col"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-violet/10 via-violet-light/10 to-violet/5 rounded-3xl blur-2xl group-hover:blur-3xl transition-premium opacity-60" />

      <div className="relative backdrop-blur-2xl bg-card border border-border rounded-3xl flex flex-col h-full overflow-hidden hover:border-violet/50 hover:shadow-panel-hover transition-premium">
        {/* Header */}
        <div className="p-6 border-b border-border bg-gradient-to-r from-violet/10 to-violet-light/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet to-violet-light flex items-center justify-center shadow-glow-accent">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl flex items-center gap-2 font-semibold">
                  Chief People Officer
                  <Sparkles className="w-5 h-5 text-warning" />
                </h2>
                <p className="text-sm text-secondary font-medium">"More People, More Problems"</p>
              </div>
            </div>

            {/* Workflow detection indicator - shows when active */}
            {messages.length > 0 && messages[messages.length - 1].detectedWorkflow && messages[messages.length - 1].detectedWorkflow !== 'general' && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-violet/10 border border-violet/20 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 text-violet" />
                <span className="text-xs font-medium text-violet capitalize">
                  {messages[messages.length - 1].detectedWorkflow?.replace('_', ' ')} workflow
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                conversationId={conversationId}
                onToggleEdit={toggleEdit}
                onUpdateEdit={updateEditedContent}
                onSaveEdit={saveEdit}
                onCopy={copyToClipboard}
                onExportToGoogleDocs={exportToGoogleDocs}
              />
            ))}
          </AnimatePresence>

          {isTyping && (
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
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="px-6 pb-4"
          >
            <p className="text-sm text-secondary mb-3 font-medium">Try asking me about:</p>
            <div className="grid grid-cols-3 gap-2">
              {suggestions.map((suggestion, index) => {
                const Icon = suggestion.icon;
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="flex items-center gap-3 p-3 bg-card hover:bg-white/10 border border-border rounded-xl transition-premium hover:border-violet/50 hover:shadow-glow-accent text-left group/btn"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet to-violet-light flex items-center justify-center flex-shrink-0 group-hover/btn:scale-110 transition-transform shadow-glow-accent">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{suggestion.text}</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Input */}
        <div className="p-6 border-t border-border bg-gradient-to-r from-violet/5 to-violet-light/5">
          <label htmlFor="chat-input" className="sr-only">
            Chat message input
          </label>
          <div className="flex gap-3">
            <input
              ref={inputRef}
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about HR..."
              aria-label="Chat message input"
              aria-describedby="chat-input-help"
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 outline-none focus:border-violet focus:ring-2 focus:ring-violet/30 transition-premium placeholder-secondary font-medium"
            />
            <motion.button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
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
      </div>

      {/* PII Warning Modal */}
      <AnimatePresence>
        {piiWarning.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setPiiWarning({ show: false, types: [], message: '', pendingText: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-error/20 to-error/10 border border-error/50 rounded-2xl p-6 max-w-lg w-full shadow-panel-hover"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-error to-error flex items-center justify-center flex-shrink-0 shadow-soft">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    Sensitive Information Detected
                    <Shield className="w-5 h-5 text-warning" />
                  </h3>
                  <p className="text-foreground text-sm mb-3 font-medium">
                    Your message contains potentially sensitive information:
                  </p>
                  <div className="bg-card border border-error/30 rounded-lg p-3 mb-3">
                    <p className="text-sm font-semibold text-error">
                      Detected: <span className="text-foreground">{piiWarning.types.join(', ')}</span>
                    </p>
                  </div>
                  <p className="text-sm text-secondary font-medium">
                    {piiWarning.message}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button
                  onClick={handleEditMessage}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-violet hover:bg-violet-light border border-violet/50 rounded-xl transition-premium flex items-center justify-center gap-2 font-semibold shadow-glow-accent"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Message
                </motion.button>
                <motion.button
                  onClick={handleProceedWithPII}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-border rounded-xl transition-premium flex items-center justify-center gap-2 font-semibold"
                >
                  <Send className="w-4 h-4" />
                  Send Anyway
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
