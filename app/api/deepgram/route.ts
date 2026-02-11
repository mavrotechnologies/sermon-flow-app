import { NextRequest, NextResponse } from 'next/server';

/**
 * Deepgram API route - returns connection config for client
 * Keeps API key on server for security
 */

// All 66 Bible book names + common variations for keyword boosting
const BIBLE_KEYWORDS = [
  // Old Testament
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', 'Samuel', 'Kings', 'Chronicles',
  'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Psalm',
  'Proverbs', 'Ecclesiastes', 'Song of Solomon', 'Songs', 'Solomon',
  'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel',
  'Hosea', 'Joel', 'Amos', 'Obadiah', 'Jonah', 'Micah',
  'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi',
  // New Testament
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  'Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians',
  'Thessalonians', 'Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', 'Peter', 'Jude', 'Revelation', 'Revelations',
  // Common theological terms
  'scripture', 'scriptures', 'verse', 'chapter', 'Bible',
  'gospel', 'epistle', 'apostle', 'prophet', 'prophets',
  'Christ', 'Jesus', 'Lord', 'God', 'Holy Spirit',
  'righteousness', 'salvation', 'redemption', 'grace', 'mercy',
  'faith', 'hope', 'love', 'sin', 'repentance', 'forgiveness',
  'covenant', 'blessing', 'prayer', 'worship', 'praise',
  'amen', 'hallelujah', 'selah', 'hosanna',
];

export async function GET(request: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'DEEPGRAM_API_KEY not configured' },
      { status: 503 }
    );
  }

  // Build Deepgram WebSocket URL with optimal settings for sermon transcription
  const params = new URLSearchParams({
    // Model selection - Nova-2 is best for accents
    model: 'nova-2',
    language: 'en',

    // Enable smart features
    smart_format: 'true',
    punctuate: 'true',
    paragraphs: 'true',

    // Interim results for real-time feel
    interim_results: 'true',

    // Utterance detection for natural sentence breaks
    utterance_end_ms: '1000',

    // Voice activity detection
    vad_events: 'true',

    // Endpointing for faster results
    endpointing: '300',

    // Keywords boost (critical for Bible book recognition)
    keywords: BIBLE_KEYWORDS.map(k => `${k}:2`).join(','),

    // Encoding settings
    encoding: 'linear16',
    sample_rate: '16000',
    channels: '1',
  });

  const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

  return NextResponse.json({
    wsUrl,
    apiKey, // Client needs this for WebSocket auth header
    keywords: BIBLE_KEYWORDS,
  });
}
