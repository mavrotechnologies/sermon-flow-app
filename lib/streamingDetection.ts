/**
 * Streaming Scripture Detection
 *
 * Processes transcript text word-by-word for near-instant detection.
 * Doesn't wait for sentence boundaries - detects as words arrive.
 *
 * Key features:
 * - Word-level detection with rolling buffer
 * - Predictive pre-fetching when book names detected
 * - Stable match tracking to avoid flickering
 * - Interim result processing before finalization
 */

import { detectScriptures } from './scriptureDetector';
import { searchPopularVerseCache } from './popularVerseCache';
import { normalizeSpokenText } from './normalizeSpoken';
import type { ScriptureReference, BibleVerse, BibleTranslation } from '@/types';
import type { ActiveScriptureContext } from './normalizeSpoken';
import { lookupVerses } from './verseLookup';

// All 66 Bible book names and common abbreviations for early detection
const BOOK_PATTERNS = [
  // Old Testament
  { pattern: /\b(genesis|gen)\b/i, book: 'Genesis' },
  { pattern: /\b(exodus|exod|ex)\b/i, book: 'Exodus' },
  { pattern: /\b(leviticus|lev)\b/i, book: 'Leviticus' },
  { pattern: /\b(numbers|num)\b/i, book: 'Numbers' },
  { pattern: /\b(deuteronomy|deut|dt)\b/i, book: 'Deuteronomy' },
  { pattern: /\b(joshua|josh)\b/i, book: 'Joshua' },
  { pattern: /\b(judges|judg)\b/i, book: 'Judges' },
  { pattern: /\b(ruth)\b/i, book: 'Ruth' },
  { pattern: /\b(1\s*samuel|first\s*samuel|1\s*sam)\b/i, book: '1 Samuel' },
  { pattern: /\b(2\s*samuel|second\s*samuel|2\s*sam)\b/i, book: '2 Samuel' },
  { pattern: /\b(1\s*kings|first\s*kings|1\s*kgs)\b/i, book: '1 Kings' },
  { pattern: /\b(2\s*kings|second\s*kings|2\s*kgs)\b/i, book: '2 Kings' },
  { pattern: /\b(1\s*chronicles|first\s*chronicles|1\s*chr)\b/i, book: '1 Chronicles' },
  { pattern: /\b(2\s*chronicles|second\s*chronicles|2\s*chr)\b/i, book: '2 Chronicles' },
  { pattern: /\b(ezra)\b/i, book: 'Ezra' },
  { pattern: /\b(nehemiah|neh)\b/i, book: 'Nehemiah' },
  { pattern: /\b(esther|est)\b/i, book: 'Esther' },
  { pattern: /\b(job)\b/i, book: 'Job' },
  { pattern: /\b(psalms?|ps)\b/i, book: 'Psalms' },
  { pattern: /\b(proverbs|prov|pr)\b/i, book: 'Proverbs' },
  { pattern: /\b(ecclesiastes|eccl|ecc)\b/i, book: 'Ecclesiastes' },
  { pattern: /\b(song\s*of\s*solomon|song\s*of\s*songs|songs?|sos)\b/i, book: 'Song of Solomon' },
  { pattern: /\b(isaiah|isa)\b/i, book: 'Isaiah' },
  { pattern: /\b(jeremiah|jer)\b/i, book: 'Jeremiah' },
  { pattern: /\b(lamentations|lam)\b/i, book: 'Lamentations' },
  { pattern: /\b(ezekiel|ezek|ez)\b/i, book: 'Ezekiel' },
  { pattern: /\b(daniel|dan)\b/i, book: 'Daniel' },
  { pattern: /\b(hosea|hos)\b/i, book: 'Hosea' },
  { pattern: /\b(joel)\b/i, book: 'Joel' },
  { pattern: /\b(amos)\b/i, book: 'Amos' },
  { pattern: /\b(obadiah|obad)\b/i, book: 'Obadiah' },
  { pattern: /\b(jonah|jon)\b/i, book: 'Jonah' },
  { pattern: /\b(micah|mic)\b/i, book: 'Micah' },
  { pattern: /\b(nahum|nah)\b/i, book: 'Nahum' },
  { pattern: /\b(habakkuk|hab)\b/i, book: 'Habakkuk' },
  { pattern: /\b(zephaniah|zeph)\b/i, book: 'Zephaniah' },
  { pattern: /\b(haggai|hag)\b/i, book: 'Haggai' },
  { pattern: /\b(zechariah|zech)\b/i, book: 'Zechariah' },
  { pattern: /\b(malachi|mal)\b/i, book: 'Malachi' },
  // New Testament
  { pattern: /\b(matthew|matt|mt)\b/i, book: 'Matthew' },
  { pattern: /\b(mark|mk)\b/i, book: 'Mark' },
  { pattern: /\b(luke|lk)\b/i, book: 'Luke' },
  { pattern: /\b(john|jn)\b/i, book: 'John' },
  { pattern: /\b(acts)\b/i, book: 'Acts' },
  { pattern: /\b(romans|rom)\b/i, book: 'Romans' },
  { pattern: /\b(1\s*corinthians|first\s*corinthians|1\s*cor)\b/i, book: '1 Corinthians' },
  { pattern: /\b(2\s*corinthians|second\s*corinthians|2\s*cor)\b/i, book: '2 Corinthians' },
  { pattern: /\b(galatians|gal)\b/i, book: 'Galatians' },
  { pattern: /\b(ephesians|eph)\b/i, book: 'Ephesians' },
  { pattern: /\b(philippians|phil)\b/i, book: 'Philippians' },
  { pattern: /\b(colossians|col)\b/i, book: 'Colossians' },
  { pattern: /\b(1\s*thessalonians|first\s*thessalonians|1\s*thess)\b/i, book: '1 Thessalonians' },
  { pattern: /\b(2\s*thessalonians|second\s*thessalonians|2\s*thess)\b/i, book: '2 Thessalonians' },
  { pattern: /\b(1\s*timothy|first\s*timothy|1\s*tim)\b/i, book: '1 Timothy' },
  { pattern: /\b(2\s*timothy|second\s*timothy|2\s*tim)\b/i, book: '2 Timothy' },
  { pattern: /\b(titus|tit)\b/i, book: 'Titus' },
  { pattern: /\b(philemon|phlm)\b/i, book: 'Philemon' },
  { pattern: /\b(hebrews|heb)\b/i, book: 'Hebrews' },
  { pattern: /\b(james|jas)\b/i, book: 'James' },
  { pattern: /\b(1\s*peter|first\s*peter|1\s*pet)\b/i, book: '1 Peter' },
  { pattern: /\b(2\s*peter|second\s*peter|2\s*pet)\b/i, book: '2 Peter' },
  { pattern: /\b(1\s*john|first\s*john|1\s*jn)\b/i, book: '1 John' },
  { pattern: /\b(2\s*john|second\s*john|2\s*jn)\b/i, book: '2 John' },
  { pattern: /\b(3\s*john|third\s*john|3\s*jn)\b/i, book: '3 John' },
  { pattern: /\b(jude)\b/i, book: 'Jude' },
  { pattern: /\b(revelation|rev)\b/i, book: 'Revelation' },
];

