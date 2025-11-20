'use client';

import {
  useState,
  useEffect,
  Suspense,
  useCallback,
  useRef,
  useLayoutEffect,
  type CSSProperties,
} from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Users, Smile, Grid3x3, Settings, Database } from 'lucide-react';
import { FloatingOrbs } from '@/components/custom/FloatingOrbs';
import { MetricCard } from '@/components/custom/MetricCard';
import { ChatInterface } from '@/components/custom/ChatInterface';
import { ContextPanel, ContextPanelData } from '@/components/custom/ContextPanel';
import type { DocumentExportPayload } from '@/components/custom/DocumentEditorPanel';
import { AnalyticsChartPanel } from '@/components/custom/AnalyticsChartPanel';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { logComponentError } from '@/lib/errorLogging';
import { fetchWithRetry } from '@/lib/api-helpers/fetch-with-retry';
import {
  DialogSkeleton,
  DocumentEditorSkeleton,
  PerformanceGridSkeleton,
  ENPSSkeleton,
} from '@/components/ui/skeletons';
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

// Lazy load heavy context panel components
// Only loaded when user triggers specific panel type, reducing initial bundle
const DocumentEditorPanel = dynamic(
  () =>
    import('@/components/custom/DocumentEditorPanel').then((mod) => ({
      default: mod.DocumentEditorPanel,
    })),
  {
    loading: () => <DocumentEditorSkeleton />,
    ssr: false, // Document editor is client-side only (Google Drive integration)
  }
);

const PerformanceGridPanel = dynamic(
  () =>
    import('@/components/custom/PerformanceGridPanel').then((mod) => ({
      default: mod.PerformanceGridPanel,
    })),
  {
    loading: () => <PerformanceGridSkeleton />,
    ssr: false, // Performance grid is client-side only (complex state management)
  }
);

const ENPSPanel = dynamic(
  () => import('@/components/custom/ENPSPanel'),
  {
    loading: () => <ENPSSkeleton />,
    ssr: false, // eNPS panel is client-side only (tabs, complex UI)
  }
);

type MetricType = 'headcount' | 'attrition' | null;
type MetricsState = {
  headcount: number;
  enpsScore: number;
  lastUpdated: string | null;
};

type NineBoxSummary = {
  highPerformers: number;
  coreEmployees: number;
  developmentNeeded: number;
  totalAnalyzed: number;
  avgRatingInflation?: number;
};

