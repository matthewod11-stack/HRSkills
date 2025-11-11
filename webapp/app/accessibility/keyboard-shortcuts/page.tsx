'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, Keyboard } from 'lucide-react';
import Link from 'next/link';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['Tab'], description: 'Move focus to next interactive element', category: 'Navigation' },
  {
    keys: ['Shift', 'Tab'],
    description: 'Move focus to previous interactive element',
    category: 'Navigation',
  },
  {
    keys: ['Tab'],
    description: 'Skip to main content (first Tab from page load)',
    category: 'Navigation',
  },

  // Global
  { keys: ['Cmd/Ctrl', 'K'], description: 'Open command palette', category: 'Global' },
  { keys: ['Esc'], description: 'Close modal/dialog', category: 'Global' },
  { keys: ['Cmd/Ctrl', '+'], description: 'Zoom in', category: 'Global' },
  { keys: ['Cmd/Ctrl', '-'], description: 'Zoom out', category: 'Global' },
  { keys: ['Cmd/Ctrl', '0'], description: 'Reset zoom', category: 'Global' },

  // Chat Interface
  { keys: ['Enter'], description: 'Send chat message', category: 'Chat' },
  { keys: ['Shift', 'Enter'], description: 'New line in chat input', category: 'Chat' },

  // Forms
  { keys: ['Enter'], description: 'Submit form / Activate button', category: 'Forms' },
  { keys: ['Space'], description: 'Toggle checkbox / Activate button', category: 'Forms' },
  { keys: ['↑', '↓'], description: 'Navigate through dropdown options', category: 'Forms' },

  // Tables
  { keys: ['↑', '↓'], description: 'Navigate table rows', category: 'Tables' },
  { keys: ['Enter'], description: 'Edit selected row', category: 'Tables' },

  // Screen Reader
  {
    keys: ['H'],
    description: 'Navigate to next heading (screen reader)',
    category: 'Screen Reader',
  },
  {
    keys: ['1-6'],
    description: 'Navigate by heading level (screen reader)',
    category: 'Screen Reader',
  },
  {
    keys: ['R'],
    description: 'Navigate to regions/landmarks (screen reader)',
    category: 'Screen Reader',
  },
  { keys: ['F'], description: 'Navigate to forms (screen reader)', category: 'Screen Reader' },
];

const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

export default function KeyboardShortcuts() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white overflow-hidden">
      {/* Floating background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-black/40 border-b border-white/20 sticky top-0 z-30"
        >
          <div className="max-w-5xl mx-auto px-6 py-4">
            <Link href="/accessibility">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Back to accessibility statement"
                className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                <span>Back to Accessibility Statement</span>
              </motion.button>
            </Link>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-5xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl mb-6">
              <Keyboard className="w-10 h-10" aria-hidden="true" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Keyboard Shortcuts</h1>
            <p className="text-gray-400 text-lg">
              Navigate HR Command Center efficiently using your keyboard
            </p>
          </motion.div>

          {/* Quick Tip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6 mb-8"
          >
            <h2 className="text-xl font-semibold mb-2 text-blue-300">Quick Tip</h2>
            <p className="text-gray-300">
              Most keyboard shortcuts use standard web conventions. Focus indicators (blue outlines)
              show where you are on the page. Press{' '}
              <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Tab</kbd> to navigate and{' '}
              <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Enter</kbd> or{' '}
              <kbd className="px-2 py-1 bg-white/10 rounded text-sm">Space</kbd> to activate.
            </p>
          </motion.div>

          {/* Shortcuts by Category */}
          <div className="space-y-6">
            {categories.map((category, categoryIndex) => (
              <motion.section
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + categoryIndex * 0.1 }}
              >
                <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3">
                  <span className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm">
                    {categoryIndex + 1}
                  </span>
                  {category}
                </h2>

                <div className="bg-white/5 border-2 border-white/20 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-white/5 border-b-2 border-white/20">
                        <th className="text-left p-4 font-semibold">Shortcut</th>
                        <th className="text-left p-4 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shortcuts
                        .filter((s) => s.category === category)
                        .map((shortcut, index) => (
                          <tr
                            key={index}
                            className="border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors"
                          >
                            <td className="p-4">
                              <div className="flex gap-2">
                                {shortcut.keys.map((key, keyIndex) => (
                                  <span key={keyIndex} className="inline-flex items-center gap-1">
                                    <kbd className="px-3 py-1.5 bg-white/10 border-2 border-white/20 rounded-lg text-sm font-mono shadow-lg">
                                      {key}
                                    </kbd>
                                    {keyIndex < shortcut.keys.length - 1 && (
                                      <span className="text-gray-500">+</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-gray-300">{shortcut.description}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </motion.section>
            ))}
          </div>

          {/* Platform Notes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-12 bg-white/5 border-2 border-white/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-semibold mb-4">Platform Notes</h2>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-400">
              <div>
                <h3 className="font-semibold text-white mb-2">macOS</h3>
                <p>
                  Use <strong className="text-white">Cmd</strong> (⌘) instead of Ctrl
                </p>
                <p className="mt-2">
                  VoiceOver: <strong className="text-white">Cmd + F5</strong> to toggle
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Windows/Linux</h3>
                <p>
                  Use <strong className="text-white">Ctrl</strong> for most shortcuts
                </p>
                <p className="mt-2">
                  NVDA: <strong className="text-white">Ctrl + Alt + N</strong> to toggle
                </p>
              </div>
            </div>
          </motion.div>

          {/* Additional Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="mt-8 text-center"
          >
            <p className="text-gray-400 mb-4">Need help or have suggestions for new shortcuts?</p>
            <Link href="/accessibility">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-cyan-500 border-2 border-indigo-400/50 rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
              >
                Contact Accessibility Team
              </motion.button>
            </Link>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
