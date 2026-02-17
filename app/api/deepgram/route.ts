import { NextRequest, NextResponse } from 'next/server';

/**
 * Deepgram API route - returns connection config for client
 * Keeps API key on server for security
 */

// Bible book names + theological terms for keyword boosting
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

  // Build Deepgram WebSocket URL with optimal settings
  const params = new URLSearchParams();

  // Model
  params.set('model', 'nova-2');
  params.set('language', 'en');

  // Smart features
  params.set('smart_format', 'true');
  params.set('punctuate', 'true');
  params.set('paragraphs', 'true');

  // Interim results for real-time feel
  params.set('interim_results', 'true');

  // Utterance detection for natural sentence breaks
  params.set('utterance_end_ms', '1000');

  // Voice activity detection
  params.set('vad_events', 'true');

  // Endpointing for faster results
  params.set('endpointing', '300');

  // Encoding settings
  params.set('encoding', 'linear16');
  params.set('sample_rate', '16000');
  params.set('channels', '1');

  // Only boost the most critical Bible book names to keep URL short.
  // Full keyword list made the URL ~2300 chars which Deepgram rejects.
  const TOP_KEYWORDS = [
    'Genesis', 'Exodus', 'Psalms', 'Proverbs', 'Isaiah',
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
    'Corinthians', 'Galatians', 'Ephesians', 'Hebrews',
    'Revelation', 'Jesus', 'Christ', 'scripture',
  ];
  for (const keyword of TOP_KEYWORDS) {
    params.append('keywords', `${keyword}:2`);
  }

  const wsUrl = `wss://api.deepgram.com/v1/listen?${params.toString()}`;

  return NextResponse.json({ wsUrl, apiKey });
}