// Chapter pattern after book name
const CHAPTER_PATTERN = /\bchapter\s+(\d+)|(\d+)\s*(?::|verse)/i;

// Verse pattern
const VERSE_PATTERN = /\bverse\s+(\d+)|:\s*(\d+)/i;

export interface StreamingMatch {
  id: string;
  type: 'book' | 'chapter' | 'verse' | 'complete';
  book: string;
  chapter?: number;
  verse?: number;
  verseEnd?: number;
  confidence: number;
  timestamp: number;
  stableFor: number;  // ms this match has been stable
  prefetchedVerses?: BibleVerse[];
}

export interface StreamingDetectionState {
  currentBook: string | null;
  currentChapter: number | null;
  currentVerse: number | null;
  pendingMatches: Map<string, StreamingMatch>;
  confirmedMatches: Map<string, StreamingMatch>;
  wordBuffer: string[];
  lastUpdate: number;
}

/**
 * Create initial streaming detection state
 */
export function createStreamingState(): StreamingDetectionState {
  return {
    currentBook: null,
    currentChapter: null,
    currentVerse: null,
    pendingMatches: new Map(),
    confirmedMatches: new Map(),
    wordBuffer: [],
    lastUpdate: Date.now(),
  };
}

// Words that are common English and also Bible book names — require chapter/verse context
const AMBIGUOUS_BOOKS = new Set([
  'Job', 'Mark', 'Acts', 'Ruth', 'John', 'James', 'Jude',
  'Song of Solomon', 'Joel', 'Amos', 'Jonah', 'Micah', 'Titus',
]);

