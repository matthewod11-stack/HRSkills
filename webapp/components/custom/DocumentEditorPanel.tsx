'use client';

import { motion } from 'framer-motion';
import { Check, Clipboard, Download, FileText } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { copyToClipboard, exportToDocx } from '@/lib/export/docx-export';
import {
  getTemplateById,
  getTemplatesByCategory,
  HR_TEMPLATE_CATEGORIES,
  HR_TEMPLATES,
  type TemplateCategory,
} from '@/lib/templates/hr-templates';

type EditorContentSource = 'library' | 'generated' | 'default';

export interface DocumentExportPayload {
  content: string;
  documentType: string;
  format: 'docx' | 'clipboard';
  employeeName?: string;
  templateId?: string;
}

interface DocumentEditorPanelProps {
  content?: string;
  documentType?: string;
  employeeName?: string;
  generatedContent?: string;
  onExport?: (payload: DocumentExportPayload) => void;
}

function getDefaultDocumentTemplate(documentType: string, employeeName?: string): string {
  const name = employeeName ?? '[Employee Name]';

  switch (documentType) {
    case 'pip':
      return `# Performance Improvement Plan

**Employee:** ${name}
**Date:** ${new Date().toLocaleDateString()}

## Purpose
This Performance Improvement Plan outlines expectations and support to help the employee meet performance standards.

## Areas for Improvement
1. [Area 1]
2. [Area 2]

## Goals
- [Goal 1]
- [Goal 2]

## Timeline
- 30 days: [Checkpoint 1]
- 60 days: [Checkpoint 2]
- 90 days: [Final Review]
`;
    case 'offer_letter':
      return `# Offer Letter

**Date:** ${new Date().toLocaleDateString()}

Dear ${name},

We are pleased to offer you the position of [Role] at [Company].

## Position Details
- **Title:** [Title]
- **Start Date:** [Date]
- **Salary:** [Amount]
- **Benefits:** [Summary]

Please confirm your acceptance by [Date].

Sincerely,
[Your Name]
`;
    case 'job_description':
      return `# Job Description

## Role Overview
[Brief description of the role]

## Responsibilities
- [Responsibility 1]
- [Responsibility 2]

## Requirements
- [Requirement 1]
- [Requirement 2]

## Compensation
[Salary range and benefits]
`;
    default:
      return `# Document Draft

Provide context here and customize as needed.

**For:** ${name || '[Recipient]'}
**Date:** ${new Date().toLocaleDateString()}
`;
  }
}

