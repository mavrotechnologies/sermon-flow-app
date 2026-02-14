'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { detectScriptures, initializeParser, formatReference } from '@/lib/scriptureDetector';
import { lookupVerses } from '@/lib/verseLookup';
import type { TranscriptSegment, DetectedScripture, ScriptureReference, BibleTranslation, BibleVerse } from '@/types';

interface UseScriptureDetectionResult {
  detectedScriptures: DetectedScripture[];
  processSegment: (segment: TranscriptSegment) => Promise<DetectedScripture[]>;
  addScriptureByRef: (book: string, chapter: number, verse: number, verseEnd?: number) => Promise<void>;
  navigateVerse: (scriptureId: string, direction: 'prev' | 'next') => Promise<void>;
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
  const [translation, setTranslation] = useState<BibleTranslation>('NKJV');

  const processedRefs = useRef<Set<string>>(new Set());
  const isInitialized = useRef(false);
  const verseCache = useRef<Map<string, BibleVerse[]>>(new Map());

  // Use ref to access current scriptures in useEffect without stale closure
  const scripturesRef = useRef<DetectedScripture[]>([]);
  scripturesRef.current = detectedScriptures;

  // Initialize the BCV parser
  useEffect(() => {
    if (!isInitialized.current) {
      initializeParser().catch(console.error);
      isInitialized.current = true;
    }
  }, []);

  // Re-fetch verses when translation changes
  useEffect(() => {
    // Access current scriptures via ref to avoid stale closure
    const currentScriptures = scripturesRef.current;
    if (currentScriptures.length === 0) return;

    const refetchVerses = async () => {
      setIsProcessing(true);
      try {
        const updatedScriptures = await Promise.all(
          currentScriptures.map(async (scripture) => {
            const verses = await lookupVerses(scripture, translation);
            return { ...scripture, verses };
          })
        );
        setDetectedScriptures(updatedScriptures);
      } catch (error) {
        console.error('Error refetching verses:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    refetchVerses();
  }, [translation]);

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
   * Fetch a verse with caching
   */
  const fetchVersesCached = useCallback(
    async (book: string, chapter: number, verse: number): Promise<BibleVerse[]> => {
      const cacheKey = `${book}-${chapter}-${verse}-${translation}`;
      const cached = verseCache.current.get(cacheKey);
      if (cached) return cached;

      const ref: ScriptureReference = {
        id: 'nav',
        rawText: `${book} ${chapter}:${verse}`,
        book,
        chapter,
        verseStart: verse,
        osis: `${book}.${chapter}.${verse}`,
      };

      const verses = await lookupVerses(ref, translation);
      if (verses.length > 0) {
        verseCache.current.set(cacheKey, verses);
      }
      return verses;
    },
    [translation]
  );

  /**
   * Prefetch adjacent verses in background
   */
  const prefetchAdjacent = useCallback(
    (book: string, chapter: number, verse: number) => {
      if (verse > 1) fetchVersesCached(book, chapter, verse - 1).catch(() => {});
      fetchVersesCached(book, chapter, verse + 1).catch(() => {});
    },
    [fetchVersesCached]
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

        // Prefetch adjacent verses for fast navigation
        prefetchAdjacent(book, chapter, verse);
      } catch (error) {
        console.error('Error adding scripture by ref:', error);
      }
    },
    [translation, onScriptureDetected, prefetchAdjacent]
  );

  /**
   * Navigate to prev/next verse for a scripture card
   */
  const navigateVerse = useCallback(
    async (scriptureId: string, direction: 'prev' | 'next'): Promise<void> => {
      const scripture = scripturesRef.current.find(s => s.id === scriptureId);
      if (!scripture) return;

      const newVerseStart = direction === 'next'
        ? (scripture.verseEnd || scripture.verseStart) + 1
        : scripture.verseStart - 1;

      if (newVerseStart < 1) return;

      try {
        const verses = await fetchVersesCached(scripture.book, scripture.chapter, newVerseStart);
        if (verses.length === 0) return;

        setDetectedScriptures(prev =>
          prev.map(s =>
            s.id === scriptureId
              ? { ...s, verseStart: newVerseStart, verseEnd: undefined, verses }
              : s
          )
        );

        // Prefetch adjacent verses for instant next navigation
        prefetchAdjacent(scripture.book, scripture.chapter, newVerseStart);
      } catch (error) {
        console.error('Error navigating verse:', error);
      }
    },
    [fetchVersesCached, prefetchAdjacent]
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
    navigateVerse,
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
