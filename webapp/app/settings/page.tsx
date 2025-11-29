'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bell,
  Building,
  CheckCircle2,
  Database,
  Loader2,
  Plug,
  Save,
  Shield,
  TrendingUp,
  User,
  XCircle,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AIMetricsDashboard } from '@/components/custom/AIMetricsDashboard';
import { QuotaBanner } from '@/components/custom/QuotaBanner';
import { getDaysSinceFirstRun } from '@/lib/first-run-client';
import { queryKeys } from '@/lib/query-keys';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SettingSection {
  id: string;
  title: string;
  icon: LucideIcon;
  settings: Setting[];
}

interface Setting {
  id: string;
  label: string;
  type: 'input' | 'select' | 'toggle';
  value: string | boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
}

interface AIHealth {
  provider: string;
  healthy: boolean;
  latency: number;
  lastChecked: string;
  errorRate: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [daysSinceFirstRun, setDaysSinceFirstRun] = useState(0);
  const [hasPersonalApiKey, setHasPersonalApiKey] = useState(false);
  const [hasUploadedData, setHasUploadedData] = useState(false);

  // Fetch AI configuration from API
  const { data: aiConfigData } = useQuery({
    queryKey: queryKeys.ai.config,
    queryFn: () => fetcher('/api/ai/config'),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch quota status for quota banner
  const { data: quotaData } = useQuery({
    queryKey: queryKeys.ai.quota,
    queryFn: () => fetcher('/api/ai/quota'),
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch first-run status
  const { data: firstRunData } = useQuery({
    queryKey: queryKeys.setup.init,
    queryFn: () => fetcher('/api/setup/init'),
  });

  // Initialize progressive disclosure state
  useEffect(() => {
    setDaysSinceFirstRun(getDaysSinceFirstRun());

    // Check if user has uploaded data (more than demo data count)
    if (firstRunData && firstRunData.employeeCount > 200) {
      setHasUploadedData(true);
    }

    // Check if user has personal API key (from quota data)
    if (quotaData?.hasPersonalKey) {
      setHasPersonalApiKey(true);
    }
  }, [firstRunData, quotaData]);

  const [sections, setSections] = useState<SettingSection[]>([
    {
      id: 'account',
      title: 'Account Settings',
      icon: User,
      settings: [
        {
          id: 'email',
          label: 'Email Address',
          type: 'input',
          value: 'admin@company.com',
          placeholder: 'your.email@company.com',
          description: 'Your primary email for notifications and account recovery',
        },
        {
          id: 'name',
          label: 'Full Name',
          type: 'input',
          value: 'Admin User',
          placeholder: 'John Doe',
        },
      ],
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      settings: [
        {
          id: 'emailNotifications',
          label: 'Email Notifications',
          type: 'toggle',
          value: true,
          description: 'Receive email alerts for important events',
        },
        {
          id: 'weeklyReports',
          label: 'Weekly Summary Reports',
          type: 'toggle',
          value: true,
        },
        {
          id: 'securityAlerts',
          label: 'Security Alerts',
          type: 'toggle',
          value: true,
        },
      ],
    },
    {
      id: 'organization',
      title: 'Organization',
      icon: Building,
      settings: [
        {
          id: 'orgName',
          label: 'Organization Name',
          type: 'input',
          value: 'My Company',
          placeholder: 'Your Company Name',
        },
        {
          id: 'industry',
          label: 'Industry',
          type: 'select',
          value: 'technology',
          options: ['technology', 'finance', 'healthcare', 'retail', 'manufacturing', 'other'],
        },
        {
          id: 'companySize',
          label: 'Company Size',
          type: 'select',
          value: '100-500',
          options: ['1-10', '11-50', '51-100', '100-500', '500-1000', '1000+'],
        },
      ],
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      settings: [
        {
          id: 'twoFactor',
          label: 'Two-Factor Authentication',
          type: 'toggle',
          value: false,
          description: 'Add an extra layer of security to your account',
        },
        {
          id: 'sessionTimeout',
          label: 'Session Timeout',
          type: 'select',
          value: '8-hours',
          options: ['1-hour', '4-hours', '8-hours', '24-hours', 'never'],
        },
        {
          id: 'auditLog',
          label: 'Enable Audit Logging',
          type: 'toggle',
          value: true,
        },
      ],
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: Plug,
      settings: [
        {
          id: 'rippling',
          label: 'Rippling',
          type: 'toggle',
          value: false,
          description: 'Connect to Rippling for employee data, payroll, and benefits management',
        },
        {
          id: 'slack',
          label: 'Slack',
          type: 'toggle',
          value: true,
          description: 'Send notifications and updates to Slack channels',
        },
        {
          id: 'notion',
          label: 'Notion',
          type: 'toggle',
          value: false,
          description: 'Sync HR documentation and onboarding workflows with Notion',
        },
        {
          id: 'gsuite',
          label: 'Google Workspace',
          type: 'toggle',
          value: true,
          description: 'Access Gmail, Calendar, Drive, and Google Meet integration',
        },
      ],
    },
  ]);

  const updateSetting = (sectionId: string, settingId: string, newValue: string | boolean) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          return {
            ...section,
            settings: section.settings.map((setting) =>
              setting.id === settingId ? { ...setting, value: newValue } : setting
            ),
          };
        }
        return section;
      })
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // TODO: Save other settings to backend
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (_error) {
      setSaveMessage('Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestProviders = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/ai/config/test', {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        alert(
          'Provider test complete!\n\n' +
            data.results
              .map((r: { provider: string; message: string }) => `${r.provider}: ${r.message}`)
              .join('\n')
        );
      }
    } catch (_error) {
      alert('Error testing providers');
    } finally {
      setIsTesting(false);
    }
  };

  const handleUpdateAIProvider = async (field: string, value: string | boolean | null) => {
    try {
      const response = await fetch('/api/ai/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        // Invalidate and refetch the AI config query
        queryClient.invalidateQueries({ queryKey: queryKeys.ai.config });
      }
    } catch (error) {
      console.error('Error updating AI config:', error);
    }
  };

  const getHealthIcon = (health: AIHealth | undefined) => {
    if (!health) return <AlertCircle className="w-4 h-4 text-charcoal-soft" />;
    if (health.healthy) return <CheckCircle2 className="w-4 h-4 text-sage" />;
    return <XCircle className="w-4 h-4 text-error" />;
  };

  const getHealthColor = (health: AIHealth | undefined) => {
    if (!health) return 'border-warm';
    if (health.healthy) return 'border-sage/50';
    return 'border-error/50';
  };

  return (
    <div className="min-h-screen bg-radial-cream text-charcoal">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-cream-white/90 border-b-2 border-warm sticky top-0 z-30 shadow-soft"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-10 h-10 bg-cream hover:bg-terracotta/10 border-2 border-warm hover:border-terracotta/40 rounded-xl flex items-center justify-center transition-all hover-lift shadow-soft"
              >
                <ArrowLeft className="w-5 h-5 text-terracotta" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-charcoal">Settings</h1>
                <p className="text-sm text-charcoal-light">
                  Manage your HR Command Center preferences
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {saveMessage && <span className="text-sm text-sage font-medium">{saveMessage}</span>}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-terracotta to-amber hover:shadow-warm disabled:opacity-50 rounded-xl transition-all text-cream-white font-medium hover-lift"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="space-y-6">
          {/* Quota Banner - Show if using shared key and approaching limit */}
          {quotaData && !quotaData.hasPersonalKey && <QuotaBanner quotaStatus={quotaData} />}

          {/* Data Status Section - Always visible */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-cream-white border-2 border-sage/30 rounded-3xl p-6 shadow-soft hover:border-sage/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-sage to-sage-light rounded-2xl flex items-center justify-center shadow-warm">
                <Database className="w-6 h-6 text-cream-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-charcoal">Your Data</h2>
                <p className="text-xs text-charcoal-light">Employee data and analytics status</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Data Status */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-sage/5 border border-warm rounded-2xl shadow-soft">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-4 h-4 text-sage" />
                    <span className="text-xs text-charcoal-light font-medium">Employees</span>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">
                    {firstRunData?.employeeCount || 0}
                  </p>
                  <p className="text-xs text-charcoal-soft mt-1">
                    {hasUploadedData ? 'Your data' : 'Demo data'}
                  </p>
                </div>

                <div className="p-4 bg-amber/5 border border-warm rounded-2xl shadow-soft">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-amber" />
                    <span className="text-xs text-charcoal-light font-medium">Analytics</span>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">
                    {firstRunData?.progress?.percentage || 0}%
                  </p>
                  <p className="text-xs text-charcoal-soft mt-1">Setup complete</p>
                </div>

                <div className="p-4 bg-terracotta/5 border border-warm rounded-2xl shadow-soft">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-terracotta" />
                    <span className="text-xs text-charcoal-light font-medium">Status</span>
                  </div>
                  <p className="text-2xl font-bold text-charcoal">Active</p>
                  <p className="text-xs text-charcoal-soft mt-1">
                    {daysSinceFirstRun > 0 ? `${daysSinceFirstRun} days ago` : 'Just started'}
                  </p>
                </div>
              </div>

              {/* Upload Data CTA - Only show if using demo data */}
              {!hasUploadedData && (
                <div className="p-4 bg-gradient-to-br from-sage/10 to-amber/10 border-2 border-sage/30 rounded-2xl shadow-soft">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-bold text-charcoal mb-1">Data Input Hub</h3>
                      <p className="text-xs text-charcoal-light">
                        Currently using demo data (200 employees). Upload your CSV and manage your
                        document library to unlock personalized analytics and insights.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push('/data-sources')}
                      className="flex items-center gap-2 px-4 py-2 bg-sage hover:bg-sage-light text-cream-white rounded-xl text-sm transition-all whitespace-nowrap font-medium hover-lift shadow-soft hover:shadow-warm"
                    >
                      <Database className="w-4 h-4" />
                      Go to Data Input Hub →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* AI Provider Configuration Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-cream-white border-2 border-amber/30 rounded-3xl p-6 shadow-soft hover:border-amber/50 transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber to-terracotta rounded-2xl flex items-center justify-center shadow-warm">
                  <Zap className="w-6 h-6 text-cream-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-charcoal">AI Configuration</h2>
                  <p className="text-xs text-charcoal-light">
                    {hasPersonalApiKey
                      ? 'Using your personal API key - unlimited usage'
                      : 'Using shared key - add yours for unlimited usage'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestProviders}
                disabled={isTesting}
                className="flex items-center gap-2 px-3 py-2 bg-amber hover:bg-amber-dark disabled:opacity-50 rounded-xl text-sm transition-all text-cream-white font-medium hover-lift shadow-soft hover:shadow-warm"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Activity className="w-3.5 h-3.5" />
                    Test Connectivity
                  </>
                )}
              </button>
            </div>

            {aiConfigData ? (
              <div className="space-y-6">
                {/* Provider Selection */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold mb-2 text-charcoal">
                      Primary AI Provider
                    </label>
                    <select
                      value={aiConfigData.config.primary}
                      onChange={(e) => handleUpdateAIProvider('primary', e.target.value)}
                      className="w-full px-3 py-2 bg-cream border-2 border-warm rounded-xl text-sm focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 transition-all text-charcoal font-medium"
                    >
                      <option value="anthropic" className="bg-cream-white">
                        Claude (Anthropic)
                      </option>
                      <option value="openai" className="bg-cream-white">
                        GPT (OpenAI)
                      </option>
                    </select>
                    <p className="text-xs text-charcoal-light mt-1">
                      Default provider for all AI requests
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-charcoal">
                      Fallback Provider
                    </label>
                    <select
                      value={aiConfigData.config.fallback || ''}
                      onChange={(e) => handleUpdateAIProvider('fallback', e.target.value || null)}
                      className="w-full px-3 py-2 bg-cream border-2 border-warm rounded-xl text-sm focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 transition-all text-charcoal font-medium"
                    >
                      <option value="" className="bg-cream-white">
                        None
                      </option>
                      <option value="anthropic" className="bg-cream-white">
                        Claude (Anthropic)
                      </option>
                      <option value="openai" className="bg-cream-white">
                        GPT (OpenAI)
                      </option>
                    </select>
                    <p className="text-xs text-charcoal-light mt-1">
                      Used if primary provider fails
                    </p>
                  </div>
                </div>

                {/* Auto Failover Toggle */}
                <div className="flex items-center justify-between p-4 bg-amber/5 border border-warm rounded-2xl">
                  <div>
                    <p className="text-sm font-bold text-charcoal">Automatic Failover</p>
                    <p className="text-xs text-charcoal-light">
                      Automatically switch to fallback provider on errors
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateAIProvider(
                        'enableAutoFallback',
                        !aiConfigData.config.enableAutoFallback
                      )
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      aiConfigData.config.enableAutoFallback ? 'bg-amber' : 'bg-charcoal-soft'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-cream-white rounded-full transition-transform shadow-soft ${
                        aiConfigData.config.enableAutoFallback ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Provider Health Status */}
                <div>
                  <h3 className="text-sm font-bold mb-3 text-charcoal">Provider Health Status</h3>
                  <div className="grid md:grid-cols-2 gap-3">
                    {['anthropic', 'openai'].map((provider) => {
                      const health = aiConfigData.health?.[provider];
                      return (
                        <div
                          key={provider}
                          className={`p-3 bg-cream border-2 ${getHealthColor(health)} rounded-2xl shadow-soft`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold capitalize text-charcoal">
                              {provider}
                            </span>
                            {getHealthIcon(health)}
                          </div>
                          {health && (
                            <>
                              <p className="text-xs text-charcoal-light">
                                Latency: {health.latency}ms
                              </p>
                              <p className="text-xs text-charcoal-light">
                                Status: {health.healthy ? 'Operational' : 'Unavailable'}
                              </p>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Optional API Keys */}
                <div className="border-t-2 border-warm pt-6">
                  <h3 className="text-sm font-bold mb-3 text-charcoal">
                    Custom API Keys (Optional)
                  </h3>
                  <p className="text-xs text-charcoal-light mb-4">
                    Add your own API keys to bypass shared limits. Your keys are encrypted and
                    stored securely.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-charcoal">
                        Anthropic API Key
                      </label>
                      <input
                        type="password"
                        placeholder="sk-ant-..."
                        className="w-full px-3 py-2 bg-cream border-2 border-warm rounded-xl text-sm focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 text-charcoal placeholder-charcoal-soft"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-charcoal">
                        OpenAI API Key
                      </label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        className="w-full px-3 py-2 bg-cream border-2 border-warm rounded-xl text-sm focus:outline-none focus:border-amber focus:ring-2 focus:ring-amber/20 text-charcoal placeholder-charcoal-soft"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-terracotta" />
              </div>
            )}
          </motion.div>

          {/* AI Cost Monitoring Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-cream-white border-2 border-terracotta/30 rounded-3xl p-6 shadow-soft hover:border-terracotta/50 transition-all"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-terracotta to-terracotta-dark rounded-2xl flex items-center justify-center shadow-warm">
                <Activity className="w-6 h-6 text-cream-white" />
              </div>
              <h2 className="text-lg font-bold text-charcoal">AI Cost Monitoring</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start justify-between gap-4 border-b-2 border-warm pb-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1 text-charcoal">
                    Prompt Caching
                  </label>
                  <p className="text-xs text-charcoal-light">
                    Cache static prompts to reduce token costs by 90%
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('ai-monitoring', 'promptCaching', true)}
                  className="relative w-12 h-6 rounded-full bg-terracotta"
                >
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-cream-white rounded-full translate-x-6 shadow-soft" />
                </button>
              </div>

              <div className="flex items-start justify-between gap-4 border-b-2 border-warm pb-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1 text-charcoal">
                    Smart Data Filtering
                  </label>
                  <p className="text-xs text-charcoal-light">
                    Use semantic analysis to include only relevant employee fields
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('ai-monitoring', 'semanticFiltering', true)}
                  className="relative w-12 h-6 rounded-full bg-terracotta"
                >
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-cream-white rounded-full translate-x-6 shadow-soft" />
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold mb-1 text-charcoal">
                    Dynamic Token Limits
                  </label>
                  <p className="text-xs text-charcoal-light">
                    Automatically adjust max_tokens based on query type
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting('ai-monitoring', 'dynamicTokens', true)}
                  className="relative w-12 h-6 rounded-full bg-terracotta"
                >
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-cream-white rounded-full translate-x-6 shadow-soft" />
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-warm">
              <AIMetricsDashboard />
            </div>
          </motion.div>

          {/* Other Sections with Progressive Disclosure */}
          {sections
            .filter((section) => {
              // Hide integrations section until user has been active 7+ days
              if (section.id === 'integrations' && daysSinceFirstRun < 7) {
                return false;
              }
              return true;
            })
            .map((section, sectionIndex) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (sectionIndex + 3) * 0.1 }}
                className="backdrop-blur-xl bg-cream-white border-2 border-sage/20 rounded-3xl p-6 shadow-soft hover:border-sage/40 transition-all"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-sage to-sage-light rounded-2xl flex items-center justify-center shadow-warm">
                    <section.icon className="w-6 h-6 text-cream-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-charcoal">{section.title}</h2>
                    {section.id === 'integrations' && (
                      <p className="text-xs text-charcoal-light">
                        Connect external services to enhance your workflow
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {section.settings.map((setting) => (
                    <div
                      key={setting.id}
                      className="border-b-2 border-warm last:border-0 pb-4 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-bold mb-1 text-charcoal">
                            {setting.label}
                          </label>
                          {setting.description && (
                            <p className="text-xs text-charcoal-light mb-2">
                              {setting.description}
                            </p>
                          )}
                        </div>

                        <div className="w-64">
                          {setting.type === 'input' && (
                            <input
                              type="text"
                              value={setting.value as string}
                              onChange={(e) =>
                                updateSetting(section.id, setting.id, e.target.value)
                              }
                              placeholder={setting.placeholder}
                              className="w-full px-3 py-2 bg-cream border-2 border-warm rounded-xl text-sm focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all text-charcoal placeholder-charcoal-soft font-medium"
                            />
                          )}

                          {setting.type === 'select' && (
                            <select
                              value={setting.value as string}
                              onChange={(e) =>
                                updateSetting(section.id, setting.id, e.target.value)
                              }
                              className="w-full px-3 py-2 bg-cream border-2 border-warm rounded-xl text-sm focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all text-charcoal font-medium"
                            >
                              {setting.options?.map((option) => (
                                <option key={option} value={option} className="bg-cream-white">
                                  {option.charAt(0).toUpperCase() +
                                    option.slice(1).replace('-', ' ')}
                                </option>
                              ))}
                            </select>
                          )}

                          {setting.type === 'toggle' && (
                            <button
                              type="button"
                              onClick={() => updateSetting(section.id, setting.id, !setting.value)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                setting.value ? 'bg-sage' : 'bg-charcoal-soft'
                              }`}
                            >
                              <div
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-cream-white rounded-full transition-transform shadow-soft ${
                                  setting.value ? 'translate-x-6' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
        </div>
      </main>
    </div>
  );
}
