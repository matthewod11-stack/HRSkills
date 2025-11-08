'use client'

import { useState } from 'react';
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
  Activity
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AIMetricsDashboard } from '@/components/custom/AIMetricsDashboard';

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

export default function SettingsPage() {
  const router = useRouter();

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
      id: 'api',
      title: 'API Configuration',
      icon: Key,
      settings: [
        {
          id: 'apiKey',
          label: 'API Key',
          type: 'input',
          value: 'sk-ant-••••••••••••••••',
          placeholder: 'sk-ant-...',
          description: 'Anthropic API key for Claude AI integration'
        },
        {
          id: 'apiModel',
          label: 'Default Model',
          type: 'select',
          value: 'claude-sonnet-4',
          options: ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku-4']
        }
      ]
    },
    {
      id: 'ai',
      title: 'AI Calibration',
      icon: Brain,
      settings: [
        {
          id: 'temperature',
          label: 'Response Temperature',
          type: 'select',
          value: 'balanced',
          options: ['creative', 'balanced', 'precise'],
          description: 'Controls creativity vs consistency in AI responses'
        },
        {
          id: 'contextWindow',
          label: 'Context Window',
          type: 'select',
          value: 'standard',
          options: ['minimal', 'standard', 'extended', 'maximum']
        },
        {
          id: 'autoSummarize',
          label: 'Auto-summarize Long Responses',
          type: 'toggle',
          value: true
        }
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Payment',
      icon: CreditCard,
      settings: [
        {
          id: 'paymentMethod',
          label: 'Payment Method',
          type: 'select',
          value: 'credit-card',
          options: ['credit-card', 'debit-card', 'bank-transfer', 'invoice']
        },
        {
          id: 'billingEmail',
          label: 'Billing Email',
          type: 'input',
          value: 'billing@company.com',
          placeholder: 'billing@company.com'
        },
        {
          id: 'plan',
          label: 'Current Plan',
          type: 'select',
          value: 'enterprise',
          options: ['starter', 'professional', 'enterprise']
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
      id: 'ai-monitoring',
      title: 'AI Cost Monitoring',
      icon: Activity,
      settings: [
        {
          id: 'promptCaching',
          label: 'Prompt Caching',
          type: 'toggle',
          value: true,
          description: 'Cache static prompts to reduce token costs by 90%'
        },
        {
          id: 'semanticFiltering',
          label: 'Smart Data Filtering',
          type: 'toggle',
          value: true,
          description: 'Use semantic analysis to include only relevant employee fields'
        },
        {
          id: 'dynamicTokens',
          label: 'Dynamic Token Limits',
          type: 'toggle',
          value: true,
          description: 'Automatically adjust max_tokens based on query type'
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

  const handleSave = () => {
    // TODO: Implement save functionality
    alert('Settings saved! (This is a placeholder)');
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

            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-all"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="space-y-6">
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: sectionIndex * 0.1 }}
              className="backdrop-blur-xl bg-black/40 border-2 border-white/20 rounded-2xl p-6"
            >
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <section.icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold">{section.title}</h2>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                {section.settings.map((setting, settingIndex) => (
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

              {/* AI Monitoring Dashboard */}
              {section.id === 'ai-monitoring' && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <AIMetricsDashboard />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 backdrop-blur-xl bg-blue-500/10 border-2 border-blue-500/30 rounded-2xl p-6"
        >
          <h3 className="text-sm font-bold mb-2 text-blue-400">Note</h3>
          <p className="text-sm text-gray-300">
            These are placeholder settings for demonstration purposes. In production, these settings would be
            connected to your account database and would persist across sessions.
          </p>
        </motion.div>
      </main>
    </div>
  );
}
