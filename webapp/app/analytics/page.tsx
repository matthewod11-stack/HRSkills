'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  Copy,
  BarChart3,
  LineChart,
  PieChart,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import dynamic from 'next/dynamic';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { logComponentError } from '@/lib/errorLogging';
import { useAuth } from '@/lib/auth/auth-context';

// Lazy load Chart.js components with configuration
const Bar = dynamic(
  () => import('@/lib/chartjs-config').then(() => import('react-chartjs-2').then((mod) => mod.Bar)),
  {
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-white/5 rounded-lg animate-pulse" />,
  }
);
const Line = dynamic(
  () =>
    import('@/lib/chartjs-config').then(() => import('react-chartjs-2').then((mod) => mod.Line)),
  {
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-white/5 rounded-lg animate-pulse" />,
  }
);
const Pie = dynamic(
  () => import('@/lib/chartjs-config').then(() => import('react-chartjs-2').then((mod) => mod.Pie)),
  {
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-white/5 rounded-lg animate-pulse" />,
  }
);
const Scatter = dynamic(
  () =>
    import('@/lib/chartjs-config').then(() => import('react-chartjs-2').then((mod) => mod.Scatter)),
  {
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-white/5 rounded-lg animate-pulse" />,
  }
);

interface Message {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  chartConfig?: ChartConfig;
  suggestedFollowUps?: string[];
}

interface ChartConfig {
  type: 'bar' | 'line' | 'scatter' | 'pie';
  data: any;
  options: any;
  canPin?: boolean;
}

const initialMessages: Message[] = [
  {
    id: 1,
    role: 'assistant',
    content:
      "👋 Hi! I'm your HR Analytics Assistant. Ask me questions about your workforce data, and I'll generate insights and visualizations for you.\n\nTry asking:\n- What&apos;s our department distribution?\n- Show me attrition trends\n- Compare performance ratings by level",
    timestamp: new Date(Date.now() - 60000),
  },
];

// Data sources are now automatically loaded from the master sheet in data center

