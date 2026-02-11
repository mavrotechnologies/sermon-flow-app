'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SlidingWindowBuffer,
  createSlidingWindowBuffer,
  type BufferedSegment,
} from '@/lib/slidingWindowBuffer';
import {
  SermonSessionContext,
  createSessionContext,
} from '@/lib/sessionContext';
import {
  runDetectionPipeline,
  mightContainScripture,
  calculateMultiSignalConfidence,
  type PipelineDetection,
  type PipelineConfig,
} from '@/lib/stagedDetectionPipeline';
import {
  initializeSemanticSearch,
  indexPopularVerses,
  isSemanticSearchReady,
  getSemanticSearchStats,
} from '@/lib/semanticSearch';
import { lookupVerses } from '@/lib/verseLookup';
import type { TranscriptSegment, DetectedScripture, BibleTranslation, BibleVerse } from '@/types';

export interface EnhancedDetection extends PipelineDetection {
  verses: BibleVerse[];
  timestamp: number;
  multiSignalScore?: number;
}

export interface DetectionStats {
  regexCount: number;
  cacheCount: number;
  semanticCount: number;
  contextCount: number;
  gptCount: number;
  totalDetections: number;
  avgDetectionTimeMs: number;
  semanticSearchReady: boolean;
}

interface UseEnhancedScriptureDetectionResult {
  // State
  detectedScriptures: EnhancedDetection[];
  isProcessing: boolean;
  isInitializing: boolean;
  initProgress: string;
  error: string | null;
  stats: DetectionStats;

  // Actions
  processSegment: (segment: TranscriptSegment) => Promise<EnhancedDetection[]>;
  clearScriptures: () => void;
  initialize: () => Promise<void>;

  // Settings
  translation: BibleTranslation;
  setTranslation: (translation: BibleTranslation) => void;
  pipelineConfig: PipelineConfig;
  setPipelineConfig: (config: Partial<PipelineConfig>) => void;
}

const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  enableRegex: true,
  enableCache: true,
  enableSemantic: true,
  enableGPT: true,
  enableContext: true,
  semanticMinConfidence: 'medium',
  gptFallbackThreshold: 'medium-only',
};

/**
 * Enhanced scripture detection hook with all improvements:
 * - Sliding window buffer for split references
 * - Popular verse cache for instant lookup
 * - Session context tracking
 * - Semantic search with embeddings
 * - Staged pipeline with GPT fallback
 * - Multi-signal confidence scoring
 */
