'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Globe, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Language {
  code: string;
  name: string;
}

interface LanguageSelectorProps {
  value: string;
  onChange: (languageCode: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
  preset?: 'global_hr' | 'european' | 'asian' | 'americas' | 'top_5';
}

/**
 * Language selector dropdown with search
 */
export function LanguageSelector({
  value,
  onChange,
  label = 'Language',
  placeholder = 'Select language',
  className = '',
  showSearch = true,
  preset,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [_loading, _setLoading] = useState(false);

  // Predefined language presets
  const PRESETS: Record<string, Language[]> = {
    global_hr: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'it', name: 'Italian' },
      { code: 'ru', name: 'Russian' },
    ],
    european: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'nl', name: 'Dutch' },
      { code: 'pl', name: 'Polish' },
      { code: 'sv', name: 'Swedish' },
      { code: 'da', name: 'Danish' },
    ],
    asian: [
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'th', name: 'Thai' },
      { code: 'vi', name: 'Vietnamese' },
      { code: 'id', name: 'Indonesian' },
      { code: 'ms', name: 'Malay' },
      { code: 'hi', name: 'Hindi' },
    ],
    americas: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'fr', name: 'French' },
    ],
    top_5: [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
    ],
  };

  useEffect(() => {
    // Use preset if provided, otherwise fetch all languages
    if (preset && PRESETS[preset]) {
      setLanguages(PRESETS[preset]);
    } else {
      // In a real app, fetch from API
      setLanguages(PRESETS.global_hr);
    }
  }, [preset]);

  const filteredLanguages = languages.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedLanguage = languages.find((lang) => lang.code === value);

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}

      {/* Dropdown trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 border-2 border-white/20 rounded-xl px-4 py-3 flex items-center justify-between hover:border-white/30 transition-all"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <span className="text-white">
            {selectedLanguage ? selectedLanguage.name : placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-black/95 backdrop-blur-xl border-2 border-white/20 rounded-xl shadow-2xl overflow-hidden"
            >
              {showSearch && (
                <div className="p-3 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search languages..."
                      className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 transition-colors"
                    />
                  </div>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto">
                {filteredLanguages.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No languages found</div>
                ) : (
                  filteredLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        onChange(lang.code);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/10 transition-colors"
                    >
                      <span className="text-white">{lang.name}</span>
                      {value === lang.code && <Check className="w-5 h-5 text-green-400" />}
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

interface TranslationPreviewProps {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  onClose: () => void;
  onConfirm?: () => void;
  isOpen: boolean;
}

/**
 * Modal to preview translation before confirming
 */
export function TranslationPreview({
  originalText,
  translatedText,
  sourceLanguage,
  targetLanguage,
  onClose,
  onConfirm,
  isOpen,
}: TranslationPreviewProps) {
  if (!isOpen) return null;

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
          className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-white/20 rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Globe className="w-6 h-6 text-blue-400" />
            Translation Preview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Original */}
            <div>
              <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide">
                Original ({sourceLanguage})
              </p>
              <div className="bg-black/40 border border-white/10 rounded-lg p-4 min-h-[200px]">
                <p className="text-gray-200 whitespace-pre-wrap">{originalText}</p>
              </div>
            </div>

            {/* Translated */}
            <div>
              <p className="text-sm text-gray-400 mb-2 uppercase tracking-wide">
                Translated ({targetLanguage})
              </p>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 min-h-[200px]">
                <p className="text-white whitespace-pre-wrap">{translatedText}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            {onConfirm && (
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
              >
                Confirm Translation
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface TranslationResult {
  text: string;
  originalText: string;
  sourceLanguage: string;
  targetLanguage: string;
}

interface TranslationButtonProps {
  text: string;
  targetLanguage?: string;
  onTranslated?: (result: TranslationResult) => void;
  className?: string;
  variant?: 'button' | 'icon';
}

/**
 * Button to trigger translation
 */
export function TranslationButton({
  text,
  targetLanguage = 'es',
  onTranslated,
  className = '',
  variant = 'button',
}: TranslationButtonProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);

  const handleTranslate = async () => {
    setIsTranslating(true);
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguage,
          detectSource: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTranslationResult(result.data);
        setShowPreview(true);
        if (onTranslated) {
          onTranslated(result.data);
        }
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={handleTranslate}
          disabled={isTranslating}
          className={`p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 ${className}`}
          title="Translate"
        >
          {isTranslating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Globe className="w-4 h-4" />
          )}
        </button>

        {translationResult && (
          <TranslationPreview
            isOpen={showPreview}
            originalText={translationResult.originalText}
            translatedText={translationResult.text}
            sourceLanguage={translationResult.sourceLanguage}
            targetLanguage={translationResult.targetLanguage}
            onClose={() => setShowPreview(false)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTranslate}
        disabled={isTranslating}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 ${className}`}
      >
        {isTranslating ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Translating...</span>
          </>
        ) : (
          <>
            <Globe className="w-4 h-4" />
            <span>Translate</span>
          </>
        )}
      </button>

      {translationResult && (
        <TranslationPreview
          isOpen={showPreview}
          originalText={translationResult.originalText}
          translatedText={translationResult.text}
          sourceLanguage={translationResult.sourceLanguage}
          targetLanguage={translationResult.targetLanguage}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}
