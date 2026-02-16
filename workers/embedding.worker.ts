/**
 * Web Worker for Bible verse semantic search
 * Handles embedding generation and vector similarity search off the main thread
 */

import { pipeline, FeatureExtractionPipeline } from '@huggingface/transformers';

// Types
interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  embedding?: number[];
}

interface SearchResult {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  similarity: number;
}

interface WorkerMessage {
  type: 'init' | 'search' | 'status' | 'embed';
  id?: string;
  payload?: {
    text?: string;
    topK?: number;
  };
}

interface WorkerResponse {
  type: 'ready' | 'results' | 'error' | 'progress' | 'embedding';
  id?: string;
  payload?: {
    results?: SearchResult[];
    embedding?: number[];
    error?: string;
    progress?: string;
    modelLoaded?: boolean;
  };
}

// State
let extractor: FeatureExtractionPipeline | null = null;
let bibleEmbeddings: Float32Array | null = null;
let verseMetadata: BibleVerse[] | null = null;
let isInitialized = false;

const EMBEDDING_DIM = 384; // MiniLM dimension

/**
 * Initialize the embedding model and load Bible embeddings
 */
async function initialize(): Promise<void> {
  if (isInitialized) return;

  try {
    // Report progress
    postMessage({ type: 'progress', payload: { progress: 'Loading AI model...' } } as WorkerResponse);

    // Load the embedding model (quantized for smaller size)
    extractor = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2',
      {
        // Use quantized model for faster loading
        dtype: 'fp32',
      }
    );

    postMessage({ type: 'progress', payload: { progress: 'Loading Bible embeddings...' } } as WorkerResponse);

    // Load pre-computed embeddings
    const embeddingsResponse = await fetch('/data/bible-embeddings.bin');
    if (embeddingsResponse.ok) {
      const buffer = await embeddingsResponse.arrayBuffer();
      bibleEmbeddings = new Float32Array(buffer);
    }

    // Load verse metadata
    const metadataResponse = await fetch('/data/bible-metadata.json');
    if (metadataResponse.ok) {
      verseMetadata = await metadataResponse.json();
    }

    isInitialized = true;
    postMessage({ type: 'ready', payload: { modelLoaded: true } } as WorkerResponse);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to initialize';
    postMessage({ type: 'error', payload: { error: errorMessage } } as WorkerResponse);
  }
}

/**
 * Generate embedding for input text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  if (!extractor) {
    throw new Error('Model not initialized');
  }

  const output = await extractor(text, {
    pooling: 'mean',
    normalize: true,
  });

  // Extract the embedding array
  return Array.from(output.data as Float32Array);
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: Float32Array, offset: number): number {
  let dot = 0;
  for (let i = 0; i < EMBEDDING_DIM; i++) {
    dot += a[i] * b[offset + i];
  }
  return dot; // Vectors are already normalized
}

/**
 * Search for similar Bible verses
 */
async function searchVerses(text: string, topK: number = 5): Promise<SearchResult[]> {
  if (!extractor || !bibleEmbeddings || !verseMetadata) {
    throw new Error('Not initialized');
  }

  // Generate embedding for the search text
  const queryEmbedding = await generateEmbedding(text);

  // Compute similarities with all verses
  const scores: { index: number; score: number }[] = [];
  const numVerses = verseMetadata.length;

  for (let i = 0; i < numVerses; i++) {
    const similarity = cosineSimilarity(queryEmbedding, bibleEmbeddings, i * EMBEDDING_DIM);
    scores.push({ index: i, score: similarity });
  }

  // Sort by similarity (descending) and take top K
  scores.sort((a, b) => b.score - a.score);
  const topResults = scores.slice(0, topK);

  // Map to results with metadata
  return topResults.map(({ index, score }) => ({
    book: verseMetadata![index].book,
    chapter: verseMetadata![index].chapter,
    verse: verseMetadata![index].verse,
    text: verseMetadata![index].text,
    similarity: score,
  }));
}

// Message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, id, payload } = event.data;

  switch (type) {
    case 'init':
      await initialize();
      break;

    case 'embed':
      if (!payload?.text) {
        postMessage({ type: 'error', id, payload: { error: 'No text provided' } } as WorkerResponse);
        return;
      }

      try {
        if (!isInitialized) {
          await initialize();
        }
        const embedding = await generateEmbedding(payload.text);
        postMessage({ type: 'embedding', id, payload: { embedding } } as WorkerResponse);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Embed failed';
        postMessage({ type: 'error', id, payload: { error: errorMessage } } as WorkerResponse);
      }
      break;

    case 'search':
      if (!payload?.text) {
        postMessage({ type: 'error', id, payload: { error: 'No search text provided' } } as WorkerResponse);
        return;
      }

      try {
        // Initialize if not already done
        if (!isInitialized) {
          await initialize();
        }

        const results = await searchVerses(payload.text, payload.topK || 5);
        postMessage({ type: 'results', id, payload: { results } } as WorkerResponse);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Search failed';
        postMessage({ type: 'error', id, payload: { error: errorMessage } } as WorkerResponse);
      }
      break;

    case 'status':
      postMessage({
        type: 'ready',
        id,
        payload: { modelLoaded: isInitialized },
      } as WorkerResponse);
      break;
  }
};
