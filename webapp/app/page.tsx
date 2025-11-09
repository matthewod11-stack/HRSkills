'use client'

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingDown,
  Briefcase,
  Settings
} from 'lucide-react';
import { FloatingOrbs } from '@/components/custom/FloatingOrbs';
import { MetricCard } from '@/components/custom/MetricCard';
import { ChatInterface } from '@/components/custom/ChatInterface';
import { ContextPanel, ContextPanelData } from '@/components/custom/ContextPanel';
import { DocumentEditorPanel } from '@/components/custom/DocumentEditorPanel';
import { AnalyticsChartPanel } from '@/components/custom/AnalyticsChartPanel';
import { PerformanceGridPanel } from '@/components/custom/PerformanceGridPanel';
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

  // Context panel state for Phase 2 dashboard
  const [contextPanelData, setContextPanelData] = useState<ContextPanelData | null>(null);

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

          {/* Main Layout - Chat First with Dynamic Context Panel */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Chat Interface - Full Width by Default */}
            <section
              aria-label="HR Assistant Chat"
              className="flex-1 order-1 lg:order-2 min-h-[700px]"
            >
              <div className="flex flex-col gap-6">
                {/* Context Panel - Appears above chat when triggered */}
                {contextPanelData?.type && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="order-1"
                  >
                    <ContextPanel
                      panelData={contextPanelData}
                      onClose={() => setContextPanelData(null)}
                    >
                      {/* Render appropriate panel based on type */}
                      {contextPanelData.type === 'document' && (
                        <DocumentEditorPanel
                          content={contextPanelData.data?.content || ''}
                          documentType={contextPanelData.config?.documentType}
                          employeeName={contextPanelData.data?.employeeName}
                          onExport={async (content) => {
                            // TODO: Implement Google Docs export
                            console.log('Export to Google Docs:', content);
                          }}
                        />
                      )}
                      {contextPanelData.type === 'analytics' && (
                        <AnalyticsChartPanel
                          metric={contextPanelData.data?.metric || 'headcount'}
                          chartType={contextPanelData.config?.chartType}
                          department={contextPanelData.config?.filters?.department}
                          dateRange={contextPanelData.config?.filters?.dateRange}
                        />
                      )}
                      {contextPanelData.type === 'performance' && (
                        <PerformanceGridPanel
                          department={contextPanelData.config?.filters?.department}
                          highlights={contextPanelData.config?.highlights}
                          onEmployeeClick={(employee) => {
                            console.log('Employee clicked:', employee);
                            // TODO: Inject employee context into chat
                          }}
                        />
                      )}
                    </ContextPanel>
                  </motion.div>
                )}

                {/* Chat Interface - Pushed down when context panel is active */}
                <div className="order-2 h-[700px]">
                  <ErrorBoundary
                    level="section"
                    onError={(error, errorInfo) => {
                      logComponentError(error, errorInfo, 'ChatInterface');
                    }}
                  >
                    <ChatInterface
                      onContextPanelChange={setContextPanelData}
                    />
                  </ErrorBoundary>
                </div>
              </div>
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
