import { NextRequest, NextResponse } from 'next/server';

export interface DetectedScripture {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const SYSTEM_PROMPT = `You are a Bible scripture detection expert. Your job is to identify Bible verses that are being quoted, paraphrased, or referenced in sermon transcripts.

When given a sermon transcript chunk, analyze it and return a JSON array of detected scriptures.

Rules:
1. Only return scriptures you are CONFIDENT are being referenced
2. Include direct quotes, paraphrases, and clear allusions
3. For each detection, provide:
   - book: The book name (e.g., "John", "1 Corinthians", "Psalms")
   - chapter: The chapter number
   - verse: The starting verse number
   - verseEnd: (optional) The ending verse if a range is referenced
   - confidence: "high" (direct quote), "medium" (clear paraphrase), or "low" (likely allusion)
   - reason: Brief explanation of why you detected this reference

4. Return an empty array [] if no scriptures are detected
5. Return ONLY valid JSON, no other text

Example output:
[
  {
    "book": "John",
    "chapter": 3,
    "verse": 16,
    "confidence": "high",
    "reason": "Direct quote: 'For God so loved the world'"
  },
  {
    "book": "Proverbs",
    "chapter": 21,
    "verse": 20,
    "confidence": "medium",
    "reason": "Paraphrase about treasure and oil in dwelling of wise"
  }
]`;

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    // Skip if text is too short
    if (text.trim().length < 30) {
      return NextResponse.json({ scriptures: [] });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const messages: OpenAIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Analyze this sermon transcript for Bible references:\n\n"${text}"` }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.1, // Low temperature for consistent results
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return NextResponse.json(
        { error: `OpenAI API error: ${response.status} - ${errorText}` },
        { status: 500 }
      );
    }

    const data: OpenAIResponse = await response.json();
    const content = data.choices[0]?.message?.content || '[]';

    // Parse the JSON response
    let scriptures: DetectedScripture[] = [];
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        scriptures = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Failed to parse GPT response:', content);
      scriptures = [];
    }

    // Validate and clean the results
    scriptures = scriptures.filter(s =>
      s.book &&
      typeof s.chapter === 'number' &&
      typeof s.verse === 'number' &&
      ['high', 'medium', 'low'].includes(s.confidence)
    );

    return NextResponse.json({ scriptures });
  } catch (error) {
    console.error('Scripture detection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
