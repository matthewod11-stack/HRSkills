'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, FileText, Grid3x3, Smile, X } from 'lucide-react';
import { type CSSProperties, useEffect, useState } from 'react';

export type ContextPanelType = 'document' | 'analytics' | 'performance' | 'enps' | null;

export interface ContextPanelData {
  type: ContextPanelType;
  title?: string;
  data?: Record<string, unknown>;
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
  alignmentStyle?: CSSProperties;
}

export function ContextPanel({ panelData, onClose, children, alignmentStyle }: ContextPanelProps) {
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
          glow: 'from-sage/20 via-sage-light/15 to-sage/10',
          containerBg: 'bg-cream-white/95',
          containerBorder: 'border-sage/30 hover:border-sage/50',
          headerGradient: 'from-sage/10 to-sage-light/8',
          iconBg: 'from-sage to-sage-light',
          closeButtonBorder: 'border-sage/30 hover:border-sage/50',
          closeButtonBg: 'bg-sage/10 hover:bg-sage/20',
        };
      case 'analytics':
        return {
          glow: 'from-terracotta/15 via-amber/12 to-terracotta/8',
          containerBg: 'bg-cream-white/95',
          containerBorder: 'border-terracotta/30 hover:border-terracotta/50',
          headerGradient: 'from-terracotta/10 to-amber/8',
          iconBg: 'from-terracotta to-amber',
          closeButtonBorder: 'border-terracotta/30 hover:border-terracotta/50',
          closeButtonBg: 'bg-terracotta/10 hover:bg-terracotta/20',
        };
      case 'performance':
        return {
          glow: 'from-amber/18 via-terracotta/15 to-amber/10',
          containerBg: 'bg-cream-white/95',
          containerBorder: 'border-amber/30 hover:border-amber/50',
          headerGradient: 'from-amber/10 to-terracotta/8',
          iconBg: 'from-amber to-terracotta-dark',
          closeButtonBorder: 'border-amber/30 hover:border-amber/50',
          closeButtonBg: 'bg-amber/10 hover:bg-amber/20',
        };
      case 'enps':
        return {
          glow: 'from-sage/18 via-terracotta/12 to-sage/10',
          containerBg: 'bg-cream-white/95',
          containerBorder: 'border-sage/30 hover:border-sage/50',
          headerGradient: 'from-sage/10 to-terracotta/8',
          iconBg: 'from-sage to-terracotta',
          closeButtonBorder: 'border-sage/30 hover:border-sage/50',
          closeButtonBg: 'bg-sage/10 hover:bg-sage/20',
        };
      default:
        return {
          glow: 'from-terracotta/12 via-amber/10 to-sage/8',
          containerBg: 'bg-cream-white/95',
          containerBorder: 'border-warm hover:border-terracotta/40',
          headerGradient: 'from-terracotta/8 to-amber/6',
          iconBg: 'from-terracotta to-amber',
          closeButtonBorder: 'border-warm hover:border-terracotta/40',
          closeButtonBg: 'bg-terracotta/10 hover:bg-terracotta/20',
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
      case 'enps':
        return <Smile className="w-5 h-5" />;
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
      case 'enps':
        return 'Employee Satisfaction (eNPS)';
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
          className="relative flex h-full min-h-full max-h-full w-full"
          style={{ minWidth: 0, ...alignmentStyle }}
        >
          <div className="relative group flex h-full min-h-full max-h-full w-full">
            {/* Glassmorphic background with gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${accent.glow} rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-70`}
            />

            <div
              className={`relative backdrop-blur-2xl rounded-3xl overflow-hidden border-2 transition-all duration-300 shadow-warm ${accent.containerBg} ${accent.containerBorder} flex h-full min-h-full max-h-full w-full flex-col`}
            >
              {/* Header */}
              <div
                className={`flex-shrink-0 flex items-center justify-between px-6 py-4 border-b-2 border-warm bg-gradient-to-r ${accent.headerGradient}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${accent.iconBg} flex items-center justify-center shadow-warm text-cream-white`}
                  >
                    {getPanelIcon(panelData.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-charcoal">
                      {getPanelTitle(panelData.type, panelData.title)}
                    </h3>
                    {panelData.config?.filters && (
                      <p className="text-xs text-charcoal-light font-medium">
                        {panelData.config.filters.department &&
                          `${panelData.config.filters.department} • `}
                        {panelData.config.filters.dateRange || 'All time'}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 hover-lift ${accent.closeButtonBg} ${accent.closeButtonBorder} text-charcoal hover:text-charcoal`}
                  aria-label="Close context panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {children || (
                  <div className="flex items-center justify-center h-full text-charcoal-light">
                    <p>Panel content will appear here</p>
                  </div>
                )}
              </div>

              {/* Footer with context info */}
              {panelData.config?.highlights && panelData.config.highlights.length > 0 && (
                <div className="flex-shrink-0 px-6 py-3 border-t border-warm bg-gradient-to-r from-terracotta/5 to-amber/5">
                  <p className="text-xs text-charcoal-light font-medium">
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
