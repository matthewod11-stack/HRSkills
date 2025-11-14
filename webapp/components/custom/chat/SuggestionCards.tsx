'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users as UsersIcon, Zap, LucideIcon } from 'lucide-react';

/**
 * Suggestion configuration
 */
interface Suggestion {
  icon: LucideIcon;
  text: string;
  gradient: string;
}

/**
 * Props for the SuggestionCards component
 */
export interface SuggestionCardsProps {
  /** Callback when a suggestion is clicked */
  onSuggestionClick: (text: string) => void;
}

/**
 * Default suggestions shown when chat is empty
 */
const DEFAULT_SUGGESTIONS: Suggestion[] = [
  { icon: FileText, text: 'Generate an offer', gradient: 'from-blue-500 to-cyan-500' },
  { icon: UsersIcon, text: 'Create a PIP', gradient: 'from-purple-500 to-pink-500' },
  { icon: Zap, text: 'Write a JD', gradient: 'from-green-500 to-emerald-500' },
];

/**
 * SuggestionCards - Quick action cards shown when chat is empty
 *
 * Displays clickable suggestion cards that help users get started
 * with common HR tasks. Only shown when there are no messages
 * in the conversation.
 *
 * Features:
 * - Animated entry with staggered delays
 * - Icon + text layout
 * - Hover effects and transitions
 *
 * Memoized to prevent re-renders when parent updates.
 *
 * @example
 * ```tsx
 * {messages.length === 0 && (
 *   <SuggestionCards
 *     onSuggestionClick={(text) => handleSend(text)}
 *   />
 * )}
 * ```
 */
export const SuggestionCards = memo(function SuggestionCards({
  onSuggestionClick
}: SuggestionCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="px-6 pb-4"
    >
      <p className="text-sm text-secondary mb-3 font-medium">Try asking me about:</p>
      <div className="grid grid-cols-3 gap-2">
        {DEFAULT_SUGGESTIONS.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="flex items-center gap-3 p-3 bg-card hover:bg-white/10 border border-border rounded-xl transition-premium hover:border-violet/50 hover:shadow-glow-accent text-left group/btn"
              aria-label={`Suggest: ${suggestion.text}`}
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
  );
});

SuggestionCards.displayName = 'SuggestionCards';