export default function AnalyticsPage() {
  const { getAuthHeaders } = useAuth();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentChart, setCurrentChart] = useState<ChartConfig | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Generate session ID on mount
    setSessionId(`analytics-${Date.now()}`);
  }, []);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping) return;

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
      // Note: Analytics chat still uses dedicated endpoint for conversational AI
      // The unified /api/analytics?metric=X is for structured metric queries
      const response = await fetch('/api/analytics/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          message: messageText,
          sessionId,
          conversationHistory: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message || 'API error');
      }

      const assistantMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: result.data.content,
        chartConfig: result.data.chartConfig || null,
        suggestedFollowUps: result.data.suggestedFollowUps || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (result.data.chartConfig) {
        setCurrentChart(result.data.chartConfig);
      }
    } catch (error: any) {
      console.error('Analytics error:', error);
      const errorMessage: Message = {
        id: messages.length + 2,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try rephrasing your question.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const renderChart = (config: ChartConfig) => {
    const ChartComponent = {
      bar: Bar,
      line: Line,
      pie: Pie,
      scatter: Scatter,
    }[config.type];

    if (!ChartComponent) return null;

    return (
      <div className="w-full h-[400px]">
        <ChartComponent data={config.data} options={config.options} />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white overflow-hidden">
      {/* Floating background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-black/40 border-b border-white/20 sticky top-0 z-30"
        >
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Back to home"
                    className="w-12 h-12 bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                  </motion.button>
                </Link>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Analytics</h1>
                  <p className="text-sm text-gray-400">Ask questions about your data</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-400">Data from Data Center</p>
                <Link href="/data-sources">
                  <span className="text-xs text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                    Manage data sources →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-[1800px] mx-auto px-6 py-8">
          <ErrorBoundary
            level="page"
            onError={(error, errorInfo) => {
              logComponentError(error, errorInfo, 'AnalyticsPage');
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Chat Panel (40%) */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="relative group h-[700px] flex flex-col"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60" />

                  <div className="relative backdrop-blur-2xl bg-black/40 border-2 border-white/30 rounded-3xl flex flex-col h-full overflow-hidden hover:border-white/40 transition-all duration-300">
                    {/* Chat Header */}
                    <div className="p-6 border-b-2 border-white/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <Bot className="w-7 h-7" aria-hidden="true" />
                        </div>
                        <div>
                          <h2 className="text-xl flex items-center gap-2">
                            Analytics Assistant
                            <Sparkles className="w-5 h-5 text-yellow-400" aria-hidden="true" />
                          </h2>
                          <p className="text-sm text-gray-400">Powered by Claude AI</p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      <AnimatePresence initial={false}>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                message.role === 'user'
                                  ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
                              }`}
                            >
                              {message.role === 'user' ? (
                                <User className="w-5 h-5" aria-hidden="true" />
                              ) : (
                                <Bot className="w-5 h-5" aria-hidden="true" />
                              )}
                            </div>
                            <div
                              className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}
                            >
                              <div
                                className={`max-w-[85%] p-4 rounded-2xl ${
                                  message.role === 'user'
                                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-500/50'
                                    : 'bg-black/40 border-2 border-white/20'
                                }`}
                              >
                                <div className="prose prose-invert prose-sm max-w-none">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {message.content}
                                  </ReactMarkdown>
                                </div>

                                {/* Suggested follow-ups */}
                                {message.role === 'assistant' &&
                                  message.suggestedFollowUps &&
                                  message.suggestedFollowUps.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-white/10">
                                      <p className="text-xs text-gray-400 mb-2">
                                        Suggested questions:
                                      </p>
                                      <div className="space-y-1">
                                        {message.suggestedFollowUps.map((followUp, idx) => (
                                          <button
                                            key={idx}
                                            onClick={() => handleSend(followUp)}
                                            className="block w-full text-left px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg text-xs transition-colors"
                                          >
                                            {followUp}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                                  <p className="text-xs text-gray-500">
                                    {message.timestamp.toLocaleTimeString('en-US', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </p>
                                  {message.role === 'assistant' && (
                                    <button
                                      onClick={() => copyToClipboard(message.content)}
                                      className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                                      aria-label="Copy message to clipboard"
                                      title="Copy to clipboard"
                                    >
                                      <Copy className="w-4 h-4" aria-hidden="true" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3"
                          role="status"
                          aria-live="polite"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <div className="bg-black/40 border-2 border-white/20 p-4 rounded-2xl">
                            <span className="sr-only">Analyzing your question...</span>
                            <div className="flex gap-1">
                              <motion.div
                                className="w-2 h-2 bg-blue-400 rounded-full"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-purple-400 rounded-full"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              />
                              <motion.div
                                className="w-2 h-2 bg-pink-400 rounded-full"
                                animate={{ y: [0, -8, 0] }}
                                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-6 border-t-2 border-white/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                      <div className="flex gap-3">
                        <label htmlFor="analytics-input" className="sr-only">
                          Ask analytics questions about your data
                        </label>
                        <input
                          id="analytics-input"
                          ref={inputRef}
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Ask about your data..."
                          aria-label="Analytics query input"
                          aria-describedby="analytics-input-help"
                          className="flex-1 bg-black/40 border-2 border-white/30 rounded-xl px-4 py-3 outline-none focus:border-blue-500/70 focus:ring-2 focus:ring-blue-500/30 transition-all placeholder-gray-500"
                        />
                        <motion.button
                          onClick={() => handleSend()}
                          disabled={!input.trim() || isTyping}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          aria-label="Send analytics query"
                          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 border-2 border-blue-400/50 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 hover:border-blue-400/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          <Send className="w-5 h-5" aria-hidden="true" />
                        </motion.button>
                      </div>
                      <p
                        id="analytics-input-help"
                        className="text-xs text-gray-500 mt-2 text-center"
                      >
                        Press Enter to send
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Visualization Panel (60%) */}
              <div className="lg:col-span-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="relative group h-[700px] flex flex-col"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60" />

                  <div className="relative backdrop-blur-2xl bg-black/40 border-2 border-white/30 rounded-3xl p-6 h-full overflow-hidden hover:border-white/40 transition-all duration-300">
                    {currentChart ? (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {currentChart.type === 'bar' && (
                              <BarChart3 className="w-5 h-5 text-blue-400" aria-hidden="true" />
                            )}
                            {currentChart.type === 'line' && (
                              <LineChart className="w-5 h-5 text-purple-400" aria-hidden="true" />
                            )}
                            {currentChart.type === 'pie' && (
                              <PieChart className="w-5 h-5 text-pink-400" aria-hidden="true" />
                            )}
                            Visualization
                          </h3>
                        </div>
                        <div className="flex items-center justify-center h-[calc(100%-80px)]">
                          {renderChart(currentChart)}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <TrendingUp className="w-24 h-24 mb-4 opacity-30" aria-hidden="true" />
                        <p className="text-lg">Ask a question to see visualizations</p>
                        <p className="text-sm mt-2">Try: &ldquo;What&apos;s our department distribution?&rdquo;</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