/**
 * Detect book name in text
 * For ambiguous book names (common English words), requires nearby chapter/verse context
 */
export function detectBookName(text: string): string | null {
  for (const { pattern, book } of BOOK_PATTERNS) {
    if (pattern.test(text)) {
      // For ambiguous names, require a number nearby (chapter/verse indicator)
      if (AMBIGUOUS_BOOKS.has(book)) {
        // Check if there's a chapter:verse pattern or "chapter X" or just digits nearby
        const hasChapterVerse = /\d+\s*[:.]\s*\d+/.test(text) ||
          /\bchapter\s+\d/i.test(text) ||
          /\bverse\s+\d/i.test(text);
        // Also accept if the book name is directly followed by a number (e.g., "John 3")
        const bookFollowedByNumber = new RegExp(
          pattern.source + '\\s+\\d', 'i'
        ).test(text);
        if (!hasChapterVerse && !bookFollowedByNumber) {
          continue; // Skip — likely a common English word, not a Bible book
        }
      }
      return book;
    }
  }
  return null;
}

/**
 * Detect chapter number after book name
 */
export function detectChapter(text: string): number | null {
  const match = text.match(CHAPTER_PATTERN);
  if (match) {
    return parseInt(match[1] || match[2], 10);
  }
  // Also check for standalone numbers after book name
  const numMatch = text.match(/\b(\d{1,3})\b/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }
  return null;
}

/**
 * Detect verse number
 */
export function detectVerse(text: string): { verse: number; verseEnd?: number } | null {
  const verseMatch = text.match(VERSE_PATTERN);
  if (verseMatch) {
    const verse = parseInt(verseMatch[1] || verseMatch[2], 10);
    // Check for verse range
    const rangeMatch = text.match(/:?\s*\d+\s*[-–]\s*(\d+)/);
    const verseEnd = rangeMatch ? parseInt(rangeMatch[1], 10) : undefined;
    return { verse, verseEnd };
  }
  return null;
}

/**
 * Process a single word and update state
 */
export function processWord(
  word: string,
  state: StreamingDetectionState
): {
  state: StreamingDetectionState;
  bookDetected: string | null;
  chapterDetected: number | null;
  verseDetected: { verse: number; verseEnd?: number } | null;
  shouldPrefetch: 'book' | 'chapter' | 'verse' | null;
} {
  const now = Date.now();

  // Add word to buffer (keep last 20 words)
  state.wordBuffer.push(word);
  if (state.wordBuffer.length > 20) {
    state.wordBuffer.shift();
  }
  state.lastUpdate = now;

  // Join recent words for pattern matching
  const recentText = state.wordBuffer.join(' ');

  let bookDetected: string | null = null;
  let chapterDetected: number | null = null;
  let verseDetected: { verse: number; verseEnd?: number } | null = null;
  let shouldPrefetch: 'book' | 'chapter' | 'verse' | null = null;

  // Detect book name
  const book = detectBookName(recentText);
  if (book && book !== state.currentBook) {
    state.currentBook = book;
    state.currentChapter = null;
    state.currentVerse = null;
    bookDetected = book;
    shouldPrefetch = 'book';
  }

  // Detect chapter (only if we have a book)
  if (state.currentBook) {
    const chapter = detectChapter(recentText);
    if (chapter && chapter !== state.currentChapter && chapter <= 150) {
      state.currentChapter = chapter;
      state.currentVerse = null;
      chapterDetected = chapter;
      shouldPrefetch = 'chapter';
    }
  }

  // Detect verse (only if we have book and chapter)
  if (state.currentBook && state.currentChapter) {
    const verse = detectVerse(recentText);
    if (verse && verse.verse !== state.currentVerse && verse.verse <= 176) {
      state.currentVerse = verse.verse;
      verseDetected = verse;
      shouldPrefetch = 'verse';
    }
  }

  return {
    state,
    bookDetected,
    chapterDetected,
    verseDetected,
    shouldPrefetch,
  };
}

/**
 * Process interim transcript text (streaming)
 */
