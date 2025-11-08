'use client'

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingDown,
  Briefcase,
  Settings,
  Database,
  Grid3x3,
  FolderOpen
} from 'lucide-react';
import { FloatingOrbs } from '@/components/custom/FloatingOrbs';
import { MetricCard } from '@/components/custom/MetricCard';
import { QuickActionCard } from '@/components/custom/QuickActionCard';
import { ChatInterface } from '@/components/custom/ChatInterface';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { logComponentError } from '@/lib/errorLogging';
import { get } from '@/lib/api-helpers/fetch-with-retry';
import { DialogSkeleton } from '@/components/ui/skeletons';

// Lazy load heavy dialog components
// These are only needed when user interacts, reducing initial bundle size
const MetricDetailsDialog = dynamic(
  () => import('@/components/custom/MetricDetailsDialog').then(mod => ({ default: mod.MetricDetailsDialog })),
  {
    loading: () => <DialogSkeleton />,
    ssr: false // Dialog is client-side only
  }
);

const CommandPalette = dynamic(
  () => import('@/components/custom/CommandPalette').then(mod => ({ default: mod.CommandPalette })),
  {
    loading: () => <DialogSkeleton />,
    ssr: false // Command palette is client-side only
  }
);

type MetricType = 'headcount' | 'attrition' | 'openPositions' | null;

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [commandOpen, setCommandOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    headcount: 0,
    attritionRate: 0,
    openPositions: 0
  });
  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');

  useEffect(() => {
    // Auto-login for development
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const demoToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJkZXYtdXNlciIsImVtYWlsIjoiZGV2QGhyc2tpbGxzLmxvY2FsIiwibmFtZSI6IkRldmVsb3BlciIsInJvbGVzIjpbeyJpZCI6ImFkbWluIiwibmFtZSI6IkFkbWluIn1dLCJpYXQiOjE3MzEwMTkyMDAsImV4cCI6OTk5OTk5OTk5OX0.dev-token';
      const demoUser = {
        userId: 'dev-user',
        email: 'dev@hrskills.local',
        name: 'Developer',
        roles: [{ id: 'admin', name: 'Admin', permissions: [] }]
      };
      localStorage.setItem('auth_token', demoToken);
      localStorage.setItem('auth_user', JSON.stringify(demoUser));
      console.log('✅ Auto-logged in as Developer');
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch real metrics from API with retry logic
    get('/api/metrics')
      .then(data => {
        setMetrics({
          headcount: data.headcount || 0,
          attritionRate: data.attritionRate || 0,
          openPositions: data.openPositions || 0
        });
      })
      .catch(err => console.error('Failed to fetch metrics:', err));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      } else if (e.key === 'Escape') {
        setCommandOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleMetricClick = (metric: MetricType, title: string, description: string) => {
    setSelectedMetric(metric);
    setDialogTitle(title);
    setDialogDescription(description);
    setMetricDialogOpen(true);
  };

  const handleDialogClose = () => {
    setMetricDialogOpen(false);
    setSelectedMetric(null);
  };

  return (
    <div className="min-h-screen bg-radial-dark text-white overflow-hidden">
      <FloatingOrbs />

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-card/80 border-b border-border sticky top-0 z-30 shadow-soft transition-premium"
        >
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet to-violet-light rounded-xl flex items-center justify-center shadow-glow-accent">
                  <span className="text-xl font-bold">HR</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold">HR Command Center</h1>
                  <p className="text-sm text-secondary">Powered by Claude AI</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => window.location.href = '/team-time'}
                  className="text-right hidden md:block hover:bg-white/5 px-4 py-2 rounded-lg transition-premium cursor-pointer"
                >
                  <p className="text-sm text-secondary" suppressHydrationWarning>{formatDate(currentTime)}</p>
                  <p className="text-2xl font-mono" suppressHydrationWarning>{formatTime(currentTime)}</p>
                </button>

                <button
                  onClick={() => window.location.href = '/settings'}
                  aria-label="Open settings"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-border hover:border-violet/50 rounded-lg flex items-center justify-center transition-premium"
                >
                  <Settings className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-[1800px] mx-auto px-6 py-8">
          {/* Metrics Grid - Top Row - 3 Cards */}
          <section aria-label="Key metrics">
            <h2 className="sr-only">Key Metrics Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <MetricCard
              title="Total Headcount"
              value={metrics.headcount}
              change="+2.5%"
              isPositive={true}
              icon={Users}
              progress={75}
              delay={0}
              onClick={() => handleMetricClick('headcount', 'Recent New Hires', 'Last 5 employees who joined the company')}
            />
            <MetricCard
              title="Attrition Rate"
              value={`${metrics.attritionRate}%`}
              change="-0.5%"
              isPositive={true}
              icon={TrendingDown}
              progress={15}
              delay={0.1}
              onClick={() => handleMetricClick('attrition', 'Recent Terminations', 'Last 5 employees who left the company this year')}
            />
            <MetricCard
              title="Open Positions"
              value={metrics.openPositions}
              change="+3"
              isPositive={false}
              icon={Briefcase}
              progress={40}
              delay={0.2}
              onClick={() => handleMetricClick('openPositions', 'Open Positions', 'Current open roles awaiting candidates')}
            />
            </div>
          </section>

          {/* Main Layout - Full Width */}
          <div className="flex gap-6">
            {/* Left Column - Quick Actions (narrow) */}
            <nav aria-label="Quick actions" className="flex flex-col gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="w-[280px]"
              >
                <QuickActionCard
                  title="Analytics"
                  description="Ask questions about your data"
                  icon={TrendingDown}
                  gradient="from-emerald-500 to-teal-500"
                  delay={0.5}
                  href="/analytics"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="w-[280px]"
              >
                <QuickActionCard
                  title="Data Center"
                  description="Upload & manage data"
                  icon={Database}
                  gradient="from-emerald-500 to-teal-500"
                  delay={0.6}
                  href="/data-sources"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="w-[280px]"
              >
                <QuickActionCard
                  title="9-Box"
                  description="Performance Heatmap"
                  icon={Grid3x3}
                  gradient="from-emerald-500 to-teal-500"
                  delay={0.7}
                  href="/nine-box"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="w-[280px]"
              >
                <QuickActionCard
                  title="Document Library"
                  description="Policies, handbooks & templates"
                  icon={FolderOpen}
                  gradient="from-emerald-500 to-teal-500"
                  delay={0.8}
                  href="/documents"
                />
              </motion.div>
            </nav>

            {/* Right Column - Chat Interface (flex-1) */}
            <section aria-label="HR Assistant Chat" className="flex-1 h-[767px]">
              <ErrorBoundary
                level="section"
                onError={(error, errorInfo) => {
                  logComponentError(error, errorInfo, 'ChatInterface');
                }}
              >
                <ChatInterface />
              </ErrorBoundary>
            </section>
          </div>
        </main>
      </div>

      <Suspense fallback={<DialogSkeleton />}>
        <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
      </Suspense>

      <Suspense fallback={<DialogSkeleton />}>
        <MetricDetailsDialog
          isOpen={metricDialogOpen}
          onClose={handleDialogClose}
          metric={selectedMetric}
          title={dialogTitle}
          description={dialogDescription}
        />
      </Suspense>
    </div>
  );
}
