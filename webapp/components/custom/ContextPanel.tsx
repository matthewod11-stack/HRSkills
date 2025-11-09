'use client'

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
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="relative overflow-hidden"
        >
          <div className="relative group">
            {/* Glassmorphic background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60" />

            <div className="relative backdrop-blur-2xl bg-black/40 border-2 border-white/30 rounded-3xl overflow-hidden hover:border-white/40 transition-all duration-300">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b-2 border-white/20 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    {getPanelIcon(panelData.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {getPanelTitle(panelData.type, panelData.title)}
                    </h3>
                    {panelData.config?.filters && (
                      <p className="text-xs text-gray-400">
                        {panelData.config.filters.department && `${panelData.config.filters.department} • `}
                        {panelData.config.filters.dateRange || 'All time'}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className="w-10 h-10 bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center transition-all"
                  aria-label="Close context panel"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 min-h-[400px] max-h-[600px] overflow-y-auto">
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
