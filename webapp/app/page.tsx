'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Users, TrendingDown, Grid3x3, Settings, Database } from 'lucide-react';
import { FloatingOrbs } from '@/components/custom/FloatingOrbs';
import { MetricCard } from '@/components/custom/MetricCard';
import { ChatInterface } from '@/components/custom/ChatInterface';
import { ContextPanel, ContextPanelData } from '@/components/custom/ContextPanel';
import { DocumentEditorPanel, DocumentExportPayload } from '@/components/custom/DocumentEditorPanel';
import { AnalyticsChartPanel } from '@/components/custom/AnalyticsChartPanel';
import { PerformanceGridPanel } from '@/components/custom/PerformanceGridPanel';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { logComponentError } from '@/lib/errorLogging';
import { fetchWithRetry } from '@/lib/api-helpers/fetch-with-retry';
import { DialogSkeleton } from '@/components/ui/skeletons';
import { useAuth } from '@/lib/auth/auth-context';

// Lazy load heavy dialog components
// These are only needed when user interacts, reducing initial bundle size
const MetricDetailsDialog = dynamic(
  () =>
    import('@/components/custom/MetricDetailsDialog').then((mod) => ({
      default: mod.MetricDetailsDialog,
    })),
  {
    loading: () => <DialogSkeleton />,
    ssr: false, // Dialog is client-side only
  }
);

const CommandPalette = dynamic(
  () =>
    import('@/components/custom/CommandPalette').then((mod) => ({ default: mod.CommandPalette })),
  {
    loading: () => <DialogSkeleton />,
    ssr: false, // Command palette is client-side only
  }
);

type MetricType = 'headcount' | 'attrition' | null;
type MetricsState = {
  headcount: number;
  attritionRate: number;
  lastUpdated: string | null;
};

