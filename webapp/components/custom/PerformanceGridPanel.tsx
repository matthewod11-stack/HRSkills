'use client'

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Grid3x3, Users, TrendingUp, TrendingDown, RefreshCw, Filter } from 'lucide-react';
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

  useEffect(() => {
    fetchGridData();
  }, [department]);

  const fetchGridData = async () => {
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
  };

  const getCellData = (performance: string, potential: string): NineBoxCell | null => {
    return gridData.find(
      (cell) => cell.performance === performance && cell.potential === potential
    ) || null;
  };

  const getCellColor = (performance: string, potential: string): string => {
    const key = `${performance}-${potential}`;
    const colorMap: Record<string, string> = {
      'High-High': 'from-green-500/30 to-emerald-500/30 border-green-500/60',
      'High-Medium': 'from-green-500/20 to-blue-500/20 border-green-500/50',
      'High-Low': 'from-blue-500/30 to-cyan-500/30 border-blue-500/60',
      'Medium-High': 'from-blue-500/30 to-purple-500/30 border-blue-500/60',
      'Medium-Medium': 'from-gray-500/20 to-gray-500/20 border-gray-500/40',
      'Medium-Low': 'from-yellow-500/20 to-orange-500/20 border-yellow-500/50',
      'Low-High': 'from-orange-500/30 to-red-500/30 border-orange-500/60',
      'Low-Medium': 'from-red-500/20 to-orange-500/20 border-red-500/50',
      'Low-Low': 'from-red-500/30 to-pink-500/30 border-red-500/60',
    };
    return colorMap[key] || 'from-gray-500/20 to-gray-500/20 border-gray-500/40';
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
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-4 h-4" />
          <div>
            <h4 className="font-medium">9-Box Performance Grid</h4>
            <p className="text-xs text-gray-400">
              {department || 'All Departments'} • {summary?.totalAnalyzed || 0} employees
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchGridData}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg text-xs transition-all flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">High Performers</span>
          </div>
          <p className="text-2xl font-bold text-green-400">{summary?.highPerformers || 0}</p>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Core Team</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">{summary?.coreEmployees || 0}</p>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-gray-400">Dev Needed</span>
          </div>
          <p className="text-2xl font-bold text-orange-400">{summary?.developmentNeeded || 0}</p>
        </div>
      </div>

      {/* 9-Box Grid */}
      <div className="flex-1">
        <div className="grid grid-cols-4 gap-2 text-xs">
          {/* Header Row */}
          <div></div>
          <div className="text-center text-gray-400 font-medium">Low Potential</div>
          <div className="text-center text-gray-400 font-medium">Med Potential</div>
          <div className="text-center text-gray-400 font-medium">High Potential</div>

          {/* Grid Rows */}
          {(['High', 'Medium', 'Low'] as const).map((perf) => (
            <div key={perf} className="contents">
              {/* Row Label */}
              <div className="flex items-center justify-end pr-2 text-gray-400 font-medium text-right">
                {perf} Perf
              </div>

              {/* Cells */}
              {(['Low', 'Medium', 'High'] as const).map((pot) => {
                const cell = getCellData(perf, pot);
                const colorClass = getCellColor(perf, pot);
                const highlighted = isHighlighted(perf, pot);

                return (
                  <motion.div
                    key={`${perf}-${pot}`}
                    whileHover={{ scale: cell && cell.count > 0 ? 1.05 : 1 }}
                    onClick={() => handleCellClick(cell)}
                    className={`
                      bg-gradient-to-br ${colorClass}
                      rounded-lg p-3 cursor-pointer transition-all
                      ${cell && cell.count > 0 ? 'hover:shadow-lg' : 'opacity-50'}
                      ${highlighted ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-black' : ''}
                    `}
                  >
                    <div className="text-center">
                      <div className="text-xl font-bold mb-0.5">{cell?.count || 0}</div>
                      <div className="text-[10px] text-gray-300 leading-tight">
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
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-gray-400">
          <p className="mb-1">
            Performance based on AI analysis + manager ratings
          </p>
          {highlights.length > 0 && (
            <p className="text-yellow-400">
              Highlighting: {highlights.join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
