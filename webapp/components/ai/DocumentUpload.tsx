'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload,
  FileText,
  Image as ImageIcon,
  File,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Download,
  Trash2,
  FileUp,
} from 'lucide-react'
import type { FormParseResult, OCRResult } from '@/lib/ai-services/document-ai-service'

interface DocumentUploadProps {
  onUpload?: (result: FormParseResult | OCRResult, file: File) => void
  onError?: (error: string) => void
  className?: string
  uploadType?: 'form' | 'ocr' | 'auto'
  extractTables?: boolean
  extractEntities?: boolean
  maxFiles?: number
}

interface UploadedDocument {
  file: File
  result?: FormParseResult | OCRResult
  error?: string
  processing?: boolean
}

/**
 * Document upload component with drag-and-drop, preview, and batch processing
 */
export function DocumentUpload({
  onUpload,
  onError,
  className = '',
  uploadType = 'auto',
  extractTables = true,
  extractEntities = false,
  maxFiles = 5,
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [previewDocument, setPreviewDocument] = useState<UploadedDocument | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFiles(Array.from(files))
    }
  }

  const handleFiles = (files: File[]) => {
    const validFiles = files.slice(0, maxFiles - documents.length)

    const newDocuments: UploadedDocument[] = validFiles.map(file => ({
      file,
      processing: true,
    }))

    setDocuments(prev => [...prev, ...newDocuments])

    // Process each file
    validFiles.forEach((file, index) => {
      processDocument(file, documents.length + index)
    })
  }

  const processDocument = async (file: File, index: number) => {
    try {
      const formData = new FormData()

      let endpoint = '/api/ai/ocr-image'

      if (uploadType === 'form') {
        endpoint = '/api/ai/extract-form'
        formData.append('form', file)
      } else if (uploadType === 'ocr' || uploadType === 'auto') {
        endpoint = '/api/ai/ocr-image'
        formData.append('image', file)
      }

      if (extractTables) {
        formData.append('extractTables', 'true')
      }
      if (extractEntities) {
        formData.append('extractEntities', 'true')
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to process document')
      }

      setDocuments(prev => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          result: result.data,
          processing: false,
        }
        return updated
      })

      onUpload?.(result.data, file)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process document'

      setDocuments(prev => {
        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          error: errorMessage,
          processing: false,
        }
        return updated
      })

      onError?.(errorMessage)
    }
  }

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index))
    if (previewDocument === documents[index]) {
      setPreviewDocument(null)
    }
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-8 h-8" />
    }
    if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8" />
    }
    return <File className="w-8 h-8" />
  }

  const canUploadMore = documents.length < maxFiles

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      {canUploadMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
            isDragging
              ? 'border-blue-500/50 bg-blue-500/10'
              : 'border-white/20 bg-black/40 hover:border-white/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.tiff,.tif,.gif,.bmp,.webp"
            onChange={handleFileSelect}
            multiple={maxFiles > 1}
            className="hidden"
          />

          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full">
              <Upload className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Upload Documents</h3>
              <p className="text-sm text-gray-400">
                Drag and drop or click to browse
              </p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all text-sm"
            >
              Browse Files
            </button>
            <p className="text-xs text-gray-500">
              PDF, PNG, JPG, TIFF, GIF, BMP, WebP (max 10MB each)
              {maxFiles > 1 && ` • Up to ${maxFiles} files`}
            </p>
          </div>
        </div>
      )}

      {/* Document List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-bold">
              Uploaded Documents ({documents.length}/{maxFiles})
            </h4>
            {documents.length > 0 && (
              <button
                onClick={() => setDocuments([])}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          <AnimatePresence>
            {documents.map((doc, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-black/40 border-2 border-white/20 rounded-lg p-4"
              >
                <div className="flex items-center gap-4">
                  {/* File Icon */}
                  <div className="flex-shrink-0 p-3 bg-white/5 border border-white/10 rounded-lg">
                    {getFileIcon(doc.file)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.file.name}</p>
                    <p className="text-sm text-gray-400">
                      {(doc.file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    {doc.processing && (
                      <div className="flex items-center gap-2 text-blue-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Processing...</span>
                      </div>
                    )}

                    {doc.error && (
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">Error</span>
                      </div>
                    )}

                    {doc.result && !doc.processing && !doc.error && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Processed</span>
                      </div>
                    )}

                    {/* Actions */}
                    {doc.result && (
                      <button
                        onClick={() => setPreviewDocument(doc)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    )}

                    <button
                      onClick={() => removeDocument(index)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {doc.error && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-sm text-red-400">{doc.error}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Preview Modal */}
      <DocumentPreviewModal
        document={previewDocument}
        onClose={() => setPreviewDocument(null)}
      />
    </div>
  )
}

/**
 * Document preview modal
 */
function DocumentPreviewModal({
  document,
  onClose,
}: {
  document: UploadedDocument | null
  onClose: () => void
}) {
  if (!document || !document.result) return null

  const isOCR = 'pages' in document.result
  const isForm = 'formType' in document.result

  const handleDownload = () => {
    const text = isOCR ? document.result.text : document.result.rawText || ''
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = window.document.createElement('a')
    a.href = url
    a.download = `${document.file.name}-extracted.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-white/20 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold">Document Preview</h3>
              <p className="text-sm text-gray-400">{document.file.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Download extracted text"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* OCR Result */}
            {isOCR && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400">Confidence</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {((document.result as OCRResult).confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400">Pages</p>
                    <p className="text-2xl font-bold text-green-400">
                      {(document.result as OCRResult).pages.length}
                    </p>
                  </div>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400">Words</p>
                    <p className="text-2xl font-bold text-purple-400">
                      {(document.result as OCRResult).text.split(/\s+/).length}
                    </p>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                  <h4 className="text-sm font-bold mb-2 text-gray-400">Extracted Text</h4>
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                    {(document.result as OCRResult).text}
                  </pre>
                </div>

                {(document.result as OCRResult).tables && (document.result as OCRResult).tables!.length > 0 && (
                  <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                    <h4 className="text-sm font-bold mb-2 text-gray-400">
                      Tables ({(document.result as OCRResult).tables!.length})
                    </h4>
                    {(document.result as OCRResult).tables!.map((table, index) => (
                      <div key={index} className="mb-4 overflow-x-auto">
                        <table className="w-full text-sm border border-white/10">
                          <thead>
                            <tr className="bg-white/5">
                              {table.headers.map((header, i) => (
                                <th key={i} className="border border-white/10 p-2 text-left">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {table.rows.map((row, i) => (
                              <tr key={i}>
                                {row.map((cell, j) => (
                                  <td key={j} className="border border-white/10 p-2">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Form Result */}
            {isForm && (
              <div className="space-y-4">
                {(document.result as FormParseResult).formType && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <p className="text-sm text-gray-400">Detected Form Type</p>
                    <p className="text-xl font-bold text-blue-400">
                      {(document.result as FormParseResult).formType}
                    </p>
                  </div>
                )}

                <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                  <h4 className="text-sm font-bold mb-3 text-gray-400">
                    Extracted Fields ({(document.result as FormParseResult).fields.length})
                  </h4>
                  <div className="space-y-2">
                    {(document.result as FormParseResult).fields.map((field, index) => (
                      <div key={index} className="flex items-start justify-between p-2 bg-white/5 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{field.name}</p>
                          <p className="text-sm text-gray-400">{field.value}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {(field.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
