/**
 * Sliding Window Buffer for Transcript Segments
 *
 * Buffers transcript segments to catch scripture references that span
 * multiple segments (e.g., "Let's turn to the book of..." + "Romans chapter 8")
 */

export interface BufferedSegment {
  id: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
}

export interface SlidingWindowConfig {
  maxSegments: number;      // Number of segments to keep in buffer
  maxChars: number;         // Maximum characters in combined text
  overlapChars: number;     // Characters to overlap between windows
}

const DEFAULT_CONFIG: SlidingWindowConfig = {
  maxSegments: 4,
  maxChars: 800,
  overlapChars: 100,
};

export class SlidingWindowBuffer {
  private segments: BufferedSegment[] = [];
  private config: SlidingWindowConfig;
  private lastProcessedText: string = '';

  constructor(config: Partial<SlidingWindowConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Add a new segment to the buffer
   */
  add(segment: BufferedSegment): void {
    this.segments.push(segment);

    // Keep only the last N segments
    while (this.segments.length > this.config.maxSegments) {
      this.segments.shift();
    }
  }

  /**
   * Get the combined text from all buffered segments
   */
  getCombinedText(): string {
    const combined = this.segments.map(s => s.text).join(' ');

    // Trim to max chars, keeping the most recent text
    if (combined.length > this.config.maxChars) {
      return combined.slice(-this.config.maxChars);
    }

    return combined;
  }

  /**
   * Get text that hasn't been processed yet (new since last call)
   * Returns the full window but tracks what's new for detection triggering
   */
  getNewText(): { fullWindow: string; newPortion: string; hasNewContent: boolean } {
    const fullWindow = this.getCombinedText();

    // Find the overlap with previously processed text
    const overlapStart = this.lastProcessedText.length > this.config.overlapChars
      ? this.lastProcessedText.slice(-this.config.overlapChars)
      : this.lastProcessedText;

    const overlapIndex = fullWindow.indexOf(overlapStart);
    const newPortion = overlapIndex >= 0 && overlapStart.length > 0
      ? fullWindow.slice(overlapIndex + overlapStart.length)
      : fullWindow;

    return {
      fullWindow,
      newPortion: newPortion.trim(),
      hasNewContent: newPortion.trim().length > 10,
    };
  }

  /**
   * Mark the current window as processed
   */
  markProcessed(): void {
    this.lastProcessedText = this.getCombinedText();
  }

  /**
   * Get the latest segment
   */
  getLatest(): BufferedSegment | null {
    return this.segments[this.segments.length - 1] || null;
  }

  /**
   * Check if any segment in the buffer is final
   */
  hasFinalSegment(): boolean {
    return this.segments.some(s => s.isFinal);
  }

  /**
   * Get the timestamp range of the buffer
   */
  getTimeRange(): { start: number; end: number } | null {
    if (this.segments.length === 0) return null;

    return {
      start: this.segments[0].timestamp,
      end: this.segments[this.segments.length - 1].timestamp,
    };
  }

  /**
   * Clear the buffer
   */
  clear(): void {
    this.segments = [];
    this.lastProcessedText = '';
  }

  /**
   * Get buffer statistics
   */
  getStats(): { segmentCount: number; totalChars: number; oldestTimestamp: number | null } {
    return {
      segmentCount: this.segments.length,
      totalChars: this.getCombinedText().length,
      oldestTimestamp: this.segments[0]?.timestamp || null,
    };
  }
}

/**
 * Create a sliding window buffer instance
 */
export function createSlidingWindowBuffer(config?: Partial<SlidingWindowConfig>): SlidingWindowBuffer {
  return new SlidingWindowBuffer(config);
}