export function processInterimText(
  text: string,
  state: StreamingDetectionState
): {
  state: StreamingDetectionState;
  earlyMatches: StreamingMatch[];
  shouldPrefetch: { book: string; chapter?: number } | null;
} {
  // Normalize spoken text first (converts "one" to "1", handles "chapter X verse Y", etc.)
  const normalizedText = normalizeSpokenText(text);

  const words = normalizedText.trim().split(/\s+/);
  const earlyMatches: StreamingMatch[] = [];
  let shouldPrefetch: { book: string; chapter?: number } | null = null;

  // Process each word
  for (const word of words) {
    const result = processWord(word, state);
    state = result.state;

    if (result.bookDetected) {
      shouldPrefetch = { book: result.bookDetected };
    }
    if (result.chapterDetected && state.currentBook) {
      shouldPrefetch = { book: state.currentBook, chapter: result.chapterDetected };
    }
  }

  // Build active context for relative reference resolution
  const activeContext: ActiveScriptureContext | null =
    state.currentBook && state.currentChapter
      ? { book: state.currentBook, chapter: state.currentChapter }
      : null;

  // Run regex detection on the normalized text with context for relative references
  const regexMatches = detectScriptures(normalizedText, activeContext);
  for (const match of regexMatches) {
    const key = `${match.book}-${match.chapter}-${match.verseStart}`;
    if (!state.confirmedMatches.has(key)) {
      const streamingMatch: StreamingMatch = {
        id: match.id,
        type: 'complete',
        book: match.book,
        chapter: match.chapter,
        verse: match.verseStart,
        verseEnd: match.verseEnd,
        confidence: 0.9,
        timestamp: Date.now(),
        stableFor: 0,
      };
      earlyMatches.push(streamingMatch);
    }
  }

  // Also check popular verse cache for quick matches (use normalized text)
  const cacheMatches = searchPopularVerseCache(normalizedText, 10);
  for (const match of cacheMatches) {
    if (match.confidence === 'high') {
      const key = `${match.verse.book}-${match.verse.chapter}-${match.verse.verseStart}`;
      if (!state.confirmedMatches.has(key)) {
        const streamingMatch: StreamingMatch = {
          id: `cache-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          type: 'complete',
          book: match.verse.book,
          chapter: match.verse.chapter,
          verse: match.verse.verseStart,
          verseEnd: match.verse.verseEnd,
          confidence: match.score / 20, // Normalize score
          timestamp: Date.now(),
          stableFor: 0,
        };
        earlyMatches.push(streamingMatch);
      }
    }
  }

  return { state, earlyMatches, shouldPrefetch };
}

/**
 * Pre-fetch verses for a book/chapter
 */
export async function prefetchVerses(
  book: string,
  chapter?: number,
  translation: BibleTranslation = 'NKJV'
): Promise<BibleVerse[]> {
  if (!chapter) {
    // Just pre-load the book metadata, no actual verses yet
    return [];
  }

  // Prefetch first few verses of the chapter (likely candidates)
  const ref: ScriptureReference = {
    id: `prefetch-${book}-${chapter}`,
    rawText: `${book} ${chapter}`,
    book,
    chapter,
    verseStart: 1,
    verseEnd: 10, // Prefetch first 10 verses
    osis: `${book}.${chapter}.1-${book}.${chapter}.10`,
  };

  return lookupVerses(ref, translation);
}

/**
 * Stable match tracking - only emit matches that have been stable for a threshold
 */
export function trackStableMatch(
  match: StreamingMatch,
  pendingMatches: Map<string, StreamingMatch>,
  stableThresholdMs: number = 300
): { isStable: boolean; match: StreamingMatch } {
  const key = `${match.book}-${match.chapter || 0}-${match.verse || 0}`;
  const existing = pendingMatches.get(key);

  if (existing) {
    // Update stability time
    match.stableFor = Date.now() - existing.timestamp;
    pendingMatches.set(key, match);

    return {
      isStable: match.stableFor >= stableThresholdMs,
      match,
    };
  } else {
    // New match
    match.stableFor = 0;
    pendingMatches.set(key, match);
    return { isStable: false, match };
  }
}

/**
 * Clear matches that haven't been seen recently
 */
export function pruneStaleMatches(
  pendingMatches: Map<string, StreamingMatch>,
  maxAgeMs: number = 2000
): void {
  const now = Date.now();
  for (const [key, match] of pendingMatches) {
    if (now - match.timestamp > maxAgeMs) {
      pendingMatches.delete(key);
    }
  }
}

/**
 * Reset streaming state (e.g., after a pause in speech)
 */
export function resetStreamingState(state: StreamingDetectionState): StreamingDetectionState {
  return {
    ...state,
    currentBook: null,
    currentChapter: null,
    currentVerse: null,
    wordBuffer: [],
    pendingMatches: new Map(),
  };
}