type ExternalChatPrompt = {
  id: number;
  text: string;
};

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [commandOpen, setCommandOpen] = useState(false);
  const [metrics, setMetrics] = useState<MetricsState>({
    headcount: 0,
    enpsScore: 0,
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
  const [externalChatPrompt, setExternalChatPrompt] = useState<ExternalChatPrompt | null>(null);

  // Layout alignment tracking
  const metricsLayoutRef = useRef<HTMLDivElement | null>(null);
  const headcountCardRef = useRef<HTMLDivElement | null>(null);
  const enpsCardRef = useRef<HTMLDivElement | null>(null);
  const nineBoxCardRef = useRef<HTMLDivElement | null>(null);
  const [alignmentMetrics, setAlignmentMetrics] = useState({
    panelWidth: 0,
    chatOffset: 0,
    panelInset: 0,
    columnGap: 0,
    layoutWidth: 0,
    isDesktop: false,
  });

  // Context panel state for Phase 2 dashboard
  const [contextPanelData, setContextPanelData] = useState<ContextPanelData | null>(null);
  const { getAuthHeaders } = useAuth();

  useLayoutEffect(() => {
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') {
      return;
    }

    let frameId = 0;

    const measure = () => {
      const layoutEl = metricsLayoutRef.current;
      const headcountEl = headcountCardRef.current;
      const nineBoxEl = nineBoxCardRef.current;

      if (!layoutEl || !headcountEl || !nineBoxEl) {
        return;
      }

      const layoutRect = layoutEl.getBoundingClientRect();
      const headcountRect = headcountEl.getBoundingClientRect();
      const nineBoxRect = nineBoxEl.getBoundingClientRect();

      const computedStyles = getComputedStyle(layoutEl);
      const columnGap = parseFloat(computedStyles.columnGap || '0') || 0;
      const chatOffset = Math.max(0, headcountRect.left - layoutRect.left);
      const panelInset = Math.max(0, layoutRect.right - nineBoxRect.right);
      const panelWidth = nineBoxRect.width;
      const layoutWidth = layoutRect.width;
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

      setAlignmentMetrics((current) => {
        const next = {
          panelWidth,
          chatOffset,
          panelInset,
          columnGap,
          layoutWidth,
          isDesktop,
        };

        const isSame =
          Math.abs(current.panelWidth - next.panelWidth) < 0.5 &&
          Math.abs(current.chatOffset - next.chatOffset) < 0.5 &&
          Math.abs(current.panelInset - next.panelInset) < 0.5 &&
          Math.abs(current.columnGap - next.columnGap) < 0.5 &&
          Math.abs(current.layoutWidth - next.layoutWidth) < 0.5 &&
          current.isDesktop === next.isDesktop;

        return isSame ? current : next;
      });
    };

    const handleResize = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      frameId = window.requestAnimationFrame(measure);
    };

    handleResize();

    const resizeObserver = new ResizeObserver(handleResize);
    const observedElements = [
      metricsLayoutRef.current,
      headcountCardRef.current,
      enpsCardRef.current,
      nineBoxCardRef.current,
    ].filter((el): el is HTMLDivElement => Boolean(el));

    observedElements.forEach((el) => resizeObserver.observe(el));
    window.addEventListener('resize', handleResize);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
        enpsScore: typeof data?.enpsScore === 'number' ? data.enpsScore : 0,
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
        enpsScore: 0,
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
  const enpsDisplay = metricsLoading || metricsFailed ? '—' :
    metrics.enpsScore >= 0 ? `+${metrics.enpsScore}` : `${metrics.enpsScore}`;
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
  const enpsProgress = metricsHasData
    ? Math.min(Math.max(Math.round((metrics.enpsScore + 100) / 2), 0), 100) // Map -100 to +100 → 0 to 100
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
  const enpsIsPositive = metricsHasData ? metrics.enpsScore >= 30 : false; // 30+ is "Great"
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

  const triggerChatPrompt = (text: string) => {
    setExternalChatPrompt({ id: Date.now(), text });
  };

  const handleHeadcountClick = () => {
    setMetricDialogOpen(false);
    setSelectedMetric(null);
    setContextPanelData({
      type: 'analytics',
      title: 'Headcount Analytics',
      data: {
        metric: 'headcount',
      },
      config: {
        chartType: 'bar',
        filters: {
          dateRange: 'last_12_months',
        },
      },
    });
    triggerChatPrompt('Give me a snapshot of headcount trends over the last 12 months.');
  };

  const handleENPSClick = () => {
    setMetricDialogOpen(false);
    setSelectedMetric(null);
    setContextPanelData({
      type: 'enps',
      title: 'Employee Satisfaction (eNPS)',
      data: {},
      config: {},
    });
    triggerChatPrompt('Summarize our latest eNPS results and call out any risks I should know.');
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
    triggerChatPrompt('Highlight high performers in the latest nine-box grid and flag any talent risks.');
  };

  const handleDialogClose = () => {
    setMetricDialogOpen(false);
    setSelectedMetric(null);
  };

  const isPanelActive = Boolean(contextPanelData?.type);
  const isAlignmentReady =
    alignmentMetrics.isDesktop && alignmentMetrics.panelWidth > 0 && isPanelActive;

  const gridStyle: CSSProperties | undefined = isAlignmentReady
    ? {
        gridTemplateColumns: `minmax(0, 1fr) minmax(0, 1fr) minmax(0, ${alignmentMetrics.panelWidth}px)`,
      }
    : undefined;

  const contextPanelStyle: CSSProperties | undefined = isPanelActive
    ? {
        width: '100%',
        ...(alignmentMetrics.isDesktop && alignmentMetrics.panelWidth > 0
          ? { maxWidth: `${alignmentMetrics.panelWidth}px` }
          : {}),
        ...(alignmentMetrics.isDesktop && alignmentMetrics.panelInset > 0
          ? { marginRight: `${alignmentMetrics.panelInset}px` }
          : {}),
      }
    : undefined;

  const chatAlignmentStyle: CSSProperties | undefined =
    alignmentMetrics.isDesktop && alignmentMetrics.chatOffset > 0
      ? { paddingLeft: `${alignmentMetrics.chatOffset}px` }
      : undefined;

  return (
    <div className="min-h-screen bg-radial-cream text-charcoal overflow-hidden">
      <FloatingOrbs />

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-cream-white/90 border-b border-warm sticky top-0 z-30 shadow-soft transition-premium"
        >
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-terracotta to-amber rounded-2xl flex items-center justify-center shadow-warm">
                  <span className="text-xl font-bold text-cream-white">HR</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-charcoal">HR Command Center</h1>
                  <p className="text-sm text-charcoal-light">Powered by Claude AI</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button
                  onClick={() => (window.location.href = '/team-time')}
                  className="text-right hidden md:block hover:bg-terracotta/5 px-4 py-2 rounded-xl transition-premium cursor-pointer hover-lift"
                >
                  <p className="text-sm text-charcoal-light" suppressHydrationWarning>
                    {formatDate(currentTime)}
                  </p>
                  <p className="text-2xl font-mono text-terracotta" suppressHydrationWarning>
                    {formatTime(currentTime)}
                  </p>
                </button>

                <button
                  onClick={() => (window.location.href = '/data-sources')}
                  aria-label="Upload Data & Documents"
                  title="Upload Data & Documents"
                  className="w-10 h-10 bg-cream hover:bg-terracotta/10 border border-warm hover:border-terracotta/40 rounded-xl flex items-center justify-center transition-premium hover-lift"
                >
                  <Database className="w-5 h-5 text-terracotta" aria-hidden="true" />
                </button>

                <button
                  onClick={() => (window.location.href = '/settings')}
                  aria-label="Open settings"
                  className="w-10 h-10 bg-cream hover:bg-terracotta/10 border border-warm hover:border-terracotta/40 rounded-xl flex items-center justify-center transition-premium hover-lift"
                >
                  <Settings className="w-5 h-5 text-terracotta" aria-hidden="true" />
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
              <h2 className="text-lg font-semibold text-charcoal">Key Metrics</h2>
              <button
                onClick={fetchMetrics}
                disabled={metricsLoading}
                className="px-3 py-2 text-sm font-medium rounded-xl border border-warm bg-cream hover:bg-terracotta hover:text-cream-white transition-premium disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-warm"
                aria-live="polite"
              >
                {metricsLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div ref={headcountCardRef} className="h-full">
                <MetricCard
                  title="Total Headcount"
                  value={headcountDisplay}
                  change={metricsStatusLabel}
                  isPositive={metricsHasData}
                  icon={Users}
                  progress={headcountProgress}
                  delay={0}
                  onClick={handleHeadcountClick}
                />
              </div>
              <div ref={enpsCardRef} className="h-full">
                <MetricCard
                  title="Employee Satisfaction (eNPS)"
                  value={enpsDisplay}
                  change={metricsStatusLabel}
                  isPositive={enpsIsPositive}
                  icon={Smile}
                  progress={enpsProgress}
                  delay={0.1}
                  onClick={handleENPSClick}
                />
              </div>
              <div ref={nineBoxCardRef} className="h-full">
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
            </div>
            {metricsError && <p className="text-sm text-warning font-medium">{metricsError}</p>}
            {nineBoxError && !nineBoxHasData && (
              <p className="text-sm text-warning font-medium">{nineBoxError}</p>
            )}
          </section>

          {/* Main Layout - Chat First with Dynamic Context Panel */}
          <div
            ref={metricsLayoutRef}
            className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-4"
            style={gridStyle}
          >
            {/* Chat Interface */}
            <section
              aria-label="HR Assistant Chat"
              className={`order-1 min-w-0 w-full ${
                contextPanelData?.type ? 'lg:col-span-2' : 'lg:col-span-3'
              }`}
              style={chatAlignmentStyle}
            >
              <div className="h-full max-h-[calc(100vh-280px)] min-h-[650px]">
                <ErrorBoundary
                  level="section"
                  onError={(error, errorInfo) => {
                    logComponentError(error, errorInfo, 'ChatInterface');
                  }}
                >
                  <ChatInterface
                    onContextPanelChange={setContextPanelData}
                    externalPrompt={externalChatPrompt}
                    onExternalPromptConsumed={(promptId) => {
                      setExternalChatPrompt((current) =>
                        current && current.id === promptId ? null : current
                      );
                    }}
                  />
                </ErrorBoundary>
              </div>
            </section>

            {/* Context / Document Panel */}
            {contextPanelData?.type && (
              <aside
                className="order-2 lg:order-2 min-w-0 w-full lg:col-span-1"
                style={contextPanelStyle}
              >
                <div className="h-full max-h-[calc(100vh-360px)] min-h-[500px]">
                  <ContextPanel
                    panelData={contextPanelData}
                    onClose={() => setContextPanelData(null)}
                    alignmentStyle={contextPanelStyle}
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
                    {contextPanelData.type === 'enps' && (
                      <ENPSPanel data={contextPanelData.data} />
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
