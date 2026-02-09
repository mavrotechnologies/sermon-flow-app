'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { detectScriptures, initializeParser, formatReference } from '@/lib/scriptureDetector';
import { lookupVerses } from '@/lib/verseLookup';
import type { TranscriptSegment, DetectedScripture, ScriptureReference, BibleTranslation } from '@/types';

interface UseScriptureDetectionResult {
  detectedScriptures: DetectedScripture[];
  processSegment: (segment: TranscriptSegment) => Promise<DetectedScripture[]>;
  addScriptureByRef: (book: string, chapter: number, verse: number, verseEnd?: number) => Promise<void>;
  clearScriptures: () => void;
  isProcessing: boolean;
  translation: BibleTranslation;
  setTranslation: (translation: BibleTranslation) => void;
}

/**
 * Hook for detecting and looking up scripture references
 * Processes transcript segments and fetches verse text
 */
export function useScriptureDetection(
  onScriptureDetected?: (scripture: DetectedScripture) => void
): UseScriptureDetectionResult {
  const [detectedScriptures, setDetectedScriptures] = useState<DetectedScripture[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [translation, setTranslation] = useState<BibleTranslation>('KJV');

  const processedRefs = useRef<Set<string>>(new Set());
  const isInitialized = useRef(false);

  // Initialize the BCV parser
  useEffect(() => {
    if (!isInitialized.current) {
      initializeParser().catch(console.error);
      isInitialized.current = true;
    }
  }, []);

  /**
   * Create unique key for a scripture reference to avoid duplicates
   */
  const getRefKey = useCallback((ref: ScriptureReference): string => {
    return `${ref.book}-${ref.chapter}-${ref.verseStart}-${ref.verseEnd || ref.verseStart}`;
  }, []);

  /**
   * Process a transcript segment for scripture references
   */
  const processSegment = useCallback(
    async (segment: TranscriptSegment): Promise<DetectedScripture[]> => {
      if (!segment.text.trim()) return [];

      setIsProcessing(true);
      const newScriptures: DetectedScripture[] = [];

      try {
        // Detect scripture references in the text
        const refs = detectScriptures(segment.text);

        for (const ref of refs) {
          const refKey = getRefKey(ref);

          // Skip if already processed
          if (processedRefs.current.has(refKey)) continue;
          processedRefs.current.add(refKey);

          // Look up the verses
          const verses = await lookupVerses(ref, translation);

          const detectedScripture: DetectedScripture = {
            ...ref,
            verses,
            timestamp: segment.timestamp,
          };

          newScriptures.push(detectedScripture);

          // Notify callback
          onScriptureDetected?.(detectedScripture);
        }

        if (newScriptures.length > 0) {
          // Add new scriptures at the beginning (stack order - newest first)
          setDetectedScriptures((prev) => [...newScriptures, ...prev]);
        }
      } catch (error) {
        console.error('Error processing segment:', error);
      } finally {
        setIsProcessing(false);
      }

      return newScriptures;
    },
    [translation, getRefKey, onScriptureDetected]
  );

  /**
   * Add a scripture by reference (from GPT detection)
   */
  const addScriptureByRef = useCallback(
    async (book: string, chapter: number, verse: number, verseEnd?: number): Promise<void> => {
      const refKey = `${book}-${chapter}-${verse}-${verseEnd || verse}`;

      // Skip if already processed
      if (processedRefs.current.has(refKey)) return;
      processedRefs.current.add(refKey);

      try {
        const ref: ScriptureReference = {
          id: `gpt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          rawText: `${book} ${chapter}:${verse}${verseEnd ? `-${verseEnd}` : ''}`,
          book,
          chapter,
          verseStart: verse,
          verseEnd,
          osis: `${book}.${chapter}.${verse}${verseEnd ? `-${book}.${chapter}.${verseEnd}` : ''}`,
        };

        // Look up the verses
        const verses = await lookupVerses(ref, translation);

        const detectedScripture: DetectedScripture = {
          ...ref,
          verses,
          timestamp: Date.now(),
        };

        // Add at the beginning (stack order - newest first)
        setDetectedScriptures((prev) => [detectedScripture, ...prev]);
        onScriptureDetected?.(detectedScripture);
      } catch (error) {
        console.error('Error adding scripture by ref:', error);
      }
    },
    [translation, onScriptureDetected]
  );

  /**
   * Clear all detected scriptures
   */
  const clearScriptures = useCallback(() => {
    setDetectedScriptures([]);
    processedRefs.current.clear();
  }, []);

  return {
    detectedScriptures,
    processSegment,
    addScriptureByRef,
    clearScriptures,
    isProcessing,
    translation,
    setTranslation,
  };
}

/**
 * Format a detected scripture for display
 */
export function formatDetectedScripture(scripture: DetectedScripture): string {
  return formatReference(scripture);
}
