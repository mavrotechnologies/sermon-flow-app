/**
 * Semantic Bible verse search using embeddings
 * Uses Transformers.js to run MiniLM model in the browser
 */

import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';

export interface SemanticMatch {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  similarity: number;
  confidence: 'high' | 'medium' | 'low';
}

interface VerseData {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  embedding?: number[];
}

// Singleton state
let extractor: FeatureExtractionPipeline | null = null;
let isModelLoading = false;
let modelLoadPromise: Promise<void> | null = null;
let bibleVerses: VerseData[] = [];

// Confidence thresholds from the research
const HIGH_CONFIDENCE_THRESHOLD = 0.75;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.60;

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
 * Generate embedding for text
 */
async function embed(text: string): Promise<number[]> {
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
      text: bibleVerses[index].text,
      similarity,
      confidence: getConfidence(similarity),
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
  return `${match.book} ${match.chapter}:${match.verse}`;
}
