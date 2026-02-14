/**
 * Staged Scripture Detection Pipeline
 *
 * Implements a multi-stage detection approach:
 * Stage 1: Regex/BCV parsing (instant, explicit references)
 * Stage 2: Popular verse cache (instant, keyword matching)
 * Stage 3: Semantic search (50-100ms, embeddings)
 * Stage 4: GPT fallback (200-500ms, only when needed)
 *
 * This reduces API costs and improves detection speed.
 */

import { detectScriptures } from './scriptureDetector';
import { searchPopularVerseCache, type CacheMatchResult } from './popularVerseCache';
import { tieredSemanticSearch, isSemanticSearchReady, type SemanticMatch } from './semanticSearch';
import { type SermonSessionContext } from './sessionContext';
import type { ScriptureReference } from '@/types';

// Detection result with source tracking
export interface PipelineDetection {
  id: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'regex' | 'cache' | 'semantic' | 'gpt' | 'context';
  reason?: string;
  score?: number;
}

export interface PipelineConfig {
  enableRegex: boolean;
  enableCache: boolean;
  enableSemantic: boolean;
  enableGPT: boolean;
  enableContext: boolean;
  semanticMinConfidence: 'high' | 'medium' | 'low';
  gptFallbackThreshold: 'always' | 'medium-only' | 'never';
}

const DEFAULT_CONFIG: PipelineConfig = {
  enableRegex: true,
  enableCache: true,
  enableSemantic: true,
  enableGPT: true,
  enableContext: true,
  semanticMinConfidence: 'medium',
  gptFallbackThreshold: 'medium-only',
};

export interface PipelineResult {
  detections: PipelineDetection[];
  stagesRun: string[];
  timings: Record<string, number>;
  shouldCallGPT: boolean;
  gptContext?: string;
}

/**
 * Generate unique detection ID
 */
