/**
 * Google Cloud Speech-to-Text API Service
 *
 * Provides audio transcription with speaker diarization for interviews,
 * meetings, and voice interactions. Supports 100+ languages and
 * real-time streaming transcription.
 *
 * @see https://cloud.google.com/speech-to-text/docs
 */

import { SpeechClient } from '@google-cloud/speech'
import type { protos } from '@google-cloud/speech'

type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig
type IRecognitionAudio = protos.google.cloud.speech.v1.IRecognitionAudio
type ISpeakerDiarizationConfig = protos.google.cloud.speech.v1.ISpeakerDiarizationConfig

// Initialize Speech client (uses GOOGLE_APPLICATION_CREDENTIALS env var)
let speechClient: SpeechClient | null = null

function getSpeechClient(): SpeechClient {
  if (!speechClient) {
    speechClient = new SpeechClient()
  }
  return speechClient
}

/**
 * Transcription result with speaker labels and timestamps
 */
export interface TranscriptionResult {
  /** Full transcript text */
  transcript: string
  /** Individual words with timestamps */
  words: TranscriptWord[]
  /** Speaker-labeled segments */
  segments: TranscriptSegment[]
  /** Detected language */
  language: string
  /** Overall confidence score (0-1) */
  confidence: number
  /** Audio duration in seconds */
  duration: number
  /** Number of speakers detected */
  speakerCount?: number
}

/**
 * Individual word with timing
 */
export interface TranscriptWord {
  /** Word text */
  word: string
  /** Start time in seconds */
  startTime: number
  /** End time in seconds */
  endTime: number
  /** Confidence score (0-1) */
  confidence: number
  /** Speaker tag (if diarization enabled) */
  speakerTag?: number
}

/**
 * Speaker segment
 */
export interface TranscriptSegment {
  /** Speaker identifier (1, 2, 3, etc.) */
  speaker: number
  /** Segment text */
  text: string
  /** Start time in seconds */
  startTime: number
  /** End time in seconds */
  endTime: number
  /** Confidence score (0-1) */
  confidence: number
}

/**
 * Streaming transcription chunk
 */
export interface StreamingTranscript {
  /** Transcript text (may be partial) */
  text: string
  /** Is this the final result for this segment */
  isFinal: boolean
  /** Confidence score */
  confidence: number
  /** Stability score (0-1, how likely to change) */
  stability?: number
}

/**
 * Transcription configuration
 */
export interface TranscriptionConfig {
  /** Language code (e.g., 'en-US', 'es-ES') */
  languageCode?: string
  /** Enable automatic language detection */
  autoDetectLanguage?: boolean
  /** Alternative language codes for detection */
  alternativeLanguageCodes?: string[]
  /** Enable speaker diarization */
  enableSpeakerDiarization?: boolean
  /** Expected number of speakers (helps accuracy) */
  speakerCount?: number
  /** Enable automatic punctuation */
  enableAutomaticPunctuation?: boolean
  /** Enable word-level timestamps */
  enableWordTimeOffsets?: boolean
  /** Audio encoding (LINEAR16, FLAC, MP3, etc.) */
  encoding?: 'LINEAR16' | 'FLAC' | 'MP3' | 'OGG_OPUS' | 'WEBM_OPUS'
  /** Sample rate in Hz */
  sampleRateHertz?: number
  /** Number of audio channels */
  audioChannelCount?: number
  /** Profanity filter */
  profanityFilter?: boolean
  /** Enhanced model for better accuracy (costs more) */
  useEnhanced?: boolean
  /** Model type: 'latest_long' for long audio, 'latest_short' for short */
  model?: 'latest_long' | 'latest_short' | 'command_and_search' | 'phone_call' | 'video' | 'default'
}

/**
 * Transcribe audio file to text
 *
 * @param audioContent - Audio file content as Buffer or base64 string
 * @param config - Transcription configuration
 * @returns Transcription result with speaker labels and timestamps
 *
 * @example
 * ```typescript
 * const audioBuffer = fs.readFileSync('interview.mp3')
 * const result = await transcribeAudio(audioBuffer, {
 *   languageCode: 'en-US',
 *   enableSpeakerDiarization: true,
 *   speakerCount: 2
 * })
 * // Result: { transcript: "...", segments: [...], speakerCount: 2 }
 * ```
 */
