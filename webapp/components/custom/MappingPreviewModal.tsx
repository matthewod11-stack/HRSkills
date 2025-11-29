'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check, X } from 'lucide-react';
import { useState } from 'react';
import {
  CANONICAL_FIELDS,
  type ColumnMapping,
  type UploadPreview,
} from '@/lib/types/master-employee';

interface MappingPreviewModalProps {
  preview: UploadPreview;
  onConfirm: (adjustedMappings: ColumnMapping[]) => void;
  onCancel: () => void;
}

export function MappingPreviewModal({ preview, onConfirm, onCancel }: MappingPreviewModalProps) {
  const [mappings, setMappings] = useState<ColumnMapping[]>(preview.column_mappings);
  const [activeTab, setActiveTab] = useState<'mappings' | 'conflicts' | 'preview'>('mappings');

  const handleMappingChange = (index: number, newCanonicalField: string | null) => {
    const updated = [...mappings];
    updated[index] = {
      ...updated[index],
      canonical_field: newCanonicalField,
      is_custom: newCanonicalField === null,
      confidence: newCanonicalField ? 1.0 : 0,
    };
    setMappings(updated);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400';
    if (confidence >= 0.7) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return '✓ High';
    if (confidence >= 0.7) return '⚠ Medium';
    return '✗ Low';
  };

  const canonicalFieldOptions = Object.entries(CANONICAL_FIELDS).map(([key, meta]) => ({
    value: key,
    label: meta.display_name,
    category: meta.category,
  }));

  // Group by category
  const groupedOptions = canonicalFieldOptions.reduce(
    (acc, option) => {
      if (!acc[option.category]) acc[option.category] = [];
      acc[option.category].push(option);
      return acc;
    },
    {} as Record<string, typeof canonicalFieldOptions>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 border-2 border-white/20 rounded-2xl p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Review Column Mappings</h2>
            <p className="text-gray-400">
              {preview.file_name} • {preview.row_count} rows
            </p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="text-green-400">{preview.new_employees} new employees</span>
              <span className="text-blue-400">{preview.existing_employees} updates</span>
              {preview.conflicts.length > 0 && (
                <span className="text-yellow-400">{preview.conflicts.length} conflicts</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('mappings')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'mappings'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Column Mappings ({mappings.length})
          </button>
          {preview.conflicts.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('conflicts')}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                activeTab === 'conflicts'
                  ? 'border-yellow-500 text-yellow-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              Conflicts ({preview.conflicts.length})
            </button>
          )}
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              activeTab === 'preview'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            Data Preview
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'mappings' && (
            <div className="space-y-2">
              {mappings.map((mapping, index) => (
                <div
                  key={index}
                  className="p-3 bg-white/5 border border-white/10 rounded-lg flex items-center gap-4"
                >
                  <div className="flex-1">
                    <div className="font-medium">{mapping.source_column}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Sample:{' '}
                      {mapping.sample_values
                        .slice(0, 2)
                        .map((v) => String(v || '—'))
                        .join(', ')}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-gray-600" />

                  <div className="flex-1">
                    <select
                      value={mapping.canonical_field || 'custom'}
                      onChange={(e) =>
                        handleMappingChange(
                          index,
                          e.target.value === 'custom' ? null : e.target.value
                        )
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-white/20 rounded-lg text-sm"
                    >
                      <option value="custom">→ Custom Field (Not Mapped)</option>
                      {Object.entries(groupedOptions).map(([category, options]) => (
                        <optgroup key={category} label={category.toUpperCase()}>
                          {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className={`text-xs font-medium ${getConfidenceColor(mapping.confidence)}`}>
                    {getConfidenceBadge(mapping.confidence)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div className="space-y-2">
              {preview.conflicts.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Check className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <p>No conflicts detected!</p>
                  <p className="text-sm mt-1">All updates will merge cleanly.</p>
                </div>
              ) : (
                preview.conflicts.map((conflict, index) => (
                  <div
                    key={index}
                    className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium text-yellow-200">
                          {conflict.employee_id} • {conflict.field_name}
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-400">Existing Value:</div>
                            <div className="text-white mt-1">{String(conflict.existing_value)}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">New Value:</div>
                            <div className="text-white mt-1">{String(conflict.new_value)}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-400">
                          → Will use new value by default
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-800">
                  <tr>
                    {mappings.map((mapping, index) => (
                      <th
                        key={index}
                        className="px-3 py-2 text-left font-semibold border-b-2 border-white/20 whitespace-nowrap"
                      >
                        <div>{mapping.source_column}</div>
                        <div className="text-xs font-normal text-gray-500 mt-1">
                          → {mapping.canonical_field || 'custom'}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sample_data.map((row, idx) => (
                    <tr key={idx} className="border-b border-white/10 hover:bg-white/5">
                      {mappings.map((mapping, colIdx) => (
                        <td key={colIdx} className="px-3 py-2 whitespace-nowrap">
                          {row[mapping.source_column] !== null &&
                          row[mapping.source_column] !== undefined
                            ? String(row[mapping.source_column])
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onConfirm(mappings)}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Confirm & Import
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
