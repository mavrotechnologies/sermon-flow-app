import type { BookNameMap } from '@/types';

/**
 * Complete mapping of Bible book names
 * OSIS codes, display names, and common abbreviations
 */
export const BOOK_NAMES: BookNameMap[] = [
  // Old Testament
  { osis: 'Gen', name: 'Genesis', abbrev: ['gen', 'ge', 'gn'] },
  { osis: 'Exod', name: 'Exodus', abbrev: ['exod', 'exo', 'ex'] },
  { osis: 'Lev', name: 'Leviticus', abbrev: ['lev', 'le', 'lv'] },
  { osis: 'Num', name: 'Numbers', abbrev: ['num', 'nu', 'nm', 'nb'] },
  { osis: 'Deut', name: 'Deuteronomy', abbrev: ['deut', 'de', 'dt'] },
  { osis: 'Josh', name: 'Joshua', abbrev: ['josh', 'jos', 'jsh'] },
  { osis: 'Judg', name: 'Judges', abbrev: ['judg', 'jdg', 'jg', 'jdgs'] },
  { osis: 'Ruth', name: 'Ruth', abbrev: ['ruth', 'rth', 'ru'] },
  { osis: '1Sam', name: '1 Samuel', abbrev: ['1sam', '1sa', '1s', 'i sam', 'i sa'] },
  { osis: '2Sam', name: '2 Samuel', abbrev: ['2sam', '2sa', '2s', 'ii sam', 'ii sa'] },
  { osis: '1Kgs', name: '1 Kings', abbrev: ['1kgs', '1ki', '1k', 'i kgs', 'i kings'] },
  { osis: '2Kgs', name: '2 Kings', abbrev: ['2kgs', '2ki', '2k', 'ii kgs', 'ii kings'] },
  { osis: '1Chr', name: '1 Chronicles', abbrev: ['1chr', '1ch', 'i chr', 'i chron'] },
  { osis: '2Chr', name: '2 Chronicles', abbrev: ['2chr', '2ch', 'ii chr', 'ii chron'] },
  { osis: 'Ezra', name: 'Ezra', abbrev: ['ezra', 'ezr'] },
  { osis: 'Neh', name: 'Nehemiah', abbrev: ['neh', 'ne'] },
  { osis: 'Esth', name: 'Esther', abbrev: ['esth', 'est', 'es'] },
  { osis: 'Job', name: 'Job', abbrev: ['job', 'jb'] },
  { osis: 'Ps', name: 'Psalms', abbrev: ['ps', 'psa', 'psm', 'pss', 'psalm', 'psalms'] },
  { osis: 'Prov', name: 'Proverbs', abbrev: ['prov', 'pro', 'prv', 'pr'] },
  { osis: 'Eccl', name: 'Ecclesiastes', abbrev: ['eccl', 'ecc', 'ec', 'qoh'] },
  { osis: 'Song', name: 'Song of Solomon', abbrev: ['song', 'sos', 'so', 'canticles'] },
  { osis: 'Isa', name: 'Isaiah', abbrev: ['isa', 'is'] },
  { osis: 'Jer', name: 'Jeremiah', abbrev: ['jer', 'je', 'jr'] },
  { osis: 'Lam', name: 'Lamentations', abbrev: ['lam', 'la'] },
  { osis: 'Ezek', name: 'Ezekiel', abbrev: ['ezek', 'eze', 'ezk'] },
  { osis: 'Dan', name: 'Daniel', abbrev: ['dan', 'da', 'dn'] },
  { osis: 'Hos', name: 'Hosea', abbrev: ['hos', 'ho'] },
  { osis: 'Joel', name: 'Joel', abbrev: ['joel', 'jl'] },
  { osis: 'Amos', name: 'Amos', abbrev: ['amos', 'am'] },
  { osis: 'Obad', name: 'Obadiah', abbrev: ['obad', 'ob'] },
  { osis: 'Jonah', name: 'Jonah', abbrev: ['jonah', 'jnh', 'jon'] },
  { osis: 'Mic', name: 'Micah', abbrev: ['mic', 'mc'] },
  { osis: 'Nah', name: 'Nahum', abbrev: ['nah', 'na'] },
  { osis: 'Hab', name: 'Habakkuk', abbrev: ['hab', 'hb'] },
  { osis: 'Zeph', name: 'Zephaniah', abbrev: ['zeph', 'zep', 'zp'] },
  { osis: 'Hag', name: 'Haggai', abbrev: ['hag', 'hg'] },
  { osis: 'Zech', name: 'Zechariah', abbrev: ['zech', 'zec', 'zc'] },
  { osis: 'Mal', name: 'Malachi', abbrev: ['mal', 'ml'] },

  // New Testament
  { osis: 'Matt', name: 'Matthew', abbrev: ['matt', 'mat', 'mt'] },
  { osis: 'Mark', name: 'Mark', abbrev: ['mark', 'mrk', 'mk', 'mr'] },
  { osis: 'Luke', name: 'Luke', abbrev: ['luke', 'luk', 'lk'] },
  { osis: 'John', name: 'John', abbrev: ['john', 'jhn', 'jn'] },
  { osis: 'Acts', name: 'Acts', abbrev: ['acts', 'act', 'ac'] },
  { osis: 'Rom', name: 'Romans', abbrev: ['rom', 'ro', 'rm'] },
  { osis: '1Cor', name: '1 Corinthians', abbrev: ['1cor', '1co', 'i cor', 'i co'] },
  { osis: '2Cor', name: '2 Corinthians', abbrev: ['2cor', '2co', 'ii cor', 'ii co'] },
  { osis: 'Gal', name: 'Galatians', abbrev: ['gal', 'ga'] },
  { osis: 'Eph', name: 'Ephesians', abbrev: ['eph', 'ephes'] },
  { osis: 'Phil', name: 'Philippians', abbrev: ['phil', 'php', 'pp'] },
  { osis: 'Col', name: 'Colossians', abbrev: ['col', 'co'] },
  { osis: '1Thess', name: '1 Thessalonians', abbrev: ['1thess', '1th', 'i thess', 'i th'] },
  { osis: '2Thess', name: '2 Thessalonians', abbrev: ['2thess', '2th', 'ii thess', 'ii th'] },
  { osis: '1Tim', name: '1 Timothy', abbrev: ['1tim', '1ti', 'i tim', 'i ti'] },
  { osis: '2Tim', name: '2 Timothy', abbrev: ['2tim', '2ti', 'ii tim', 'ii ti'] },
  { osis: 'Titus', name: 'Titus', abbrev: ['titus', 'tit'] },
  { osis: 'Phlm', name: 'Philemon', abbrev: ['phlm', 'phm', 'pm'] },
  { osis: 'Heb', name: 'Hebrews', abbrev: ['heb'] },
  { osis: 'Jas', name: 'James', abbrev: ['jas', 'jm'] },
  { osis: '1Pet', name: '1 Peter', abbrev: ['1pet', '1pe', '1pt', 'i pet', 'i pe'] },
  { osis: '2Pet', name: '2 Peter', abbrev: ['2pet', '2pe', '2pt', 'ii pet', 'ii pe'] },
  { osis: '1John', name: '1 John', abbrev: ['1john', '1jn', '1jhn', 'i john', 'i jn'] },
  { osis: '2John', name: '2 John', abbrev: ['2john', '2jn', '2jhn', 'ii john', 'ii jn'] },
  { osis: '3John', name: '3 John', abbrev: ['3john', '3jn', '3jhn', 'iii john', 'iii jn'] },
  { osis: 'Jude', name: 'Jude', abbrev: ['jude', 'jud', 'jd'] },
  { osis: 'Rev', name: 'Revelation', abbrev: ['rev', 're', 'revelations'] },
];

/**
 * Get display name from OSIS code
 */
export function getBookName(osis: string): string {
  const book = BOOK_NAMES.find((b) => b.osis === osis);
  return book?.name || osis;
}

/**
 * Get OSIS code from display name or abbreviation
 */
export function getOsisCode(name: string): string | null {
  const normalized = name.toLowerCase().replace(/\s+/g, '');

  const book = BOOK_NAMES.find(
    (b) =>
      b.name.toLowerCase().replace(/\s+/g, '') === normalized ||
      b.abbrev.some((a) => a.replace(/\s+/g, '') === normalized)
  );

  return book?.osis || null;
}

/**
 * Get all book names for autocomplete
 */
export function getAllBookNames(): string[] {
  return BOOK_NAMES.map((b) => b.name);
}