function generateId(): string {
  return `det-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Convert regex detection to pipeline format
 */
function regexToPipeline(ref: ScriptureReference): PipelineDetection {
  return {
    id: ref.id || generateId(),
    book: ref.book,
    chapter: ref.chapter,
    verseStart: ref.verseStart,
    verseEnd: ref.verseEnd,
    confidence: 'high',
    source: 'regex',
    reason: `Explicit reference: "${ref.rawText}"`,
  };
}

/**
 * Convert cache match to pipeline format
 */
function cacheToPipeline(match: CacheMatchResult): PipelineDetection {
  return {
    id: generateId(),
    book: match.verse.book,
    chapter: match.verse.chapter,
    verseStart: match.verse.verseStart,
    verseEnd: match.verse.verseEnd,
    confidence: match.confidence,
    source: 'cache',
    reason: `Matched keywords for ${match.verse.reference}`,
    score: match.score,
  };
}

/**
 * Convert semantic match to pipeline format
 */
function semanticToPipeline(match: SemanticMatch): PipelineDetection {
  return {
    id: generateId(),
    book: match.book,
    chapter: match.chapter,
    verseStart: match.verse,
    verseEnd: match.verseEnd,
    confidence: match.confidence,
    source: 'semantic',
    reason: `Semantic similarity: ${(match.similarity * 100).toFixed(1)}%`,
    score: match.similarity,
  };
}

/**
 * Convert context suggestion to pipeline format
 */
function contextToPipeline(suggestion: { book: string; chapter: number; confidence: number }): PipelineDetection {
  return {
    id: generateId(),
    book: suggestion.book,
    chapter: suggestion.chapter,
    verseStart: 1, // Context doesn't give specific verses
    confidence: suggestion.confidence >= 0.8 ? 'high' : suggestion.confidence >= 0.6 ? 'medium' : 'low',
    source: 'context',
    reason: 'Continuation from previous reference',
    score: suggestion.confidence,
  };
}

/**
 * Deduplicate detections, preferring higher confidence sources
 */
function deduplicateDetections(detections: PipelineDetection[]): PipelineDetection[] {
  const seen = new Map<string, PipelineDetection>();

  // Priority order for sources
  const sourcePriority: Record<string, number> = {
    regex: 5,
    cache: 4,
    semantic: 3,
    context: 2,
    gpt: 1,
  };

  for (const detection of detections) {
    const key = `${detection.book}-${detection.chapter}-${detection.verseStart}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, detection);
    } else {
      // Keep the one with higher source priority
      const existingPriority = sourcePriority[existing.source] || 0;
      const newPriority = sourcePriority[detection.source] || 0;

      if (newPriority > existingPriority) {
        seen.set(key, detection);
      } else if (newPriority === existingPriority) {
        // Same priority, keep higher confidence
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        if (confidenceOrder[detection.confidence] > confidenceOrder[existing.confidence]) {
          seen.set(key, detection);
        }
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Main staged detection pipeline
 */
export async function runDetectionPipeline(
  text: string,
  sessionContext?: SermonSessionContext,
  config: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const detections: PipelineDetection[] = [];
  const stagesRun: string[] = [];
  const timings: Record<string, number> = {};

  // Stage 1: Regex/BCV Detection (instant)
  // Pass active context for resolving relative references like "verse 6"
  if (fullConfig.enableRegex) {
    const start = performance.now();
    const activeContext = sessionContext ? {
      book: sessionContext.getContext().currentBook,
      chapter: sessionContext.getContext().currentChapter,
    } : null;

    // Only pass valid context (both book and chapter must be set)
    const validContext = activeContext?.book && activeContext?.chapter
      ? { book: activeContext.book, chapter: activeContext.chapter }
      : null;

    const regexResults = detectScriptures(text, validContext);
    timings['regex'] = performance.now() - start;
    stagesRun.push('regex');

    for (const ref of regexResults) {
      detections.push(regexToPipeline(ref));
    }

    // If we found explicit references, we might skip later stages
    if (regexResults.length > 0) {
      // Found explicit references - still run other stages for additional matches
      // but mark that GPT is less needed
    }
  }

  // Stage 2: Popular Verse Cache (instant)
  if (fullConfig.enableCache) {
    const start = performance.now();
    const cacheResults = searchPopularVerseCache(text, 7);
    timings['cache'] = performance.now() - start;
    stagesRun.push('cache');

    for (const match of cacheResults) {
      detections.push(cacheToPipeline(match));
    }
  }

  // Stage 3: Context-based Detection
  if (fullConfig.enableContext && sessionContext) {
    const start = performance.now();
    const contextSuggestions = sessionContext.suggestFromContext(text);
    timings['context'] = performance.now() - start;
    stagesRun.push('context');

    for (const suggestion of contextSuggestions) {
      detections.push(contextToPipeline(suggestion));
    }
  }

  // Stage 4: Semantic Search (50-100ms)
  if (fullConfig.enableSemantic && isSemanticSearchReady()) {
    const start = performance.now();
    try {
      const semanticResults = await tieredSemanticSearch(text, {
        topK: 5,
        minConfidence: fullConfig.semanticMinConfidence,
        searchFullBible: false, // Only search popular verses for speed
      });
      timings['semantic'] = performance.now() - start;
      stagesRun.push('semantic');

      for (const match of semanticResults) {
        detections.push(semanticToPipeline(match));
      }
    } catch (error) {
      console.warn('Semantic search failed:', error);
      timings['semantic'] = performance.now() - start;
    }
  }

  // Deduplicate results
  const uniqueDetections = deduplicateDetections(detections);

  // Determine if GPT fallback is needed
  let shouldCallGPT = false;
  let gptContext = '';

  if (fullConfig.enableGPT) {
    const hasHighConfidence = uniqueDetections.some(d => d.confidence === 'high');
    const hasMediumConfidence = uniqueDetections.some(d => d.confidence === 'medium');
    const hasTheologicalContent = detectTheologicalContent(text);

    switch (fullConfig.gptFallbackThreshold) {
      case 'always':
        shouldCallGPT = true;
        break;
      case 'medium-only':
        // Call GPT if we have medium-confidence matches that need verification
        // Or if we detected theological content but found nothing
        shouldCallGPT = (hasMediumConfidence && !hasHighConfidence) ||
          (hasTheologicalContent && uniqueDetections.length === 0);
        break;
      case 'never':
        shouldCallGPT = false;
        break;
    }

    if (shouldCallGPT && sessionContext) {
      gptContext = sessionContext.getContextHint();
    }
  }

  return {
    detections: uniqueDetections,
    stagesRun,
    timings,
    shouldCallGPT,
    gptContext,
  };
}

/**
 * Detect if text contains theological content that might reference scripture
 */
function detectTheologicalContent(text: string): boolean {
  const theologicalTerms = [
    'scripture', 'bible', 'verse', 'chapter', 'gospel',
    'jesus', 'christ', 'god', 'lord', 'spirit', 'holy',
    'faith', 'grace', 'salvation', 'sin', 'forgiveness',
    'prayer', 'worship', 'praise', 'blessing', 'commandment',
    'prophet', 'apostle', 'disciple', 'pharisee',
    'heaven', 'eternal', 'kingdom', 'covenant',
    'paul', 'peter', 'moses', 'david', 'abraham',
    'says the lord', 'it is written', 'the word says',
    'as we read', 'scripture tells us', 'bible says',
  ];

  const lowerText = text.toLowerCase();
  return theologicalTerms.some(term => lowerText.includes(term));
}

/**
 * Quick check if text might contain scripture references
 * Useful for deciding whether to run the full pipeline
 */
export function mightContainScripture(text: string): boolean {
  // Quick regex patterns
  const quickPatterns = [
    /\b\d+:\d+/,  // verse pattern like 3:16
    /\b(genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalm|proverbs|ecclesiastes|song|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation)\b/i,
  ];

  return quickPatterns.some(pattern => pattern.test(text)) || detectTheologicalContent(text);
}

/**
 * Calculate combined confidence score from multiple signals
 */
export function calculateMultiSignalConfidence(
  detections: PipelineDetection[],
  text: string
): Map<string, number> {
  const confidenceScores = new Map<string, number>();

  for (const detection of detections) {
    const key = `${detection.book}-${detection.chapter}-${detection.verseStart}`;
    let score = confidenceScores.get(key) || 0;

    // Base score from source
    const sourceWeights: Record<string, number> = {
      regex: 0.95,    // Very reliable
      cache: 0.85,    // High reliability for popular verses
      semantic: 0.75, // Good but can have false positives
      context: 0.65,  // Helpful but speculative
      gpt: 0.80,      // Generally good but expensive
    };

    const sourceScore = sourceWeights[detection.source] || 0.5;

    // Confidence weight
    const confidenceWeights = { high: 1.0, medium: 0.7, low: 0.4 };
    const confidenceWeight = confidenceWeights[detection.confidence];

    // Combined source contribution
    const contribution = sourceScore * confidenceWeight * 0.3; // Each source adds up to 30%

    score = Math.min(1.0, score + contribution);
    confidenceScores.set(key, score);
  }

  return confidenceScores;
}
