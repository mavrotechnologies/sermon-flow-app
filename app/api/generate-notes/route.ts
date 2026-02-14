import { NextRequest } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const SYSTEM_PROMPT = `You are a sermon note-taking assistant. Given a transcript excerpt from a sermon, extract structured notes.

For each distinct main point or topic in the text, produce a note with:
- mainPoint: A concise summary of the main idea (1 sentence)
- subPoints: 2-4 supporting details or explanations (short phrases)
- scriptureReferences: Any Bible references mentioned (e.g., "John 3:16", "Romans 8:28")
- keyQuote: The most impactful direct quote from the preacher, if any (keep exact wording)
- theme: A 1-3 word theme tag (e.g., "Grace", "Faith & Works", "Prayer")

Rules:
- Only extract notes from NEW text that hasn't been covered by previous notes
- Each note should represent a distinct point, not repeat previous ones
- Keep sub-points concise (under 15 words each)
- If the text is too short or doesn't contain a clear point, return an empty array
- Return valid JSON only

Return format: { "notes": [...] }`;

export async function POST(request: NextRequest) {
  try {
    const { newText, previousNotes, detectedScriptures } = await request.json();

    if (!newText || newText.trim().length < 50) {
      return Response.json({ notes: [] });
    }

    // Build context from previous notes to avoid repetition
    const previousContext = previousNotes && previousNotes.length > 0
      ? `\n\nPrevious notes already extracted (DO NOT repeat these):\n${previousNotes.map((n: { mainPoint: string }) => `- ${n.mainPoint}`).join('\n')}`
      : '';

    const scriptureContext = detectedScriptures && detectedScriptures.length > 0
      ? `\n\nScriptures already detected: ${detectedScriptures.map((s: { book: string; chapter: number; verseStart: number }) => `${s.book} ${s.chapter}:${s.verseStart}`).join(', ')}`
      : '';

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `New transcript text to extract notes from:\n"${newText}"${previousContext}${scriptureContext}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ notes: [] });
    }

    const parsed = JSON.parse(content);
    const notes = (parsed.notes || []).map((note: {
      mainPoint: string;
      subPoints?: string[];
      scriptureReferences?: string[];
      keyQuote?: string;
      theme?: string;
    }) => ({
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      mainPoint: note.mainPoint || '',
      subPoints: note.subPoints || [],
      scriptureReferences: note.scriptureReferences || [],
      keyQuote: note.keyQuote,
      theme: note.theme,
    }));

    return Response.json({ notes });
  } catch (error) {
    console.error('Generate notes error:', error);
    return Response.json({ notes: [], error: 'Failed to generate notes' }, { status: 500 });
  }
}
