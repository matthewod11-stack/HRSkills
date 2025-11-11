'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, BarChart3, Grid3x3 } from 'lucide-react';

export type ContextPanelType = 'document' | 'analytics' | 'performance' | null;

export interface ContextPanelData {
  type: ContextPanelType;
  title?: string;
  data?: any;
  config?: {
    filters?: {
      department?: string;
      dateRange?: string;
      location?: string;
    };
    highlights?: string[];
    documentType?: string;
    chartType?: 'bar' | 'line' | 'pie' | 'scatter';
  };
}

interface ContextPanelProps {
  panelData: ContextPanelData | null;
  onClose: () => void;
  children?: React.ReactNode;
}

export function ContextPanel({ panelData, onClose, children }: ContextPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(!!panelData?.type);
  }, [panelData]);

  const handleClose = () => {
    setIsVisible(false);
    // Delay actual close to allow animation to complete
    setTimeout(onClose, 300);
  };

  const getAccentStyles = (type: ContextPanelType) => {
    switch (type) {
      case 'document':
        return {
          glow: 'from-emerald-500/20 via-emerald-400/10 to-teal-500/10',
          containerBg: 'bg-emerald-950/60',
          containerBorder: 'border-emerald-500/40 hover:border-emerald-400/70',
          headerGradient: 'from-emerald-500/15 to-teal-500/10',
          iconBg: 'from-emerald-500 to-teal-500',
          closeButtonBorder: 'border-emerald-500/40 hover:border-emerald-400/70',
          closeButtonBg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
        };
      case 'analytics':
        return {
          glow: 'from-blue-500/10 via-purple-500/10 to-pink-500/10',
          containerBg: 'bg-black/45',
          containerBorder: 'border-blue-400/40 hover:border-blue-300/60',
          headerGradient: 'from-blue-500/15 to-purple-500/10',
          iconBg: 'from-blue-500 to-purple-600',
          closeButtonBorder: 'border-blue-400/40 hover:border-blue-300/60',
          closeButtonBg: 'bg-white/5 hover:bg-white/10',
        };
      case 'performance':
        return {
          glow: 'from-orange-500/15 via-amber-400/10 to-rose-500/10',
          containerBg: 'bg-black/45',
          containerBorder: 'border-orange-400/40 hover:border-orange-300/60',
          headerGradient: 'from-orange-500/15 to-rose-500/10',
          iconBg: 'from-orange-500 to-rose-500',
          closeButtonBorder: 'border-orange-400/40 hover:border-orange-300/60',
          closeButtonBg: 'bg-white/5 hover:bg-white/10',
        };
      default:
        return {
          glow: 'from-blue-500/10 via-purple-500/10 to-pink-500/10',
          containerBg: 'bg-black/40',
          containerBorder: 'border-white/30 hover:border-white/40',
          headerGradient: 'from-blue-500/10 to-purple-500/10',
          iconBg: 'from-blue-500 to-purple-600',
          closeButtonBorder: 'border-white/20 hover:border-white/40',
          closeButtonBg: 'bg-white/5 hover:bg-white/10',
        };
    }
  };

  const accent = getAccentStyles(panelData?.type ?? null);

  const getPanelIcon = (type: ContextPanelType) => {
    switch (type) {
      case 'document':
        return <FileText className="w-5 h-5" />;
      case 'analytics':
        return <BarChart3 className="w-5 h-5" />;
      case 'performance':
        return <Grid3x3 className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getPanelTitle = (type: ContextPanelType, title?: string) => {
    if (title) return title;

    switch (type) {
      case 'document':
        return 'Document Editor';
      case 'analytics':
        return 'Analytics';
      case 'performance':
        return 'Performance Grid';
      default:
        return 'Context Panel';
    }
  };

  if (!panelData?.type) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="relative flex h-full"
        >
          <div className="relative group flex h-full flex-1">
            {/* Glassmorphic background with gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${accent.glow} rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-70`}
            />

            <div
              className={`relative backdrop-blur-2xl rounded-3xl overflow-hidden border-2 transition-all duration-300 ${accent.containerBg} ${accent.containerBorder} flex h-full flex-col`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between px-6 py-4 border-b-2 border-white/10 bg-gradient-to-r ${accent.headerGradient}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent.iconBg} flex items-center justify-center`}
                  >
                    {getPanelIcon(panelData.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {getPanelTitle(panelData.type, panelData.title)}
                    </h3>
                    {panelData.config?.filters && (
                      <p className="text-xs text-gray-400">
                        {panelData.config.filters.department &&
                          `${panelData.config.filters.department} • `}
                        {panelData.config.filters.dateRange || 'All time'}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${accent.closeButtonBg} ${accent.closeButtonBorder}`}
                  aria-label="Close context panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                {children || (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>Panel content will appear here</p>
                  </div>
                )}
              </div>

              {/* Footer with context info */}
              {panelData.config?.highlights && panelData.config.highlights.length > 0 && (
                <div className="px-6 py-3 border-t border-white/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                  <p className="text-xs text-gray-400">
                    Highlighting: {panelData.config.highlights.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
