'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DeepgramService } from '@/lib/deepgramService';
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
  source: 'deepgram' | 'browser' | null;
}

interface TranscriptionCallbacks {
  onTranscript?: (segment: TranscriptSegment) => void;
  onInterim?: (text: string) => void;
}

/**
 * Hook for managing speech-to-text transcription
 * Uses Deepgram nova-3 via WebSocket proxy, falls back to browser Web Speech API
 */
export function useTranscription(
  onTranscriptOrCallbacks?: ((segment: TranscriptSegment) => void) | TranscriptionCallbacks
): UseTranscriptionResult {
  const callbacks: TranscriptionCallbacks =
    typeof onTranscriptOrCallbacks === 'function'
      ? { onTranscript: onTranscriptOrCallbacks }
      : onTranscriptOrCallbacks || {};

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'deepgram' | 'browser' | null>(null);

  const deepgramRef = useRef<DeepgramService | null>(null);
  const browserRecognitionRef = useRef<SpeechRecognitionService | null>(null);
  const segmentIdRef = useRef(0);
  const isStartingRef = useRef(false);

  const onTranscriptRef = useRef(callbacks.onTranscript);
  const onInterimRef = useRef(callbacks.onInterim);

  useEffect(() => {
    onTranscriptRef.current = callbacks.onTranscript;
    onInterimRef.current = callbacks.onInterim;
  }, [callbacks.onTranscript, callbacks.onInterim]);

  const createSegment = useCallback((text: string): TranscriptSegment => {
    return {
      id: `segment_${Date.now()}_${++segmentIdRef.current}`,
      text: text.trim(),
      timestamp: Date.now(),
      isFinal: true,
    };
  }, []);

  const handleFinalTranscript = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const segment = createSegment(text);
      setTranscript((prev) => [...prev, segment]);
      setInterimText('');
      onTranscriptRef.current?.(segment);
    },
    [createSegment]
  );

  const handleInterimTranscript = useCallback((text: string) => {
    setInterimText(text);
    onInterimRef.current?.(text);
  }, []);

  // Start with Deepgram, fall back to browser
  const startRecording = useCallback(() => {
    if (isRecording || isStartingRef.current) return;
    isStartingRef.current = true;
    setError(null);
    setInterimText('');

    // Try Deepgram first
    const dg = new DeepgramService({
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          handleFinalTranscript(text);
        } else {
          handleInterimTranscript(text);
        }
      },
      onError: (err) => {
        console.warn('[Deepgram] Error, falling back to browser:', err);
        dg.stop();
        deepgramRef.current = null;
        // Fall back to browser
        startBrowserRecognition();
      },
      onOpen: () => {
        setIsRecording(true);
        setSource('deepgram');
        isStartingRef.current = false;
        console.log('[Transcription] Using Deepgram nova-3');
      },
      onClose: () => {
        if (deepgramRef.current) {
          setIsRecording(false);
          setSource(null);
        }
      },
    });

    deepgramRef.current = dg;
    dg.start().catch(() => {
      // If start itself fails, fall back
      startBrowserRecognition();
    });
  }, [isRecording, handleFinalTranscript, handleInterimTranscript]);

  const startBrowserRecognition = useCallback(() => {
    if (!SpeechRecognitionService.isSupported()) {
      setError('Speech recognition not supported');
      isStartingRef.current = false;
      return;
    }

    browserRecognitionRef.current = new SpeechRecognitionService(
      { continuous: true, interimResults: true, language: 'en-US' },
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
          setSource('browser');
          isStartingRef.current = false;
          console.log('[Transcription] Using browser Web Speech API');
        },
        onEnd: () => {
          setIsRecording(false);
          setSource(null);
        },
      }
    );
    browserRecognitionRef.current.start();
  }, [handleFinalTranscript, handleInterimTranscript]);

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
    setSource(null);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript([]);
    setInterimText('');
    segmentIdRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      deepgramRef.current?.stop();
      browserRecognitionRef.current?.abort();
    };
  }, []);

  const isSupported = true; // Deepgram works everywhere, browser is fallback

  return {
    isRecording,
    isSupported,
    transcript,
    interimText,
    startRecording,
    stopRecording,
    clearTranscript,
    error,
    source,
  };
}
