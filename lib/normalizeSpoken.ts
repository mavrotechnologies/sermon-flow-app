// Custom number conversion (words-to-numbers was too aggressive)

/**
 * Normalizes spoken text to written format for better scripture detection
 * Converts spoken numbers to digits and normalizes scripture reference patterns
 */

// Book name patterns that need normalization
const ORDINAL_BOOKS: Record<string, string> = {
    'first samuel': '1 Samuel',
    'second samuel': '2 Samuel',
    'first kings': '1 Kings',
    'second kings': '2 Kings',
    'first chronicles': '1 Chronicles',
    'second chronicles': '2 Chronicles',
    'first corinthians': '1 Corinthians',
    'second corinthians': '2 Corinthians',
    'first thessalonians': '1 Thessalonians',
    'second thessalonians': '2 Thessalonians',
    'first timothy': '1 Timothy',
    'second timothy': '2 Timothy',
    'first peter': '1 Peter',
    'second peter': '2 Peter',
    'first john': '1 John',
    'second john': '2 John',
    'third john': '3 John',
    '1st samuel': '1 Samuel',
    '2nd samuel': '2 Samuel',
    '1st kings': '1 Kings',
    '2nd kings': '2 Kings',
    '1st chronicles': '1 Chronicles',
    '2nd chronicles': '2 Chronicles',
    '1st corinthians': '1 Corinthians',
    '2nd corinthians': '2 Corinthians',
    '1st thessalonians': '1 Thessalonians',
    '2nd thessalonians': '2 Thessalonians',
    '1st timothy': '1 Timothy',
    '2nd timothy': '2 Timothy',
    '1st peter': '1 Peter',
    '2nd peter': '2 Peter',
    '1st john': '1 John',
    '2nd john': '2 John',
    '3rd john': '3 John',
};

/**
 * Converts spoken chapter/verse patterns to standard format
 * e.g., "chapter three verse sixteen" → "3:16"
 * e.g., "chapter 3 verses 16 through 18" → "3:16-18"
 */
function normalizeChapterVerse(text: string): string {
    let normalized = text;

    // Pattern: "chapter X verse Y" → "X:Y"
    normalized = normalized.replace(
        /chapter\s+(\d+)\s+verse\s+(\d+)/gi,
        '$1:$2'
    );

    // Pattern: "chapter X verses Y through/to Z" → "X:Y-Z"
    normalized = normalized.replace(
        /chapter\s+(\d+)\s+verses?\s+(\d+)\s+(?:through|to|thru)\s+(\d+)/gi,
        '$1:$2-$3'
    );

    // Pattern: "verses X through Y" → "X-Y" (when chapter already specified)
    normalized = normalized.replace(
        /verses?\s+(\d+)\s+(?:through|to|thru)\s+(\d+)/gi,
        '$1-$2'
    );

    // Pattern: "verse X" → ":X" (needs chapter context)
    // This is tricky - we'll leave it for the parser to handle

    return normalized;
}

/**
 * Normalizes ordinal book names
 * e.g., "First Corinthians" → "1 Corinthians"
 */
function normalizeBookNames(text: string): string {
    let normalized = text;

    for (const [spoken, written] of Object.entries(ORDINAL_BOOKS)) {
        const regex = new RegExp(spoken, 'gi');
        normalized = normalized.replace(regex, written);
    }

    return normalized;
}

/**
 * Converts spoken numbers to digits (carefully)
 * e.g., "chapter three verse sixteen" → "chapter 3 verse 16"
 * Preserves book names and other words
 */
function convertSpokenNumbers(text: string): string {
    // Only convert specific number words, not the whole text
    const numberWords: Record<string, string> = {
        'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
        'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
        'ten': '10', 'eleven': '11', 'twelve': '12', 'thirteen': '13',
        'fourteen': '14', 'fifteen': '15', 'sixteen': '16', 'seventeen': '17',
        'eighteen': '18', 'nineteen': '19', 'twenty': '20', 'thirty': '30',
        'forty': '40', 'fifty': '50', 'sixty': '60', 'seventy': '70',
        'eighty': '80', 'ninety': '90', 'hundred': '100',
    };

    let result = text;

    // Replace number words with digits
    for (const [word, digit] of Object.entries(numberWords)) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        result = result.replace(regex, digit);
    }

    // Handle compound numbers like "twenty one" → "21"
    result = result.replace(/(\d0)\s+(\d)(?!\d)/g, (_, tens, ones) => {
        return String(parseInt(tens) + parseInt(ones));
    });

    return result;
}

/**
 * Main normalization function
 * Applies all normalization steps to convert spoken text to parser-friendly format
 */
export function normalizeSpokenText(text: string): string {
    let normalized = text.toLowerCase();

    // Step 1: Convert spoken numbers to digits
    normalized = convertSpokenNumbers(normalized);

    // Step 2: Normalize ordinal book names
    normalized = normalizeBookNames(normalized);

    // Step 3: Normalize chapter/verse patterns
    normalized = normalizeChapterVerse(normalized);

    return normalized;
}

/**
 * Quick test if text might contain a scripture reference
 * Used for early filtering before running the full parser
 */
export function mightContainScripture(text: string): boolean {
    const bibleBookPattern = /\b(genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalms?|proverbs|ecclesiastes|song|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation)\b/i;

    const chapterVersePattern = /\d+[:\s]+\d+/;

    return bibleBookPattern.test(text) || chapterVersePattern.test(text);
}
