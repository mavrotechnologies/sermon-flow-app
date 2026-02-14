'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  createStreamingState,
  processInterimText,
  prefetchVerses,
  trackStableMatch,
  pruneStaleMatches,
  resetStreamingState,
  type StreamingMatch,
  type StreamingDetectionState,
} from '@/lib/streamingDetection';
import { lookupVerses } from '@/lib/verseLookup';
import type { BibleVerse, BibleTranslation, ScriptureReference } from '@/types';

export interface StreamingScripture {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  verses: BibleVerse[];
  confidence: number;
  source: 'streaming' | 'interim' | 'final';
  detectedAt: number;
  displayedAt: number;
  latencyMs: number;  // Time from detection to display
}

interface UseStreamingScriptureDetectionResult {
  // Detected scriptures
  streamingScriptures: StreamingScripture[];

  // Processing state
  isProcessing: boolean;
  currentBook: string | null;
  currentChapter: number | null;
  pendingReference: string | null;  // e.g., "Romans 8..." while waiting for verse

  // Actions
  processInterim: (text: string) => void;
  processFinal: (text: string) => Promise<void>;
  clear: () => void;

  // Settings
  translation: BibleTranslation;
  setTranslation: (t: BibleTranslation) => void;

  // Stats
  avgLatencyMs: number;
  prefetchHits: number;
}

// Prefetch cache
const prefetchCache = new Map<string, BibleVerse[]>();

/**
 * Hook for streaming (real-time) scripture detection
 *
 * Processes interim transcript text word-by-word for near-instant detection.
 * Pre-fetches verses when book/chapter detected before verse number spoken.
 */
