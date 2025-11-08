'use client'

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { FileType, FILE_TYPE_LABELS, UploadResponse } from '@/lib/types/data-sources';
import { useAuth } from '@/lib/auth/auth-context';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

export function FileUpload({ onUploadSuccess }: FileUploadProps) {
  const { getAuthHeaders } = useAuth();
  const [fileType, setFileType] = useState<FileType>('employee_master');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);

      const response = await fetch('/api/data/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      const result: UploadResponse = await response.json();
      setUploadResult(result);

      if (result.success) {
        onUploadSuccess();
        // Auto-clear success message after 3 seconds
        setTimeout(() => setUploadResult(null), 3000);
      }
    } catch (error) {
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      });
    } finally {
      setUploading(false);
    }
  }, [fileType, onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    disabled: uploading
  });

  return (
    <div className="w-full">
      {/* File Type Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Select Data Type
        </label>
        <select
          value={fileType}
          onChange={(e) => setFileType(e.target.value as FileType)}
          disabled={uploading}
          className="w-full px-4 py-2 bg-white/5 border-2 border-white/20 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
        >
          {Object.entries(FILE_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value} className="bg-gray-900">
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300
          ${isDragActive
            ? 'border-blue-500 bg-blue-500/10 scale-105'
            : uploading
              ? 'border-gray-600 bg-gray-800/50 cursor-wait'
              : 'border-white/30 hover:border-blue-500/50 hover:bg-white/5'
          }
        `}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-4">
          {uploading ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent"
              />
              <p className="text-lg font-medium">Uploading...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                {isDragActive ? (
                  <Upload className="w-8 h-8" />
                ) : (
                  <FileText className="w-8 h-8" />
                )}
              </div>
              <div>
                <p className="text-lg font-medium mb-1">
                  {isDragActive
                    ? 'Drop file here'
                    : 'Drag & drop CSV/Excel file here'}
                </p>
                <p className="text-sm text-gray-400">
                  or click to browse
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Supported formats: CSV, XLSX, XLS
              </p>
            </>
          )}
        </div>
      </div>

      {/* Upload Result */}
      <AnimatePresence>
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`
              mt-4 p-4 rounded-xl border-2
              ${uploadResult.success
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-red-500/10 border-red-500/30'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
              )}

              <div className="flex-1">
                <p className={`font-medium ${uploadResult.success ? 'text-green-300' : 'text-red-300'}`}>
                  {uploadResult.success ? 'Upload Successful!' : 'Upload Failed'}
                </p>

                {uploadResult.success && (
                  <div className="mt-2 text-sm space-y-1">
                    <p><span className="text-gray-400">File:</span> {uploadResult.fileName}</p>
                    <p><span className="text-gray-400">Rows:</span> {uploadResult.rowCount}</p>
                    {uploadResult.validationErrors && uploadResult.validationErrors.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded">
                        <p className="text-yellow-300 text-xs font-medium mb-1">Warnings:</p>
                        <ul className="text-yellow-200/80 text-xs space-y-1">
                          {uploadResult.validationErrors.map((error, idx) => (
                            <li key={idx}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {!uploadResult.success && uploadResult.error && (
                  <p className="mt-1 text-sm text-red-200">
                    {uploadResult.error}
                  </p>
                )}

                {uploadResult.validationErrors && !uploadResult.success && (
                  <ul className="mt-2 text-sm text-red-200 space-y-1">
                    {uploadResult.validationErrors.map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUploadResult(null);
                }}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
