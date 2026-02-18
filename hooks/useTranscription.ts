'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeechRecognitionService } from '@/lib/speechRecognition';
import { DeepgramService } from '@/lib/deepgramService';
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
  transcriptionSource: 'deepgram' | 'browser' | null;
}

interface TranscriptionCallbacks {
  onTranscript?: (segment: TranscriptSegment) => void;
  onInterim?: (text: string) => void;
}

/**
 * Hook for managing speech-to-text transcription
 * Uses Deepgram (with Bible keyword boosting) with automatic fallback to Web Speech API
 * Optimized for African/Ghanaian English accents
 */
export function useTranscription(
  onTranscriptOrCallbacks?: ((segment: TranscriptSegment) => void) | TranscriptionCallbacks
): UseTranscriptionResult {
  // Handle both old and new API
  const callbacks: TranscriptionCallbacks =
    typeof onTranscriptOrCallbacks === 'function'
      ? { onTranscript: onTranscriptOrCallbacks }
      : onTranscriptOrCallbacks || {};

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [transcriptionSource, setTranscriptionSource] = useState<'deepgram' | 'browser' | null>(null);

  const deepgramRef = useRef<DeepgramService | null>(null);
  const browserRecognitionRef = useRef<SpeechRecognitionService | null>(null);
  const segmentIdRef = useRef(0);
  const isStartingRef = useRef(false);

  // Use refs for callbacks to avoid recreating service when callbacks change
  const onTranscriptRef = useRef(callbacks.onTranscript);
  const onInterimRef = useRef(callbacks.onInterim);

  // Keep the refs updated
  useEffect(() => {
    onTranscriptRef.current = callbacks.onTranscript;
    onInterimRef.current = callbacks.onInterim;
  }, [callbacks.onTranscript, callbacks.onInterim]);

  /**
   * Create a transcript segment from text
   */
  const createSegment = useCallback((text: string): TranscriptSegment => {
    return {
      id: `segment_${Date.now()}_${++segmentIdRef.current}`,
      text: text.trim(),
      timestamp: Date.now(),
      isFinal: true,
    };
  }, []);

  /**
   * Handle final transcript from either source
   */
  const handleFinalTranscript = useCallback(
    (text: string) => {
      const segment = createSegment(text);
      setTranscript((prev) => [...prev, segment]);
      setInterimText('');
      onTranscriptRef.current?.(segment);
    },
    [createSegment]
  );

  /**
   * Handle interim transcript from either source
   */
  const handleInterimTranscript = useCallback((text: string) => {
    setInterimText(text);
    onInterimRef.current?.(text);
  }, []);

  /**
   * Start browser speech recognition as fallback
   */
  const startBrowserRecognition = useCallback(() => {
    console.log('Starting browser speech recognition (fallback)');
    setTranscriptionSource('browser');

    browserRecognitionRef.current = new SpeechRecognitionService(
      {
        continuous: true,
        interimResults: true,
        language: 'en-US',
      },
      {
        onResult: (text, isFinal) => {
          if (isFinal) {
            handleFinalTranscript(text);
          } else {
            handleInterimTranscript(text);
          }
        },
        onError: (err) => setError(err),
        onStart: () => {
          setIsRecording(true);
          setError(null);
          isStartingRef.current = false;
        },
        onEnd: () => {
          setIsRecording(false);
        },
      }
    );

    browserRecognitionRef.current.start();
  }, [handleFinalTranscript, handleInterimTranscript]);

  /**
   * Start Deepgram transcription
   */
  const startDeepgram = useCallback(async () => {
    console.log('Attempting Deepgram transcription...');

    deepgramRef.current = new DeepgramService({
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          handleFinalTranscript(text);
        } else {
          handleInterimTranscript(text);
        }
      },
      onError: (err) => {
        console.warn('Deepgram error:', err);
        // If Deepgram fails, fall back to browser speech recognition
        if (err.includes('not configured') || err.includes('Connection error') || err.includes('Failed')) {
          console.log('Deepgram unavailable, falling back to browser speech recognition');
          // Clean up Deepgram instance before falling back (release mic/audio)
          if (deepgramRef.current) {
            deepgramRef.current.abort();
          }
          deepgramRef.current = null;
          startBrowserRecognition();
        } else {
          setError(err);
          setIsRecording(false);
          isStartingRef.current = false;
        }
      },
      onStart: () => {
        console.log('Deepgram transcription started');
        setTranscriptionSource('deepgram');
        setIsRecording(true);
        setError(null);
        isStartingRef.current = false;
      },
      onEnd: () => {
        setIsRecording(false);
      },
    });

    try {
      await deepgramRef.current.start();
    } catch (err) {
      // Error is handled in onError callback
      console.warn('Deepgram start failed:', err);
    }
  }, [handleFinalTranscript, handleInterimTranscript, startBrowserRecognition]);

  /**
   * Start recording - tries Deepgram first, falls back to browser
   */
  const startRecording = useCallback(async () => {
    if (isRecording || isStartingRef.current) return;

    isStartingRef.current = true;
    setError(null);
    setInterimText('');

    // Try Deepgram first if supported
    if (DeepgramService.isSupported()) {
      await startDeepgram();
    } else if (SpeechRecognitionService.isSupported()) {
      startBrowserRecognition();
    } else {
      setError('Speech recognition not supported in this browser');
      isStartingRef.current = false;
    }
  }, [isRecording, startDeepgram, startBrowserRecognition]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (deepgramRef.current) {
      deepgramRef.current.stop();
      deepgramRef.current = null;
    }

    if (browserRecognitionRef.current) {
      browserRecognitionRef.current.stop();
      browserRecognitionRef.current = null;
    }

    setIsRecording(false);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (deepgramRef.current) {
        deepgramRef.current.abort();
      }
      if (browserRecognitionRef.current) {
        browserRecognitionRef.current.abort();
      }
    };
  }, []);

  const isSupported = DeepgramService.isSupported() || SpeechRecognitionService.isSupported();

  return {
    isRecording,
    isSupported,
    transcript,
    interimText,
    startRecording,
    stopRecording,
    clearTranscript,
    error,
    transcriptionSource,
  };
}
