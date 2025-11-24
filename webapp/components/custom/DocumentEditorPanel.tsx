'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, Check, Copy, Download, ExternalLink, FileText, FileUp } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type EditorContentSource = 'template' | 'generated' | 'default';

interface DriveTemplateMetadata {
  id: string;
  name: string;
  skillName?: string;
  webViewLink?: string;
  matchConfidence?: number;
  matchReason?: string;
  source?: 'environment' | 'keyword';
  content?: string;
}

export interface DocumentExportPayload {
  content: string;
  documentType: string;
  source: EditorContentSource;
  templateId?: string;
  templateName?: string;
  employeeName?: string;
}

interface DocumentEditorPanelProps {
  content: string;
  documentType?: string;
  employeeName?: string;
  generatedContent?: string;
  driveTemplate?: DriveTemplateMetadata;
  driveTemplateError?: string;
  driveTemplateNeedsAuth?: boolean;
  onExport?: (payload: DocumentExportPayload) => Promise<void>;
}

function resolveInitialContent(content: string | undefined, fallback: string): string {
  if (content && content.trim().length > 0) {
    return content;
  }
  return fallback;
}

function getDefaultDocumentTemplate(documentType: string, employeeName?: string): string {
  switch (documentType) {
    case 'pip':
      return buildPipTemplate(employeeName);
    case 'offer_letter':
      return buildOfferLetterTemplate(employeeName);
    case 'job_description':
      return buildJobDescriptionTemplate();
    default:
      return '# Document Draft\n\nProvide context here and customize as needed.';
  }
}

function buildPipTemplate(employeeName?: string): string {
  const name = employeeName ?? '[Employee Name]';
  return `PERFORMANCE IMPROVEMENT PLAN

Employee: ${name}
Title: [Title]
Manager: [Manager Name]
Department: [Department]
Date: [Date]
Review Period: [Start Date] – [End Date]

---

## Purpose of this Plan

This Performance Improvement Plan (PIP) outlines expectations, support, and checkpoints to help ${name} meet the performance standards of the role. The goal is successful improvement and continued employment.

---

## Performance Issues

### Issue 1: [Describe the first performance gap]
- Examples / evidence (include dates, metrics, missed expectations)
- Impact on team / business
- Expected performance standard

### Issue 2: [Describe the second performance gap]
- Examples / evidence
- Impact on team / business
- Expected performance standard

---

## Improvement Goals

### Goal 1: [Goal name]
- **Success criteria:** List measurable outcomes.
- **Measurement:** How progress will be tracked.
- **Support/resources:** Coaching, tools, or training provided.

### Goal 2: [Goal name]
- **Success criteria:** …
- **Measurement:** …
- **Support/resources:** …

---

## Support & Resources

- Training / enablement:
  - [Course or workshop]
  - [Mentor or shadowing plan]
- Tools / access to be provided
- Other support commitments

---

## Check-in Schedule

- Weekly 1:1s every [Day/Time] with [Manager]
- Mid-point review on [Date]
- Final review on [Date]

Each check-in will cover progress against goals, blockers, and next steps. Notes will be documented and shared after every meeting.

---

## Outcomes

- **Successful completion:** All goals met; PIP closed and expectations reaffirmed.
- **Extension:** Used only if substantial progress is demonstrated but goals not yet met.
- **Termination:** If improvement is insufficient or expectations are not met within the review period.

---

## Acknowledgment

I acknowledge receipt of this Performance Improvement Plan and understand the expectations, support, and potential outcomes.

Employee Signature: ______________________    Date: __________

Manager Signature: _______________________    Date: __________

HR Signature: ____________________________    Date: __________

---

## Employee Comments

[Space for the employee to add comments or questions]`;
}

function buildOfferLetterTemplate(employeeName?: string): string {
  const name = employeeName ?? '[Candidate Name]';
  return `# Offer Letter Draft

Dear ${name},

We are pleased to offer you the position of [Role] at [Company]. Please review the summary below and customize the details as needed:

- **Start Date:** [Start Date]
- **Manager:** [Manager Name]
- **Base Salary:** [Amount] per [year/hour]
- **Bonus/Commission:** [Details]
- **Benefits:** [Health, retirement, equity, etc.]
- **Work Location:** [Remote/Onsite/Hybrid]
- **Additional Terms:** [Probationary period, contingencies, etc.]

Please confirm acceptance by [Acceptance Deadline]. We are excited to have you join the team!

Sincerely,

[Your Name]
[Title]
[Company]`;
}

function buildJobDescriptionTemplate(): string {
  return `# Job Description Draft

## Role Overview

Provide a concise overview of the role, key mission, and how it contributes to the organization.

## Responsibilities

- Responsibility 1
- Responsibility 2
- Responsibility 3

## Required Qualifications

- Skill or experience 1
- Skill or experience 2
- Skill or experience 3

## Preferred Qualifications

- Nice-to-have 1
- Nice-to-have 2

## Success Metrics

Outline how success will be measured in this role (e.g., KPIs, OKRs, deliverables).

## Compensation & Benefits

- Compensation range: [Range]
- Benefits highlights: [Health, retirement, equity]

## About the Team

Add a short paragraph about the team culture, structure, and collaboration style.`;
}