export function DocumentEditorPanel({
  content,
  documentType = 'general',
  employeeName,
  generatedContent,
  onExport,
}: DocumentEditorPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Template selection state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

  const normalizedDocumentType = documentType ?? 'general';
  const defaultTemplate = useMemo(
    () => getDefaultDocumentTemplate(normalizedDocumentType, employeeName),
    [normalizedDocumentType, employeeName]
  );

  // Calculate content baselines for different sources
  const sourceBaselines = useMemo(() => {
    const selectedTemplate = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;
    const libraryContent = selectedTemplate?.content ?? '';
    const generatedBaseline =
      generatedContent && generatedContent.trim().length > 0 ? generatedContent : '';

    return {
      library: libraryContent,
      generated: generatedBaseline,
      default: defaultTemplate,
    };
  }, [selectedTemplateId, generatedContent, defaultTemplate]);

  // Determine available content sources
  const availableSources = useMemo<EditorContentSource[]>(() => {
    const sources: EditorContentSource[] = [];

    if (sourceBaselines.library && sourceBaselines.library.trim().length > 0) {
      sources.push('library');
    }

    if (
      sourceBaselines.generated &&
      sourceBaselines.generated.trim().length > 0 &&
      sourceBaselines.generated.trim() !== sourceBaselines.library.trim()
    ) {
      sources.push('generated');
    }

    if (sources.length === 0) {
      sources.push('default');
    }

    return sources;
  }, [sourceBaselines]);

  const initialSource = availableSources[0] ?? 'default';
  const [activeSource, setActiveSource] = useState<EditorContentSource>(initialSource);
  const [sourceDrafts, setSourceDrafts] = useState<Record<EditorContentSource, string>>({
    library: sourceBaselines.library,
    generated: sourceBaselines.generated,
    default: sourceBaselines.default,
  });
  const [dirtySources, setDirtySources] = useState<Record<EditorContentSource, boolean>>({
    library: false,
    generated: false,
    default: false,
  });
  const [editedContent, setEditedContent] = useState<string>(
    content || sourceBaselines[initialSource] || ''
  );

  const activeSourceRef = useRef<EditorContentSource>(initialSource);

  useEffect(() => {
    activeSourceRef.current = activeSource;
  }, [activeSource]);

  // Update when source baselines change
  useEffect(() => {
    setSourceDrafts({
      library: sourceBaselines.library,
      generated: sourceBaselines.generated,
      default: sourceBaselines.default,
    });

    const preferredSource = activeSourceRef.current;
    const nextSource = availableSources.includes(preferredSource)
      ? preferredSource
      : (availableSources[0] ?? 'default');

    activeSourceRef.current = nextSource;
    setActiveSource(nextSource);
    setEditedContent(sourceBaselines[nextSource] ?? '');
    setDirtySources({
      library: false,
      generated: false,
      default: false,
    });
  }, [sourceBaselines, availableSources]);

  // Handle template selection
  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = getTemplateById(templateId);
    if (template) {
      setEditedContent(template.content);
      setActiveSource('library');
    }
  }, []);

  const handleContentChange = (value: string) => {
    setEditedContent(value);
    setSourceDrafts((prev) => ({
      ...prev,
      [activeSource]: value,
    }));
    setDirtySources((prev) => ({
      ...prev,
      [activeSource]: value.trim() !== (sourceBaselines[activeSource]?.trim() ?? ''),
    }));
  };

  const handleSourceChange = (nextSource: EditorContentSource) => {
    if (nextSource === activeSource) return;

    const updatedDrafts = {
      ...sourceDrafts,
      [activeSource]: editedContent,
    };
    const nextContent = updatedDrafts[nextSource] ?? sourceBaselines[nextSource] ?? '';

    setSourceDrafts(updatedDrafts);
    setActiveSource(nextSource);
    activeSourceRef.current = nextSource;
    setEditedContent(nextContent);
    setDirtySources((prev) => ({
      ...prev,
      [activeSource]: editedContent.trim() !== (sourceBaselines[activeSource]?.trim() ?? ''),
      [nextSource]: nextContent.trim() !== (sourceBaselines[nextSource]?.trim() ?? ''),
    }));
  };

  // DOCX download handler
  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const selectedTemplate = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;
      const docType = selectedTemplate?.name ?? normalizedDocumentType;
      await exportToDocx(editedContent, docType, employeeName);

      onExport?.({
        content: editedContent,
        documentType: docType,
        format: 'docx',
        employeeName,
        templateId: selectedTemplateId ?? undefined,
      });
    } catch (err) {
      console.error('Failed to export DOCX:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Clipboard copy handler
  const handleCopy = async () => {
    const success = await copyToClipboard(editedContent);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);

      onExport?.({
        content: editedContent,
        documentType: normalizedDocumentType,
        format: 'clipboard',
        employeeName,
        templateId: selectedTemplateId ?? undefined,
      });
    }
  };

  const getDocumentTitle = (type: string) => {
    const selectedTemplate = selectedTemplateId ? getTemplateById(selectedTemplateId) : null;
    if (selectedTemplate) {
      return selectedTemplate.name;
    }

    const titles: Record<string, string> = {
      offer_letter: 'Offer Letter',
      pip: 'Performance Improvement Plan',
      job_description: 'Job Description',
      policy: 'Policy Document',
      performance_review: 'Performance Review',
      termination_letter: 'Termination Letter',
      interview_guide: 'Interview Guide',
      onboarding_checklist: 'Onboarding Checklist',
      custom: 'Document',
      general: 'Document',
    };
    return titles[type] || 'Document';
  };

  const sourceLabels: Record<EditorContentSource, string> = {
    library: 'Template',
    generated: 'AI Draft',
    default: 'Starter',
  };

  const sourceOptions = availableSources.map((source) => ({
    key: source,
    label: sourceLabels[source],
  }));

  const isDirty = dirtySources[activeSource] ?? false;

  // Get templates for dropdown
  const filteredTemplates =
    selectedCategory === 'all'
      ? HR_TEMPLATES
      : getTemplatesByCategory(selectedCategory as TemplateCategory);

  return (
    <div className="flex flex-col h-full p-6">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-sage/20">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-sage" />
          <div>
            <h4 className="font-medium text-charcoal">
              {getDocumentTitle(normalizedDocumentType)}
            </h4>
            {employeeName && <p className="text-xs text-charcoal-soft">For: {employeeName}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sourceOptions.length > 1 && (
            <div className="flex items-center gap-2 pr-3 mr-1 border-r border-sage/20">
              <span className="text-xs text-charcoal-soft">Source</span>
              <div className="flex bg-cream border border-warm rounded-xl p-0.5">
                {sourceOptions.map((option) => (
                  <button
                    type="button"
                    key={option.key}
                    onClick={() => handleSourceChange(option.key)}
                    className={`px-2.5 py-1 text-xs rounded-lg transition-all ${
                      activeSource === option.key
                        ? 'bg-sage/30 text-charcoal font-medium'
                        : 'text-charcoal-light hover:text-charcoal hover:bg-sage/10'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className="px-3 py-1.5 bg-cream-white hover:bg-sage/10 border border-warm hover:border-sage/30 rounded-xl text-xs font-medium text-charcoal transition-all shadow-soft"
          >
            {editMode ? 'Preview' : 'Edit'}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 bg-cream-white hover:bg-sage/10 border border-warm hover:border-sage/30 rounded-xl text-xs font-medium text-charcoal transition-all shadow-soft flex items-center gap-1"
          >
            {copySuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-sage" />
                Copied
              </>
            ) : (
              <>
                <Clipboard className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="px-3 py-1.5 bg-terracotta/10 hover:bg-terracotta hover:text-cream-white border border-terracotta/50 hover:border-terracotta rounded-xl text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed shadow-soft hover:shadow-warm"
          >
            <Download className="w-3.5 h-3.5" />
            {isExporting ? 'Exporting...' : 'Download DOCX'}
          </button>
        </div>
      </div>

      {/* Template Selector */}
      <div className="flex-shrink-0 mb-4 flex flex-wrap items-center gap-3">
        <label className="text-xs font-medium text-charcoal-soft">Template:</label>

        {/* Category Filter */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as TemplateCategory | 'all')}
          className="text-xs border border-warm rounded-lg px-2 py-1.5 bg-cream-white text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/40"
        >
          <option value="all">All Categories</option>
          {Object.entries(HR_TEMPLATE_CATEGORIES).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {/* Template Dropdown */}
        <select
          value={selectedTemplateId ?? ''}
          onChange={(e) => {
            if (e.target.value) {
              handleTemplateSelect(e.target.value);
            }
          }}
          className="flex-1 min-w-[200px] text-xs border border-warm rounded-lg px-2 py-1.5 bg-cream-white text-charcoal focus:outline-none focus:ring-2 focus:ring-sage/40"
        >
          <option value="">Select a template...</option>
          {filteredTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} - {template.description}
            </option>
          ))}
        </select>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full bg-white text-gray-900 rounded-xl border border-gray-200 shadow-lg overflow-y-auto">
          {editMode ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
              <textarea
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full bg-transparent text-gray-900 px-4 py-3 text-sm font-mono resize-none rounded-xl focus:outline-none focus:border-sage focus:ring-2 focus:ring-sage/40 border-none"
                placeholder="Edit document content..."
              />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 py-5">
              <div className="prose prose-neutral prose-sm max-w-none text-gray-900">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {editedContent || '*No content available yet*'}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-sage/20">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-charcoal-light">
          <div className="flex items-center gap-2">
            <span>{editMode ? 'Edit mode - Changes are local' : 'Preview mode'}</span>
            {isDirty && <span className="text-amber font-medium">Unsaved edits</span>}
            {selectedTemplateId && (
              <span className="text-sage">
                Template: {getTemplateById(selectedTemplateId)?.name}
              </span>
            )}
          </div>
          <div>
            {editedContent.split('\n').length} lines • {editedContent.length} characters
          </div>
        </div>
      </div>
    </div>
  );
}
