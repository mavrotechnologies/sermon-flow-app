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

// Broadcast Types
export interface BroadcastMessage {
  type: 'transcript' | 'scripture' | 'status' | 'clear';
  payload: TranscriptSegment | DetectedScripture | StatusPayload | null;
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

// Public domain translations (freely available)
export type PublicDomainTranslation =
  | 'KJV'    // King James Version
  | 'WEB'    // World English Bible
  | 'ASV'    // American Standard Version
  | 'BBE'    // Bible in Basic English
  | 'DARBY'  // Darby Translation
  | 'YLT'    // Young's Literal Translation
  | 'WBT';   // Webster Bible Translation

// Premium/copyrighted translations (API fallback)
export type PremiumTranslation =
  | 'ESV'    // English Standard Version
  | 'NIV'    // New International Version
  | 'NKJV'   // New King James Version
  | 'NASB'   // New American Standard Bible
  | 'NLT'    // New Living Translation
  | 'AMP'    // Amplified Bible
  | 'MSG';   // The Message

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
  // Public Domain - Full offline support
  { code: 'KJV', name: 'KJV', fullName: 'King James Version', isPublicDomain: true, description: 'Traditional, poetic language' },
  { code: 'WEB', name: 'WEB', fullName: 'World English Bible', isPublicDomain: true, description: 'Modern public domain' },
  { code: 'ASV', name: 'ASV', fullName: 'American Standard Version', isPublicDomain: true, description: 'Literal translation (1901)' },
  { code: 'BBE', name: 'BBE', fullName: 'Bible in Basic English', isPublicDomain: true, description: 'Simple vocabulary' },
  { code: 'DARBY', name: 'Darby', fullName: 'Darby Translation', isPublicDomain: true, description: 'Literal study Bible' },
  { code: 'YLT', name: 'YLT', fullName: "Young's Literal Translation", isPublicDomain: true, description: 'Very literal rendering' },
  { code: 'WBT', name: 'Webster', fullName: 'Webster Bible Translation', isPublicDomain: true, description: 'Updated KJV language' },
  // Premium - Online only
  { code: 'ESV', name: 'ESV', fullName: 'English Standard Version', isPublicDomain: false, description: 'Modern literal' },
  { code: 'NIV', name: 'NIV', fullName: 'New International Version', isPublicDomain: false, description: 'Balanced readability' },
  { code: 'NKJV', name: 'NKJV', fullName: 'New King James Version', isPublicDomain: false, description: 'Updated KJV' },
  { code: 'NASB', name: 'NASB', fullName: 'New American Standard Bible', isPublicDomain: false, description: 'Highly accurate' },
  { code: 'NLT', name: 'NLT', fullName: 'New Living Translation', isPublicDomain: false, description: 'Easy to understand' },
  { code: 'AMP', name: 'AMP', fullName: 'Amplified Bible', isPublicDomain: false, description: 'Expanded meaning' },
  { code: 'MSG', name: 'MSG', fullName: 'The Message', isPublicDomain: false, description: 'Contemporary paraphrase' },
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