export function useStreamingScriptureDetection(
  onScriptureDetected?: (scripture: StreamingScripture) => void
): UseStreamingScriptureDetectionResult {
  // State
  const [streamingScriptures, setStreamingScriptures] = useState<StreamingScripture[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBook, setCurrentBook] = useState<string | null>(null);
  const [currentChapter, setCurrentChapter] = useState<number | null>(null);
  const [pendingReference, setPendingReference] = useState<string | null>(null);
  const [translation, setTranslation] = useState<BibleTranslation>('NKJV');
  const [avgLatencyMs, setAvgLatencyMs] = useState(0);
  const [prefetchHits, setPrefetchHits] = useState(0);

  // Refs
  const stateRef = useRef<StreamingDetectionState>(createStreamingState());
  const processedIdsRef = useRef<Set<string>>(new Set());
  const latenciesRef = useRef<number[]>([]);
  const lastInterimRef = useRef<string>('');
  const prefetchingRef = useRef<Set<string>>(new Set());
  const interimProcessingRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Prune stale pending matches periodically
   */
  useEffect(() => {
    const interval = setInterval(() => {
      pruneStaleMatches(stateRef.current.pendingMatches, 3000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Pre-fetch verses when book/chapter detected
   */
  const handlePrefetch = useCallback(
    async (book: string, chapter?: number) => {
      const key = chapter ? `${book}-${chapter}` : book;

      // Already prefetching or cached
      if (prefetchingRef.current.has(key) || prefetchCache.has(key)) {
        return;
      }

      prefetchingRef.current.add(key);
      setCurrentBook(book);
      if (chapter) {
        setCurrentChapter(chapter);
        setPendingReference(`${book} ${chapter}...`);
      } else {
        setPendingReference(`${book}...`);
      }

      try {
        const verses = await prefetchVerses(book, chapter, translation);
        if (verses.length > 0) {
          prefetchCache.set(key, verses);
        }
      } catch (error) {
        console.warn('Prefetch failed:', error);
      } finally {
        prefetchingRef.current.delete(key);
      }
    },
    [translation]
  );

  /**
   * Get verses from cache or fetch
   */
  const getVerses = useCallback(
    async (book: string, chapter: number, verse: number, verseEnd?: number): Promise<BibleVerse[]> => {
      const cacheKey = `${book}-${chapter}`;

      // Check prefetch cache first
      const cached = prefetchCache.get(cacheKey);
      if (cached) {
        // Filter to specific verses
        const filtered = cached.filter(
          v => v.verse >= verse && v.verse <= (verseEnd || verse)
        );
        if (filtered.length > 0) {
          setPrefetchHits(prev => prev + 1);
          return filtered;
        }
      }

      // Fetch specific verses
      const ref: ScriptureReference = {
        id: `stream-${Date.now()}`,
        rawText: `${book} ${chapter}:${verse}`,
        book,
        chapter,
        verseStart: verse,
        verseEnd,
        osis: '',
      };

      return lookupVerses(ref, translation);
    },
    [translation]
  );

  /**
   * Process interim (streaming) text
   * Runs on every update of interim text for real-time detection
   */
  const processInterim = useCallback(
    (text: string) => {
      // Skip if same as last interim
      if (text === lastInterimRef.current) return;
      lastInterimRef.current = text;

      // Debounce slightly to avoid processing every keystroke
      if (interimProcessingRef.current) {
        clearTimeout(interimProcessingRef.current);
      }

      interimProcessingRef.current = setTimeout(() => {
        setIsProcessing(true);

        try {
          const result = processInterimText(text, stateRef.current);
          stateRef.current = result.state;

          // Update current book/chapter from streaming state for context tracking
          if (result.state.currentBook) {
            setCurrentBook(result.state.currentBook);
          }
          if (result.state.currentChapter) {
            setCurrentChapter(result.state.currentChapter);
          }

          // Handle prefetch
          if (result.shouldPrefetch) {
            handlePrefetch(result.shouldPrefetch.book, result.shouldPrefetch.chapter);
          }

          // Process early matches
          for (const match of result.earlyMatches) {
            const key = `${match.book}-${match.chapter}-${match.verse}`;

            // Skip if already confirmed
            if (processedIdsRef.current.has(key)) continue;

            // Track stability - reduced from 350ms to 150ms for faster detection
            const { isStable, match: trackedMatch } = trackStableMatch(
              match,
              stateRef.current.pendingMatches,
              150 // 150ms stability threshold - fast enough for African preaching
            );

            if (isStable && match.type === 'complete') {
              // Stable match - emit it!
              processedIdsRef.current.add(key);
              stateRef.current.confirmedMatches.set(key, trackedMatch);

              // Get verses (may be from prefetch cache)
              getVerses(
                match.book,
                match.chapter!,
                match.verse!,
                match.verseEnd
              ).then(verses => {
                const displayedAt = Date.now();
                const latency = displayedAt - match.timestamp;

                const scripture: StreamingScripture = {
                  id: match.id,
                  book: match.book,
                  chapter: match.chapter!,
                  verse: match.verse!,
                  verseEnd: match.verseEnd,
                  verses,
                  confidence: match.confidence,
                  source: 'interim',
                  detectedAt: match.timestamp,
                  displayedAt,
                  latencyMs: latency,
                };

                // Track latency
                latenciesRef.current.push(latency);
                if (latenciesRef.current.length > 50) {
                  latenciesRef.current.shift();
                }
                setAvgLatencyMs(
                  latenciesRef.current.reduce((a, b) => a + b, 0) / latenciesRef.current.length
                );

                // Add to scriptures
                setStreamingScriptures(prev => [scripture, ...prev]);
                setPendingReference(null);

                // Notify callback
                onScriptureDetected?.(scripture);
              });
            }
          }
        } catch (error) {
          console.error('Interim processing error:', error);
        } finally {
          setIsProcessing(false);
        }
      }, 30); // 30ms debounce - reduced for faster response
    },
    [handlePrefetch, getVerses, onScriptureDetected]
  );

  /**
   * Process final transcript text
   * Runs when a segment is finalized - catches anything missed
   */
  const processFinal = useCallback(
    async (text: string) => {
      setIsProcessing(true);

      try {
        const result = processInterimText(text, stateRef.current);
        stateRef.current = result.state;

        // Process all matches (don't require stability for final text)
        for (const match of result.earlyMatches) {
          if (match.type !== 'complete') continue;

          const key = `${match.book}-${match.chapter}-${match.verse}`;
          if (processedIdsRef.current.has(key)) continue;

          processedIdsRef.current.add(key);

          const verses = await getVerses(
            match.book,
            match.chapter!,
            match.verse!,
            match.verseEnd
          );

          const displayedAt = Date.now();
          const latency = displayedAt - match.timestamp;

          const scripture: StreamingScripture = {
            id: match.id,
            book: match.book,
            chapter: match.chapter!,
            verse: match.verse!,
            verseEnd: match.verseEnd,
            verses,
            confidence: match.confidence,
            source: 'final',
            detectedAt: match.timestamp,
            displayedAt,
            latencyMs: latency,
          };

          setStreamingScriptures(prev => [scripture, ...prev]);
          onScriptureDetected?.(scripture);
        }

        // Clear pending reference
        setPendingReference(null);

        // Reset book/chapter tracking after final (pause in speech)
        setTimeout(() => {
          if (!isProcessing) {
            stateRef.current = resetStreamingState(stateRef.current);
            setCurrentBook(null);
            setCurrentChapter(null);
          }
        }, 2000);
      } catch (error) {
        console.error('Final processing error:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [getVerses, isProcessing, onScriptureDetected]
  );

  /**
   * Clear all state
   */
  const clear = useCallback(() => {
    setStreamingScriptures([]);
    stateRef.current = createStreamingState();
    processedIdsRef.current.clear();
    latenciesRef.current = [];
    prefetchCache.clear();
    lastInterimRef.current = '';
    setCurrentBook(null);
    setCurrentChapter(null);
    setPendingReference(null);
    setAvgLatencyMs(0);
    setPrefetchHits(0);
  }, []);

  return {
    streamingScriptures,
    isProcessing,
    currentBook,
    currentChapter,
    pendingReference,
    processInterim,
    processFinal,
    clear,
    translation,
    setTranslation,
    avgLatencyMs,
    prefetchHits,
  };
}
