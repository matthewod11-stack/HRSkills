'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, FileText, AlertCircle, CheckCircle, LucideIcon } from 'lucide-react';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const notifications = [
  {
    id: 1,
    type: 'success',
    icon: CheckCircle,
    title: 'New hire completed',
    message: 'Sarah Johnson has completed onboarding',
    time: '5m ago',
    color: 'green',
  },
  {
    id: 2,
    type: 'info',
    icon: UserPlus,
    title: 'Interview scheduled',
    message: 'Interview with Alex Chen at 2:00 PM',
    time: '1h ago',
    color: 'blue',
  },
  {
    id: 3,
    type: 'warning',
    icon: AlertCircle,
    title: 'Document pending',
    message: '3 employees have pending documents',
    time: '3h ago',
    color: 'amber',
  },
  {
    id: 4,
    type: 'info',
    icon: FileText,
    title: 'Report generated',
    message: 'Monthly HR metrics report is ready',
    time: '5h ago',
    color: 'purple',
  },
];

const colorMap = {
  green: 'from-green-500/20 to-emerald-500/20 text-green-400',
  blue: 'from-blue-500/20 to-cyan-500/20 text-blue-400',
  amber: 'from-amber-500/20 to-orange-500/20 text-amber-400',
  purple: 'from-purple-500/20 to-pink-500/20 text-purple-400',
};

/**
 * NotificationItem Component
 *
 * Individual notification card, memoized to prevent re-renders
 * when unrelated notifications change.
 */
const NotificationItem = memo(function NotificationItem({
  notification,
  index,
  colorMap: colorMapProp,
}: {
  notification: (typeof notifications)[0];
  index: number;
  colorMap: Record<string, string>;
}) {
  const Icon = notification.icon;

  return (
    <motion.div
      key={notification.id}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="mb-3 p-4 backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-xl hover:bg-white/10 hover:border-white/40 transition-all cursor-pointer group"
    >
      <div className="flex gap-3">
        <div
          className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorMapProp[notification.color]} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="mb-1">{notification.title}</p>
          <p className="text-sm text-gray-400 mb-2">{notification.message}</p>
          <p className="text-xs text-gray-500">{notification.time}</p>
        </div>
      </div>
    </motion.div>
  );
});

export function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md backdrop-blur-2xl bg-black/90 border-l-2 border-white/30 shadow-2xl z-50"
          >
            <div className="flex items-center justify-between p-6 border-b-2 border-white/20">
              <div>
                <h2 className="text-xl">Notifications</h2>
                <p className="text-sm text-gray-400">
                  You have {notifications.length} unread notifications
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 border-2 border-white/30 hover:border-white/50 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto h-[calc(100%-88px)] p-4">
              {notifications.map((notification, index) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  index={index}
                  colorMap={colorMap}
                />
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
