/**
 * Session Context Tracking
 *
 * Tracks what the pastor has already referenced in the sermon
 * to help detect implicit references like "as Paul continues in the next chapter"
 */

export interface ReferencedPassage {
  book: string;
  chapter: number;
  verses?: { start: number; end?: number };
  timestamp: number;
  count: number;  // How many times referenced
}

export interface SessionContext {
  referencedPassages: ReferencedPassage[];
  currentBook: string | null;
  currentChapter: number | null;
  lastReference: ReferencedPassage | null;
  sermonStartTime: number;
}

// Contextual phrases that indicate continuation
const CONTINUATION_PHRASES = [
  'next verse',
  'next chapter',
  'continues',
  'as paul continues',
  'as he continues',
  'as we continue',
  'going on',
  'moving on',
  'verse after',
  'following verse',
  'in the next',
  'paul goes on',
  'he goes on',
  'then it says',
  'and then',
  'also says',
  'earlier in',
  'later in',
  'back in',
  'same chapter',
  'same book',
  'few verses later',
  'few verses earlier',
  'beginning of the chapter',
  'end of the chapter',
  'previous verse',
  'before that',
  'after that',
];

// Book relationship hints (for implicit references)
const AUTHOR_BOOKS: Record<string, string[]> = {
  paul: ['Romans', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Corinthians', '2 Corinthians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon'],
  peter: ['1 Peter', '2 Peter'],
  john: ['John', '1 John', '2 John', '3 John', 'Revelation'],
  james: ['James'],
  moses: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'],
  david: ['Psalms'],
  solomon: ['Proverbs', 'Ecclesiastes', 'Song of Solomon'],
  isaiah: ['Isaiah'],
  jeremiah: ['Jeremiah', 'Lamentations'],
  ezekiel: ['Ezekiel'],
  daniel: ['Daniel'],
  luke: ['Luke', 'Acts'],
};

export class SermonSessionContext {
  private context: SessionContext;

  constructor() {
    this.context = {
      referencedPassages: [],
      currentBook: null,
      currentChapter: null,
      lastReference: null,
      sermonStartTime: Date.now(),
    };
  }

  /**
   * Record a new scripture reference
   */
  addReference(book: string, chapter: number, verseStart?: number, verseEnd?: number): void {
    // Check if we already have this passage
    const existing = this.context.referencedPassages.find(
      p => p.book === book && p.chapter === chapter
    );

    if (existing) {
      existing.count++;
      existing.timestamp = Date.now();
      if (verseStart) {
        existing.verses = { start: verseStart, end: verseEnd };
      }
    } else {
      const newPassage: ReferencedPassage = {
        book,
        chapter,
        verses: verseStart ? { start: verseStart, end: verseEnd } : undefined,
        timestamp: Date.now(),
        count: 1,
      };
      this.context.referencedPassages.push(newPassage);
    }

    // Update current context
    this.context.currentBook = book;
    this.context.currentChapter = chapter;
    this.context.lastReference = this.context.referencedPassages.find(
      p => p.book === book && p.chapter === chapter
    ) || null;
  }

  /**
   * Check if text contains continuation phrases
   */
  hasContinuationPhrase(text: string): boolean {
    const lowerText = text.toLowerCase();
    return CONTINUATION_PHRASES.some(phrase => lowerText.includes(phrase));
  }

  /**
   * Get likely book based on author mention
   */
  getLikelyBookFromAuthor(text: string): string[] {
    const lowerText = text.toLowerCase();
    const matches: string[] = [];

    for (const [author, books] of Object.entries(AUTHOR_BOOKS)) {
      if (lowerText.includes(author)) {
        // Prefer books already referenced in this sermon
        const referencedBooks = books.filter(book =>
          this.context.referencedPassages.some(p => p.book === book)
        );
        if (referencedBooks.length > 0) {
          matches.push(...referencedBooks);
        } else {
          matches.push(...books);
        }
      }
    }

    return matches;
  }

  /**
   * Suggest likely references based on context
   */
  suggestFromContext(text: string): Array<{ book: string; chapter: number; confidence: number }> {
    const suggestions: Array<{ book: string; chapter: number; confidence: number }> = [];
    const lowerText = text.toLowerCase();

    // Check for continuation phrases
    if (this.hasContinuationPhrase(text) && this.context.lastReference) {
      const last = this.context.lastReference;

      // "next verse" - same chapter
      if (lowerText.includes('next verse') || lowerText.includes('following verse')) {
        suggestions.push({
          book: last.book,
          chapter: last.chapter,
          confidence: 0.8,
        });
      }

      // "next chapter"
      if (lowerText.includes('next chapter')) {
        suggestions.push({
          book: last.book,
          chapter: last.chapter + 1,
          confidence: 0.9,
        });
      }

      // "previous chapter" or "earlier"
      if (lowerText.includes('previous chapter') || lowerText.includes('chapter before')) {
        suggestions.push({
          book: last.book,
          chapter: Math.max(1, last.chapter - 1),
          confidence: 0.9,
        });
      }

      // Generic continuation
      if (lowerText.includes('continues') || lowerText.includes('goes on') || lowerText.includes('moving on')) {
        suggestions.push({
          book: last.book,
          chapter: last.chapter,
          confidence: 0.7,
        });
      }
    }

    // Check for author mentions
    const authorBooks = this.getLikelyBookFromAuthor(text);
    if (authorBooks.length > 0 && this.context.lastReference) {
      // If author matches a recently referenced book, boost that
      if (authorBooks.includes(this.context.lastReference.book)) {
        suggestions.push({
          book: this.context.lastReference.book,
          chapter: this.context.lastReference.chapter,
          confidence: 0.75,
        });
      }
    }

    // Check for "same chapter/book" references
    if ((lowerText.includes('same chapter') || lowerText.includes('same passage')) && this.context.lastReference) {
      suggestions.push({
        book: this.context.lastReference.book,
        chapter: this.context.lastReference.chapter,
        confidence: 0.85,
      });
    }

    // Check for chapter number mentions without book
    const chapterMatch = text.match(/chapter\s+(\d+)/i);
    if (chapterMatch && this.context.currentBook) {
      suggestions.push({
        book: this.context.currentBook,
        chapter: parseInt(chapterMatch[1], 10),
        confidence: 0.7,
      });
    }

    // Verse number mention without full reference
    const verseMatch = text.match(/verse\s+(\d+)/i);
    if (verseMatch && this.context.currentBook && this.context.currentChapter) {
      suggestions.push({
        book: this.context.currentBook,
        chapter: this.context.currentChapter,
        confidence: 0.6,
      });
    }

    return suggestions;
  }

  /**
   * Get recently referenced passages (for biasing detection)
   */
  getRecentPassages(limitMs: number = 5 * 60 * 1000): ReferencedPassage[] {
    const cutoff = Date.now() - limitMs;
    return this.context.referencedPassages
      .filter(p => p.timestamp > cutoff)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all referenced books in this sermon
   */
  getReferencedBooks(): string[] {
    return [...new Set(this.context.referencedPassages.map(p => p.book))];
  }

  /**
   * Get the most frequently referenced passages
   */
  getMostReferenced(limit: number = 5): ReferencedPassage[] {
    return [...this.context.referencedPassages]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get current context state
   */
  getContext(): SessionContext {
    return { ...this.context };
  }

  /**
   * Reset the session context
   */
  reset(): void {
    this.context = {
      referencedPassages: [],
      currentBook: null,
      currentChapter: null,
      lastReference: null,
      sermonStartTime: Date.now(),
    };
  }

  /**
   * Get context hint for GPT prompt enhancement
   */
  getContextHint(): string {
    const recent = this.getRecentPassages(3 * 60 * 1000); // Last 3 minutes
    if (recent.length === 0) return '';

    const books = [...new Set(recent.map(p => p.book))];
    const lastRef = this.context.lastReference;

    let hint = `Recent scripture context: `;
    hint += `Referenced books: ${books.join(', ')}. `;

    if (lastRef) {
      hint += `Most recent: ${lastRef.book} ${lastRef.chapter}. `;
    }

    hint += `Consider implicit references to these passages.`;

    return hint;
  }
}

/**
 * Create a new session context instance
 */
export function createSessionContext(): SermonSessionContext {
  return new SermonSessionContext();
}