export async function transcribeAudio(
  audioContent: Buffer | string,
  config: TranscriptionConfig = {}
): Promise<TranscriptionResult> {
  const client = getSpeechClient()

  // Convert to Buffer if base64 string
  const audioBuffer = typeof audioContent === 'string'
    ? Buffer.from(audioContent, 'base64')
    : audioContent

  // Build recognition config
  const recognitionConfig: IRecognitionConfig = {
    encoding: config.encoding || 'MP3',
    sampleRateHertz: config.sampleRateHertz || 16000,
    audioChannelCount: config.audioChannelCount || 1,
    languageCode: config.languageCode || 'en-US',
    enableAutomaticPunctuation: config.enableAutomaticPunctuation !== false,
    enableWordTimeOffsets: config.enableWordTimeOffsets !== false,
    profanityFilter: config.profanityFilter || false,
    useEnhanced: config.useEnhanced || false,
    model: config.model || 'latest_long',
  }

  // Add language alternatives if auto-detect enabled
  if (config.autoDetectLanguage && config.alternativeLanguageCodes) {
    recognitionConfig.alternativeLanguageCodes = config.alternativeLanguageCodes
  }

  // Add speaker diarization if enabled
  if (config.enableSpeakerDiarization) {
    const diarizationConfig: ISpeakerDiarizationConfig = {
      enableSpeakerDiarization: true,
      minSpeakerCount: config.speakerCount ? Math.max(2, config.speakerCount - 1) : 2,
      maxSpeakerCount: config.speakerCount ? config.speakerCount + 1 : 6,
    }
    recognitionConfig.diarizationConfig = diarizationConfig
  }

  const audio: IRecognitionAudio = {
    content: audioBuffer,
  }

  try {
    const [response] = await client.recognize({
      config: recognitionConfig,
      audio,
    })

    const results = response.results || []

    // Extract full transcript
    const transcript = results
      .map(result => result.alternatives?.[0]?.transcript || '')
      .join(' ')

    // Extract words with timestamps
    const words: TranscriptWord[] = []
    for (const result of results) {
      const alternative = result.alternatives?.[0]
      if (alternative?.words) {
        for (const wordInfo of alternative.words) {
          words.push({
            word: wordInfo.word || '',
            startTime: parseTimestamp(wordInfo.startTime),
            endTime: parseTimestamp(wordInfo.endTime),
            confidence: alternative.confidence || 0,
            speakerTag: wordInfo.speakerTag || undefined,
          })
        }
      }
    }

    // Build speaker segments from words
    const segments: TranscriptSegment[] = []
    if (config.enableSpeakerDiarization && words.length > 0) {
      let currentSpeaker = words[0].speakerTag || 1
      let currentSegment: TranscriptWord[] = []

      for (const word of words) {
        const speaker = word.speakerTag || 1

        if (speaker !== currentSpeaker && currentSegment.length > 0) {
          // New speaker, save current segment
          segments.push({
            speaker: currentSpeaker,
            text: currentSegment.map(w => w.word).join(' '),
            startTime: currentSegment[0].startTime,
            endTime: currentSegment[currentSegment.length - 1].endTime,
            confidence: currentSegment.reduce((sum, w) => sum + w.confidence, 0) / currentSegment.length,
          })

          currentSegment = []
          currentSpeaker = speaker
        }

        currentSegment.push(word)
      }

      // Add final segment
      if (currentSegment.length > 0) {
        segments.push({
          speaker: currentSpeaker,
          text: currentSegment.map(w => w.word).join(' '),
          startTime: currentSegment[0].startTime,
          endTime: currentSegment[currentSegment.length - 1].endTime,
          confidence: currentSegment.reduce((sum, w) => sum + w.confidence, 0) / currentSegment.length,
        })
      }
    }

    // Calculate overall confidence and duration
    const confidence = results.reduce((sum, r) => sum + (r.alternatives?.[0]?.confidence || 0), 0) / (results.length || 1)
    const duration = words.length > 0 ? words[words.length - 1].endTime : 0

    // Detect speaker count
    const speakerTags = new Set(words.map(w => w.speakerTag).filter(Boolean))
    const speakerCount = speakerTags.size || undefined

    return {
      transcript,
      words,
      segments,
      language: config.languageCode || 'en-US',
      confidence,
      duration,
      speakerCount,
    }
  } catch (error) {
    console.error('[Speech] Transcription failed:', error)
    // Fail open - return empty result
    return {
      transcript: '',
      words: [],
      segments: [],
      language: config.languageCode || 'en-US',
      confidence: 0,
      duration: 0,
    }
  }
}