type NineBoxSummary = {
  highPerformers: number;
  coreEmployees: number;
  developmentNeeded: number;
  totalAnalyzed: number;
  avgRatingInflation?: number;
};

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [commandOpen, setCommandOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsState>({
    headcount: 0,
    attritionRate: 0,
    lastUpdated: null,
  });
  const [metricsStatus, setMetricsStatus] = useState<
    'idle' | 'loading' | 'live' | 'empty' | 'error'
  >('idle');
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [nineBoxSummary, setNineBoxSummary] = useState<NineBoxSummary | null>(null);
  const [nineBoxStatus, setNineBoxStatus] = useState<
    'idle' | 'loading' | 'live' | 'empty' | 'error'
  >('idle');
  const [nineBoxError, setNineBoxError] = useState<string | null>(null);
  const [metricDialogOpen, setMetricDialogOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogDescription, setDialogDescription] = useState('');

  // Context panel state for Phase 2 dashboard
  const [contextPanelData, setContextPanelData] = useState<ContextPanelData | null>(null);
  const { getAuthHeaders } = useAuth();

  const handleDocumentExport = useCallback(
    async (payload: DocumentExportPayload) => {
      try {
        const timestamp = new Date();
        const datePart = timestamp.toISOString().split('T')[0];
        const typePart = payload.documentType.replace(/_/g, '-');
        const namePart = payload.employeeName
          ? `_${payload.employeeName.trim().replace(/\s+/g, '_')}`
          : '';
        const title = `${datePart}_${typePart}${namePart}`;

        const response = await fetch('/api/documents/export-to-google-docs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            title,
            content: payload.content,
            documentType: payload.documentType,
            metadata: {
              employeeName: payload.employeeName,
              source: payload.source,
              templateId: payload.templateId,
              templateName: payload.templateName,
            },
          }),
        });

        const data = await response.json();

        if (data.needsAuth) {
          const shouldConnect = window.confirm(
            'You need to connect your Google account to export documents. Connect now?'
          );
          if (shouldConnect) {
            window.location.href = '/api/auth/google';
          }
          return;
        }

        if (!response.ok) {
          throw new Error(data.error || data.message || 'Export failed');
        }

        if (data.editLink) {
          window.open(data.editLink, '_blank');
        }
      } catch (error: any) {
        console.error('Failed to export to Google Docs:', error);
        alert(`Failed to export document: ${error.message || 'Unknown error'}`);
      }
    },
    [getAuthHeaders]
  );

  useEffect(() => {
    // Auto-login for development
    const token = localStorage.getItem('auth_token');
    if (!token) {
      const demoToken =
        'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiJkZXYtdXNlciIsImVtYWlsIjoiZGV2QGhyc2tpbGxzLmxvY2FsIiwibmFtZSI6IkRldmVsb3BlciIsInJvbGVzIjpbeyJpZCI6ImFkbWluIiwibmFtZSI6IkFkbWluIn1dLCJpYXQiOjE3MzEwMTkyMDAsImV4cCI6OTk5OTk5OTk5OX0.dev-token';
      const demoUser = {
        userId: 'dev-user',
        email: 'dev@hrskills.local',
        name: 'Developer',
        roles: [{ id: 'admin', name: 'Admin', permissions: [] }],
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

  const fetchMetrics = useCallback(async () => {
    setMetricsStatus('loading');
    setNineBoxStatus('loading');
    setMetricsError(null);
    setNineBoxError(null);

    try {
      const data = await fetchWithRetry<any>(`/api/metrics?_=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
      });

      setMetrics({
        headcount: typeof data?.headcount === 'number' ? data.headcount : 0,
        attritionRate: typeof data?.attritionRate === 'number' ? data.attritionRate : 0,
        lastUpdated: typeof data?.lastUpdated === 'string' ? data.lastUpdated : null,
      });

      if (data?.error) {
        setMetricsStatus('empty');
        setMetricsError(data.message || data.error);
      } else {
        setMetricsStatus('live');
        setMetricsError(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch metrics:', error);
      setMetrics({
        headcount: 0,
        attritionRate: 0,
        lastUpdated: null,
      });
      setMetricsStatus('error');
      setMetricsError(error?.message || 'Failed to load metrics');
    }

    try {
      const analyticsResult = await fetchWithRetry<any>(
        `/api/analytics?metric=nine-box&_=${Date.now()}`,
        {
          method: 'GET',
          cache: 'no-store',
        }
      );

      const normalizeAnalyticsError = (rawError: unknown) => {
        if (!rawError) return 'Nine-box analytics unavailable';
        const message =
          typeof rawError === 'string'
            ? rawError
            : typeof rawError === 'object' && rawError !== null && 'message' in rawError
              ? String((rawError as any).message)
              : '';
        if (message.toLowerCase().includes('no employee data')) {
          return 'Missing data';
        }
        return message || 'Nine-box analytics unavailable';
      };

      if (!analyticsResult?.success) {
        setNineBoxSummary(null);
        setNineBoxStatus('empty');
        setNineBoxError(normalizeAnalyticsError(analyticsResult?.error));
        return;
      }

      const summary: NineBoxSummary | undefined = analyticsResult?.data?.summary;

      if (summary && typeof summary.highPerformers === 'number') {
        setNineBoxSummary(summary);
        setNineBoxStatus('live');
        setNineBoxError(null);
      } else {
        setNineBoxSummary(null);
        setNineBoxStatus('empty');
        setNineBoxError('Missing data');
      }
    } catch (error: any) {
      console.error('Failed to fetch nine-box analytics:', error);
      setNineBoxSummary(null);
      setNineBoxStatus('error');
      setNineBoxError(
        error?.message?.toLowerCase()?.includes('no employee data')
          ? 'Missing data'
          : error?.message || 'Failed to load nine-box analytics'
      );
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const metricsLoading = metricsStatus === 'loading' || metricsStatus === 'idle';
  const metricsHasData = metricsStatus === 'live';
  const metricsUnavailable = metricsStatus === 'empty';
  const metricsFailed = metricsStatus === 'error';
  const nineBoxLoading = nineBoxStatus === 'loading' || nineBoxStatus === 'idle';
  const nineBoxHasData = nineBoxStatus === 'live';
  const nineBoxUnavailable = nineBoxStatus === 'empty';
  const nineBoxFailed = nineBoxStatus === 'error';

  const headcountDisplay = metricsLoading || metricsFailed ? '—' : metrics.headcount;
  const attritionDisplay = metricsLoading || metricsFailed ? '—' : `${metrics.attritionRate}%`;
  const nineBoxDisplay =
    nineBoxLoading || nineBoxFailed ? '—' : (nineBoxSummary?.highPerformers ?? 0);

  const metricsStatusLabel = metricsLoading
    ? 'Loading...'
    : metricsHasData
      ? 'Live data'
      : metricsUnavailable
        ? 'No data'
        : metricsFailed
          ? 'Error'
          : '—';
  const nineBoxStatusLabel = nineBoxLoading
    ? 'Loading...'
    : nineBoxHasData
      ? 'Analyzed'
      : nineBoxUnavailable
        ? (nineBoxError ?? 'No data')
        : nineBoxFailed
          ? (nineBoxError ?? 'Error')
          : '—';

  const headcountProgress = metricsHasData
    ? Math.min(Math.round((metrics.headcount / 200) * 100), 100)
    : 0;
  const attritionProgress = metricsHasData
    ? Math.max(0, 100 - Math.min(Math.round(metrics.attritionRate), 100))
    : 0;
  const nineBoxProgress =
    nineBoxHasData && nineBoxSummary?.totalAnalyzed
      ? Math.min(
          Math.round(
            (nineBoxSummary.highPerformers / Math.max(nineBoxSummary.totalAnalyzed, 1)) * 100
          ),
          100
        )
      : 0;
  const attritionIsPositive = metricsHasData ? metrics.attritionRate <= 10 : false;
  const nineBoxIsPositive =
    nineBoxHasData && nineBoxSummary?.totalAnalyzed
      ? nineBoxSummary.highPerformers / Math.max(nineBoxSummary.totalAnalyzed, 1) >= 0.3
      : false;

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
      second: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleMetricClick = (metric: MetricType, title: string, description: string) => {
    setSelectedMetric(metric);
    setDialogTitle(title);
    setDialogDescription(description);
    setMetricDialogOpen(true);
  };

  const handleNineBoxClick = () => {
    setMetricDialogOpen(false);
    setSelectedMetric(null);
    setContextPanelData({
      type: 'performance',
      title: '9Box High Performers',
      data: {
        metric: 'nine-box',
        summary: nineBoxSummary,
      },
      config: {
        highlights: ['High-High', 'High-Medium', 'Medium-High'],
      },
    });
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
                  onClick={() => (window.location.href = '/team-time')}
                  className="text-right hidden md:block hover:bg-white/5 px-4 py-2 rounded-lg transition-premium cursor-pointer"
                >
                  <p className="text-sm text-secondary" suppressHydrationWarning>
                    {formatDate(currentTime)}
                  </p>
                  <p className="text-2xl font-mono" suppressHydrationWarning>
                    {formatTime(currentTime)}
                  </p>
                </button>

                <button
                  onClick={() => (window.location.href = '/data-sources')}
                  aria-label="Upload Data & Documents"
                  title="Upload Data & Documents"
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 border border-border hover:border-violet/50 rounded-lg flex items-center justify-center transition-premium"
                >
                  <Database className="w-5 h-5" aria-hidden="true" />
                </button>

                <button
                  onClick={() => (window.location.href = '/settings')}
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
            <div className="flex items-center justify-between mb-4 gap-2">
              <h2 className="text-lg font-semibold text-foreground">Key Metrics</h2>
              <button
                onClick={fetchMetrics}
                disabled={metricsLoading}
                className="px-3 py-2 text-sm font-medium rounded-lg border border-border bg-white/5 hover:bg-white/10 transition-premium disabled:opacity-50 disabled:cursor-not-allowed"
                aria-live="polite"
              >
                {metricsLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <MetricCard
                title="Total Headcount"
                value={headcountDisplay}
                change={metricsStatusLabel}
                isPositive={metricsHasData}
                icon={Users}
                progress={headcountProgress}
                delay={0}
                onClick={() =>
                  handleMetricClick(
                    'headcount',
                    'Recent New Hires',
                    'Last 5 employees who joined the company'
                  )
                }
              />
              <MetricCard
                title="Attrition Rate"
                value={attritionDisplay}
                change={metricsStatusLabel}
                isPositive={attritionIsPositive}
                icon={TrendingDown}
                progress={attritionProgress}
                delay={0.1}
                onClick={() =>
                  handleMetricClick(
                    'attrition',
                    'Recent Terminations',
                    'Last 5 employees who left the company this year'
                  )
                }
              />
              <MetricCard
                title="9Box High Performers"
                value={nineBoxDisplay}
                change={nineBoxStatusLabel}
                isPositive={nineBoxIsPositive}
                icon={Grid3x3}
                progress={nineBoxProgress}
                delay={0.2}
                onClick={handleNineBoxClick}
              />
            </div>
            {metricsError && <p className="text-sm text-warning font-medium">{metricsError}</p>}
            {nineBoxError && !nineBoxHasData && (
              <p className="text-sm text-warning font-medium">{nineBoxError}</p>
            )}
          </section>

          {/* Main Layout - Chat First with Dynamic Context Panel */}
          <div
            className={`grid grid-cols-1 gap-6 lg:gap-4 ${
              contextPanelData?.type ? 'lg:grid-cols-12' : 'lg:grid-cols-12'
            }`}
          >
            {/* Chat Interface */}
            <section
              aria-label="HR Assistant Chat"
              className={`order-1 w-full ${
                contextPanelData?.type
                  ? 'lg:order-1 lg:col-span-8'
                  : 'lg:order-1 lg:col-span-12'
              }`}
            >
              <div className="h-full max-h-[calc(100vh-360px)] min-h-[500px]">
                <ErrorBoundary
                  level="section"
                  onError={(error, errorInfo) => {
                    logComponentError(error, errorInfo, 'ChatInterface');
                  }}
                >
                  <ChatInterface onContextPanelChange={setContextPanelData} />
                </ErrorBoundary>
              </div>
            </section>

            {/* Context / Document Panel */}
            {contextPanelData?.type && (
              <aside className="order-2 lg:order-2 w-full lg:col-span-4 lg:col-start-9">
                <div className="h-full max-h-[calc(100vh-360px)] min-h-[500px]">
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
                        generatedContent={contextPanelData.data?.generatedContent}
                        driveTemplate={contextPanelData.data?.driveTemplate}
                        driveTemplateError={contextPanelData.data?.driveTemplateError}
                        driveTemplateNeedsAuth={contextPanelData.data?.driveTemplateNeedsAuth}
                        onExport={handleDocumentExport}
                      />
                    )}
                    {contextPanelData.type === 'analytics' && (
                      <AnalyticsChartPanel
                        metric={contextPanelData.data?.metric || 'headcount'}
                        chartType={contextPanelData.config?.chartType}
                        department={contextPanelData.config?.filters?.department}
                        dateRange={contextPanelData.config?.filters?.dateRange}
                        chartConfig={contextPanelData.data?.chartConfig}
                        analysisSummary={contextPanelData.data?.analysisSummary}
                        metadata={contextPanelData.data?.metadata}
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
                </div>
              </aside>
            )}
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
