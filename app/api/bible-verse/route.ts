import { NextRequest, NextResponse } from 'next/server';

/**
 * API.Bible Bible IDs for each translation
 * Get your API key from https://scripture.api.bible/
 * Find Bible IDs at: https://scripture.api.bible/livedocs
 */
const API_BIBLE_IDS: Record<string, string> = {
  // Fallback for public domain (if needed)
  KJV: 'de4e12af7f28f599-02',      // King James Version

  // Premium translations via API.Bible (IDs from API response)
  NIV: '78a9f6124f344018-01',      // New International Version 2011
  NKJV: '63097d2a0a2f7db3-01',     // New King James Version
  NLT: 'd6e14a625393b4da-01',      // New Living Translation
};

/**
 * Book name mapping for API.Bible format
 */
const BOOK_IDS: Record<string, string> = {
  'Genesis': 'GEN', 'Exodus': 'EXO', 'Leviticus': 'LEV', 'Numbers': 'NUM',
  'Deuteronomy': 'DEU', 'Joshua': 'JOS', 'Judges': 'JDG', 'Ruth': 'RUT',
  '1 Samuel': '1SA', '2 Samuel': '2SA', '1 Kings': '1KI', '2 Kings': '2KI',
  '1 Chronicles': '1CH', '2 Chronicles': '2CH', 'Ezra': 'EZR', 'Nehemiah': 'NEH',
  'Esther': 'EST', 'Job': 'JOB', 'Psalms': 'PSA', 'Psalm': 'PSA',
  'Proverbs': 'PRO', 'Ecclesiastes': 'ECC', 'Song of Solomon': 'SNG',
  'Isaiah': 'ISA', 'Jeremiah': 'JER', 'Lamentations': 'LAM', 'Ezekiel': 'EZK',
  'Daniel': 'DAN', 'Hosea': 'HOS', 'Joel': 'JOL', 'Amos': 'AMO',
  'Obadiah': 'OBA', 'Jonah': 'JON', 'Micah': 'MIC', 'Nahum': 'NAM',
  'Habakkuk': 'HAB', 'Zephaniah': 'ZEP', 'Haggai': 'HAG', 'Zechariah': 'ZEC',
  'Malachi': 'MAL', 'Matthew': 'MAT', 'Mark': 'MRK', 'Luke': 'LUK',
  'John': 'JHN', 'Acts': 'ACT', 'Romans': 'ROM', '1 Corinthians': '1CO',
  '2 Corinthians': '2CO', 'Galatians': 'GAL', 'Ephesians': 'EPH',
  'Philippians': 'PHP', 'Colossians': 'COL', '1 Thessalonians': '1TH',
  '2 Thessalonians': '2TH', '1 Timothy': '1TI', '2 Timothy': '2TI',
  'Titus': 'TIT', 'Philemon': 'PHM', 'Hebrews': 'HEB', 'James': 'JAS',
  '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN',
  '3 John': '3JN', 'Jude': 'JUD', 'Revelation': 'REV',
};

function getBookId(bookName: string): string {
  // Direct match
  if (BOOK_IDS[bookName]) {
    return BOOK_IDS[bookName];
  }

  // Try case-insensitive match
  const normalized = bookName.trim();
  for (const [key, value] of Object.entries(BOOK_IDS)) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return value;
    }
  }

  // Try partial match
  for (const [key, value] of Object.entries(BOOK_IDS)) {
    if (key.toLowerCase().includes(normalized.toLowerCase()) ||
        normalized.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return bookName.substring(0, 3).toUpperCase();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const book = searchParams.get('book');
  const chapter = searchParams.get('chapter');
  const verse = searchParams.get('verse');
  const verseEnd = searchParams.get('verseEnd');
  const translation = searchParams.get('translation') || 'KJV';

  if (!book || !chapter || !verse) {
    return NextResponse.json(
      { error: 'Missing required parameters: book, chapter, verse' },
      { status: 400 }
    );
  }

  const apiKey = process.env.API_BIBLE_KEY;

  // If no API.Bible key, return indication to use fallback
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API_BIBLE_KEY not configured', useFallback: true },
      { status: 503 }
    );
  }

  const bibleId = API_BIBLE_IDS[translation] || API_BIBLE_IDS['KJV'];
  const bookId = getBookId(book);

  // Build verse reference
  const verseRef = verseEnd && verseEnd !== verse
    ? `${bookId}.${chapter}.${verse}-${bookId}.${chapter}.${verseEnd}`
    : `${bookId}.${chapter}.${verse}`;

  try {
    const response = await fetch(
      `https://rest.api.bible/v1/bibles/${bibleId}/passages/${verseRef}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=false`,
      {
        headers: {
          'api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API.Bible error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch verse', useFallback: true },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.data && data.data.content) {
      // Clean up the text
      let text = data.data.content
        .replace(/<[^>]*>/g, '')  // Remove HTML tags
        .replace(/\s+/g, ' ')     // Normalize whitespace
        .trim();

      return NextResponse.json({
        book,
        chapter: parseInt(chapter),
        verse: parseInt(verse),
        verseEnd: verseEnd ? parseInt(verseEnd) : undefined,
        text,
        translation,
        reference: data.data.reference,
      });
    }

    return NextResponse.json(
      { error: 'No content in response', useFallback: true },
      { status: 404 }
    );
  } catch (error) {
    console.error('API.Bible fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verse', useFallback: true },
      { status: 500 }
    );
  }
}
