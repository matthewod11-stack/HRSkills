'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Loader2, Upload, X } from 'lucide-react';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  variant?: 'button' | 'icon';
  languageCode?: string;
}

/**
 * Voice input component with browser Web Speech API for real-time transcription
 * Falls back to file upload if not supported
 */
export function VoiceInput({
  onTranscript,
  onError,
  className = '',
  variant = 'icon',
  languageCode = 'en-US',
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = languageCode;

        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' ';
            } else {
              interimTranscript += transcriptPiece;
            }
          }

          const fullTranscript = (finalTranscript || interimTranscript).trim();
          setTranscript(fullTranscript);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          onError?.(`Speech recognition error: ${event.error}`);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
          if (transcript) {
            onTranscript(transcript);
            setTranscript('');
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [languageCode]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      // Fallback to file upload if Web Speech API not supported
      setShowUploadModal(true);
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setShowUploadModal(false);

    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('languageCode', languageCode);
      formData.append('preset', 'COMMAND');

      const response = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success && result.data.transcript) {
        onTranscript(result.data.transcript);
      } else {
        onError?.('Transcription failed');
      }
    } catch (error) {
      onError?.('Failed to upload and transcribe audio');
      console.error('Transcription error:', error);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={toggleRecording}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all disabled:opacity-50 ${
            isRecording
              ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400 hover:bg-red-500/30'
              : 'bg-blue-500/20 border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/30'
          } ${className}`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : isRecording ? (
            <>
              <MicOff className="w-5 h-5" />
              <span>Stop Recording</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Start Recording</span>
            </>
          )}
        </button>

        {isRecording && transcript && (
          <div className="mt-2 p-3 bg-black/40 border border-white/10 rounded-lg">
            <p className="text-sm text-gray-300 italic">{transcript}</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        <UploadAudioModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onFileSelect={() => fileInputRef.current?.click()}
        />
      </>
    );
  }

  // Icon variant
  return (
    <>
      <button
        onClick={toggleRecording}
        disabled={isProcessing}
        className={`p-2 rounded-lg transition-all disabled:opacity-50 relative ${
          isRecording
            ? 'bg-red-500/20 border-2 border-red-500/50 text-red-400 hover:bg-red-500/30'
            : 'bg-transparent hover:bg-white/10'
        } ${className}`}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <>
            <MicOff className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </>
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </button>

      {isRecording && transcript && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full mb-2 right-0 p-3 bg-black/95 border-2 border-blue-500/50 rounded-lg max-w-xs"
        >
          <p className="text-sm text-gray-300 italic">{transcript}</p>
        </motion.div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <UploadAudioModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onFileSelect={() => fileInputRef.current?.click()}
      />
    </>
  );
}

interface UploadAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: () => void;
}

function UploadAudioModal({ isOpen, onClose, onFileSelect }: UploadAudioModalProps) {
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
          className="relative bg-gradient-to-br from-gray-900 to-black border-2 border-white/20 rounded-2xl p-6 max-w-md w-full"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <h3 className="text-xl font-bold mb-4">Voice Input Not Available</h3>

          <p className="text-gray-300 mb-6">
            Your browser doesn&apos;t support real-time voice input. You can upload an audio file
            instead.
          </p>

          <div className="space-y-3">
            <button
              onClick={onFileSelect}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Audio File</span>
            </button>

            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4">Supported formats: MP3, WAV, M4A, FLAC, OGG</p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onError?: (error: string) => void;
  maxDuration?: number; // in seconds
  className?: string;
}

/**
 * Audio recorder component for recording interviews
 * Captures audio from microphone and returns Blob
 */
export function AudioRecorder({
  onRecordingComplete,
  onError,
  maxDuration = 3600, // 1 hour default
  className = '',
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(audioBlob);

        stream.getTracks().forEach((track) => track.stop());

        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      onError?.('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all"
        >
          <Mic className="w-5 h-5" />
          <span>Start Recording</span>
        </button>
      ) : (
        <>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 border-2 border-red-500/50 rounded-xl">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="font-mono text-lg">{formatTime(recordingTime)}</span>
          </div>

          <button
            onClick={togglePause}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors"
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button
            onClick={stopRecording}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/50 transition-all"
          >
            Stop & Save
          </button>
        </>
      )}
    </div>
  );
}
