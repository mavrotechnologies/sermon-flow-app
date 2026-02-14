'use client';

import { useState, useCallback, useRef } from 'react';
import type { SermonNote, DetectedScripture } from '@/types';

const WORD_THRESHOLD = 200;
const TIME_THRESHOLD_MS = 60000; // 60 seconds

interface UseSermonNotesOptions {
  onNotesGenerated?: (notes: SermonNote[]) => void;
}

export function useSermonNotes(options: UseSermonNotesOptions = {}) {
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const bufferRef = useRef<string>('');
  const wordCountSinceLastRef = useRef<number>(0);
  const lastGenerationTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatingRef = useRef<boolean>(false);
  const scripturesRef = useRef<DetectedScripture[]>([]);

  const generateNotes = useCallback(async () => {
    if (generatingRef.current) return;
    if (bufferRef.current.trim().length < 50) return;

    generatingRef.current = true;
    setIsGenerating(true);

    try {
      const res = await fetch('/api/generate-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newText: bufferRef.current,
          previousNotes: notes,
          detectedScriptures: scripturesRef.current,
        }),
      });

      const data = await res.json();
      if (data.notes && data.notes.length > 0) {
        setNotes((prev) => {
          const updated = [...prev, ...data.notes];
          options.onNotesGenerated?.(updated);
          return updated;
        });
      }

      // Reset buffer after successful generation
      bufferRef.current = '';
      wordCountSinceLastRef.current = 0;
      lastGenerationTimeRef.current = Date.now();
    } catch (error) {
      console.error('Failed to generate notes:', error);
    } finally {
      generatingRef.current = false;
      setIsGenerating(false);
    }
  }, [notes, options]);

  const addTranscriptText = useCallback(
    (text: string) => {
      bufferRef.current += ' ' + text;
      const wordCount = text.trim().split(/\s+/).length;
      wordCountSinceLastRef.current += wordCount;

      // Check word threshold
      if (wordCountSinceLastRef.current >= WORD_THRESHOLD) {
        generateNotes();
        // Reset backup timer
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(generateNotes, TIME_THRESHOLD_MS);
        return;
      }

      // Set backup timer if not already set
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (wordCountSinceLastRef.current > 30) {
            generateNotes();
          }
        }, TIME_THRESHOLD_MS);
      }
    },
    [generateNotes]
  );

  const updateScriptures = useCallback((scriptures: DetectedScripture[]) => {
    scripturesRef.current = scriptures;
  }, []);

  const clear = useCallback(() => {
    setNotes([]);
    setIsGenerating(false);
    bufferRef.current = '';
    wordCountSinceLastRef.current = 0;
    lastGenerationTimeRef.current = 0;
    generatingRef.current = false;
    scripturesRef.current = [];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    notes,
    isGenerating,
    addTranscriptText,
    updateScriptures,
    clear,
  };
}
