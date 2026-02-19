'use client';

import { useState, useCallback, useRef } from 'react';

export interface GPTDetectedScripture {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  detectedAt: number;
  text?: string; // Will be filled from verse lookup
}

interface UseGPTScriptureDetectionResult {
  isDetecting: boolean;
  detectedScriptures: GPTDetectedScripture[];
  error: string | null;
  detect: (text: string, immediate?: boolean) => void;
  clearScriptures: () => void;
}

/**
 * Hook for GPT-powered Bible scripture detection
 * Uses OpenAI GPT-4o-mini to identify Bible references in sermon text
 */
export function useGPTScriptureDetection(): UseGPTScriptureDetectionResult {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedScriptures, setDetectedScriptures] = useState<GPTDetectedScripture[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Debounce and deduplication
  const lastTextRef = useRef<string>('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const idCounterRef = useRef(0);
  const pendingRequestRef = useRef<AbortController | null>(null);

  /**
   * Generate unique ID for detected scripture
   */
  const generateId = useCallback(() => {
    idCounterRef.current += 1;
    return `gpt-scripture-${Date.now()}-${idCounterRef.current}`;
  }, []);

  /**
   * Detect scriptures in the given text - real-time as preacher speaks
   */
  const detect = useCallback(async (text: string, immediate: boolean = false) => {
    // Skip if text hasn't changed enough (at least 20 new characters)
    if (!immediate && text.length - lastTextRef.current.length < 20 && text.includes(lastTextRef.current.slice(-50))) {
      return;
    }

    // Skip short text
    if (text.trim().length < 30) {
      return;
    }

    lastTextRef.current = text;

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Cancel pending request if new text comes in
    if (pendingRequestRef.current) {
      pendingRequestRef.current.abort();
    }

    // Fast debounce - 300ms for real-time feel
    const debounceTime = immediate ? 0 : 300;

    debounceRef.current = setTimeout(async () => {
      setIsDetecting(true);
      setError(null);

      // Create abort controller for this request
      const abortController = new AbortController();
      pendingRequestRef.current = abortController;

      try {
        const response = await fetch('/api/detect-scripture', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to detect scriptures');
        }

        const data = await response.json();
        const scriptures = data.scriptures || [];

        // Add to existing scriptures, avoiding duplicates
        setDetectedScriptures(prev => {
          const newScriptures = [...prev];

          for (const scripture of scriptures) {
            const key = `${scripture.book}-${scripture.chapter}-${scripture.verse}`;
            const existingIndex = newScriptures.findIndex(
              s => `${s.book}-${s.chapter}-${s.verse}` === key
            );

            if (existingIndex === -1) {
              // Prepend new scripture (stack order - newest on top)
              newScriptures.unshift({
                ...scripture,
                id: generateId(),
                detectedAt: Date.now(),
              });
            } else if (
              getConfidenceLevel(scripture.confidence) >
              getConfidenceLevel(newScriptures[existingIndex].confidence)
            ) {
              // Update if higher confidence
              newScriptures[existingIndex] = {
                ...newScriptures[existingIndex],
                ...scripture,
              };
            }
          }

          // Keep only last 30 scriptures
          return newScriptures.slice(0, 30);
        });
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
        console.error('GPT detection error:', err);
        setError(err instanceof Error ? err.message : 'Detection failed');
      } finally {
        setIsDetecting(false);
        pendingRequestRef.current = null;
      }
    }, debounceTime);
  }, [generateId]);

  /**
   * Clear all detected scriptures
   */
  const clearScriptures = useCallback(() => {
    setDetectedScriptures([]);
    lastTextRef.current = '';
    setError(null);
  }, []);

  return {
    isDetecting,
    detectedScriptures,
    error,
    detect,
    clearScriptures,
  };
}

/**
 * Convert confidence string to numeric level for comparison
 */
function getConfidenceLevel(confidence: string): number {
  switch (confidence) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}
