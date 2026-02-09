import { NextRequest } from 'next/server';
import type { ScriptureReference, BibleTranslation } from '@/types';

// Import Bible data for offline support (public domain translations)
import kjvData from '@/data/kjv.json';
import webData from '@/data/web.json';

// Local Bible data cache
const bibleData: Record<string, Record<string, Record<string, Record<string, string>>>> = {
  kjv: kjvData,
  web: webData,
};

// Map our translation codes to bible-api.com translation codes
const API_TRANSLATION_MAP: Record<string, string> = {
  kjv: 'kjv',
  web: 'web',
  asv: 'asv',
  bbe: 'bbe',
  darby: 'darby',
  ylt: 'ylt',
  wbt: 'web', // Webster not in API, fallback to WEB
  // Premium translations fallback to KJV for API (they use online services)
  esv: 'kjv',
  niv: 'kjv',
  nkjv: 'kjv',
  nasb: 'kjv',
  nlt: 'kjv',
  amp: 'kjv',
  msg: 'kjv',
};

/**
 * GET /api/verse?book=John&chapter=3&verse=16&translation=KJV
 * Look up a specific verse
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const book = searchParams.get('book');
  const chapter = searchParams.get('chapter');
  const verseStart = searchParams.get('verse') || searchParams.get('verseStart');
  const verseEnd = searchParams.get('verseEnd');
  const translation = (searchParams.get('translation') || 'KJV').toLowerCase();

  if (!book || !chapter || !verseStart) {
    return Response.json(
      { error: 'Missing required parameters: book, chapter, verse' },
      { status: 400 }
    );
  }

  try {
    const verses = lookupVerses(
      book,
      parseInt(chapter, 10),
      parseInt(verseStart, 10),
      verseEnd ? parseInt(verseEnd, 10) : undefined,
      translation
    );

    if (verses.length === 0) {
      // Try fallback to external API
      const fallbackVerses = await fetchFromAPI(
        book,
        parseInt(chapter, 10),
        parseInt(verseStart, 10),
        verseEnd ? parseInt(verseEnd, 10) : undefined,
        translation
      );

      if (fallbackVerses.length === 0) {
        return Response.json(
          { error: 'Verse not found' },
          { status: 404 }
        );
      }

      return Response.json({ verses: fallbackVerses });
    }

    return Response.json({ verses });
  } catch (error) {
    console.error('Verse lookup error:', error);
    return Response.json(
      { error: 'Failed to look up verse' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/verse
 * Look up verses from a scripture reference object
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference, translation = 'KJV' } = body as {
      reference: ScriptureReference;
      translation?: BibleTranslation;
    };

    if (!reference || !reference.book || !reference.chapter || !reference.verseStart) {
      return Response.json(
        { error: 'Invalid scripture reference' },
        { status: 400 }
      );
    }

    const verses = lookupVerses(
      reference.book,
      reference.chapter,
      reference.verseStart,
      reference.verseEnd,
      translation.toLowerCase()
    );

    if (verses.length === 0) {
      const fallbackVerses = await fetchFromAPI(
        reference.book,
        reference.chapter,
        reference.verseStart,
        reference.verseEnd,
        translation.toLowerCase()
      );

      return Response.json({ verses: fallbackVerses });
    }

    return Response.json({ verses });
  } catch (error) {
    console.error('Verse lookup error:', error);
    return Response.json(
      { error: 'Failed to look up verse' },
      { status: 500 }
    );
  }
}

/**
 * Look up verses from local data
 */
function lookupVerses(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number,
  translation: string = 'kjv'
): Array<{ book: string; chapter: number; verse: number; text: string; translation: string }> {
  const lowerTranslation = translation.toLowerCase();
  const data = bibleData[lowerTranslation];
  if (!data) return [];

  // Normalize book name
  const normalizedBook = book.toLowerCase().replace(/\s+/g, '');
  const bookData = data[normalizedBook];

  if (!bookData) return [];

  const chapterData = bookData[chapter.toString()];
  if (!chapterData) return [];

  const verses: Array<{ book: string; chapter: number; verse: number; text: string; translation: string }> = [];
  const end = verseEnd || verseStart;

  for (let v = verseStart; v <= end; v++) {
    const text = chapterData[v.toString()];
    if (text) {
      verses.push({
        book,
        chapter,
        verse: v,
        text,
        translation: translation.toUpperCase(),
      });
    }
  }

  return verses;
}

/**
 * Fallback to external API
 */
async function fetchFromAPI(
  book: string,
  chapter: number,
  verseStart: number,
  verseEnd?: number,
  translation: string = 'kjv'
): Promise<Array<{ book: string; chapter: number; verse: number; text: string; translation: string }>> {
  try {
    const verseRef = verseEnd
      ? `${book}+${chapter}:${verseStart}-${verseEnd}`
      : `${book}+${chapter}:${verseStart}`;

    // Map to API-supported translation
    const lowerTranslation = translation.toLowerCase();
    const apiTranslation = API_TRANSLATION_MAP[lowerTranslation] || 'kjv';

    const response = await fetch(
      `https://bible-api.com/${encodeURIComponent(verseRef)}?translation=${apiTranslation}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    // Use original translation code in response for user display
    const displayTranslation = translation.toUpperCase();

    if (data.verses) {
      return data.verses.map((v: { book_name: string; chapter: number; verse: number; text: string }) => ({
        book: v.book_name,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text.trim(),
        translation: displayTranslation,
      }));
    }

    if (data.text) {
      return [{
        book,
        chapter,
        verse: verseStart,
        text: data.text.trim(),
        translation: displayTranslation,
      }];
    }

    return [];
  } catch (error) {
    console.error('External API error:', error);
    return [];
  }
}
