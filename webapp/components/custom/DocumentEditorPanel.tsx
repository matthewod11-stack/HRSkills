'use client'

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Save, Copy, Check, FileUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentEditorPanelProps {
  content: string;
  documentType?: string;
  employeeName?: string;
  onExport?: (content: string) => Promise<void>;
}

export function DocumentEditorPanel({
  content,
  documentType = 'general',
  employeeName,
  onExport,
}: DocumentEditorPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExport = async () => {
    if (!onExport) return;

    setIsExporting(true);
    try {
      await onExport(editedContent);
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
    a.download = `${documentType}_${employeeName || 'document'}_${new Date().toISOString().split('T')[0]}.md`;
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
      general: 'Document',
    };
    return titles[type] || 'Document';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          <div>
            <h4 className="font-medium">{getDocumentTitle(documentType)}</h4>
            {employeeName && (
              <p className="text-xs text-gray-400">For: {employeeName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Edit/Preview Toggle */}
          <button
            onClick={() => setEditMode(!editMode)}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg text-xs transition-all"
          >
            {editMode ? 'Preview' : 'Edit'}
          </button>

          {/* Copy Button */}
          <button
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

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/30 rounded-lg text-xs transition-all flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>

          {/* Export to Google Docs */}
          {onExport && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-500/70 rounded-lg text-xs transition-all flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileUp className="w-3.5 h-3.5" />
              {isExporting ? 'Exporting...' : 'Export to Docs'}
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {editMode ? (
          /* Edit Mode - Textarea */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full"
          >
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full h-full bg-black/20 border border-white/20 rounded-lg px-4 py-3 text-sm font-mono resize-none focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Edit document content..."
            />
          </motion.div>
        ) : (
          /* Preview Mode - Rendered Markdown */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white/5 border border-white/10 rounded-lg px-6 py-4"
          >
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {editedContent || '*No content generated yet*'}
              </ReactMarkdown>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <div>
            {editMode ? 'Edit mode - Changes are local' : 'Preview mode'}
          </div>
          <div>
            {editedContent.split('\n').length} lines • {editedContent.length} characters
          </div>
        </div>
      </div>
    </div>
  );
}
