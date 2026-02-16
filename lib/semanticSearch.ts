/**
 * Semantic Bible verse search using embeddings
 * Uses Transformers.js to run MiniLM model in the browser
 * Enhanced with popular verse pre-indexing and batch processing
 */

import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';
import { POPULAR_VERSES } from './popularVerseCache';

export interface SemanticMatch {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  text: string;
  similarity: number;
  confidence: 'high' | 'medium' | 'low';
  source: 'popular' | 'full';  // Whether from popular cache or full search
}

interface VerseData {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  text: string;
  embedding?: number[];
}

// Singleton state
let extractor: FeatureExtractionPipeline | null = null;
let isModelLoading = false;
let modelLoadPromise: Promise<void> | null = null;
let bibleVerses: VerseData[] = [];
let popularVerseEmbeddings: Map<string, { data: VerseData; embedding: number[] }> = new Map();
let popularVersesIndexed = false;

// Worker state
let embeddingWorker: Worker | null = null;
let workerReady = false;
let workerCallId = 0;
const pendingCallbacks = new Map<string, { resolve: (v: number[]) => void; reject: (e: Error) => void }>();

/**
 * Initialize the embedding Web Worker
 */
function initWorker(): boolean {
  if (embeddingWorker) return workerReady;
  if (typeof window === 'undefined') return false;

  try {
    embeddingWorker = new Worker(
      new URL('../workers/embedding.worker.ts', import.meta.url),
      { type: 'module' }
    );

    embeddingWorker.onmessage = (event) => {
      const { type, id, payload } = event.data;

      if (type === 'ready') {
        workerReady = true;
        return;
      }

      if (id && pendingCallbacks.has(id)) {
        const cb = pendingCallbacks.get(id)!;
        pendingCallbacks.delete(id);

        if (type === 'embedding' && payload?.embedding) {
          cb.resolve(payload.embedding);
        } else if (type === 'error') {
          cb.reject(new Error(payload?.error || 'Worker error'));
        }
      }
    };

    embeddingWorker.onerror = () => {
      // Worker failed to load — fall back to main thread
      embeddingWorker = null;
      workerReady = false;
      // Reject all pending callbacks
      for (const [, cb] of pendingCallbacks) {
        cb.reject(new Error('Worker crashed'));
      }
      pendingCallbacks.clear();
    };

    return true;
  } catch {
    embeddingWorker = null;
    return false;
  }
}

/**
 * Send an embed request to the worker and return a Promise for the result
 */
function workerEmbed(text: string): Promise<number[]> {
  return new Promise((resolve, reject) => {
    if (!embeddingWorker) {
      reject(new Error('Worker not available'));
      return;
    }
    const id = `e-${++workerCallId}`;
    pendingCallbacks.set(id, { resolve, reject });
    embeddingWorker.postMessage({ type: 'embed', id, payload: { text } });
  });
}

// Confidence thresholds
const HIGH_CONFIDENCE_THRESHOLD = 0.78;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.65;
const LOW_CONFIDENCE_THRESHOLD = 0.55;

/**
 * Initialize the embedding model
 */
export async function initializeSemanticSearch(
  onProgress?: (message: string) => void
): Promise<boolean> {
  if (extractor) return true;

  if (modelLoadPromise) {
    await modelLoadPromise;
    return !!extractor;
  }

  isModelLoading = true;
  modelLoadPromise = (async () => {
    try {
      // Try to start the Web Worker for off-main-thread inference
      initWorker();

      onProgress?.('Loading AI model (22MB)...');

      // @ts-expect-error - transformers.js pipeline has complex union types
      extractor = await pipeline(
        'feature-extraction',
        'Xenova/all-MiniLM-L6-v2',
        {
          progress_callback: (progress: { status: string; progress?: number }) => {
            if (progress.progress) {
              onProgress?.(`Loading model: ${Math.round(progress.progress)}%`);
            }
          },
        }
      );

      // Tell worker to initialize its model in parallel
      if (embeddingWorker) {
        embeddingWorker.postMessage({ type: 'init' });
      }

      onProgress?.('Loading Bible data...');

      // Load Bible verses from JSON
      // Embeddings will be computed on-demand during search
      try {
        const metadataRes = await fetch('/data/bible-metadata.json');
        if (metadataRes.ok) {
          bibleVerses = await metadataRes.json();
          onProgress?.('Ready!');
        } else {
          // Fall back to loading from bundled JSON
          await loadBibleFromJSON();
          onProgress?.('Ready!');
        }
      } catch {
        await loadBibleFromJSON();
        onProgress?.('Ready!');
      }
    } catch (error) {
      console.error('Failed to initialize semantic search:', error);
      throw error;
    } finally {
      isModelLoading = false;
    }
  })();

  await modelLoadPromise;
  return !!extractor;
}