export function DocumentEditorPanel({
  content,
  documentType = 'general',
  employeeName,
  generatedContent,
  driveTemplate,
  driveTemplateError,
  driveTemplateNeedsAuth,
  onExport,
}: DocumentEditorPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const normalizedDocumentType = documentType ?? 'general';
  const defaultTemplate = useMemo(
    () => getDefaultDocumentTemplate(normalizedDocumentType, employeeName),
    [normalizedDocumentType, employeeName]
  );

  const normalizedContent = useMemo(
    () => resolveInitialContent(content, defaultTemplate),
    [content, defaultTemplate]
  );

  const sourceBaselines = useMemo(() => {
    const templateContent = driveTemplate?.content ?? (driveTemplate ? normalizedContent : '');
    const generatedBaseline =
      generatedContent && generatedContent.trim().length > 0
        ? generatedContent
        : !templateContent
          ? normalizedContent
          : '';

    return {
      template: templateContent,
      generated: generatedBaseline,
      default: defaultTemplate,
    };
  }, [driveTemplate, generatedContent, normalizedContent, defaultTemplate]);

  const availableSources = useMemo<EditorContentSource[]>(() => {
    const sources: EditorContentSource[] = [];

    if (sourceBaselines.template && sourceBaselines.template.trim().length > 0) {
      sources.push('template');
    }

    if (
      sourceBaselines.generated &&
      sourceBaselines.generated.trim().length > 0 &&
      (!sourceBaselines.template ||
        sourceBaselines.generated.trim() !== sourceBaselines.template.trim())
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
    template: sourceBaselines.template,
    generated: sourceBaselines.generated,
    default: sourceBaselines.default,
  });
  const [dirtySources, setDirtySources] = useState<Record<EditorContentSource, boolean>>({
    template: false,
    generated: false,
    default: false,
  });
  const [editedContent, setEditedContent] = useState<string>(sourceBaselines[initialSource] ?? '');

  const activeSourceRef = useRef<EditorContentSource>(initialSource);

  useEffect(() => {
    activeSourceRef.current = activeSource;
  }, [activeSource]);

  useEffect(() => {
    setSourceDrafts({
      template: sourceBaselines.template,
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
      template: false,
      generated: false,
      default: false,
    });
  }, [sourceBaselines, availableSources]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

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

  const handleExport = async () => {
    if (!onExport) return;

    setIsExporting(true);
    try {
      await onExport({
        content: editedContent,
        documentType: normalizedDocumentType,
        source: activeSource,
        templateId: driveTemplate?.id,
        templateName: driveTemplate?.name,
        employeeName,
      });
    } catch (err) {
      console.error('Failed to export:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editedContent], { type: 'text/markdown' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${normalizedDocumentType}_${employeeName || 'document'}_${
      new Date().toISOString().split('T')[0]
    }.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getDocumentTitle = (type: string) => {
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
    template: 'Template',
    generated: 'AI Draft',
    default: 'Starter',
  };

  const sourceOptions = availableSources.map((source) => ({
    key: source,
    label: sourceLabels[source],
  }));

  const isDirty = dirtySources[activeSource] ?? false;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-emerald-500/20">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          <div>
            <h4 className="font-medium text-emerald-100">
              {getDocumentTitle(normalizedDocumentType)}
            </h4>
            {employeeName && <p className="text-xs text-emerald-200/70">For: {employeeName}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sourceOptions.length > 1 && (
            <div className="flex items-center gap-2 pr-3 mr-1 border-r border-white/10">
              <span className="text-xs text-emerald-200/70">Source</span>
              <div className="flex bg-white/5 border border-white/10 rounded-lg p-0.5">
                {sourceOptions.map((option) => (
                  <button
                    type="button"
                    key={option.key}
                    onClick={() => handleSourceChange(option.key)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                      activeSource === option.key
                        ? 'bg-emerald-500/30 text-emerald-900 font-medium'
                        : 'text-emerald-100/80 hover:text-emerald-50 hover:bg-white/10'
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
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg text-xs transition-all"
          >
            {editMode ? 'Preview' : 'Edit'}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg text-xs transition-all flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg text-xs transition-all flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>

          {onExport && (
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/70 rounded-lg text-xs transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileUp className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting...' : 'Export to Docs'}
            </button>
          )}
        </div>
      </div>

      {driveTemplate && (
        <div className="flex-shrink-0 mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100/80">
          <div className="flex items-center gap-2">
            <span className="font-medium text-emerald-200">
              Google Drive template: {driveTemplate.name}
            </span>
            {driveTemplate.matchReason && (
              <span className="text-emerald-200/60">({driveTemplate.matchReason})</span>
            )}
          </div>
          {driveTemplate.webViewLink && (
            <a
              href={driveTemplate.webViewLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald-200 hover:text-emerald-100 transition-colors"
            >
              Open in Drive
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {driveTemplateError && (
        <div className="flex-shrink-0 mb-3 flex items-start gap-2 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">
              {driveTemplateNeedsAuth
                ? 'Connect Google Drive to load the latest company templates.'
                : 'Unable to load Google Drive templates.'}
            </p>
            <p className="opacity-80">{driveTemplateError}</p>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-full bg-white text-gray-900 rounded-xl border border-gray-200 shadow-lg">
          {editMode ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
              <textarea
                value={editedContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full bg-transparent text-gray-900 px-4 py-3 text-sm font-mono resize-none rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/40 border-none"
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
      <div className="flex-shrink-0 mt-4 pt-4 border-t border-emerald-500/20">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100/80">
          <div className="flex items-center gap-2">
            <span>{editMode ? 'Edit mode - Changes are local' : 'Preview mode'}</span>
            {isDirty && <span className="text-amber-200">Unsaved edits</span>}
            <span className="text-emerald-200/70">Source: {sourceLabels[activeSource]}</span>
          </div>
          <div>
            {editedContent.split('\n').length} lines • {editedContent.length} characters
          </div>
        </div>
      </div>
    </div>
  );
}
