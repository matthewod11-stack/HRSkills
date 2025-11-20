'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, MapPin, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface TimeZone {
  location: string;
  city: string;
  timezone: string;
  flag: string;
  isHome?: boolean;
}

const TEAM_LOCATIONS: TimeZone[] = [
  {
    location: 'San Francisco Bay Area',
    city: 'San Francisco',
    timezone: 'America/Los_Angeles',
    flag: '🇺🇸',
    isHome: true,
  },
  {
    location: 'India',
    city: 'Bangalore',
    timezone: 'Asia/Kolkata',
    flag: '🇮🇳',
  },
  {
    location: 'Brazil',
    city: 'São Paulo',
    timezone: 'America/Sao_Paulo',
    flag: '🇧🇷',
  },
  {
    location: 'Colombia',
    city: 'Bogotá',
    timezone: 'America/Bogota',
    flag: '🇨🇴',
  },
  {
    location: 'Australia',
    city: 'Sydney',
    timezone: 'Australia/Sydney',
    flag: '🇦🇺',
  },
];

export default function TeamTimePage() {
  const router = useRouter();
  const [currentTimes, setCurrentTimes] = useState<Record<string, Date>>({});

  useEffect(() => {
    const updateTimes = () => {
      const times: Record<string, Date> = {};
      TEAM_LOCATIONS.forEach((location) => {
        times[location.timezone] = new Date();
      });
      setCurrentTimes(times);
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date, timezone: string) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date, timezone: string) => {
    return date.toLocaleDateString('en-US', {
      timeZone: timezone,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getTimeOffset = (timezone: string) => {
    const date = new Date();
    const localTime = date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const targetTime = date.toLocaleString('en-US', { timeZone: timezone });

    const localDate = new Date(localTime);
    const targetDate = new Date(targetTime);

    const diffMs = targetDate.getTime() - localDate.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    if (diffHours === 0) return 'Same time';
    if (diffHours > 0) return `+${diffHours}h ahead`;
    return `${diffHours}h behind`;
  };

  const getWorkHourStatus = (date: Date, timezone: string) => {
    const hour = parseInt(
      date.toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        hour12: false,
      })
    );

    if (hour >= 9 && hour < 18) {
      return {
        status: 'Working Hours',
        color: 'from-sage to-sage-light',
        textColor: 'text-sage',
        bgColor: 'bg-sage/10',
        borderColor: 'border-sage/30',
      };
    } else if ((hour >= 18 && hour < 22) || (hour >= 6 && hour < 9)) {
      return {
        status: 'Outside Hours',
        color: 'from-amber to-amber-dark',
        textColor: 'text-amber',
        bgColor: 'bg-amber/10',
        borderColor: 'border-amber/30',
      };
    } else {
      return {
        status: 'Sleeping Hours',
        color: 'from-charcoal-light/40 to-charcoal-light/60',
        textColor: 'text-charcoal-light',
        bgColor: 'bg-cream-light',
        borderColor: 'border-warm',
      };
    }
  };

  return (
    <div className="min-h-screen bg-radial-cream text-foreground">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-cream-white/90 border-b-2 border-warm sticky top-0 z-30 shadow-soft transition-premium"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="w-10 h-10 bg-cream hover:bg-terracotta/10 border-2 border-warm hover:border-terracotta/40 rounded-xl flex items-center justify-center transition-premium hover-lift"
                aria-label="Back to dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-terracotta" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-terracotta to-amber rounded-2xl flex items-center justify-center shadow-warm">
                  <Globe className="w-5 h-5 text-cream-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-charcoal">Global Team Time</h1>
                  <p className="text-sm text-charcoal-light">Track your team across time zones</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {TEAM_LOCATIONS.map((location, index) => {
            const currentTime = currentTimes[location.timezone] || new Date();
            const workStatus = getWorkHourStatus(currentTime, location.timezone);

            return (
              <motion.div
                key={location.timezone}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group hover-lift"
              >
                <div className="relative bg-cream-white border-2 border-warm rounded-2xl p-6 hover:border-terracotta/40 transition-premium shadow-soft hover:shadow-warm">
                  {/* Location Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl">{location.flag}</span>
                      <div>
                        <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                          {location.location}
                          {location.isHome && (
                            <span className="px-2 py-0.5 bg-terracotta/20 border border-terracotta/50 rounded-full text-xs text-terracotta font-medium">
                              Home
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-charcoal-light flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {location.city}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-3 py-1.5 ${workStatus.bgColor} border-2 ${workStatus.borderColor} rounded-xl`}
                    >
                      <p className={`text-xs font-medium ${workStatus.textColor}`}>
                        {workStatus.status}
                      </p>
                    </div>
                  </div>

                  {/* Time Display */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-5 h-5 text-charcoal-light" />
                      <span className="text-sm text-charcoal-light">Current Time</span>
                    </div>
                    <div
                      className="text-5xl font-mono font-bold tracking-tight mb-2 text-terracotta"
                      suppressHydrationWarning
                    >
                      {formatTime(currentTime, location.timezone)}
                    </div>
                    <p className="text-sm text-charcoal-light" suppressHydrationWarning>
                      {formatDate(currentTime, location.timezone)}
                    </p>
                  </div>

                  {/* Time Offset */}
                  {!location.isHome && (
                    <div className="pt-4 border-t-2 border-warm">
                      <p className="text-sm text-charcoal-light">
                        Offset from home:{' '}
                        <span className="text-charcoal font-medium">
                          {getTimeOffset(location.timezone)}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Helper Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-8 bg-cream-white border-2 border-warm rounded-2xl p-6 shadow-soft"
        >
          <h3 className="text-lg font-bold text-charcoal mb-4">Time Zone Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-sage rounded-full" />
              <div>
                <p className="text-sm font-medium text-charcoal">Working Hours</p>
                <p className="text-xs text-charcoal-light">9 AM - 6 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber rounded-full" />
              <div>
                <p className="text-sm font-medium text-charcoal">Outside Hours</p>
                <p className="text-xs text-charcoal-light">6 AM - 9 AM, 6 PM - 10 PM</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-charcoal-light/40 rounded-full" />
              <div>
                <p className="text-sm font-medium text-charcoal">Sleeping Hours</p>
                <p className="text-xs text-charcoal-light">10 PM - 6 AM</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
