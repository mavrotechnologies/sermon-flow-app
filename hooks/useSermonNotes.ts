'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { SermonNote, SermonSummary, DetectedScripture } from '@/types';

const WORD_THRESHOLD = 200;
const WORD_HARD_CAP = 250;
const SENTENCE_ENDINGS = /[.?!]\s*$/;
const TIME_THRESHOLD_MS = 60000; // 60 seconds

interface UseSermonNotesOptions {
  onNotesGenerated?: (notes: SermonNote[]) => void;
  onSummaryGenerated?: (summary: SermonSummary) => void;
}

export function useSermonNotes(options: UseSermonNotesOptions = {}) {
  const [notes, setNotes] = useState<SermonNote[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [summary, setSummary] = useState<SermonSummary | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const bufferRef = useRef<string>('');
  const wordCountSinceLastRef = useRef<number>(0);
  const lastGenerationTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generatingRef = useRef<boolean>(false);
  const scripturesRef = useRef<DetectedScripture[]>([]);
  const notesRef = useRef<SermonNote[]>([]);

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
          previousNotes: notesRef.current,
          detectedScriptures: scripturesRef.current,
        }),
      });

      const data = await res.json();
      if (data.notes && data.notes.length > 0) {
        setNotes((prev) => {
          const updated = [...prev, ...data.notes];
          notesRef.current = updated;
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
  }, [options]);

  const addTranscriptText = useCallback(
    (text: string) => {
      bufferRef.current += ' ' + text;
      const wordCount = text.trim().split(/\s+/).length;
      wordCountSinceLastRef.current += wordCount;

      // Hard cap: flush immediately regardless of sentence boundary
      if (wordCountSinceLastRef.current >= WORD_HARD_CAP) {
        generateNotes();
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(generateNotes, TIME_THRESHOLD_MS);
        return;
      }

      // Soft threshold: flush only if buffer ends on a sentence boundary
      if (wordCountSinceLastRef.current >= WORD_THRESHOLD) {
        if (SENTENCE_ENDINGS.test(bufferRef.current.trim())) {
          generateNotes();
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(generateNotes, TIME_THRESHOLD_MS);
          return;
        }
        // Not at sentence boundary — keep buffering until hard cap or sentence end
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

  const generateSummary = useCallback(async () => {
    const currentNotes = notesRef.current;
    if (currentNotes.length < 2) return;

    setIsGeneratingSummary(true);

    try {
      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: currentNotes }),
      });

      const data = await res.json();
      if (data.summary) {
        setSummary(data.summary);
        options.onSummaryGenerated?.(data.summary);
      }
    } catch (error) {
      console.error('Failed to generate summary:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  }, [options]);

  const updateScriptures = useCallback((scriptures: DetectedScripture[]) => {
    scripturesRef.current = scriptures;
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const clear = useCallback(() => {
    setNotes([]);
    setIsGenerating(false);
    setSummary(null);
    setIsGeneratingSummary(false);
    bufferRef.current = '';
    wordCountSinceLastRef.current = 0;
    lastGenerationTimeRef.current = 0;
    generatingRef.current = false;
    scripturesRef.current = [];
    notesRef.current = [];
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    notes,
    isGenerating,
    summary,
    isGeneratingSummary,
    addTranscriptText,
    updateScriptures,
    generateSummary,
    clear,
  };
}
