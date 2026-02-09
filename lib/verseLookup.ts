import type { BibleVerse, ScriptureReference, BibleTranslation } from '@/types';

// Cache for loaded Bible data
const bibleCache: Partial<Record<BibleTranslation, BibleData>> = {};

interface BibleData {
  [book: string]: {
    [chapter: string]: {
      [verse: string]: string;
    };
  };
}

/**
 * Load Bible data for a translation from local JSON
 */
async function loadBibleData(translation: BibleTranslation): Promise<BibleData | null> {
  if (bibleCache[translation]) {
    return bibleCache[translation]!;
  }

  try {
    const data = await import(`@/data/${translation.toLowerCase()}.json`);
    bibleCache[translation] = data.default || data;
    return bibleCache[translation]!;
  } catch (error) {
    console.warn(`Failed to load ${translation} Bible data:`, error);
    return null;
  }
}

/**
 * Normalize book name to match JSON keys
 */
function normalizeBookName(book: string): string {
  // Remove ordinal prefixes and standardize
  return book
    .replace(/^(\d)\s+/, '$1')
    .replace(/\s+/g, '')
    .toLowerCase();
}

/**
 * Look up verses from local Bible data
 */
async function lookupLocal(
  ref: ScriptureReference,
  translation: BibleTranslation
): Promise<BibleVerse[]> {
  const bibleData = await loadBibleData(translation);
  if (!bibleData) return [];

  const normalizedBook = normalizeBookName(ref.book);
  const bookData = bibleData[normalizedBook] || bibleData[ref.book];

  if (!bookData) {
    console.warn(`Book not found: ${ref.book}`);
    return [];
  }

  const chapterData = bookData[ref.chapter.toString()];
  if (!chapterData) {
    console.warn(`Chapter not found: ${ref.book} ${ref.chapter}`);
    return [];
  }

  const verses: BibleVerse[] = [];
  const endVerse = ref.verseEnd || ref.verseStart;

  for (let v = ref.verseStart; v <= endVerse; v++) {
    const verseText = chapterData[v.toString()];
    if (verseText) {
      verses.push({
        book: ref.book,
        chapter: ref.chapter,
        verse: v,
        text: verseText,
        translation,
      });
    }
  }

  return verses;
}

// Map our translation names to bible-api.com translations
const API_TRANSLATION_MAP: Record<string, string> = {
  // Public domain - direct support
  KJV: 'kjv',
  WEB: 'web',
  ASV: 'asv',
  BBE: 'bbe',
  DARBY: 'darby',
  YLT: 'ylt',
  WBT: 'web', // Webster fallback
  // Premium - fallback to KJV
  ESV: 'kjv',
  NIV: 'kjv',
  NKJV: 'kjv',
  NASB: 'kjv',
  NLT: 'kjv',
  AMP: 'kjv',
  MSG: 'kjv',
};

/**
 * Fallback: Look up verses from bible-api.com
 */
async function lookupAPI(
  ref: ScriptureReference,
  translation: BibleTranslation
): Promise<BibleVerse[]> {
  const verseRef = ref.verseEnd
    ? `${ref.book}+${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`
    : `${ref.book}+${ref.chapter}:${ref.verseStart}`;

  const apiTranslation = API_TRANSLATION_MAP[translation] || 'kjv';

  try {
    const response = await fetch(
      `https://bible-api.com/${encodeURIComponent(verseRef)}?translation=${apiTranslation}`
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.verses) {
      return data.verses.map((v: { book_name: string; chapter: number; verse: number; text: string }) => ({
        book: v.book_name,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text.trim(),
        translation,
      }));
    }

    // Single verse response
    if (data.text) {
      return [{
        book: ref.book,
        chapter: ref.chapter,
        verse: ref.verseStart,
        text: data.text.trim(),
        translation,
      }];
    }

    return [];
  } catch (error) {
    console.error('Bible API lookup failed:', error);
    return [];
  }
}

/**
 * Look up verses for a scripture reference
 * Tries local data first, falls back to API
 */
export async function lookupVerses(
  ref: ScriptureReference,
  translation: BibleTranslation = 'KJV'
): Promise<BibleVerse[]> {
  // Try local lookup first
  const localVerses = await lookupLocal(ref, translation);
  if (localVerses.length > 0) {
    return localVerses;
  }

  // Fall back to API
  return lookupAPI(ref, translation);
}

/**
 * Look up a single verse
 */
export async function lookupSingleVerse(
  book: string,
  chapter: number,
  verse: number,
  translation: BibleTranslation = 'KJV'
): Promise<BibleVerse | null> {
  const ref: ScriptureReference = {
    id: 'temp',
    rawText: `${book} ${chapter}:${verse}`,
    book,
    chapter,
    verseStart: verse,
    osis: `${book}.${chapter}.${verse}`,
  };

  const verses = await lookupVerses(ref, translation);
  return verses[0] || null;
}

/**
 * Format verses for display
 */
export function formatVerses(verses: BibleVerse[]): string {
  return verses.map((v) => `${v.verse}. ${v.text}`).join(' ');
}

/**
 * Get a summary of the verse reference
 */
export function getVerseReference(verses: BibleVerse[]): string {
  if (verses.length === 0) return '';

  const first = verses[0];
  const last = verses[verses.length - 1];

  if (verses.length === 1) {
    return `${first.book} ${first.chapter}:${first.verse}`;
  }

  return `${first.book} ${first.chapter}:${first.verse}-${last.verse}`;
}
