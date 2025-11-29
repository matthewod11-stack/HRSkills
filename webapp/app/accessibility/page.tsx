'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Mail, MessageSquare, Phone } from 'lucide-react';
import Link from 'next/link';

export default function AccessibilityStatement() {
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
          <div className="max-w-4xl mx-auto px-6 py-4">
            <Link href="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Back to home"
                className="flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                <span>Back to HR Command Center</span>
              </motion.button>
            </Link>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold mb-4">Accessibility Statement</h1>
            <p className="text-gray-400 mb-8">Last updated: November 4, 2025</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-8"
          >
            {/* Commitment Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Our Commitment</h2>
              <div className="bg-white/5 border-2 border-white/20 rounded-2xl p-6">
                <p className="text-gray-300 leading-relaxed mb-4">
                  HR Command Center is committed to ensuring digital accessibility for people with
                  disabilities. We are continually improving the user experience for everyone and
                  applying the relevant accessibility standards.
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We believe that everyone should have equal access to our HR automation platform,
                  regardless of ability or technology used.
                </p>
              </div>
            </section>

            {/* Standards Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Standards Compliance</h2>
              <div className="bg-white/5 border-2 border-white/20 rounded-2xl p-6">
                <p className="text-gray-300 mb-4">
                  HR Command Center conforms to the following standards:
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 text-green-400 mt-1 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <strong className="text-white">WCAG 2.1 Level AA:</strong>
                      <span className="text-gray-300">
                        {' '}
                        Web Content Accessibility Guidelines 2.1 at Level AA conformance
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 text-green-400 mt-1 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <strong className="text-white">Section 508:</strong>
                      <span className="text-gray-300">
                        {' '}
                        U.S. Federal accessibility requirements
                      </span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2
                      className="w-5 h-5 text-green-400 mt-1 flex-shrink-0"
                      aria-hidden="true"
                    />
                    <div>
                      <strong className="text-white">ARIA 1.2:</strong>
                      <span className="text-gray-300">
                        {' '}
                        Accessible Rich Internet Applications technical specifications
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </section>

            {/* Features Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Accessibility Features</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white/5 border-2 border-white/20 rounded-xl p-4">
                  <h3 className="font-semibold mb-2 text-white">Keyboard Navigation</h3>
                  <p className="text-sm text-gray-400">
                    Full keyboard support with visible focus indicators and logical tab order
                  </p>
                </div>
                <div className="bg-white/5 border-2 border-white/20 rounded-xl p-4">
                  <h3 className="font-semibold mb-2 text-white">Screen Reader Support</h3>
                  <p className="text-sm text-gray-400">
                    Tested with NVDA, JAWS, and VoiceOver with proper ARIA labels
                  </p>
                </div>
                <div className="bg-white/5 border-2 border-white/20 rounded-xl p-4">
                  <h3 className="font-semibold mb-2 text-white">High Contrast</h3>
                  <p className="text-sm text-gray-400">
                    All text meets WCAG AA contrast ratios (4.5:1 minimum)
                  </p>
                </div>
                <div className="bg-white/5 border-2 border-white/20 rounded-xl p-4">
                  <h3 className="font-semibold mb-2 text-white">Responsive Design</h3>
                  <p className="text-sm text-gray-400">
                    Works at 200% text size and 400% browser zoom
                  </p>
                </div>
                <div className="bg-white/5 border-2 border-white/20 rounded-xl p-4">
                  <h3 className="font-semibold mb-2 text-white">Semantic HTML</h3>
                  <p className="text-sm text-gray-400">
                    Proper heading hierarchy and ARIA landmarks for navigation
                  </p>
                </div>
                <div className="bg-white/5 border-2 border-white/20 rounded-xl p-4">
                  <h3 className="font-semibold mb-2 text-white">Form Labels</h3>
                  <p className="text-sm text-gray-400">
                    All form inputs have descriptive labels and help text
                  </p>
                </div>
              </div>
            </section>

            {/* Compatibility Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Technology Compatibility</h2>
              <div className="bg-white/5 border-2 border-white/20 rounded-2xl p-6">
                <p className="text-gray-300 mb-4">
                  HR Command Center is designed to be compatible with:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-white mb-2">Assistive Technologies</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Screen readers (NVDA, JAWS, VoiceOver)</li>
                      <li>• Speech recognition software</li>
                      <li>• Screen magnification tools</li>
                      <li>• Switch access devices</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">Modern Browsers</h3>
                    <ul className="text-sm text-gray-400 space-y-1">
                      <li>• Chrome (latest 2 versions)</li>
                      <li>• Firefox (latest 2 versions)</li>
                      <li>• Safari (latest 2 versions)</li>
                      <li>• Edge (latest 2 versions)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Limitations Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Known Limitations</h2>
              <div className="bg-white/5 border-2 border-white/20 rounded-2xl p-6">
                <p className="text-gray-300 mb-4">
                  Despite our best efforts, some limitations may exist. We are actively working to
                  address:
                </p>
                <ul className="text-gray-400 space-y-2 text-sm">
                  <li>• Complex data visualizations may require alternative text descriptions</li>
                  <li>• Some third-party integrations may have limited accessibility support</li>
                  <li>• Older browser versions may not support all accessibility features</li>
                </ul>
              </div>
            </section>

            {/* Feedback Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Feedback & Contact</h2>
              <div className="bg-white/5 border-2 border-white/20 rounded-2xl p-6">
                <p className="text-gray-300 mb-6">
                  We welcome your feedback on the accessibility of HR Command Center. Please let us
                  know if you encounter accessibility barriers:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <motion.a
                    href="mailto:accessibility@hrcommandcenter.com"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl hover:bg-blue-500/20 transition-all"
                  >
                    <Mail className="w-5 h-5 text-blue-400" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-semibold">Email</div>
                      <div className="text-xs text-gray-400">accessibility@</div>
                    </div>
                  </motion.a>
                  <motion.a
                    href="tel:+1-555-ACCESSS"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-xl hover:bg-green-500/20 transition-all"
                  >
                    <Phone className="w-5 h-5 text-green-400" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-semibold">Phone</div>
                      <div className="text-xs text-gray-400">1-555-ACCESS</div>
                    </div>
                  </motion.a>
                  <motion.a
                    href="https://github.com/yourorg/hrcommandcenter/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-3 p-4 bg-purple-500/10 border-2 border-purple-500/30 rounded-xl hover:bg-purple-500/20 transition-all"
                  >
                    <MessageSquare className="w-5 h-5 text-purple-400" aria-hidden="true" />
                    <div>
                      <div className="text-sm font-semibold">GitHub</div>
                      <div className="text-xs text-gray-400">Report Issue</div>
                    </div>
                  </motion.a>
                </div>
                <p className="text-sm text-gray-400 mt-6">
                  We aim to respond to accessibility feedback within 2 business days.
                </p>
              </div>
            </section>

            {/* Assessment Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Assessment Approach</h2>
              <div className="bg-white/5 border-2 border-white/20 rounded-2xl p-6">
                <p className="text-gray-300 mb-4">
                  HR Command Center has been assessed using the following methods:
                </p>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">•</span>
                    <span>
                      <strong className="text-white">Automated Testing:</strong> axe-core and
                      Playwright with @axe-core/playwright
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">•</span>
                    <span>
                      <strong className="text-white">Manual Testing:</strong> Keyboard navigation,
                      screen readers, and browser zoom testing
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">•</span>
                    <span>
                      <strong className="text-white">Code Review:</strong> ARIA implementation and
                      semantic HTML validation
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-blue-400">•</span>
                    <span>
                      <strong className="text-white">User Testing:</strong> Feedback from users with
                      disabilities
                    </span>
                  </li>
                </ul>
              </div>
            </section>

            {/* Footer Note */}
            <div className="bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6 text-center">
              <p className="text-sm text-gray-300">
                This accessibility statement is in accordance with the{' '}
                <a
                  href="https://www.w3.org/WAI/planning/statements/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  W3C Accessibility Statement Format
                </a>
                .
              </p>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