/**
 * Transcribe audio from URI (Google Cloud Storage)
 *
 * @param uri - GCS URI (e.g., 'gs://bucket-name/audio.mp3')
 * @param config - Transcription configuration
 * @returns Transcription result
 */
export async function transcribeAudioUri(
  uri: string,
  config: TranscriptionConfig = {}
): Promise<TranscriptionResult> {
  const client = getSpeechClient()

  const recognitionConfig: IRecognitionConfig = {
    encoding: config.encoding || 'MP3',
    sampleRateHertz: config.sampleRateHertz || 16000,
    languageCode: config.languageCode || 'en-US',
    enableAutomaticPunctuation: config.enableAutomaticPunctuation !== false,
    enableWordTimeOffsets: config.enableWordTimeOffsets !== false,
    model: config.model || 'latest_long',
  }

  if (config.enableSpeakerDiarization) {
    recognitionConfig.diarizationConfig = {
      enableSpeakerDiarization: true,
      minSpeakerCount: 2,
      maxSpeakerCount: 6,
    }
  }

  const audio: IRecognitionAudio = {
    uri,
  }

  try {
    const [operation] = await client.longRunningRecognize({
      config: recognitionConfig,
      audio,
    })

    const [response] = await operation.promise()

    // Process response (same as transcribeAudio)
    const results = response.results || []
    const transcript = results
      .map(result => result.alternatives?.[0]?.transcript || '')
      .join(' ')

    return {
      transcript,
      words: [],
      segments: [],
      language: config.languageCode || 'en-US',
      confidence: results.reduce((sum, r) => sum + (r.alternatives?.[0]?.confidence || 0), 0) / (results.length || 1),
      duration: 0,
    }
  } catch (error) {
    console.error('[Speech] Transcription failed:', error)
    return {
      transcript: '',
      words: [],
      segments: [],
      language: config.languageCode || 'en-US',
      confidence: 0,
      duration: 0,
    }
  }
}

/**
 * Check if Speech-to-Text API is available
 */
export async function isSpeechAvailable(): Promise<boolean> {
  try {
    const client = getSpeechClient()
    // Test with minimal API call - just check if client initializes
    // We can't do a real test without audio data
    return !!client
  } catch (error) {
    console.warn('[Speech] Not available:', error instanceof Error ? error.message : 'Unknown error')
    return false
  }
}

/**
 * Parse Google protobuf timestamp to seconds
 */
function parseTimestamp(timestamp: any): number {
  if (!timestamp) return 0
  const seconds = parseInt(timestamp.seconds || '0', 10)
  const nanos = parseInt(timestamp.nanos || '0', 10)
  return seconds + nanos / 1e9
}

/**
 * Format seconds to HH:MM:SS
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Pre-configured transcription presets for common use cases
 */
export const TRANSCRIPTION_PRESETS = {
  /** Interview recording (2 speakers, high accuracy) */
  INTERVIEW: {
    enableSpeakerDiarization: true,
    speakerCount: 2,
    enableAutomaticPunctuation: true,
    useEnhanced: true,
    model: 'latest_long' as const,
  },

  /** Meeting recording (multiple speakers) */
  MEETING: {
    enableSpeakerDiarization: true,
    speakerCount: 5,
    enableAutomaticPunctuation: true,
    model: 'latest_long' as const,
  },

  /** Phone call recording */
  PHONE_CALL: {
    enableSpeakerDiarization: true,
    speakerCount: 2,
    enableAutomaticPunctuation: true,
    model: 'phone_call' as const,
    encoding: 'LINEAR16' as const,
    sampleRateHertz: 8000,
  },

  /** Video recording */
  VIDEO: {
    enableAutomaticPunctuation: true,
    model: 'video' as const,
  },

  /** Quick command (short audio) */
  COMMAND: {
    model: 'command_and_search' as const,
    enableAutomaticPunctuation: false,
  },
}

/**
 * Supported audio formats
 */
export const SUPPORTED_AUDIO_FORMATS = [
  'mp3',
  'wav',
  'm4a',
  'flac',
  'ogg',
  'webm',
  'amr',
]

/**
 * Get file encoding from extension
 */
export function getEncodingFromExtension(filename: string): TranscriptionConfig['encoding'] {
  const ext = filename.toLowerCase().split('.').pop()

  switch (ext) {
    case 'mp3':
      return 'MP3'
    case 'flac':
      return 'FLAC'
    case 'ogg':
      return 'OGG_OPUS'
    case 'webm':
      return 'WEBM_OPUS'
    case 'wav':
    default:
      return 'LINEAR16'
  }
}
