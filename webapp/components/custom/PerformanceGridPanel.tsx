'use client';

import { motion } from 'framer-motion';
import { Grid3x3, RefreshCw, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

interface Employee {
  id: string;
  name: string;
  department: string;
  aiPerformanceScore: number;
  aiPotentialScore: number;
  managerRating: number | null;
  ratingInflation: number | null;
}

interface NineBoxCell {
  performance: 'High' | 'Medium' | 'Low';
  potential: 'High' | 'Medium' | 'Low';
  count: number;
  employees: Employee[];
  category: string;
}

interface PerformanceGridPanelProps {
  department?: string;
  highlights?: string[];
  onEmployeeClick?: (employee: Employee) => void;
}

export function PerformanceGridPanel({
  department,
  highlights = [],
  onEmployeeClick,
}: PerformanceGridPanelProps) {
  const { getAuthHeaders } = useAuth();
  const [loading, setLoading] = useState(true);
  const [gridData, setGridData] = useState<NineBoxCell[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGridData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ metric: 'nine-box' });
      if (department) params.set('department', department);

      const response = await fetch(`/api/analytics?${params}`, {
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch grid data');
      }

      setGridData(result.data.grid || []);
      setSummary(result.data.summary || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [department, getAuthHeaders]);

  useEffect(() => {
    fetchGridData();
  }, [fetchGridData]);

  const getCellData = (performance: string, potential: string): NineBoxCell | null => {
    return (
      gridData.find((cell) => cell.performance === performance && cell.potential === potential) ||
      null
    );
  };

  const getCellColor = (performance: string, potential: string): string => {
    const key = `${performance}-${potential}`;
    const colorMap: Record<string, string> = {
      'High-High': 'from-success/30 to-sage/30 border-success/60',
      'High-Medium': 'from-success/20 to-sage/20 border-success/50',
      'High-Low': 'from-sage/30 to-sage-light/30 border-sage/60',
      'Medium-High': 'from-sage/30 to-sage-light/30 border-sage/60',
      'Medium-Medium': 'from-sage-soft/30 to-sage-soft/20 border-sage/40',
      'Medium-Low': 'from-amber/20 to-amber-light/20 border-amber/50',
      'Low-High': 'from-terracotta/30 to-amber/30 border-terracotta/60',
      'Low-Medium': 'from-error/20 to-terracotta/20 border-error/50',
      'Low-Low': 'from-error/30 to-error/20 border-error/60',
    };
    return colorMap[key] || 'from-sage-soft/20 to-sage-soft/20 border-sage/40';
  };

  const isHighlighted = (performance: string, potential: string): boolean => {
    const key = `${performance}-${potential}`;
    return highlights.includes(key) || highlights.includes('flight-risk');
  };

  const handleCellClick = (cell: NineBoxCell | null) => {
    if (!cell || cell.count === 0) return;
    // Show employee list in a tooltip or modal
    console.log('Cell clicked:', cell);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-terracotta" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-5">
      {/* Subtitle */}
      <p className="text-xs text-charcoal-light mb-4">
        {department || 'All Departments'} • {summary?.totalAnalyzed || 0} employees
      </p>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-success/10 border border-success/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-success">{summary?.highPerformers || 0}</p>
          <p className="text-[10px] text-charcoal-light mt-1">High Performers</p>
        </div>

        <div className="bg-sage/10 border border-sage/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-sage">{summary?.coreEmployees || 0}</p>
          <p className="text-[10px] text-charcoal-light mt-1">Core Team</p>
        </div>

        <div className="bg-terracotta/10 border border-terracotta/30 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-terracotta">{summary?.developmentNeeded || 0}</p>
          <p className="text-[10px] text-charcoal-light mt-1">Dev Needed</p>
        </div>
      </div>

      {/* 9-Box Grid - Centered */}
      <div className="flex-1 flex items-start justify-center">
        <div className="grid grid-cols-3 gap-2 w-full max-w-[300px]">
          {(['High', 'Medium', 'Low'] as const).map((perf) => (
            <div key={perf} className="contents">
              {(['Low', 'Medium', 'High'] as const).map((pot) => {
                const cell = getCellData(perf, pot);
                const colorClass = getCellColor(perf, pot);
                const highlighted = isHighlighted(perf, pot);

                return (
                  <motion.div
                    key={`${perf}-${pot}`}
                    whileHover={{ scale: cell && cell.count > 0 ? 1.03 : 1 }}
                    onClick={() => handleCellClick(cell)}
                    className={`
                      bg-gradient-to-br ${colorClass}
                      rounded-lg p-3 cursor-pointer transition-all border aspect-square flex items-center justify-center
                      ${cell && cell.count > 0 ? 'hover:shadow-warm' : 'opacity-50'}
                      ${highlighted ? 'ring-2 ring-amber ring-offset-1 ring-offset-cream-white' : ''}
                    `}
                  >
                    <div className="text-center">
                      <div className="text-lg font-bold text-charcoal">{cell?.count || 0}</div>
                      <div className="text-[9px] text-charcoal-light leading-tight mt-0.5">
                        {cell?.category}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-charcoal-light text-center mt-4">
        Based on AI analysis + manager ratings
      </p>
    </div>
  );
}
