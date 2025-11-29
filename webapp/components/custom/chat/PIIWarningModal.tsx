'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Edit3, Send, Shield } from 'lucide-react';
import { memo } from 'react';

/**
 * Props for the PIIWarningModal component
 */
export interface PIIWarningModalProps {
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Array of detected PII types (e.g., ['SSN', 'Email']) */
  detectedTypes: string[];
  /** Warning message to display */
  message: string;
  /** Callback when Edit button is clicked */
  onEdit: () => void;
  /** Callback when Send Anyway button is clicked */
  onSendAnyway: () => void;
  /** Callback when modal is closed (backdrop click) */
  onClose: () => void;
}

/**
 * PIIWarningModal - Warning modal for PII detection
 *
 * Displays a warning when personally identifiable information (PII)
 * is detected in a user's message before sending. Gives the user
 * options to edit the message or proceed anyway.
 *
 * Features:
 * - Backdrop overlay with blur
 * - Animated entry/exit
 * - Click outside to close
 * - Two action buttons: Edit or Send Anyway
 *
 * Memoized to prevent re-renders when parent updates.
 *
 * @example
 * ```tsx
 * <PIIWarningModal
 *   isOpen={showWarning}
 *   detectedTypes={['SSN', 'Email']}
 *   message="This information should not be shared in chat."
 *   onEdit={() => setShowWarning(false)}
 *   onSendAnyway={() => sendMessage()}
 *   onClose={() => setShowWarning(false)}
 * />
 * ```
 */
export const PIIWarningModal = memo(function PIIWarningModal({
  isOpen,
  detectedTypes,
  message,
  onEdit,
  onSendAnyway,
  onClose,
}: PIIWarningModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-error/20 to-error/10 border border-error/50 rounded-2xl p-6 max-w-lg w-full shadow-panel-hover"
            role="alertdialog"
            aria-labelledby="pii-warning-title"
            aria-describedby="pii-warning-message"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-error to-error flex items-center justify-center flex-shrink-0 shadow-soft">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3
                  id="pii-warning-title"
                  className="text-xl font-bold mb-2 flex items-center gap-2"
                >
                  Sensitive Information Detected
                  <Shield className="w-5 h-5 text-warning" />
                </h3>
                <p className="text-foreground text-sm mb-3 font-medium">
                  Your message contains potentially sensitive information:
                </p>

                {/* Detected Types */}
                <div className="bg-card border border-error/30 rounded-lg p-3 mb-3">
                  <p className="text-sm font-semibold text-error">
                    Detected: <span className="text-foreground">{detectedTypes.join(', ')}</span>
                  </p>
                </div>

                {/* Warning Message */}
                <p id="pii-warning-message" className="text-sm text-secondary font-medium">
                  {message}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              {/* Edit Message */}
              <motion.button
                onClick={onEdit}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-3 bg-violet hover:bg-violet-light border border-violet/50 rounded-xl transition-premium flex items-center justify-center gap-2 font-semibold shadow-glow-accent"
                aria-label="Edit message to remove sensitive information"
              >
                <Edit3 className="w-4 h-4" />
                Edit Message
              </motion.button>

              {/* Send Anyway */}
              <motion.button
                onClick={onSendAnyway}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-border rounded-xl transition-premium flex items-center justify-center gap-2 font-semibold"
                aria-label="Send message anyway with sensitive information"
              >
                <Send className="w-4 h-4" />
                Send Anyway
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

PIIWarningModal.displayName = 'PIIWarningModal';
