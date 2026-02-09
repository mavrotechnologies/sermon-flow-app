import type { ScriptureReference } from '@/types';
import { normalizeSpokenText, mightContainScripture } from './normalizeSpoken';

// bible-passage-reference-parser provides a global bcv_parser when loaded
// We'll dynamically import it since it's a browser library
let bcvParser: BcvParser | null = null;

interface BcvParser {
  parse: (text: string) => BcvParser;
  osis: () => string;
  osis_and_indices: () => OsisAndIndices[];
}

interface OsisAndIndices {
  osis: string;
  indices: [number, number];
}

/**
 * Initialize the BCV parser
 * Must be called before using detectScriptures
 */
export async function initializeParser(): Promise<void> {
  if (bcvParser) return;

  try {
    // Dynamic import of the parser
    const bcvModule = await import('bible-passage-reference-parser/js/en_bcv_parser');
    const BCVParser = (bcvModule as { default?: { bcv_parser: new () => BcvParser } }).default?.bcv_parser;

    if (BCVParser) {
      bcvParser = new BCVParser();
    }
  } catch (error) {
    console.error('Failed to initialize BCV parser:', error);
    // Fallback: use regex-based detection
  }
}

/**
 * Generate a unique ID for a scripture reference
 */
function generateId(): string {
  return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Parse OSIS reference to extract book, chapter, verse info
 * e.g., "John.3.16" → { book: "John", chapter: 3, verseStart: 16 }
 * e.g., "John.3.16-John.3.18" → { book: "John", chapter: 3, verseStart: 16, verseEnd: 18 }
 */
function parseOsis(osis: string): Omit<ScriptureReference, 'id' | 'rawText'> | null {
  if (!osis) return null;

  // Handle range (e.g., "John.3.16-John.3.18")
  const parts = osis.split('-');
  const startRef = parts[0];
  const endRef = parts.length > 1 ? parts[1] : null;

  const startMatch = startRef.match(/^(\w+)\.(\d+)\.(\d+)$/);
  if (!startMatch) {
    // Try chapter-only reference (e.g., "John.3")
    const chapterMatch = startRef.match(/^(\w+)\.(\d+)$/);
    if (chapterMatch) {
      return {
        book: formatBookName(chapterMatch[1]),
        chapter: parseInt(chapterMatch[2], 10),
        verseStart: 1,
        osis,
      };
    }
    return null;
  }

  const result: Omit<ScriptureReference, 'id' | 'rawText'> = {
    book: formatBookName(startMatch[1]),
    chapter: parseInt(startMatch[2], 10),
    verseStart: parseInt(startMatch[3], 10),
    osis,
  };

  if (endRef) {
    const endMatch = endRef.match(/\.(\d+)$/);
    if (endMatch) {
      result.verseEnd = parseInt(endMatch[1], 10);
    }
  }

  return result;
}

/**
 * Format OSIS book name to display name
 */
function formatBookName(osisBook: string): string {
  const bookNames: Record<string, string> = {
    'Gen': 'Genesis',
    'Exod': 'Exodus',
    'Lev': 'Leviticus',
    'Num': 'Numbers',
    'Deut': 'Deuteronomy',
    'Josh': 'Joshua',
    'Judg': 'Judges',
    'Ruth': 'Ruth',
    '1Sam': '1 Samuel',
    '2Sam': '2 Samuel',
    '1Kgs': '1 Kings',
    '2Kgs': '2 Kings',
    '1Chr': '1 Chronicles',
    '2Chr': '2 Chronicles',
    'Ezra': 'Ezra',
    'Neh': 'Nehemiah',
    'Esth': 'Esther',
    'Job': 'Job',
    'Ps': 'Psalms',
    'Prov': 'Proverbs',
    'Eccl': 'Ecclesiastes',
    'Song': 'Song of Solomon',
    'Isa': 'Isaiah',
    'Jer': 'Jeremiah',
    'Lam': 'Lamentations',
    'Ezek': 'Ezekiel',
    'Dan': 'Daniel',
    'Hos': 'Hosea',
    'Joel': 'Joel',
    'Amos': 'Amos',
    'Obad': 'Obadiah',
    'Jonah': 'Jonah',
    'Mic': 'Micah',
    'Nah': 'Nahum',
    'Hab': 'Habakkuk',
    'Zeph': 'Zephaniah',
    'Hag': 'Haggai',
    'Zech': 'Zechariah',
    'Mal': 'Malachi',
    'Matt': 'Matthew',
    'Mark': 'Mark',
    'Luke': 'Luke',
    'John': 'John',
    'Acts': 'Acts',
    'Rom': 'Romans',
    '1Cor': '1 Corinthians',
    '2Cor': '2 Corinthians',
    'Gal': 'Galatians',
    'Eph': 'Ephesians',
    'Phil': 'Philippians',
    'Col': 'Colossians',
    '1Thess': '1 Thessalonians',
    '2Thess': '2 Thessalonians',
    '1Tim': '1 Timothy',
    '2Tim': '2 Timothy',
    'Titus': 'Titus',
    'Phlm': 'Philemon',
    'Heb': 'Hebrews',
    'Jas': 'James',
    '1Pet': '1 Peter',
    '2Pet': '2 Peter',
    '1John': '1 John',
    '2John': '2 John',
    '3John': '3 John',
    'Jude': 'Jude',
    'Rev': 'Revelation',
  };

  return bookNames[osisBook] || osisBook;
}

/**
 * Regex-based scripture detection
 * Primary detection method - reliable and fast
 */
function detectWithRegex(text: string): ScriptureReference[] {
  const results: ScriptureReference[] = [];

  // Book names list
  const books = 'genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalms?|proverbs|ecclesiastes|song of solomon|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation';

  // Pattern: Book Chapter:Verse or Book Chapter:Verse-Verse
  // Handles: "Romans 6:14", "John 3:16-18", "1 Corinthians 13:4", "Psalm 23:1"
  const pattern = new RegExp(
    `\\b((?:1|2|3|first|second|third|1st|2nd|3rd)?\\s*(?:${books}))\\s*(\\d+)\\s*[:\\.\\s]\\s*(\\d+)(?:\\s*[-–]\\s*(\\d+))?`,
    'gi'
  );

  let match;
  while ((match = pattern.exec(text)) !== null) {
    const [rawText, book, chapter, verseStart, verseEnd] = match;
    const cleanBook = formatDetectedBook(book.trim());

    results.push({
      id: generateId(),
      rawText: rawText.trim(),
      book: cleanBook,
      chapter: parseInt(chapter, 10),
      verseStart: parseInt(verseStart, 10),
      verseEnd: verseEnd ? parseInt(verseEnd, 10) : undefined,
      osis: `${cleanBook}.${chapter}.${verseStart}${verseEnd ? `-${cleanBook}.${chapter}.${verseEnd}` : ''}`,
    });
  }

  return results;
}

/**
 * Clean up detected book name for display
 */
function formatDetectedBook(book: string): string {
  // Capitalize first letter of each word
  return book
    .toLowerCase()
    .replace(/(?:^|\s)\w/g, (match) => match.toUpperCase())
    .replace(/^(\d+)\s*/, '$1 '); // Ensure space after number prefix
}

/**
 * Detect scripture references in text
 * Uses regex-based detection for reliability
 */
export function detectScriptures(text: string): ScriptureReference[] {
  // Quick check if text might contain scripture
  if (!mightContainScripture(text)) {
    console.log('[ScriptureDetector] No potential scripture found in:', text);
    return [];
  }

  console.log('[ScriptureDetector] Processing:', text);

  // Normalize spoken text
  const normalized = normalizeSpokenText(text);
  console.log('[ScriptureDetector] Normalized:', normalized);

  // Use regex detection (most reliable)
  const results = detectWithRegex(normalized);
  console.log('[ScriptureDetector] Found:', results);

  return results;
}

/**
 * Format a scripture reference for display
 * e.g., { book: "John", chapter: 3, verseStart: 16, verseEnd: 18 } → "John 3:16-18"
 */
export function formatReference(ref: ScriptureReference): string {
  const base = `${ref.book} ${ref.chapter}:${ref.verseStart}`;
  return ref.verseEnd ? `${base}-${ref.verseEnd}` : base;
}
