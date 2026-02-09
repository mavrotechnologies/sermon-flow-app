'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SpeechRecognitionService } from '@/lib/speechRecognition';
import type { TranscriptSegment } from '@/types';

interface UseTranscriptionResult {
  isRecording: boolean;
  isSupported: boolean;
  transcript: TranscriptSegment[];
  interimText: string;
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
  error: string | null;
}

/**
 * Hook for managing speech-to-text transcription
 * Uses Web Speech API for real-time transcription
 */
export function useTranscription(
  onTranscript?: (segment: TranscriptSegment) => void
): UseTranscriptionResult {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionService | null>(null);
  const segmentIdRef = useRef(0);
  // Use ref for callback to avoid recreating service when callback changes
  const onTranscriptRef = useRef(onTranscript);

  // Keep the ref updated
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  /**
   * Initialize speech recognition - only once on mount
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResult = (text: string, isFinal: boolean) => {
      if (isFinal) {
        const segment: TranscriptSegment = {
          id: `segment_${Date.now()}_${++segmentIdRef.current}`,
          text: text.trim(),
          timestamp: Date.now(),
          isFinal: true,
        };

        setTranscript((prev) => [...prev, segment]);
        setInterimText('');

        // Notify callback using ref (always current)
        onTranscriptRef.current?.(segment);
      } else {
        setInterimText(text);
      }
    };

    recognitionRef.current = new SpeechRecognitionService(
      {
        continuous: true,
        interimResults: true,
        language: 'en-US',
      },
      {
        onResult: handleResult,
        onError: (err) => setError(err),
        onStart: () => {
          setIsRecording(true);
          setError(null);
        },
        onEnd: () => {
          setIsRecording(false);
        },
      }
    );

    return () => {
      recognitionRef.current?.abort();
    };
  }, []); // Empty deps - only run once on mount

  /**
   * Start recording
   */
  const startRecording = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      return;
    }

    setError(null);
    recognitionRef.current.start();
  }, []);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setInterimText('');
  }, []);

  /**
   * Clear transcript
   */
  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setInterimText('');
    segmentIdRef.current = 0;
  }, []);

  return {
    isRecording,
    isSupported: SpeechRecognitionService.isSupported(),
    transcript,
    interimText,
    startRecording,
    stopRecording,
    clearTranscript,
    error,
  };
}
