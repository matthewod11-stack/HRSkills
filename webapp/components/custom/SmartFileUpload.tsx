'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { UploadPreview, ColumnMapping } from '@/lib/types/master-employee';
import { MappingPreviewModal } from './MappingPreviewModal';
import { useEmployeesData } from '@/lib/hooks/use-employees';
import { useAuth } from '@/lib/auth/auth-context';

interface SmartFileUploadProps {
  onUploadSuccess: () => void;
}

interface ImportResult {
  success: boolean;
  message?: string;
  stats?: {
    total_rows: number;
    new_records: number;
    updated_records: number;
    total_employees: number;
    errors: number;
  };
  error?: string;
}

export function SmartFileUpload({ onUploadSuccess }: SmartFileUploadProps) {
  // Employee data hook - refresh cache after successful import
  const { refresh: refreshEmployees } = useEmployeesData({ enabled: false });

  // Auth context for authentication headers
  const { getAuthHeaders } = useAuth();

  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<UploadPreview | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Step 1: Get mapping preview
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setCurrentFile(file);
      setUploading(true);
      setImportResult(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/data/preview-upload', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setPreview(result.preview);
        } else {
          setImportResult({
            success: false,
            error: result.error || 'Failed to preview upload',
          });
        }
      } catch (error) {
        setImportResult({
          success: false,
          error: error instanceof Error ? error.message : 'Upload preview failed',
        });
      } finally {
        setUploading(false);
      }
    },
    [getAuthHeaders]
  );

  // Step 2: Confirm and import with adjusted mappings
  const handleConfirmImport = async (adjustedMappings: ColumnMapping[]) => {
    if (!currentFile) return;

    setUploading(true);
    setPreview(null);

    try {
      const formData = new FormData();
      formData.append('file', currentFile);
      formData.append('mappings', JSON.stringify(adjustedMappings));

      const response = await fetch('/api/data/import', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
      });

      const result: ImportResult = await response.json();
      setImportResult(result);

      if (result.success) {
        // Refresh employee cache so components fetch fresh data
        await refreshEmployees();
        onUploadSuccess();
        // Auto-clear success message after 5 seconds
        setTimeout(() => setImportResult(null), 5000);
      }
    } catch (error) {
      setImportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setUploading(false);
      setCurrentFile(null);
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setCurrentFile(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <>
      <div className="w-full">
        {/* Dropzone */}
        <motion.div
          {...(getRootProps() as any)}
          whileHover={{ scale: uploading ? 1 : 1.02 }}
          whileTap={{ scale: uploading ? 1 : 0.98 }}
          className={`
            p-12 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all
            ${
              isDragActive
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-white/20 hover:border-blue-500/50 bg-white/5 hover:bg-white/10'
            }
            ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} aria-label="Upload employee data file (CSV or Excel)" />

          {uploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
              <p className="text-lg font-medium">Analyzing file...</p>
              <p className="text-sm text-gray-400">Detecting columns and suggesting mappings</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Upload className="w-10 h-10" />
              </div>

              <div>
                <p className="text-lg font-medium mb-1">
                  {isDragActive ? 'Drop file here' : 'Drop employee data file or click to browse'}
                </p>
                <p className="text-sm text-gray-400">
                  CSV or Excel • Columns will be auto-detected
                </p>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                <p>✨ Smart mapping detects employee ID, names, departments, and more</p>
                <p className="mt-1">🔄 Updates existing employees or creates new records</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Import Result */}
        <AnimatePresence>
          {importResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 p-4 rounded-xl border-2 ${
                importResult.success
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              <div className="flex items-start gap-3">
                {importResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                )}
                <div className="flex-1">
                  <div
                    className={`font-medium ${importResult.success ? 'text-green-200' : 'text-red-200'}`}
                  >
                    {importResult.success ? 'Import Successful!' : 'Import Failed'}
                  </div>

                  {importResult.success && importResult.stats && (
                    <div className="mt-2 text-sm space-y-1">
                      <div className="text-gray-300">
                        Processed {importResult.stats.total_rows} rows
                      </div>
                      <div className="flex gap-4 text-gray-400">
                        <span>✨ {importResult.stats.new_records} new</span>
                        <span>🔄 {importResult.stats.updated_records} updated</span>
                        <span>👥 {importResult.stats.total_employees} total employees</span>
                      </div>
                      {importResult.stats.errors > 0 && (
                        <div className="text-yellow-400">
                          ⚠️ {importResult.stats.errors} rows had errors
                        </div>
                      )}
                    </div>
                  )}

                  {!importResult.success && importResult.error && (
                    <div className="mt-1 text-sm text-red-300">{importResult.error}</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mapping Preview Modal */}
      <AnimatePresence>
        {preview && (
          <MappingPreviewModal
            preview={preview}
            onConfirm={handleConfirmImport}
            onCancel={handleCancelPreview}
          />
        )}
      </AnimatePresence>
    </>
  );
}
