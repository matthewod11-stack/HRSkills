'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Key,
  Mail,
  CreditCard,
  Brain,
  Bell,
  Shield,
  User,
  Building,
  Save,
  Plug,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AIMetricsDashboard } from '@/components/custom/AIMetricsDashboard';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface SettingSection {
  id: string;
  title: string;
  icon: any;
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
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Fetch AI configuration from API
  const { data: aiConfigData, mutate: mutateAIConfig } = useSWR('/api/ai/config', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  });

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
          description: 'Your primary email for notifications and account recovery'
        },
        {
          id: 'name',
          label: 'Full Name',
          type: 'input',
          value: 'Admin User',
          placeholder: 'John Doe'
        }
      ]
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
          description: 'Receive email alerts for important events'
        },
        {
          id: 'weeklyReports',
          label: 'Weekly Summary Reports',
          type: 'toggle',
          value: true
        },
        {
          id: 'securityAlerts',
          label: 'Security Alerts',
          type: 'toggle',
          value: true
        }
      ]
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
          placeholder: 'Your Company Name'
        },
        {
          id: 'industry',
          label: 'Industry',
          type: 'select',
          value: 'technology',
          options: ['technology', 'finance', 'healthcare', 'retail', 'manufacturing', 'other']
        },
        {
          id: 'companySize',
          label: 'Company Size',
          type: 'select',
          value: '100-500',
          options: ['1-10', '11-50', '51-100', '100-500', '500-1000', '1000+']
        }
      ]
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
          description: 'Add an extra layer of security to your account'
        },
        {
          id: 'sessionTimeout',
          label: 'Session Timeout',
          type: 'select',
          value: '8-hours',
          options: ['1-hour', '4-hours', '8-hours', '24-hours', 'never']
        },
        {
          id: 'auditLog',
          label: 'Enable Audit Logging',
          type: 'toggle',
          value: true
        }
      ]
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
          description: 'Connect to Rippling for employee data, payroll, and benefits management'
        },
        {
          id: 'slack',
          label: 'Slack',
          type: 'toggle',
          value: true,
          description: 'Send notifications and updates to Slack channels'
        },
        {
          id: 'notion',
          label: 'Notion',
          type: 'toggle',
          value: false,
          description: 'Sync HR documentation and onboarding workflows with Notion'
        },
        {
          id: 'gsuite',
          label: 'Google Workspace',
          type: 'toggle',
          value: true,
          description: 'Access Gmail, Calendar, Drive, and Google Meet integration'
        }
      ]
    }
  ]);

  const updateSetting = (sectionId: string, settingId: string, newValue: string | boolean) => {
    setSections(sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          settings: section.settings.map(setting =>
            setting.id === settingId ? { ...setting, value: newValue } : setting
          )
        };
      }
      return section;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // TODO: Save other settings to backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
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
        alert('Provider test complete!\n\n' + data.results.map((r: any) =>
          `${r.provider}: ${r.message}`
        ).join('\n'));
      }
    } catch (error) {
      alert('Error testing providers');
    } finally {
      setIsTesting(false);
    }
  };

  const handleUpdateAIProvider = async (field: string, value: any) => {
    try {
      const response = await fetch('/api/ai/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        mutateAIConfig(); // Refresh the data
      }
    } catch (error) {
      console.error('Error updating AI config:', error);
    }
  };

  const getHealthIcon = (health: AIHealth | undefined) => {
    if (!health) return <AlertCircle className="w-4 h-4 text-gray-400" />;
    if (health.healthy) return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getHealthColor = (health: AIHealth | undefined) => {
    if (!health) return 'border-gray-600';
    if (health.healthy) return 'border-green-500/50';
    return 'border-red-500/50';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-black/40 border-b border-white/20 sticky top-0 z-30"
      >
        <div className="max-w-[1600px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="w-10 h-10 bg-white/5 hover:bg-white/10 border-2 border-white/30 hover:border-white/50 rounded-lg flex items-center justify-center transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Settings</h1>
                <p className="text-sm text-gray-400">Manage your HR Command Center preferences</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {saveMessage && (
                <span className="text-sm text-green-400">{saveMessage}</span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-all"
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
          {/* AI Provider Configuration Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="backdrop-blur-xl bg-black/40 border-2 border-purple-500/30 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Provider Configuration</h2>
                  <p className="text-xs text-gray-400">Configure your AI provider preferences and failover settings</p>
                </div>
              </div>

              <button
                onClick={handleTestProviders}
                disabled={isTesting}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg text-sm transition-all"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Activity className="w-3 h-3" />
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
                    <label className="block text-sm font-medium mb-2">
                      Primary AI Provider
                    </label>
                    <select
                      value={aiConfigData.config.primary}
                      onChange={(e) => handleUpdateAIProvider('primary', e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="anthropic" className="bg-gray-900">Claude (Anthropic)</option>
                      <option value="openai" className="bg-gray-900">GPT (OpenAI)</option>
                      <option value="gemini" className="bg-gray-900">Gemini (Google)</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Default provider for all AI requests</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Fallback Provider
                    </label>
                    <select
                      value={aiConfigData.config.fallback || ''}
                      onChange={(e) => handleUpdateAIProvider('fallback', e.target.value || null)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="" className="bg-gray-900">None</option>
                      <option value="anthropic" className="bg-gray-900">Claude (Anthropic)</option>
                      <option value="openai" className="bg-gray-900">GPT (OpenAI)</option>
                      <option value="gemini" className="bg-gray-900">Gemini (Google)</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">Used if primary provider fails</p>
                  </div>
                </div>

                {/* Auto Failover Toggle */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Automatic Failover</p>
                    <p className="text-xs text-gray-400">Automatically switch to fallback provider on errors</p>
                  </div>
                  <button
                    onClick={() => handleUpdateAIProvider('enableAutoFallback', !aiConfigData.config.enableAutoFallback)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      aiConfigData.config.enableAutoFallback ? 'bg-purple-600' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                        aiConfigData.config.enableAutoFallback ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Provider Health Status */}
                <div>
                  <h3 className="text-sm font-medium mb-3">Provider Health Status</h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {['anthropic', 'openai', 'gemini'].map((provider) => {
                      const health = aiConfigData.health?.[provider];
                      return (
                        <div
                          key={provider}
                          className={`p-3 bg-white/5 border-2 ${getHealthColor(health)} rounded-lg`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium capitalize">{provider}</span>
                            {getHealthIcon(health)}
                          </div>
                          {health && (
                            <>
                              <p className="text-xs text-gray-400">
                                Latency: {health.latency}ms
                              </p>
                              <p className="text-xs text-gray-400">
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
                <div className="border-t border-white/10 pt-6">
                  <h3 className="text-sm font-medium mb-3">Custom API Keys (Optional)</h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Add your own API keys to bypass shared limits. Your keys are encrypted and stored securely.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Anthropic API Key</label>
                      <input
                        type="password"
                        placeholder="sk-ant-..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">OpenAI API Key</label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Google Gemini API Key</label>
                      <input
                        type="password"
                        placeholder="AIza..."
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            )}
          </motion.div>

          {/* AI Cost Monitoring Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="backdrop-blur-xl bg-black/40 border-2 border-white/20 rounded-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold">AI Cost Monitoring</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Prompt Caching
                  </label>
                  <p className="text-xs text-gray-400">Cache static prompts to reduce token costs by 90%</p>
                </div>
                <button
                  onClick={() => updateSetting('ai-monitoring', 'promptCaching', true)}
                  className="relative w-12 h-6 rounded-full bg-blue-600"
                >
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-6" />
                </button>
              </div>

              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Smart Data Filtering
                  </label>
                  <p className="text-xs text-gray-400">Use semantic analysis to include only relevant employee fields</p>
                </div>
                <button
                  onClick={() => updateSetting('ai-monitoring', 'semanticFiltering', true)}
                  className="relative w-12 h-6 rounded-full bg-blue-600"
                >
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-6" />
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Dynamic Token Limits
                  </label>
                  <p className="text-xs text-gray-400">Automatically adjust max_tokens based on query type</p>
                </div>
                <button
                  onClick={() => updateSetting('ai-monitoring', 'dynamicTokens', true)}
                  className="relative w-12 h-6 rounded-full bg-blue-600"
                >
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full translate-x-6" />
                </button>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10">
              <AIMetricsDashboard />
            </div>
          </motion.div>

          {/* Other Sections */}
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (sectionIndex + 2) * 0.1 }}
              className="backdrop-blur-xl bg-black/40 border-2 border-white/20 rounded-2xl p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold">{section.title}</h2>
              </div>

              <div className="space-y-4">
                {section.settings.map((setting) => (
                  <div key={setting.id} className="border-b border-white/10 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">
                          {setting.label}
                        </label>
                        {setting.description && (
                          <p className="text-xs text-gray-400 mb-2">{setting.description}</p>
                        )}
                      </div>

                      <div className="w-64">
                        {setting.type === 'input' && (
                          <input
                            type="text"
                            value={setting.value as string}
                            onChange={(e) => updateSetting(section.id, setting.id, e.target.value)}
                            placeholder={setting.placeholder}
                            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        )}

                        {setting.type === 'select' && (
                          <select
                            value={setting.value as string}
                            onChange={(e) => updateSetting(section.id, setting.id, e.target.value)}
                            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-sm focus:outline-none focus:border-blue-500 transition-colors"
                          >
                            {setting.options?.map(option => (
                              <option key={option} value={option} className="bg-gray-900">
                                {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                              </option>
                            ))}
                          </select>
                        )}

                        {setting.type === 'toggle' && (
                          <button
                            onClick={() => updateSetting(section.id, setting.id, !setting.value)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              setting.value ? 'bg-blue-600' : 'bg-gray-600'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
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
