'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Search,
  Download,
  Copy,
  Users,
  Clock,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react'
import type { TranscriptionResult, TranscriptSegment, TranscriptWord } from '@/lib/ai-services/speech-service'
import { formatTimestamp } from '@/lib/ai-services/speech-service'

interface TranscriptViewerProps {
  transcript: TranscriptionResult
  className?: string
  onTimestampClick?: (timeSeconds: number) => void
  showSpeakerLabels?: boolean
  showTimestamps?: boolean
  showConfidence?: boolean
  enableSearch?: boolean
}

/**
 * Interactive transcript viewer with speaker labels, timestamps, and search
 */
export function TranscriptViewer({
  transcript,
  className = '',
  onTimestampClick,
  showSpeakerLabels = true,
  showTimestamps = true,
  showConfidence = false,
  enableSearch = true,
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSpeaker, setSelectedSpeaker] = useState<number | null>(null)
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set())

  // Filter segments by search and speaker
  const filteredSegments = useMemo(() => {
    let segments = transcript.segments

    if (selectedSpeaker !== null) {
      segments = segments.filter(s => s.speaker === selectedSpeaker)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      segments = segments.filter(s =>
        s.text.toLowerCase().includes(query)
      )
    }

    return segments
  }, [transcript.segments, searchQuery, selectedSpeaker])

  // Get unique speakers
  const speakers = useMemo(() => {
    const speakerSet = new Set(transcript.segments.map(s => s.speaker))
    return Array.from(speakerSet).sort()
  }, [transcript.segments])

  const toggleSegment = (index: number) => {
    const newExpanded = new Set(expandedSegments)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSegments(newExpanded)
  }

  const handleCopyTranscript = () => {
    const text = transcript.segments
      .map(s => `Speaker ${s.speaker}: ${s.text}`)
      .join('\n\n')
    navigator.clipboard.writeText(text)
  }

  const handleDownloadTranscript = () => {
    const text = transcript.segments
      .map(s => {
        const timestamp = formatTimestamp(s.startTime)
        return `[${timestamp}] Speaker ${s.speaker}: ${s.text}`
      })
      .join('\n\n')

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getSpeakerColor = (speaker: number) => {
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-green-500 to-emerald-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-purple-500',
      'from-yellow-500 to-amber-500',
    ]
    return colors[(speaker - 1) % colors.length]
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400'
    if (confidence >= 0.7) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className={`bg-black/40 border-2 border-white/20 rounded-xl ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              Transcript
            </h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {formatTimestamp(transcript.duration)}
              </span>
              {transcript.speakerCount && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {transcript.speakerCount} speakers
                </span>
              )}
              <span>
                {transcript.words.length} words
              </span>
              {showConfidence && (
                <span className={getConfidenceColor(transcript.confidence)}>
                  {(transcript.confidence * 100).toFixed(0)}% confidence
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyTranscript}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Copy transcript"
            >
              <Copy className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownloadTranscript}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Download transcript"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        {enableSearch && (
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transcript..."
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 transition-colors"
              />
            </div>

            {speakers.length > 1 && (
              <div className="relative">
                <select
                  value={selectedSpeaker ?? ''}
                  onChange={(e) => setSelectedSpeaker(e.target.value ? parseInt(e.target.value) : null)}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 transition-colors appearance-none pr-10"
                >
                  <option value="">All Speakers</option>
                  {speakers.map(speaker => (
                    <option key={speaker} value={speaker}>
                      Speaker {speaker}
                    </option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Transcript Content */}
      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
        {filteredSegments.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No segments match your search
          </div>
        ) : (
          <AnimatePresence>
            {filteredSegments.map((segment, index) => {
              const isExpanded = expandedSegments.has(index)

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-2 border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-colors"
                >
                  {/* Segment Header */}
                  <div
                    className="p-4 bg-white/5 flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSegment(index)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {showSpeakerLabels && (
                        <div className={`px-3 py-1 bg-gradient-to-r ${getSpeakerColor(segment.speaker)} rounded-full text-xs font-medium`}>
                          Speaker {segment.speaker}
                        </div>
                      )}

                      {showTimestamps && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onTimestampClick?.(segment.startTime)
                          }}
                          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                          title="Jump to timestamp"
                        >
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatTimestamp(segment.startTime)}
                        </button>
                      )}

                      {showConfidence && (
                        <span className={`text-xs ${getConfidenceColor(segment.confidence)}`}>
                          {(segment.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>

                    <button className="p-1 hover:bg-white/10 rounded transition-colors">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Segment Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4">
                          <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {highlightSearch(segment.text, searchQuery)}
                          </p>

                          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400">
                            Duration: {formatTimestamp(segment.endTime - segment.startTime)}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Preview (when collapsed) */}
                  {!isExpanded && (
                    <div className="px-4 pb-4">
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {segment.text}
                      </p>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

/**
 * Highlight search query in text
 */
function highlightSearch(text: string, query: string) {
  if (!query.trim()) return text

  const parts = text.split(new RegExp(`(${query})`, 'gi'))

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={index} className="bg-yellow-400/30 text-yellow-200 px-1 rounded">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

interface TranscriptStatsProps {
  transcript: TranscriptionResult
  className?: string
}

/**
 * Display transcript statistics
 */
export function TranscriptStats({ transcript, className = '' }: TranscriptStatsProps) {
  const wordsPerMinute = transcript.duration > 0
    ? (transcript.words.length / transcript.duration) * 60
    : 0

  const speakerTime = useMemo(() => {
    const timeMap: Record<number, number> = {}

    for (const segment of transcript.segments) {
      const duration = segment.endTime - segment.startTime
      timeMap[segment.speaker] = (timeMap[segment.speaker] || 0) + duration
    }

    return timeMap
  }, [transcript.segments])

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <span className="text-sm text-gray-400">Duration</span>
        </div>
        <p className="text-2xl font-bold">{formatTimestamp(transcript.duration)}</p>
      </div>

      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-green-400" />
          <span className="text-sm text-gray-400">Words</span>
        </div>
        <p className="text-2xl font-bold">{transcript.words.length.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-1">{wordsPerMinute.toFixed(0)} WPM</p>
      </div>

      {transcript.speakerCount && (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/20 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-sm text-gray-400">Speakers</span>
          </div>
          <p className="text-2xl font-bold">{transcript.speakerCount}</p>
        </div>
      )}

      <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border-2 border-yellow-500/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-yellow-400" />
          <span className="text-sm text-gray-400">Confidence</span>
        </div>
        <p className="text-2xl font-bold">{(transcript.confidence * 100).toFixed(0)}%</p>
      </div>
    </div>
  )
}