export function useEnhancedScriptureDetection(
  onScriptureDetected?: (scripture: EnhancedDetection) => void
): UseEnhancedScriptureDetectionResult {
  // State
  const [detectedScriptures, setDetectedScriptures] = useState<EnhancedDetection[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [translation, setTranslation] = useState<BibleTranslation>('NKJV');
  const [pipelineConfig, setPipelineConfigState] = useState<PipelineConfig>(DEFAULT_PIPELINE_CONFIG);
  const [stats, setStats] = useState<DetectionStats>({
    regexCount: 0,
    cacheCount: 0,
    semanticCount: 0,
    contextCount: 0,
    gptCount: 0,
    totalDetections: 0,
    avgDetectionTimeMs: 0,
    semanticSearchReady: false,
  });

  // Refs
  const bufferRef = useRef<SlidingWindowBuffer>(createSlidingWindowBuffer());
  const contextRef = useRef<SermonSessionContext>(createSessionContext());
  const processedIdsRef = useRef<Set<string>>(new Set());
  const detectionTimesRef = useRef<number[]>([]);
  const isInitializedRef = useRef(false);
  const scripturesRef = useRef<EnhancedDetection[]>([]);

  // Keep ref in sync with state for useEffect access
  scripturesRef.current = detectedScriptures;

  /**
   * Initialize semantic search model
   */
  const initialize = useCallback(async () => {
    if (isInitializedRef.current || isInitializing) return;

    setIsInitializing(true);
    setInitProgress('Starting initialization...');

    try {
      // Initialize semantic search model
      await initializeSemanticSearch((message) => {
        setInitProgress(message);
      });

      // Index popular verses
      setInitProgress('Indexing popular verses...');
      await indexPopularVerses((message) => {
        setInitProgress(message);
      });

      isInitializedRef.current = true;
      setInitProgress('Ready!');

      // Update stats
      const searchStats = getSemanticSearchStats();
      setStats(prev => ({
        ...prev,
        semanticSearchReady: searchStats.modelLoaded && searchStats.popularVersesIndexed,
      }));
    } catch (err) {
      console.error('Failed to initialize enhanced detection:', err);
      setError('Failed to initialize AI model. Basic detection still works.');
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing]);

  // Auto-initialize on mount (but don't block)
  useEffect(() => {
    // Delay initialization slightly to not block initial render
    const timer = setTimeout(() => {
      initialize().catch(console.error);
    }, 1000);

    return () => clearTimeout(timer);
  }, [initialize]);

  /**
   * Re-fetch verses when translation changes
   */
  useEffect(() => {
    const currentScriptures = scripturesRef.current;
    if (currentScriptures.length === 0) return;

    const refetchVerses = async () => {
      setIsProcessing(true);
      try {
        const updatedScriptures = await Promise.all(
          currentScriptures.map(async (scripture) => {
            const verses = await lookupVerses(
              {
                id: scripture.id,
                rawText: `${scripture.book} ${scripture.chapter}:${scripture.verseStart}`,
                book: scripture.book,
                chapter: scripture.chapter,
                verseStart: scripture.verseStart,
                verseEnd: scripture.verseEnd,
                osis: '',
              },
              translation
            );
            return { ...scripture, verses };
          })
        );
        setDetectedScriptures(updatedScriptures);
      } catch (err) {
        console.error('Error refetching verses:', err);
      } finally {
        setIsProcessing(false);
      }
    };

    refetchVerses();
  }, [translation]);

  /**
   * Process a transcript segment through the pipeline
   */
  const processSegment = useCallback(
    async (segment: TranscriptSegment): Promise<EnhancedDetection[]> => {
      if (!segment.text.trim()) return [];

      const startTime = performance.now();
      setIsProcessing(true);
      const newScriptures: EnhancedDetection[] = [];

      try {
        // Add to sliding window buffer
        const bufferedSegment: BufferedSegment = {
          id: segment.id,
          text: segment.text,
          timestamp: segment.timestamp,
          isFinal: segment.isFinal,
        };
        bufferRef.current.add(bufferedSegment);

        // Get combined text from buffer
        const { fullWindow, hasNewContent } = bufferRef.current.getNewText();

        // Only process if there's meaningful new content
        if (!hasNewContent && !segment.isFinal) {
          setIsProcessing(false);
          return [];
        }

        // Quick check if worth running pipeline
        if (!mightContainScripture(fullWindow)) {
          bufferRef.current.markProcessed();
          setIsProcessing(false);
          return [];
        }

        // Run the staged detection pipeline
        const result = await runDetectionPipeline(
          fullWindow,
          contextRef.current,
          pipelineConfig
        );

        // Calculate multi-signal confidence
        const confidenceScores = calculateMultiSignalConfidence(result.detections, fullWindow);

        // Process each detection
        for (const detection of result.detections) {
          const key = `${detection.book}-${detection.chapter}-${detection.verseStart}`;

          // Skip if already processed
          if (processedIdsRef.current.has(key)) continue;
          processedIdsRef.current.add(key);

          // Update session context
          contextRef.current.addReference(
            detection.book,
            detection.chapter,
            detection.verseStart,
            detection.verseEnd
          );

          // Lookup verse text
          const verses = await lookupVerses(
            {
              id: detection.id,
              rawText: `${detection.book} ${detection.chapter}:${detection.verseStart}`,
              book: detection.book,
              chapter: detection.chapter,
              verseStart: detection.verseStart,
              verseEnd: detection.verseEnd,
              osis: '',
            },
            translation
          );

          const enhancedDetection: EnhancedDetection = {
            ...detection,
            verses,
            timestamp: segment.timestamp,
            multiSignalScore: confidenceScores.get(key),
          };

          newScriptures.push(enhancedDetection);
          onScriptureDetected?.(enhancedDetection);
        }

        // Update stats
        const detectionTime = performance.now() - startTime;
        detectionTimesRef.current.push(detectionTime);
        if (detectionTimesRef.current.length > 100) {
          detectionTimesRef.current.shift();
        }

        setStats(prev => {
          const newStats = { ...prev };
          for (const detection of result.detections) {
            switch (detection.source) {
              case 'regex':
                newStats.regexCount++;
                break;
              case 'cache':
                newStats.cacheCount++;
                break;
              case 'semantic':
                newStats.semanticCount++;
                break;
              case 'context':
                newStats.contextCount++;
                break;
              case 'gpt':
                newStats.gptCount++;
                break;
            }
          }
          newStats.totalDetections = processedIdsRef.current.size;
          newStats.avgDetectionTimeMs =
            detectionTimesRef.current.reduce((a, b) => a + b, 0) /
            detectionTimesRef.current.length;
          newStats.semanticSearchReady = isSemanticSearchReady();
          return newStats;
        });

        // Add new scriptures to state
        if (newScriptures.length > 0) {
          setDetectedScriptures(prev => [...newScriptures, ...prev]);
        }

        // Mark buffer as processed
        bufferRef.current.markProcessed();

        // Handle GPT fallback if needed
        if (result.shouldCallGPT && pipelineConfig.enableGPT) {
          // The GPT detection is handled by the existing useGPTScriptureDetection hook
          // We just log that it should be called
          console.log('GPT fallback recommended:', result.gptContext);
        }
      } catch (err) {
        console.error('Error processing segment:', err);
        setError('Error detecting scriptures');
      } finally {
        setIsProcessing(false);
      }

      return newScriptures;
    },
    [translation, pipelineConfig, onScriptureDetected]
  );

  /**
   * Clear all detected scriptures and reset context
   */
  const clearScriptures = useCallback(() => {
    setDetectedScriptures([]);
    processedIdsRef.current.clear();
    bufferRef.current.clear();
    contextRef.current.reset();
    detectionTimesRef.current = [];
    setStats({
      regexCount: 0,
      cacheCount: 0,
      semanticCount: 0,
      contextCount: 0,
      gptCount: 0,
      totalDetections: 0,
      avgDetectionTimeMs: 0,
      semanticSearchReady: isSemanticSearchReady(),
    });
    setError(null);
  }, []);

  /**
   * Update pipeline configuration
   */
  const setPipelineConfig = useCallback((config: Partial<PipelineConfig>) => {
    setPipelineConfigState(prev => ({ ...prev, ...config }));
  }, []);

  return {
    detectedScriptures,
    isProcessing,
    isInitializing,
    initProgress,
    error,
    stats,
    processSegment,
    clearScriptures,
    initialize,
    translation,
    setTranslation,
    pipelineConfig,
    setPipelineConfig,
  };
}
