'use client';

import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Database,
  Eye,
  FileText,
  Table2,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { getDaysSinceFirstRun } from '@/lib/first-run-client';
import { queryKeys } from '@/lib/query-keys';
import { type DataFile, FILE_TYPE_LABELS, type FilePreview } from '@/lib/types/data-sources';
import { SmartFileUpload } from './SmartFileUpload';

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

  const loadFiles = useCallback(async () => {
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
  }, [getAuthHeaders]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  useEffect(() => {
    setDaysSinceFirstRun(getDaysSinceFirstRun());

    // Check if user has uploaded data (more than demo data count)
    if (firstRunData && firstRunData.employeeCount > 200) {
      setHasUploadedData(true);
    }
  }, [firstRunData]);

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
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 mb-4 bg-cream hover:bg-terracotta/10 border-2 border-warm hover:border-terracotta/40 rounded-xl transition-all shadow-soft hover-lift text-terracotta"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold">Back to Command Center</span>
          </motion.button>
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sage to-sage-light flex items-center justify-center shadow-warm">
            <Database className="w-7 h-7 text-cream-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-charcoal">Data Input Hub</h1>
            <p className="text-charcoal-light">
              Upload employee data and manage your document library
            </p>
          </div>
        </div>
      </div>

      {/* Your Data Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-cream-white border-2 border-sage/30 rounded-3xl shadow-soft hover:border-sage/50 transition-all"
      >
        <div className="mb-4">
          <h2 className="text-lg font-bold text-charcoal">Your Data</h2>
          <p className="text-xs text-charcoal-light">Employee data and analytics status</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-sage/5 border border-warm rounded-2xl shadow-soft">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-sage" />
              <span className="text-xs text-charcoal-light font-medium">Employees</span>
            </div>
            <p className="text-2xl font-bold text-charcoal">{firstRunData?.employeeCount || 0}</p>
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
            className="p-6 bg-gradient-to-r from-amber/10 to-terracotta/10 border-2 border-amber/30 rounded-3xl cursor-pointer hover:border-amber/50 transition-all shadow-soft hover:shadow-warm hover-lift"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber to-terracotta flex items-center justify-center shadow-warm">
                  <Users className="w-7 h-7 text-cream-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1 text-charcoal">
                    View & Edit Master Employee Data
                  </h3>
                  <p className="text-charcoal-light">
                    Inline table editor with sorting, filtering, and bulk operations
                  </p>
                </div>
              </div>
              <div className="text-amber">
                <Table2 className="w-8 h-8" />
              </div>
            </div>
          </motion.div>
        </Link>
      </div>

      {/* Files List */}
      <div>
        <h2 className="text-lg font-bold mb-4 text-charcoal">Uploaded Files ({files.length})</h2>

        {loading ? (
          <div className="text-center py-12 text-charcoal-light">Loading...</div>
        ) : files.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-charcoal-soft" />
            <p className="text-charcoal-light font-medium">No files uploaded yet</p>
            <p className="text-sm text-charcoal-soft mt-1">
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
                className="p-4 bg-cream-white border-2 border-warm rounded-2xl hover:border-terracotta/30 transition-all shadow-soft hover:shadow-warm"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-terracotta to-amber flex items-center justify-center flex-shrink-0 shadow-warm">
                    <BarChart3 className="w-6 h-6 text-cream-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1 text-charcoal">{file.fileName}</h3>
                    <p className="text-sm text-charcoal-light mb-2">
                      {FILE_TYPE_LABELS[file.fileType]}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-charcoal-soft">
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
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePreview(file)}
                      className="p-2 bg-sage/10 hover:bg-sage border-2 border-sage/30 hover:border-sage rounded-xl transition-all shadow-soft hover:shadow-warm group"
                      title="Preview"
                    >
                      <Eye className="w-5 h-5 text-sage group-hover:text-cream-white" />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(file.fileId)}
                      className="p-2 bg-error/10 hover:bg-error border-2 border-error/30 hover:border-error rounded-xl transition-all shadow-soft hover:shadow-warm group"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5 text-error group-hover:text-cream-white" />
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
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-cream-white border-2 border-warm rounded-3xl p-6 max-w-6xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-warm-lg"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1 text-charcoal">{preview.file.fileName}</h3>
                  <p className="text-sm text-charcoal-light">
                    Showing first 10 rows of {preview.data.totalRows} (PII masked)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="p-2 hover:bg-terracotta/10 rounded-xl transition-colors text-terracotta hover-lift"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Table */}
              <div className="overflow-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-cream">
                    <tr>
                      {preview.data.columns.map((col) => (
                        <th
                          key={col}
                          className="px-3 py-2 text-left font-bold border-b-2 border-warm whitespace-nowrap text-charcoal"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.data.rows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-warm hover:bg-cream transition-colors"
                      >
                        {preview.data.columns.map((col) => (
                          <td key={col} className="px-3 py-2 whitespace-nowrap text-charcoal">
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
