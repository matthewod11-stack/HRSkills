import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, hasPermission, authErrorResponse } from '@/lib/auth/middleware'
import { handleApiError, createSuccessResponse } from '@/lib/api-helpers'
import { applyRateLimit, RateLimitPresets } from '@/lib/security/rate-limiter'
import {
  transcribeAudio,
  TRANSCRIPTION_PRESETS,
  getEncodingFromExtension,
  type TranscriptionResult,
  type TranscriptionConfig,
} from '@/lib/ai-services/speech-service'
import type { AIServiceResponse } from '@/lib/types/ai-services'

/**
 * POST /api/ai/transcribe
 * Transcribe audio file to text with speaker diarization
 * Requires: Authentication + employees or analytics read permission
 */
export async function POST(request: NextRequest) {
  // Apply rate limiting (AI endpoints: 30 req/min)
  const rateLimitResult = await applyRateLimit(request, RateLimitPresets.ai)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response
  }

  // Authenticate
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return authErrorResponse(authResult)
  }

  // Check permissions
  if (!hasPermission(authResult.user, 'employees', 'read') && !hasPermission(authResult.user, 'analytics', 'read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions to use transcription service' },
      { status: 403 }
    )
  }

  // Check if Speech is enabled
  if (process.env.NEXT_PUBLIC_ENABLE_SPEECH !== 'true') {
    return NextResponse.json(
      {
        success: false,
        error: 'Speech-to-Text service is not enabled. Set NEXT_PUBLIC_ENABLE_SPEECH=true to enable.',
      },
      { status: 503 }
    )
  }

  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const audioBase64 = formData.get('audioBase64') as string | null
    const languageCode = formData.get('languageCode') as string | null
    const enableSpeakerDiarization = formData.get('enableSpeakerDiarization') === 'true'
    const speakerCount = formData.get('speakerCount')
    const preset = formData.get('preset') as keyof typeof TRANSCRIPTION_PRESETS | null
    const filename = formData.get('filename') as string | null

    // Validate input
    if (!audioFile && !audioBase64) {
      return NextResponse.json(
        { success: false, error: 'Either "audio" file or "audioBase64" is required' },
        { status: 400 }
      )
    }

    // Get audio content as Buffer
    let audioBuffer: Buffer
    let detectedFilename = filename || 'audio.mp3'

    if (audioFile) {
      const arrayBuffer = await audioFile.arrayBuffer()
      audioBuffer = Buffer.from(arrayBuffer)
      detectedFilename = audioFile.name
    } else if (audioBase64) {
      audioBuffer = Buffer.from(audioBase64, 'base64')
    } else {
      return NextResponse.json(
        { success: false, error: 'No audio content provided' },
        { status: 400 }
      )
    }

    // Check file size (max 10MB for direct upload)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (audioBuffer.length > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: `Audio file too large (${(audioBuffer.length / 1024 / 1024).toFixed(1)}MB). Maximum is 10MB.`,
        },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Build configuration
    let config: TranscriptionConfig = {
      languageCode: languageCode || 'en-US',
      enableSpeakerDiarization,
      speakerCount: speakerCount ? parseInt(speakerCount, 10) : undefined,
      encoding: getEncodingFromExtension(detectedFilename),
    }

    // Apply preset if specified
    if (preset && TRANSCRIPTION_PRESETS[preset]) {
      config = {
        ...config,
        ...TRANSCRIPTION_PRESETS[preset],
      }
    }

    console.log('[Transcription] Processing audio:', {
      filename: detectedFilename,
      size: `${(audioBuffer.length / 1024).toFixed(1)}KB`,
      language: config.languageCode,
      diarization: config.enableSpeakerDiarization,
      preset: preset || 'custom',
    })

    // Perform transcription
    const result = await transcribeAudio(audioBuffer, config)

    const processingTime = Date.now() - startTime

    console.log('[Transcription] Complete:', {
      duration: `${result.duration.toFixed(1)}s`,
      words: result.words.length,
      speakers: result.speakerCount,
      confidence: result.confidence.toFixed(2),
      processingTime: `${processingTime}ms`,
    })

    const response: AIServiceResponse<TranscriptionResult> = {
      success: true,
      data: result,
      metadata: {
        processingTime,
        cost: calculateTranscriptionCost(result.duration),
      },
    }

    return createSuccessResponse(response)
  } catch (error) {
    return handleApiError(error, {
      endpoint: '/api/ai/transcribe',
      method: 'POST',
      userId: authResult.user.userId,
    })
  }
}

/**
 * Calculate estimated cost for transcription
 * Google Cloud Speech-to-Text pricing:
 * - First 60 minutes/month: FREE
 * - Standard model: $0.024/minute ($1.44/hour)
 * - Enhanced model: $0.09/minute ($5.40/hour)
 */
function calculateTranscriptionCost(durationSeconds: number): number {
  const minutes = durationSeconds / 60
  const costPerMinute = 0.024 // Standard model
  return minutes * costPerMinute
}
