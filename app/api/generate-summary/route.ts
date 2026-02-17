import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import type { SermonNote } from '@/types';

export const runtime = 'nodejs';

let _openai: OpenAI | null = null;
function getOpenAI() {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

const SYSTEM_PROMPT = `You are a sermon summary assistant. Given a set of incremental sermon notes, produce a comprehensive final summary of the entire sermon.

Return a JSON object with these fields:
- title: A compelling title for the sermon (max 10 words)
- overview: A 2-3 sentence overview of the sermon's message
- mainThemes: An array of 2-5 theme tags (short phrases, e.g. "God's Grace", "Faith in Trials")
- keyPoints: An array of objects, each with "point" (1-2 sentences) and optionally "scripture" (a Bible reference if relevant)
- keyQuotes: An array of the most impactful direct quotes from the preacher (exact wording from notes)
- scripturesSummary: An array of all Bible references mentioned across the sermon
- closingThought: A single-sentence takeaway or call to action that captures the sermon's heart

Rules:
- Synthesize across all notes — do not just concatenate them
- Keep the summary concise but comprehensive
- Preserve the preacher's voice in quotes
- If no quotes exist in the notes, return an empty array for keyQuotes
- Return valid JSON only

Return format: { "title": "...", "overview": "...", "mainThemes": [...], "keyPoints": [...], "keyQuotes": [...], "scripturesSummary": [...], "closingThought": "..." }`;

export async function POST(request: NextRequest) {
  try {
    const { notes } = await request.json() as { notes: SermonNote[] };

    if (!notes || notes.length < 2) {
      return Response.json({ summary: null, error: 'Not enough notes to generate summary' }, { status: 400 });
    }

    // Format notes for the prompt
    const notesText = notes.map((note: SermonNote, i: number) => {
      let text = `Note ${i + 1}:`;
      if (note.theme) text += ` [${note.theme}]`;
      text += `\n  Main point: ${note.mainPoint}`;
      if (note.subPoints.length > 0) {
        text += `\n  Details: ${note.subPoints.join('; ')}`;
      }
      if (note.scriptureReferences.length > 0) {
        text += `\n  Scriptures: ${note.scriptureReferences.join(', ')}`;
      }
      if (note.keyQuote) {
        text += `\n  Quote: "${note.keyQuote}"`;
      }
      return text;
    }).join('\n\n');

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.4,
      max_tokens: 2000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Here are the sermon notes to summarize (${notes.length} notes total):\n\n${notesText}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return Response.json({ summary: null, error: 'No response from AI' }, { status: 500 });
    }

    const parsed = JSON.parse(content);
    const summary = {
      id: `summary-${Date.now()}`,
      title: parsed.title || 'Sermon Summary',
      overview: parsed.overview || '',
      mainThemes: parsed.mainThemes || [],
      keyPoints: (parsed.keyPoints || []).map((kp: { point: string; scripture?: string }) => ({
        point: kp.point || '',
        scripture: kp.scripture,
      })),
      keyQuotes: parsed.keyQuotes || [],
      scripturesSummary: parsed.scripturesSummary || [],
      closingThought: parsed.closingThought || '',
      generatedAt: Date.now(),
    };

    return Response.json({ summary });
  } catch (error) {
    console.error('Generate summary error:', error);
    return Response.json({ summary: null, error: 'Failed to generate summary' }, { status: 500 });
  }
}