/**
 * Load Bible verses from JSON files
 */
async function loadBibleFromJSON(): Promise<void> {
  try {
    // Import Bible data dynamically
    const kjvData = await import('@/data/kjv.json');

    bibleVerses = [];
    const data = kjvData.default || kjvData;

    for (const [book, chapters] of Object.entries(data)) {
      for (const [chapter, verses] of Object.entries(chapters as Record<string, Record<string, string>>)) {
        for (const [verse, text] of Object.entries(verses)) {
          bibleVerses.push({
            book: formatBookName(book),
            chapter: parseInt(chapter),
            verse: parseInt(verse),
            text,
          });
        }
      }
    }

    console.log(`Loaded ${bibleVerses.length} Bible verses`);
  } catch (error) {
    console.error('Failed to load Bible data:', error);
  }
}

/**
 * Format book name for display
 */
function formatBookName(book: string): string {
  const bookNames: Record<string, string> = {
    'genesis': 'Genesis',
    'psalms': 'Psalms',
    'proverbs': 'Proverbs',
    'ecclesiastes': 'Ecclesiastes',
    'daniel': 'Daniel',
    'hosea': 'Hosea',
    'joel': 'Joel',
    'amos': 'Amos',
    'micah': 'Micah',
    'habakkuk': 'Habakkuk',
    'malachi': 'Malachi',
    'isaiah': 'Isaiah',
    'jeremiah': 'Jeremiah',
    'matthew': 'Matthew',
    'john': 'John',
    'acts': 'Acts',
    'romans': 'Romans',
    '1corinthians': '1 Corinthians',
    '2corinthians': '2 Corinthians',
    'galatians': 'Galatians',
    'ephesians': 'Ephesians',
    'philippians': 'Philippians',
    'colossians': 'Colossians',
    '2timothy': '2 Timothy',
    'hebrews': 'Hebrews',
    'james': 'James',
    '1peter': '1 Peter',
    '1john': '1 John',
    'revelation': 'Revelation',
  };

  return bookNames[book.toLowerCase()] || book;
}

/**
 * Generate embedding for text (delegates to worker when available)
 */
async function embed(text: string): Promise<number[]> {
  // Try worker first for off-main-thread inference
  if (embeddingWorker && workerReady) {
    try {
      return await workerEmbed(text);
    } catch {
      // Worker failed — fall through to main-thread
    }
  }

  // Main-thread fallback
  if (!extractor) {
    throw new Error('Model not initialized');
  }

  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  return Array.from(output.data as Float32Array);
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return dot;
}

/**
 * Get confidence level from similarity score
 */
function getConfidence(similarity: number): 'high' | 'medium' | 'low' {
  if (similarity >= HIGH_CONFIDENCE_THRESHOLD) return 'high';
  if (similarity >= MEDIUM_CONFIDENCE_THRESHOLD) return 'medium';
  return 'low';
}

/**
 * Search for semantically similar Bible verses
 */
export async function searchBibleVerses(
  text: string,
  topK: number = 5,
  minConfidence: 'high' | 'medium' | 'low' = 'medium'
): Promise<SemanticMatch[]> {
  if (!extractor) {
    throw new Error('Semantic search not initialized. Call initializeSemanticSearch first.');
  }

  if (bibleVerses.length === 0) {
    console.warn('No Bible verses loaded');
    return [];
  }

  // Generate query embedding
  const queryEmbedding = await embed(text);

  // Calculate similarities (compute embeddings on demand and cache them)
  const results: { index: number; similarity: number }[] = [];

  for (let i = 0; i < bibleVerses.length; i++) {
    const verse = bibleVerses[i];

    // Cache embeddings for future searches
    if (!verse.embedding) {
      verse.embedding = await embed(verse.text);
    }

    const similarity = cosineSimilarity(queryEmbedding, verse.embedding);
    results.push({ index: i, similarity });
  }

  // Sort by similarity
  results.sort((a, b) => b.similarity - a.similarity);

  // Filter by minimum confidence and take top K
  const minThreshold = minConfidence === 'high'
    ? HIGH_CONFIDENCE_THRESHOLD
    : minConfidence === 'medium'
      ? MEDIUM_CONFIDENCE_THRESHOLD
      : 0;

  return results
    .filter(r => r.similarity >= minThreshold)
    .slice(0, topK)
    .map(({ index, similarity }) => ({
      book: bibleVerses[index].book,
      chapter: bibleVerses[index].chapter,
      verse: bibleVerses[index].verse,
      verseEnd: bibleVerses[index].verseEnd,
      text: bibleVerses[index].text,
      similarity,
      confidence: getConfidence(similarity),
      source: 'full' as const,
    }));
}

