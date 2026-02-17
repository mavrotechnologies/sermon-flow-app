// Scripture and Bible Types
export interface BibleVerse {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
}

export interface ScriptureReference {
  id: string;
  rawText: string;
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  osis: string; // e.g., "John.3.16" or "John.3.16-John.3.18"
}

export interface DetectedScripture extends ScriptureReference {
  verses: BibleVerse[];
  timestamp: number;
}

// Transcript Types
export interface TranscriptSegment {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  scriptureRefs?: ScriptureReference[];
}

// Audio Types
export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
}

// Sermon Notes Types
export interface SermonNote {
  id: string;
  timestamp: number;
  mainPoint: string;
  subPoints: string[];
  scriptureReferences: string[];
  keyQuote?: string;
  theme?: string;
}

export interface SermonNotesPayload {
  notes: SermonNote[];
  isGenerating: boolean;
}

// Sermon Summary Types
export interface SermonSummary {
  id: string;
  title: string;
  overview: string;
  mainThemes: string[];
  keyPoints: { point: string; scripture?: string }[];
  keyQuotes: string[];
  scripturesSummary: string[];
  closingThought: string;
  generatedAt: number;
}

export interface SermonSummaryPayload {
  summary: SermonSummary | null;
  isGenerating: boolean;
}

// Broadcast Types
export interface BroadcastMessage {
  type: 'transcript' | 'scripture' | 'status' | 'clear' | 'notes' | 'summary';
  payload: TranscriptSegment | DetectedScripture | StatusPayload | SermonNotesPayload | SermonSummaryPayload | null;
  timestamp: number;
}

export interface StatusPayload {
  isRecording: boolean;
  isConnected: boolean;
}

// App State Types
export interface SermonState {
  isRecording: boolean;
  transcript: TranscriptSegment[];
  detectedScriptures: DetectedScripture[];
  currentTranslation: BibleTranslation;
  selectedDevice: string | null;
}

// Public domain translations (freely available via bible-api.com)
export type PublicDomainTranslation =
  | 'KJV'    // King James Version
  | 'WEB'    // World English Bible
  | 'ASV';   // American Standard Version

// Premium translations (via API.Bible)
export type PremiumTranslation =
  | 'NKJV'   // New King James Version
  | 'NIV'    // New International Version
  | 'NLT';   // New Living Translation

export type BibleTranslation = PublicDomainTranslation | PremiumTranslation;

// Translation metadata for UI display
export interface TranslationInfo {
  code: BibleTranslation;
  name: string;
  fullName: string;
  isPublicDomain: boolean;
  description: string;
}

export const TRANSLATIONS: TranslationInfo[] = [
  // Public Domain - Free via bible-api.com
  { code: 'KJV', name: 'KJV', fullName: 'King James Version', isPublicDomain: true, description: 'Traditional, poetic language' },
  { code: 'WEB', name: 'WEB', fullName: 'World English Bible', isPublicDomain: true, description: 'Modern public domain' },
  { code: 'ASV', name: 'ASV', fullName: 'American Standard Version', isPublicDomain: true, description: 'Literal translation (1901)' },
  // Premium - Via API.Bible
  { code: 'NKJV', name: 'NKJV', fullName: 'New King James Version', isPublicDomain: false, description: 'Updated KJV language' },
  { code: 'NIV', name: 'NIV', fullName: 'New International Version', isPublicDomain: false, description: 'Balanced readability' },
  { code: 'NLT', name: 'NLT', fullName: 'New Living Translation', isPublicDomain: false, description: 'Easy to understand' },
];

// SSE Event Types
export interface SSEMessage {
  id: string;
  event: string;
  data: string;
}

// Book name mapping type
export interface BookNameMap {
  osis: string;
  name: string;
  abbrev: string[];
}

// vMix Integration Types
export interface VmixSettings {
  enabled: boolean;
  host: string;        // e.g. "192.168.1.100"
  port: number;        // default 8088
  titleInput: string;  // vMix input number/name for the title graphic
  referenceField: string;  // field name for scripture reference (default "Headline.Text")
  verseTextField: string;  // field name for verse text (default "Description.Text")
}

export interface VmixOverlayState {
  isShowing: boolean;
  currentReference: string | null;
  currentText: string | null;
  showingSince: number | null;
}
