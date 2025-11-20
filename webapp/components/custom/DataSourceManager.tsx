'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Trash2,
  Eye,
  FileText,
  Calendar,
  BarChart3,
  X,
  ArrowLeft,
  Table2,
  Users,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { DataFile, FilePreview, FILE_TYPE_LABELS } from '@/lib/types/data-sources';
import { SmartFileUpload } from './SmartFileUpload';
import { useAuth } from '@/lib/auth/auth-context';
import { useQuery } from '@tanstack/react-query';
import { getDaysSinceFirstRun } from '@/lib/first-run-client';
import { queryKeys } from '@/lib/query-keys';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DataSourceManager() {
  const { getAuthHeaders } = useAuth();
  const [files, setFiles] = useState<DataFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ file: DataFile; data: FilePreview } | null>(null);
  const [daysSinceFirstRun, setDaysSinceFirstRun] = useState(0);
  const [hasUploadedData, setHasUploadedData] = useState(false);

  // Fetch first-run status
  const { data: firstRunData } = useQuery({
    queryKey: queryKeys.setup.init,
    queryFn: () => fetcher('/api/setup/init'),
  });

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    setDaysSinceFirstRun(getDaysSinceFirstRun());

    // Check if user has uploaded data (more than demo data count)
    if (firstRunData && firstRunData.employeeCount > 200) {
      setHasUploadedData(true);
    }
  }, [firstRunData]);

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/data/list', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/data/delete/${fileId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const result = await response.json();

      if (result.success) {
        // Reload the entire file list to get fresh IDs
        await loadFiles();
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
    } catch (error) {
      alert('Failed to delete file');
      console.error('Delete error:', error);
    }
  };

  const handlePreview = async (file: DataFile) => {
    try {
      const response = await fetch(`/api/data/preview/${file.fileId}`, {
        headers: getAuthHeaders(),
      });
      const result = await response.json();

      if (result.success) {
        setPreview({ file, data: result.preview });
      }
    } catch (error) {
      console.error('Preview error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8">
        {/* Back Button */}
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 mb-4 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Command Center</span>
          </motion.button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Data Input Hub</h1>
            <p className="text-gray-400">Upload employee data and manage your document library</p>
          </div>
        </div>
      </div>

      {/* Your Data Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl"
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold">Your Data</h2>
          <p className="text-xs text-gray-400">Employee data and analytics status</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-gray-400">Employees</span>
            </div>
            <p className="text-2xl font-bold">{firstRunData?.employeeCount || 0}</p>
            <p className="text-xs text-gray-500 mt-1">
              {hasUploadedData ? 'Your data' : 'Demo data'}
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">Analytics</span>
            </div>
            <p className="text-2xl font-bold">{firstRunData?.progress?.percentage || 0}%</p>
            <p className="text-xs text-gray-500 mt-1">Setup complete</p>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-gray-400">Status</span>
            </div>
            <p className="text-2xl font-bold">Active</p>
            <p className="text-xs text-gray-500 mt-1">
              {daysSinceFirstRun > 0 ? `${daysSinceFirstRun} days ago` : 'Just started'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Upload Section */}
      <div className="mb-8">
        <SmartFileUpload onUploadSuccess={loadFiles} />
      </div>

      {/* View/Edit Master Data Button */}
      <div className="mb-8">
        <Link href="/employees">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-6 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-2 border-purple-500/30 rounded-2xl cursor-pointer hover:border-purple-500/50 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">View & Edit Master Employee Data</h3>
                  <p className="text-gray-400">
                    Inline table editor with sorting, filtering, and bulk operations
                  </p>
                </div>
              </div>
              <div className="text-purple-300">
                <Table2 className="w-8 h-8" />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Files List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Uploaded Files ({files.length})</h2>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">No files uploaded yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Upload your first file to get started with analytics
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {files.map((file) => (
              <motion.div
                key={file.fileId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white/5 border-2 border-white/10 rounded-xl hover:border-blue-500/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-6 h-6" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg mb-1">{file.fileName}</h3>
                    <p className="text-sm text-gray-400 mb-2">{FILE_TYPE_LABELS[file.fileType]}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-4 h-4" />
                        {file.rowCount} rows
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(file.uploadedAt)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePreview(file)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border-2 border-blue-500/30 rounded-lg transition-colors"
                      title="Preview"
                    >
                      <Eye className="w-5 h-5 text-blue-300" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(file.fileId)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-red-300" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border-2 border-white/20 rounded-2xl p-6 max-w-6xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{preview.file.fileName}</h3>
                  <p className="text-sm text-gray-400">
                    Showing first 10 rows of {preview.data.totalRows} (PII masked)
                  </p>
                </div>
                <button
                  onClick={() => setPreview(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-800">
                    <tr>
                      {preview.data.columns.map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2 text-left font-semibold border-b-2 border-white/20 whitespace-nowrap"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.data.rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                        {preview.data.columns.map((col) => (
                          <td key={col} className="px-3 py-2 whitespace-nowrap">
                            {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