/**
 * Check if semantic search is ready
 */
export function isSemanticSearchReady(): boolean {
  return !!extractor && bibleVerses.length > 0;
}

/**
 * Check if model is currently loading
 */
export function isSemanticSearchLoading(): boolean {
  return isModelLoading;
}

/**
 * Format a semantic match as a reference string
 */
export function formatMatchReference(match: SemanticMatch): string {
  if (match.verseEnd && match.verseEnd !== match.verse) {
    return `${match.book} ${match.chapter}:${match.verse}-${match.verseEnd}`;
  }
  return `${match.book} ${match.chapter}:${match.verse}`;
}

/**
 * Index popular verses for fast searching
 * Should be called after model is initialized
 */
export async function indexPopularVerses(
  onProgress?: (message: string) => void
): Promise<void> {
  if (!extractor || popularVersesIndexed) return;

  onProgress?.('Indexing popular verses...');

  // Create verse data from popular verses
  for (const verse of POPULAR_VERSES) {
    // Create a combined text from keywords and verse reference
    const searchText = [
      ...verse.keywords,
      ...verse.paraphrases,
    ].join(' ');

    const data: VerseData = {
      book: verse.book,
      chapter: verse.chapter,
      verse: verse.verseStart,
      verseEnd: verse.verseEnd,
      text: searchText,
    };

    // Generate embedding
    const embedding = await embed(searchText);

    popularVerseEmbeddings.set(verse.reference, { data, embedding });
  }

  popularVersesIndexed = true;
  onProgress?.(`Indexed ${popularVerseEmbeddings.size} popular verses`);
}

/**
 * Fast search of popular verses only
 * Much faster than full Bible search
 */
export async function searchPopularVerses(
  text: string,
  topK: number = 5,
  minSimilarity: number = LOW_CONFIDENCE_THRESHOLD
): Promise<SemanticMatch[]> {
  if (!extractor) {
    throw new Error('Semantic search not initialized');
  }

  if (!popularVersesIndexed) {
    await indexPopularVerses();
  }

  const queryEmbedding = await embed(text);
  const results: { reference: string; data: VerseData; similarity: number }[] = [];

  for (const [reference, { data, embedding }] of popularVerseEmbeddings) {
    const similarity = cosineSimilarity(queryEmbedding, embedding);
    if (similarity >= minSimilarity) {
      results.push({ reference, data, similarity });
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, topK).map(({ data, similarity }) => ({
    book: data.book,
    chapter: data.chapter,
    verse: data.verse,
    verseEnd: data.verseEnd,
    text: data.text,
    similarity,
    confidence: getConfidence(similarity),
    source: 'popular' as const,
  }));
}

/**
 * Tiered search: popular verses first, then full Bible if needed
 */
export async function tieredSemanticSearch(
  text: string,
  options: {
    topK?: number;
    minConfidence?: 'high' | 'medium' | 'low';
    searchFullBible?: boolean;
  } = {}
): Promise<SemanticMatch[]> {
  const { topK = 5, minConfidence = 'medium', searchFullBible = false } = options;

  // Stage 1: Search popular verses (fast)
  const popularResults = await searchPopularVerses(text, topK);

  // If we have high-confidence matches, return early
  const highConfidenceMatches = popularResults.filter(r => r.confidence === 'high');
  if (highConfidenceMatches.length > 0) {
    return highConfidenceMatches;
  }

  // If we have enough medium-confidence matches and not requiring high, return
  if (minConfidence !== 'high' && popularResults.length >= topK) {
    return popularResults;
  }

  // Stage 2: Full Bible search if enabled and needed
  if (searchFullBible && bibleVerses.length > 0) {
    const fullResults = await searchBibleVerses(text, topK, minConfidence);

    // Merge results, preferring popular verse matches
    const mergedResults = [...popularResults];
    const existingRefs = new Set(popularResults.map(r => `${r.book}-${r.chapter}-${r.verse}`));

    for (const result of fullResults) {
      const ref = `${result.book}-${result.chapter}-${result.verse}`;
      if (!existingRefs.has(ref)) {
        mergedResults.push({ ...result, source: 'full' as const });
        existingRefs.add(ref);
      }
    }

    mergedResults.sort((a, b) => b.similarity - a.similarity);
    return mergedResults.slice(0, topK);
  }

  return popularResults;
}

/**
 * Get embedding statistics
 */
export function getSemanticSearchStats(): {
  modelLoaded: boolean;
  popularVersesIndexed: boolean;
  popularVerseCount: number;
  fullBibleVerseCount: number;
} {
  return {
    modelLoaded: !!extractor,
    popularVersesIndexed,
    popularVerseCount: popularVerseEmbeddings.size,
    fullBibleVerseCount: bibleVerses.length,
  };
}
