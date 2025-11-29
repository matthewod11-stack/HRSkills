'use client';

import { motion } from 'framer-motion';
import { Calendar, Clock } from 'lucide-react';
import { memo } from 'react';

const events = [
  {
    id: 1,
    title: 'Interview - Senior Developer',
    time: '2:00 PM',
    type: 'interview',
    color: 'blue',
  },
  {
    id: 2,
    title: 'Team Meeting',
    time: '3:30 PM',
    type: 'meeting',
    color: 'purple',
  },
  {
    id: 3,
    title: 'Onboarding Session',
    time: '4:00 PM',
    type: 'onboarding',
    color: 'green',
  },
  {
    id: 4,
    title: 'Performance Review',
    time: 'Tomorrow',
    type: 'review',
    color: 'amber',
  },
];

const colorMap = {
  blue: 'from-blue-500 to-cyan-500',
  purple: 'from-purple-500 to-pink-500',
  green: 'from-green-500 to-emerald-500',
  amber: 'from-amber-500 to-orange-500',
};

/**
 * EventItem Component
 *
 * Individual event card, memoized to prevent unnecessary re-renders.
 */
const EventItem = memo(function EventItem({
  event,
  index,
  colorMap: colorMapProp,
}: {
  event: (typeof events)[0];
  index: number;
  colorMap: Record<string, string>;
}) {
  return (
    <motion.div
      key={event.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 + index * 0.1 }}
      className="flex items-center gap-4 p-3 rounded-xl bg-black/40 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 transition-all cursor-pointer group/item"
    >
      <div className={`w-1 h-12 rounded-full bg-gradient-to-b ${colorMapProp[event.color]}`} />
      <div className="flex-1">
        <p className="mb-1 group-hover/item:text-white transition-colors">{event.title}</p>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{event.time}</span>
        </div>
      </div>
    </motion.div>
  );
});

export function UpcomingEvents() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-0 group-hover:opacity-100" />

      <div className="relative backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-2xl p-6 hover:border-white/40 transition-all duration-300">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg">Upcoming Events</h3>
        </div>

        <div className="space-y-4">
          {events.map((event, index) => (
            <EventItem key={event.id} event={event} index={index} colorMap={colorMap} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
