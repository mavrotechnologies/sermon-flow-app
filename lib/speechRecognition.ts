/**
 * Web Speech API wrapper for real-time speech-to-text transcription
 * Provides a clean interface with event callbacks
 */

export interface SpeechRecognitionConfig {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  maxAlternatives?: number;
}

export interface SpeechRecognitionCallbacks {
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  onNoMatch?: () => void;
}

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onnomatch: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

export class SpeechRecognitionService {
  private recognition: SpeechRecognitionInstance | null = null;
  private isListening = false;
  private callbacks: SpeechRecognitionCallbacks = {};
  private restartTimeout: NodeJS.Timeout | null = null;
  private shouldRestart = false;
  private restartAttempts = 0;
  private readonly maxRestartAttempts = 10;
  private isRestarting = false;
  private lastInterimTranscript = '';

  constructor(
    config: SpeechRecognitionConfig = {},
    callbacks: SpeechRecognitionCallbacks = {}
  ) {
    this.callbacks = callbacks;
    this.initRecognition(config);
  }

  private initRecognition(config: SpeechRecognitionConfig): void {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognition) {
      console.error('Speech recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();

    // Configure recognition
    this.recognition.continuous = config.continuous ?? true;
    this.recognition.interimResults = config.interimResults ?? true;
    this.recognition.lang = config.language ?? 'en-US';
    this.recognition.maxAlternatives = config.maxAlternatives ?? 1;

    // Set up event handlers
    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      this.handleResult(event);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.handleError(event);
    };

    this.recognition.onstart = () => {
      this.isListening = true;
      this.isRestarting = false;
      this.restartAttempts = 0; // Reset attempts on successful start
      console.log('[SpeechRecognition] Started/Restarted successfully');
      this.callbacks.onStart?.();
    };

    this.recognition.onend = () => {
      // Skip if we're in the middle of a restart (abort triggers onend)
      if (this.isRestarting) {
        console.log('[SpeechRecognition] Ignoring onend during restart');
        return;
      }

      // Flush any pending interim text as final before restarting/stopping.
      // Chrome kills interim results on session end without finalizing them.
      if (this.lastInterimTranscript.trim()) {
        console.log('[SpeechRecognition] Flushing unfinalised interim text as final');
        this.callbacks.onResult?.(this.lastInterimTranscript, true);
        this.lastInterimTranscript = '';
      }

      // Auto-restart if needed (Web Speech API stops on silence)
      if (this.shouldRestart) {
        console.log('[SpeechRecognition] Recognition ended, auto-restarting...');
        // Keep isListening true during auto-restart to prevent UI flicker
        this.attemptRestart();
      } else {
        // Only update state and notify when actually stopping
        console.log('[SpeechRecognition] Recognition stopped by user');
        this.isListening = false;
        this.callbacks.onEnd?.();
      }
    };

    this.recognition.onnomatch = () => {
      this.callbacks.onNoMatch?.();
    };
  }

  private handleResult(event: SpeechRecognitionEvent): void {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    // Report final transcript
    if (finalTranscript) {
      this.lastInterimTranscript = '';
      this.callbacks.onResult?.(finalTranscript, true);
    }

    // Report interim transcript
    if (interimTranscript) {
      this.lastInterimTranscript = interimTranscript;
      this.callbacks.onResult?.(interimTranscript, false);
    }
  }

  private handleError(event: SpeechRecognitionErrorEvent): void {
    // Errors that should trigger auto-restart (transient errors)
    const transientErrors = ['no-speech', 'aborted', 'network'];

    // Errors that should stop recognition completely
    const fatalErrors = ['not-allowed', 'service-not-allowed', 'audio-capture'];

    const errorMessages: Record<string, string> = {
      'no-speech': 'Listening...',
      'audio-capture': 'No microphone found. Please check your audio settings.',
      'not-allowed': 'Microphone permission denied. Please allow access.',
      'network': 'Network issue, reconnecting...',
      'aborted': 'Reconnecting...',
      'language-not-supported': 'Language not supported.',
      'service-not-allowed': 'Speech recognition service not allowed.',
    };

    // Only show error for fatal errors, not transient ones
    if (fatalErrors.includes(event.error)) {
      this.shouldRestart = false;
      const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
      this.callbacks.onError?.(message);
      return;
    }

    // For transient errors, just log and let auto-restart handle it
    if (transientErrors.includes(event.error)) {
      console.log(`[SpeechRecognition] Transient error: ${event.error}, will auto-restart`);
      // Don't call onError for transient errors to avoid UI flicker
      return;
    }

    // For any other unhandled error, show it
    const message = errorMessages[event.error] || `Speech recognition error: ${event.error}`;
    this.callbacks.onError?.(message);
  }

  /**
   * Attempt to restart recognition with retry logic
   */
  private attemptRestart(delay: number = 50): void {
    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
    }

    this.isRestarting = true;

    this.restartTimeout = setTimeout(() => {
      if (!this.shouldRestart || !this.recognition) {
        console.log('[SpeechRecognition] Restart aborted - shouldRestart:', this.shouldRestart);
        this.isRestarting = false;
        return;
      }

      try {
        this.recognition.start();
        console.log('[SpeechRecognition] Restart initiated');
        this.isRestarting = false;
      } catch (error) {
        this.restartAttempts++;
        console.log(`[SpeechRecognition] Restart attempt ${this.restartAttempts} failed:`, error);

        if (this.restartAttempts < this.maxRestartAttempts) {
          // Try again with increasing delay
          this.attemptRestart(Math.min(delay * 1.5, 500));
        } else {
          // Give up after max attempts
          console.error('[SpeechRecognition] Max restart attempts reached');
          this.restartAttempts = 0;
          this.isRestarting = false;
          this.isListening = false;
          this.callbacks.onEnd?.();
        }
      }
    }, delay);
  }

  /**
   * Start speech recognition
   */
  start(): void {
    if (!this.recognition) {
      this.callbacks.onError?.('Speech recognition not supported in this browser');
      return;
    }

    if (this.isListening) return;

    try {
      this.shouldRestart = true;
      this.restartAttempts = 0;
      this.recognition.start();
    } catch (error) {
      this.callbacks.onError?.(`Failed to start: ${error}`);
    }
  }

  /**
   * Stop speech recognition
   */
  stop(): void {
    this.shouldRestart = false;
    this.lastInterimTranscript = '';

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop errors
      }
    }
  }

  /**
   * Abort speech recognition immediately
   */
  abort(): void {
    this.shouldRestart = false;

    if (this.restartTimeout) {
      clearTimeout(this.restartTimeout);
      this.restartTimeout = null;
    }

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore abort errors
      }
    }
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Update callbacks
   */
  setCallbacks(callbacks: SpeechRecognitionCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Check if speech recognition is supported
   */
  static isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
}
