'use client'

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Grid3x3, TrendingUp, TrendingDown, AlertCircle, Download, Upload, Sparkles, X, Users as UsersIcon } from 'lucide-react';
import Link from 'next/link';
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
  color: string;
}

interface NineBoxData {
  grid: NineBoxCell[];
  summary: {
    highPerformers: number;
    coreEmployees: number;
    developmentNeeded: number;
    totalAnalyzed: number;
    avgRatingInflation: number;
  };
}

export default function NineBoxPage() {
  const { getAuthHeaders } = useAuth();
  const [nineBoxData, setNineBoxData] = useState<NineBoxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<NineBoxCell | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    loadNineBoxData();
  }, []);

  const loadNineBoxData = async () => {
    try {
      const response = await fetch('/api/analytics/nine-box', {
        headers: getAuthHeaders()
      });
      const result = await response.json();

      if (result.success) {
        setNineBoxData(result.data);

        // Extract unique departments
        const depts = new Set<string>();
        result.data.grid.forEach((cell: NineBoxCell) => {
          cell.employees.forEach((emp: Employee) => {
            if (emp.department) depts.add(emp.department);
          });
        });
        setDepartments(['all', ...Array.from(depts).sort()]);
      }
    } catch (error) {
      console.error('Failed to load 9-box data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCellData = (performance: 'High' | 'Medium' | 'Low', potential: 'High' | 'Medium' | 'Low'): NineBoxCell => {
    if (!nineBoxData) return { performance, potential, count: 0, employees: [], category: '', color: '' };

    const cell = nineBoxData.grid.find(c => c.performance === performance && c.potential === potential);
    if (!cell) return { performance, potential, count: 0, employees: [], category: '', color: '' };

    // Filter by department if selected
    if (selectedDepartment === 'all') return cell;

    return {
      ...cell,
      employees: cell.employees.filter(e => e.department === selectedDepartment),
      count: cell.employees.filter(e => e.department === selectedDepartment).length
    };
  };

  const getCellColor = (performance: string, potential: string): string => {
    const key = `${performance}-${potential}`;
    const colorMap: Record<string, string> = {
      'High-High': 'from-green-500/20 to-emerald-500/20 border-green-500/50',
      'High-Medium': 'from-green-500/15 to-blue-500/15 border-green-500/40',
      'High-Low': 'from-blue-500/20 to-cyan-500/20 border-blue-500/50',
      'Medium-High': 'from-blue-500/20 to-purple-500/20 border-blue-500/50',
      'Medium-Medium': 'from-gray-500/10 to-gray-500/10 border-gray-500/30',
      'Medium-Low': 'from-yellow-500/15 to-orange-500/15 border-yellow-500/40',
      'Low-High': 'from-orange-500/20 to-red-500/20 border-orange-500/50',
      'Low-Medium': 'from-red-500/15 to-orange-500/15 border-red-500/40',
      'Low-Low': 'from-red-500/20 to-pink-500/20 border-red-500/50'
    };
    return colorMap[key] || 'from-gray-500/10 to-gray-500/10 border-gray-500/30';
  };

  const getCategoryName = (performance: string, potential: string): string => {
    const key = `${performance}-${potential}`;
    const categories: Record<string, string> = {
      'High-High': 'Future Leader',
      'High-Medium': 'High Performer',
      'High-Low': 'Solid Performer',
      'Medium-High': 'Key Talent',
      'Medium-Medium': 'Growth Potential',
      'Medium-Low': 'Core Employee',
      'Low-High': 'Inconsistent',
      'Low-Medium': 'Development Needed',
      'Low-Low': 'Underperformer'
    };
    return categories[key] || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Grid3x3 className="w-16 h-16 mx-auto mb-4 animate-pulse text-purple-400" />
          <p className="text-lg">Loading 9-Box Grid...</p>
        </motion.div>
      </div>
    );
  }

  if (!nineBoxData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <p className="text-lg">No data available. Please upload performance reviews first.</p>
          <Link href="/data-sources">
            <button className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
              Upload Data
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white overflow-hidden">
      {/* Floating background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="backdrop-blur-xl bg-black/40 border-b border-white/20 sticky top-0 z-30"
        >
          <div className="max-w-[1800px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                </Link>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <Grid3x3 className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">9-Box Performance Grid</h1>
                  <p className="text-sm text-gray-400">Performance × Potential Matrix</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Department Filter */}
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-4 py-2 bg-white/5 border-2 border-white/20 rounded-lg text-sm hover:border-white/40 transition-all cursor-pointer focus:outline-none focus:border-blue-500 text-white"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept} className="bg-gray-900 text-white">
                      {dept === 'all' ? 'All Departments' : dept}
                    </option>
                  ))}
                </select>

                <Link href="/data-sources">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-500/50 rounded-lg transition-all flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">Upload Data</span>
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-[1800px] mx-auto px-6 py-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-60" />
              <div className="relative backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  <span className="text-xs text-gray-400">Top Performers</span>
                </div>
                <div className="text-3xl font-bold text-green-400">{nineBoxData.summary.highPerformers}</div>
                <div className="text-sm text-gray-400 mt-1">High Performance</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-60" />
              <div className="relative backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <UsersIcon className="w-6 h-6 text-blue-400" />
                  <span className="text-xs text-gray-400">Solid Contributors</span>
                </div>
                <div className="text-3xl font-bold text-blue-400">{nineBoxData.summary.coreEmployees}</div>
                <div className="text-sm text-gray-400 mt-1">Core Team</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-60" />
              <div className="relative backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <TrendingDown className="w-6 h-6 text-orange-400" />
                  <span className="text-xs text-gray-400">Needs Support</span>
                </div>
                <div className="text-3xl font-bold text-orange-400">{nineBoxData.summary.developmentNeeded}</div>
                <div className="text-sm text-gray-400 mt-1">Development Focus</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-60" />
              <div className="relative backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <span className="text-xs text-gray-400">Total Analyzed</span>
                </div>
                <div className="text-3xl font-bold text-purple-400">{nineBoxData.summary.totalAnalyzed}</div>
                <div className="text-sm text-gray-400 mt-1">Employees</div>
              </div>
            </motion.div>
          </div>

          {/* 9-Box Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-pink-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60" />

            <div className="relative backdrop-blur-2xl bg-black/40 border-2 border-white/30 rounded-3xl p-8 hover:border-white/40 transition-all duration-300">
              <div className="grid grid-cols-4 gap-4">
                {/* Header Row */}
                <div></div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-300 mb-1">Low Potential</div>
                  <div className="text-xs text-gray-500">Limited Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-300 mb-1">Medium Potential</div>
                  <div className="text-xs text-gray-500">Some Growth</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-300 mb-1">High Potential</div>
                  <div className="text-xs text-gray-500">High Growth</div>
                </div>

                {/* Grid Rows */}
                {['High', 'Medium', 'Low'].map((perf, rowIdx) => (
                  <div key={perf} className="contents">
                    {/* Row Label */}
                    <div className="flex items-center justify-end pr-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-300">{perf} Performance</div>
                        <div className="text-xs text-gray-500">
                          {perf === 'High' ? 'Exceeds' : perf === 'Medium' ? 'Meets' : 'Below'}
                        </div>
                      </div>
                    </div>

                    {/* Cells */}
                    {(['Low', 'Medium', 'High'] as const).map((pot, colIdx) => {
                      const cell = getCellData(perf as any, pot);
                      const colorClass = getCellColor(perf, pot);
                      const category = getCategoryName(perf, pot);

                      return (
                        <motion.div
                          key={`${perf}-${pot}`}
                          whileHover={{ scale: 1.02 }}
                          onClick={() => cell.count > 0 && setSelectedCell(cell)}
                          className={`bg-gradient-to-br ${colorClass} backdrop-blur-sm rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:border-white/60 ${
                            cell.count > 0 ? 'hover:shadow-lg' : 'opacity-50'
                          }`}
                        >
                          <div className="text-center">
                            <div className="text-4xl font-bold mb-2">{cell.count}</div>
                            <div className="text-xs text-gray-300 font-medium mb-1">{category}</div>
                            {cell.count > 0 && (
                              <div className="text-xs text-gray-500">Click to view</div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-8 pt-6 border-t border-white/20">
                <div className="text-sm text-gray-400 mb-4">Performance scoring based on AI analysis of review text + Manager ratings</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-green-400">High Performance (4-5):</span>
                    <span className="text-gray-400 ml-2">Exceeds expectations consistently</span>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-400">Medium Performance (3-4):</span>
                    <span className="text-gray-400 ml-2">Meets expectations</span>
                  </div>
                  <div>
                    <span className="font-semibold text-orange-400">Low Performance (&lt;3):</span>
                    <span className="text-gray-400 ml-2">Needs improvement</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Employee List Modal */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedCell(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative backdrop-blur-2xl bg-black/80 border-2 border-white/30 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <button
                onClick={() => setSelectedCell(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold mb-2">{getCategoryName(selectedCell.performance, selectedCell.potential)}</h3>
              <p className="text-sm text-gray-400 mb-6">
                {selectedCell.performance} Performance × {selectedCell.potential} Potential
              </p>

              <div className="overflow-y-auto max-h-[50vh] space-y-3">
                {selectedCell.employees.map((emp) => (
                  <motion.div
                    key={emp.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-white/5 border border-white/20 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all"
                    onClick={() => setSelectedEmployee(emp)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{emp.name}</div>
                        <div className="text-sm text-gray-400">{emp.department}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm">
                          <span className="text-gray-400">Performance:</span>
                          <span className="ml-2 font-medium">{emp.aiPerformanceScore.toFixed(1)}/5</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Potential:</span>
                          <span className="ml-2 font-medium">{emp.aiPotentialScore}/3</span>
                        </div>
                        {emp.ratingInflation !== null && emp.ratingInflation > 1 && (
                          <div className="text-xs text-orange-400 mt-1">
                            ⚠ Rating inflation: +{emp.ratingInflation.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
