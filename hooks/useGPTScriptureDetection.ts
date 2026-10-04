'use client';

import { useState, useCallback, useRef } from 'react';
import { apiError, apiFetch } from '@/lib/api';
import { lookupVerses } from '@/lib/verseLookup';
import type { BibleTranslation, BibleVerse } from '@/types';

export interface GPTScripture {
  id: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  verses: BibleVerse[];
  timestamp: number;
}

interface UseGPTScriptureDetectionResult {
  gptScriptures: GPTScripture[];
  isDetecting: boolean;
  error: string | null;
  detectFromText: (text: string) => Promise<GPTScripture[]>;
  clear: () => void;
  setTranslation: (t: BibleTranslation) => void;
}

export function useGPTScriptureDetection(): UseGPTScriptureDetectionResult {
  const [gptScriptures, setGptScriptures] = useState<GPTScripture[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const translationRef = useRef<BibleTranslation>('NKJV');
  const processedRef = useRef<Set<string>>(new Set());
  const bufferRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contextRef = useRef<string>('');

  const setTranslation = useCallback((t: BibleTranslation) => {
    translationRef.current = t;
  }, []);

  const callGPT = useCallback(async (text: string): Promise<GPTScripture[]> => {
    try {
      const res = await apiFetch('/api/v1/scripture/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context: contextRef.current || null }),
      });

      if (!res.ok) {
        throw new Error(await apiError(res));
      }

      const { scriptures } = await res.json();
      if (!Array.isArray(scriptures) || scriptures.length === 0) return [];

      const newScriptures: GPTScripture[] = [];

      for (const s of scriptures) {
        const key = `${s.book}-${s.chapter}-${s.verseStart}`;
        if (processedRef.current.has(key)) continue;
        processedRef.current.add(key);

        const verses = await lookupVerses(
          {
            id: `gpt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            rawText: `${s.book} ${s.chapter}:${s.verseStart}`,
            book: s.book,
            chapter: s.chapter,
            verseStart: s.verseStart,
            verseEnd: s.verseEnd || undefined,
            osis: '',
          },
          translationRef.current
        );

        newScriptures.push({
          id: `gpt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          book: s.book,
          chapter: s.chapter,
          verseStart: s.verseStart,
          verseEnd: s.verseEnd || undefined,
          confidence: s.confidence || 'medium',
          reason: s.reason || 'GPT detection',
          verses,
          timestamp: Date.now(),
        });
      }

      if (newScriptures.length > 0) {
        setGptScriptures(prev => [...newScriptures, ...prev]);
      }

      // Update context for subsequent calls
      contextRef.current = text.slice(-500);

      return newScriptures;
    } catch (err) {
      console.error('GPT detection error:', err);
      setError(err instanceof Error ? err.message : 'GPT detection failed');
      return [];
    }
  }, []);

  // Debounced detection - accumulates text and sends every 3 seconds
  const detectFromText = useCallback(async (text: string): Promise<GPTScripture[]> => {
    bufferRef.current.push(text);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    return new Promise((resolve) => {
      timerRef.current = setTimeout(async () => {
        // 1 second debounce for fast detection
        const combined = bufferRef.current.join(' ');
        bufferRef.current = [];

        if (combined.trim().length < 10) {
          resolve([]);
          return;
        }

        setIsDetecting(true);
        setError(null);
        try {
          const results = await callGPT(combined);
          resolve(results);
        } finally {
          setIsDetecting(false);
        }
      }, 1000);
    });
  }, [callGPT]);

  const clear = useCallback(() => {
    setGptScriptures([]);
    processedRef.current.clear();
    bufferRef.current = [];
    contextRef.current = '';
    setError(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    gptScriptures,
    isDetecting,
    error,
    detectFromText,
    clear,
    setTranslation,
  };
}
