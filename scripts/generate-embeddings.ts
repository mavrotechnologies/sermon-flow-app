/**
 * Script to generate Bible verse embeddings
 * Run with: npx tsx scripts/generate-embeddings.ts
 *
 * This generates embeddings for all verses in our Bible JSON files
 * and outputs them as binary files for efficient loading
 */

import { pipeline } from '@huggingface/transformers';
import * as fs from 'fs';
import * as path from 'path';

interface BibleData {
  [book: string]: {
    [chapter: string]: {
      [verse: string]: string;
    };
  };
}

interface VerseMetadata {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

const EMBEDDING_DIM = 384;

async function generateEmbeddings() {
  console.log('Loading embedding model...');

  const extractor = await pipeline(
    'feature-extraction',
    'Xenova/all-MiniLM-L6-v2'
  );

  console.log('Model loaded!');

  // Load Bible data
  const kjvPath = path.join(process.cwd(), 'data', 'kjv.json');
  const kjvData: BibleData = JSON.parse(fs.readFileSync(kjvPath, 'utf-8'));

  // Extract all verses with metadata
  const verses: VerseMetadata[] = [];

  for (const [book, chapters] of Object.entries(kjvData)) {
    for (const [chapter, verseData] of Object.entries(chapters)) {
      for (const [verse, text] of Object.entries(verseData)) {
        verses.push({
          book: formatBookName(book),
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          text,
        });
      }
    }
  }

  console.log(`Found ${verses.length} verses to embed`);

  // Generate embeddings in batches
  const embeddings: number[][] = [];
  const batchSize = 10;

  for (let i = 0; i < verses.length; i += batchSize) {
    const batch = verses.slice(i, i + batchSize);
    const texts = batch.map(v => v.text);

    for (const text of texts) {
      const output = await extractor(text, {
        pooling: 'mean',
        normalize: true,
      });
      embeddings.push(Array.from(output.data as Float32Array));
    }

    if ((i + batchSize) % 50 === 0) {
      console.log(`Progress: ${Math.min(i + batchSize, verses.length)}/${verses.length}`);
    }
  }

  console.log('Embeddings generated!');

  // Save metadata as JSON
  const metadataPath = path.join(process.cwd(), 'public', 'data', 'bible-metadata.json');
  fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
  fs.writeFileSync(metadataPath, JSON.stringify(verses));
  console.log(`Saved metadata to ${metadataPath}`);

  // Save embeddings as binary Float32Array
  const flatEmbeddings = new Float32Array(embeddings.flat());
  const embeddingsPath = path.join(process.cwd(), 'public', 'data', 'bible-embeddings.bin');
  fs.writeFileSync(embeddingsPath, Buffer.from(flatEmbeddings.buffer));
  console.log(`Saved embeddings to ${embeddingsPath}`);

  console.log('Done!');
}

function formatBookName(book: string): string {
  // Capitalize book names
  return book
    .split(/(?=[A-Z0-9])/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/(\d)\s+/g, '$1 ');
}

generateEmbeddings().catch(console.error);
