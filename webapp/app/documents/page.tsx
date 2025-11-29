'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Calendar,
  Download,
  Eye,
  FileText,
  Filter,
  FolderOpen,
  Search,
  Tag,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface Document {
  id: string;
  name: string;
  category: 'Policy' | 'Handbook' | 'Template' | 'Form' | 'Guide';
  uploadedBy: string;
  uploadedAt: string;
  size: string;
  tags: string[];
}

// Mock data for skeleton
const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Employee Handbook 2025.pdf',
    category: 'Handbook',
    uploadedBy: 'HR Admin',
    uploadedAt: '2025-01-15',
    size: '2.4 MB',
    tags: ['Onboarding', 'Reference'],
  },
  {
    id: '2',
    name: 'PTO Policy.pdf',
    category: 'Policy',
    uploadedBy: 'Benefits Team',
    uploadedAt: '2025-01-10',
    size: '856 KB',
    tags: ['Benefits', 'Leave'],
  },
  {
    id: '3',
    name: 'Performance Review Template.docx',
    category: 'Template',
    uploadedBy: 'People Ops',
    uploadedAt: '2025-01-08',
    size: '124 KB',
    tags: ['Performance', 'Templates'],
  },
  {
    id: '4',
    name: 'Job Description Template.docx',
    category: 'Template',
    uploadedBy: 'Talent Acquisition',
    uploadedAt: '2025-01-07',
    size: '98 KB',
    tags: ['Recruiting', 'Templates', 'Job Postings'],
  },
  {
    id: '5',
    name: 'Offer Letter Template.docx',
    category: 'Template',
    uploadedBy: 'Talent Acquisition',
    uploadedAt: '2025-01-06',
    size: '112 KB',
    tags: ['Recruiting', 'Templates', 'Onboarding'],
  },
  {
    id: '6',
    name: 'Remote Work Guidelines.pdf',
    category: 'Guide',
    uploadedBy: 'HR Admin',
    uploadedAt: '2025-01-05',
    size: '1.2 MB',
    tags: ['Remote', 'Policies'],
  },
];

const categories = ['All', 'Policy', 'Handbook', 'Template', 'Form', 'Guide'];

export default function DocumentLibraryPage() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Policy: 'from-blue-500 to-cyan-500',
      Handbook: 'from-purple-500 to-pink-500',
      Template: 'from-green-500 to-emerald-500',
      Form: 'from-orange-500 to-red-500',
      Guide: 'from-indigo-500 to-purple-500',
    };
    return colors[category] || 'from-gray-500 to-gray-600';
  };

  const getCategoryIcon = (_category: string) => {
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black text-white overflow-hidden">
      {/* Floating background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
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
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Back to home"
                    className="w-12 h-12 bg-white/5 hover:bg-white/10 border-2 border-white/20 hover:border-white/40 rounded-xl flex items-center justify-center transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" aria-hidden="true" />
                  </motion.button>
                </Link>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-7 h-7" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Document Library</h1>
                  <p className="text-sm text-gray-400">Policies, handbooks & templates</p>
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 border-2 border-emerald-400/50 rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center gap-2"
              >
                <Upload className="w-5 h-5" aria-hidden="true" />
                <span>Upload Document</span>
              </motion.button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <main className="max-w-[1800px] mx-auto px-6 py-8">
          {/* Search and Filter Bar */}
          <div className="mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-60" />

              <div className="relative backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-2xl p-6">
                <div className="flex gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <label htmlFor="document-search" className="sr-only">
                      Search documents by name, category, or tags
                    </label>
                    <Search
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      aria-hidden="true"
                    />
                    <input
                      id="document-search"
                      type="search"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      aria-label="Search documents"
                      className="w-full pl-12 pr-4 py-3 bg-black/40 border-2 border-white/30 rounded-xl outline-none focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/30 transition-all placeholder-gray-500"
                    />
                  </div>

                  {/* Filter Button */}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border-2 border-white/30 rounded-xl transition-all flex items-center gap-2"
                  >
                    <Filter className="w-5 h-5" aria-hidden="true" />
                    <span>Filters</span>
                  </motion.button>
                </div>

                {/* Category Tabs */}
                <div className="flex gap-2 mt-4">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategory === category
                          ? 'bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300'
                          : 'bg-white/5 border-2 border-white/20 hover:bg-white/10 text-gray-400'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Document Grid */}
          <h2 className="sr-only">Available Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockDocuments.map((doc, index) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative group"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${getCategoryColor(doc.category)}/10 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-60`}
                />

                <div className="relative backdrop-blur-xl bg-black/40 border-2 border-white/30 rounded-2xl p-6 hover:border-white/40 transition-all h-full flex flex-col">
                  {/* Document Icon & Category */}
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getCategoryColor(doc.category)} flex items-center justify-center`}
                    >
                      {getCategoryIcon(doc.category)}
                    </div>
                    <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-xs font-medium">
                      {doc.category}
                    </span>
                  </div>

                  {/* Document Name */}
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{doc.name}</h3>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {doc.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded text-xs text-emerald-300"
                      >
                        <Tag className="w-3 h-3 inline mr-1" aria-hidden="true" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Metadata */}
                  <div className="mt-auto space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" aria-hidden="true" />
                      <span>{doc.uploadedBy}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" aria-hidden="true" />
                      <span>{doc.uploadedAt}</span>
                    </div>
                    <div className="text-xs text-gray-500">{doc.size}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/20">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                      aria-label="Preview document"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4 text-blue-300" aria-hidden="true" />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 p-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                      aria-label="Download document"
                      title="Download"
                    >
                      <Download className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg transition-colors flex items-center justify-center"
                      aria-label="Delete document"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-300" aria-hidden="true" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Empty State (hidden when there are documents) */}
          {mockDocuments.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative group mt-12"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl blur-2xl group-hover:blur-3xl transition-all opacity-60" />

              <div className="relative backdrop-blur-2xl bg-black/40 border-2 border-white/30 rounded-3xl p-16 text-center">
                <FolderOpen className="w-24 h-24 mx-auto mb-6 text-gray-600" aria-hidden="true" />
                <h2 className="text-2xl font-bold mb-2">No Documents Yet</h2>
                <p className="text-gray-400 mb-6">
                  Upload your first policy, handbook, or template to get started
                </p>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 border-2 border-emerald-400/50 rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center gap-2 mx-auto"
                >
                  <Upload className="w-5 h-5" aria-hidden="true" />
                  <span>Upload Your First Document</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
