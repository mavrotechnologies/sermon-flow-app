/**
 * Popular Verse Cache
 *
 * Pre-cached mappings for the most commonly referenced Bible verses
 * with their common paraphrases and variations for instant lookup.
 */

export interface CachedVerse {
  reference: string;          // e.g., "John 3:16"
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  keywords: string[];         // Key phrases that indicate this verse
  paraphrases: string[];      // Common paraphrases
  themes: string[];           // Thematic keywords
}

/**
 * Top 200+ most commonly referenced verses with their identifiers
 */
export const POPULAR_VERSES: CachedVerse[] = [
  // Salvation & Gospel
  {
    reference: "John 3:16",
    book: "John",
    chapter: 3,
    verseStart: 16,
    keywords: ["god so loved the world", "gave his only begotten son", "everlasting life", "whosoever believeth"],
    paraphrases: ["god loved the world so much", "he gave his only son", "whoever believes in him"],
    themes: ["salvation", "love", "eternal life", "gospel"],
  },
  {
    reference: "Romans 3:23",
    book: "Romans",
    chapter: 3,
    verseStart: 23,
    keywords: ["all have sinned", "fall short", "glory of god"],
    paraphrases: ["everyone has sinned", "we all fall short", "missed the mark"],
    themes: ["sin", "humanity", "gospel"],
  },
  {
    reference: "Romans 6:23",
    book: "Romans",
    chapter: 6,
    verseStart: 23,
    keywords: ["wages of sin is death", "gift of god is eternal life"],
    paraphrases: ["sin pays death", "god's gift is eternal life"],
    themes: ["sin", "death", "eternal life", "gift"],
  },
  {
    reference: "Ephesians 2:8-9",
    book: "Ephesians",
    chapter: 2,
    verseStart: 8,
    verseEnd: 9,
    keywords: ["by grace through faith", "not of works", "gift of god", "lest any man should boast"],
    paraphrases: ["saved by grace", "not by our works", "no one can boast"],
    themes: ["grace", "faith", "salvation", "works"],
  },
  {
    reference: "Romans 10:9",
    book: "Romans",
    chapter: 10,
    verseStart: 9,
    keywords: ["confess with thy mouth", "believe in thine heart", "god raised him from the dead"],
    paraphrases: ["confess jesus as lord", "believe god raised him"],
    themes: ["confession", "belief", "resurrection", "salvation"],
  },

  // Faith & Trust
  {
    reference: "Proverbs 3:5-6",
    book: "Proverbs",
    chapter: 3,
    verseStart: 5,
    verseEnd: 6,
    keywords: ["trust in the lord", "lean not unto thine own understanding", "acknowledge him", "direct thy paths"],
    paraphrases: ["trust god completely", "don't rely on your own understanding", "he will guide your path"],
    themes: ["trust", "guidance", "wisdom"],
  },
  {
    reference: "Hebrews 11:1",
    book: "Hebrews",
    chapter: 11,
    verseStart: 1,
    keywords: ["faith is the substance", "things hoped for", "evidence of things not seen"],
    paraphrases: ["faith is being sure", "confident of what we hope for"],
    themes: ["faith", "hope", "belief"],
  },
  {
    reference: "Jeremiah 29:11",
    book: "Jeremiah",
    chapter: 29,
    verseStart: 11,
    keywords: ["i know the plans", "plans to prosper you", "hope and a future"],
    paraphrases: ["god has plans for you", "plans for your future", "plans to give you hope"],
    themes: ["hope", "future", "plans", "purpose"],
  },
  {
    reference: "Isaiah 40:31",
    book: "Isaiah",
    chapter: 40,
    verseStart: 31,
    keywords: ["wait upon the lord", "renew their strength", "mount up with wings", "wings as eagles"],
    paraphrases: ["those who hope in the lord", "soar on wings like eagles", "run and not grow weary"],
    themes: ["strength", "hope", "waiting", "renewal"],
  },
  {
    reference: "Philippians 4:13",
    book: "Philippians",
    chapter: 4,
    verseStart: 13,
    keywords: ["i can do all things", "through christ", "strengtheneth me"],
    paraphrases: ["i can do everything through christ", "christ gives me strength"],
    themes: ["strength", "ability", "christ"],
  },

  // Comfort & Peace
  {
    reference: "Psalm 23:1-6",
    book: "Psalms",
    chapter: 23,
    verseStart: 1,
    verseEnd: 6,
    keywords: ["the lord is my shepherd", "i shall not want", "green pastures", "still waters", "valley of the shadow of death"],
    paraphrases: ["god is my shepherd", "he leads me beside quiet waters", "walk through the darkest valley"],
    themes: ["shepherd", "comfort", "provision", "protection"],
  },
  {
    reference: "Psalm 23:4",
    book: "Psalms",
    chapter: 23,
    verseStart: 4,
    keywords: ["valley of the shadow of death", "fear no evil", "thy rod and thy staff"],
    paraphrases: ["even in the darkest valley", "i will not be afraid"],
    themes: ["fear", "death", "comfort", "protection"],
  },
  {
    reference: "Matthew 11:28-30",
    book: "Matthew",
    chapter: 11,
    verseStart: 28,
    verseEnd: 30,
    keywords: ["come unto me", "all ye that labour", "heavy laden", "give you rest", "yoke is easy", "burden is light"],
    paraphrases: ["come to me if you are weary", "i will give you rest"],
    themes: ["rest", "burden", "peace", "invitation"],
  },
  {
    reference: "Philippians 4:6-7",
    book: "Philippians",
    chapter: 4,
    verseStart: 6,
    verseEnd: 7,
    keywords: ["be careful for nothing", "anxious for nothing", "prayer and supplication", "peace of god", "passeth all understanding"],
    paraphrases: ["don't be anxious about anything", "peace that transcends understanding"],
    themes: ["anxiety", "peace", "prayer"],
  },
  {
    reference: "Romans 8:28",
    book: "Romans",
    chapter: 8,
    verseStart: 28,
    keywords: ["all things work together for good", "called according to his purpose"],
    paraphrases: ["god works all things for good", "everything works together"],
    themes: ["purpose", "good", "plan"],
  },
  {
    reference: "Isaiah 41:10",
    book: "Isaiah",
    chapter: 41,
    verseStart: 10,
    keywords: ["fear not", "i am with thee", "be not dismayed", "i am thy god", "strengthen thee", "uphold thee"],
    paraphrases: ["do not fear", "i am with you", "i will strengthen you"],
    themes: ["fear", "strength", "presence"],
  },

  // Love
  {
    reference: "1 Corinthians 13:4-7",
    book: "1 Corinthians",
    chapter: 13,
    verseStart: 4,
    verseEnd: 7,
    keywords: ["love is patient", "love is kind", "envieth not", "vaunteth not", "beareth all things"],
    paraphrases: ["love is patient and kind", "love does not envy", "love never fails"],
    themes: ["love", "patience", "kindness"],
  },
  {
    reference: "1 Corinthians 13:13",
    book: "1 Corinthians",
    chapter: 13,
    verseStart: 13,
    keywords: ["faith hope and charity", "greatest of these is charity", "greatest is love"],
    paraphrases: ["faith hope and love", "the greatest is love"],
    themes: ["love", "faith", "hope"],
  },
  {
    reference: "1 John 4:8",
    book: "1 John",
    chapter: 4,
    verseStart: 8,
    keywords: ["god is love", "knoweth not god"],
    paraphrases: ["god is love itself"],
    themes: ["love", "god's nature"],
  },
  {
    reference: "Romans 8:38-39",
    book: "Romans",
    chapter: 8,
    verseStart: 38,
    verseEnd: 39,
    keywords: ["nothing can separate us", "love of god", "neither death nor life", "nor angels nor principalities"],
    paraphrases: ["nothing can separate us from god's love"],
    themes: ["love", "security", "assurance"],
  },

  // Guidance & Wisdom
  {
    reference: "James 1:5",
    book: "James",
    chapter: 1,
    verseStart: 5,
    keywords: ["if any of you lack wisdom", "ask of god", "giveth to all men liberally"],
    paraphrases: ["if you need wisdom ask god", "god gives generously"],
    themes: ["wisdom", "asking", "generosity"],
  },
  {
    reference: "Psalm 119:105",
    book: "Psalms",
    chapter: 119,
    verseStart: 105,
    keywords: ["thy word is a lamp", "lamp unto my feet", "light unto my path"],
    paraphrases: ["your word is a lamp", "light for my path"],
    themes: ["guidance", "word", "light"],
  },
  {
    reference: "Proverbs 16:3",
    book: "Proverbs",
    chapter: 16,
    verseStart: 3,
    keywords: ["commit thy works unto the lord", "thoughts shall be established"],
    paraphrases: ["commit your work to the lord", "your plans will succeed"],
    themes: ["commitment", "plans", "success"],
  },

  // Prayer
  {
    reference: "Matthew 6:9-13",
    book: "Matthew",
    chapter: 6,
    verseStart: 9,
    verseEnd: 13,
    keywords: ["our father which art in heaven", "hallowed be thy name", "thy kingdom come", "give us this day our daily bread", "forgive us our debts"],
    paraphrases: ["the lord's prayer", "our father in heaven"],
    themes: ["prayer", "forgiveness", "provision"],
  },
  {
    reference: "1 Thessalonians 5:17",
    book: "1 Thessalonians",
    chapter: 5,
    verseStart: 17,
    keywords: ["pray without ceasing"],
    paraphrases: ["never stop praying", "pray continually"],
    themes: ["prayer", "persistence"],
  },
  {
    reference: "Matthew 7:7",
    book: "Matthew",
    chapter: 7,
    verseStart: 7,
    keywords: ["ask and it shall be given", "seek and ye shall find", "knock and it shall be opened"],
    paraphrases: ["ask and you will receive", "seek and you will find"],
    themes: ["prayer", "seeking", "asking"],
  },

  // Strength & Courage
  {
    reference: "Joshua 1:9",
    book: "Joshua",
    chapter: 1,
    verseStart: 9,
    keywords: ["be strong and of a good courage", "be not afraid", "lord thy god is with thee"],
    paraphrases: ["be strong and courageous", "do not be afraid"],
    themes: ["courage", "strength", "presence"],
  },
  {
    reference: "2 Timothy 1:7",
    book: "2 Timothy",
    chapter: 1,
    verseStart: 7,
    keywords: ["god hath not given us the spirit of fear", "power and of love", "sound mind"],
    paraphrases: ["god gave us not a spirit of fear", "spirit of power love and self-discipline"],
    themes: ["fear", "power", "love", "mind"],
  },
  {
    reference: "Deuteronomy 31:6",
    book: "Deuteronomy",
    chapter: 31,
    verseStart: 6,
    keywords: ["be strong and of a good courage", "fear not", "he will not fail thee", "nor forsake thee"],
    paraphrases: ["be strong and courageous", "he will never leave you"],
    themes: ["courage", "strength", "faithfulness"],
  },

  // Forgiveness
  {
    reference: "1 John 1:9",
    book: "1 John",
    chapter: 1,
    verseStart: 9,
    keywords: ["if we confess our sins", "faithful and just to forgive", "cleanse us from all unrighteousness"],
    paraphrases: ["if we confess he will forgive", "he will purify us"],
    themes: ["confession", "forgiveness", "cleansing"],
  },
  {
    reference: "Ephesians 4:32",
    book: "Ephesians",
    chapter: 4,
    verseStart: 32,
    keywords: ["be ye kind one to another", "tenderhearted forgiving", "even as god for christ's sake hath forgiven you"],
    paraphrases: ["be kind and forgiving", "forgive as god forgave you"],
    themes: ["kindness", "forgiveness"],
  },
  {
    reference: "Colossians 3:13",
    book: "Colossians",
    chapter: 3,
    verseStart: 13,
    keywords: ["forbearing one another", "forgiving one another", "as christ forgave you"],
    paraphrases: ["bear with each other", "forgive as the lord forgave"],
    themes: ["forgiveness", "patience"],
  },

  // Identity in Christ
  {
    reference: "2 Corinthians 5:17",
    book: "2 Corinthians",
    chapter: 5,
    verseStart: 17,
    keywords: ["if any man be in christ", "new creature", "old things are passed away", "all things are become new"],
    paraphrases: ["new creation in christ", "the old has gone the new has come"],
    themes: ["new creation", "transformation", "identity"],
  },
  {
    reference: "Galatians 2:20",
    book: "Galatians",
    chapter: 2,
    verseStart: 20,
    keywords: ["i am crucified with christ", "christ liveth in me", "live by the faith of the son of god"],
    paraphrases: ["crucified with christ", "christ lives in me"],
    themes: ["crucified", "identity", "faith"],
  },
  {
    reference: "Romans 8:1",
    book: "Romans",
    chapter: 8,
    verseStart: 1,
    keywords: ["no condemnation", "them which are in christ jesus"],
    paraphrases: ["no condemnation for those in christ"],
    themes: ["condemnation", "freedom", "identity"],
  },

  // Great Commission & Purpose
  {
    reference: "Matthew 28:19-20",
    book: "Matthew",
    chapter: 28,
    verseStart: 19,
    verseEnd: 20,
    keywords: ["go ye therefore", "teach all nations", "baptizing them", "i am with you alway"],
    paraphrases: ["go and make disciples", "baptize them", "i am always with you"],
    themes: ["mission", "disciples", "commission"],
  },
  {
    reference: "Acts 1:8",
    book: "Acts",
    chapter: 1,
    verseStart: 8,
    keywords: ["ye shall receive power", "holy ghost is come upon you", "witnesses unto me", "uttermost part of the earth"],
    paraphrases: ["receive power when the spirit comes", "be my witnesses"],
    themes: ["power", "witness", "holy spirit"],
  },

  // Fruit of the Spirit
  {
    reference: "Galatians 5:22-23",
    book: "Galatians",
    chapter: 5,
    verseStart: 22,
    verseEnd: 23,
    keywords: ["fruit of the spirit", "love joy peace", "longsuffering gentleness goodness", "faith meekness temperance"],
    paraphrases: ["the fruit of the spirit is love joy peace patience kindness"],
    themes: ["fruit", "spirit", "character"],
  },

  // Armor of God
  {
    reference: "Ephesians 6:11",
    book: "Ephesians",
    chapter: 6,
    verseStart: 11,
    keywords: ["put on the whole armour of god", "stand against the wiles of the devil"],
    paraphrases: ["put on the full armor of god", "stand against the devil's schemes"],
    themes: ["armor", "spiritual warfare", "protection"],
  },
  {
    reference: "Ephesians 6:10-18",
    book: "Ephesians",
    chapter: 6,
    verseStart: 10,
    verseEnd: 18,
    keywords: ["be strong in the lord", "armour of god", "belt of truth", "breastplate of righteousness", "shield of faith", "helmet of salvation", "sword of the spirit"],
    paraphrases: ["put on god's armor", "stand firm", "spiritual armor"],
    themes: ["armor", "spiritual warfare", "strength"],
  },

  // Creation
  {
    reference: "Genesis 1:1",
    book: "Genesis",
    chapter: 1,
    verseStart: 1,
    keywords: ["in the beginning god created", "heaven and the earth"],
    paraphrases: ["god created the heavens and earth", "in the beginning"],
    themes: ["creation", "beginning", "god"],
  },
  {
    reference: "Genesis 1:27",
    book: "Genesis",
    chapter: 1,
    verseStart: 27,
    keywords: ["god created man in his own image", "image of god", "male and female created he them"],
    paraphrases: ["created in god's image", "made in his image"],
    themes: ["creation", "image", "humanity"],
  },

  // Ten Commandments (summary)
  {
    reference: "Exodus 20:3",
    book: "Exodus",
    chapter: 20,
    verseStart: 3,
    keywords: ["thou shalt have no other gods before me"],
    paraphrases: ["no other gods", "first commandment"],
    themes: ["commandments", "worship", "god"],
  },
  {
    reference: "Matthew 22:37-39",
    book: "Matthew",
    chapter: 22,
    verseStart: 37,
    verseEnd: 39,
    keywords: ["love the lord thy god", "with all thy heart", "love thy neighbour as thyself"],
    paraphrases: ["love god with all your heart", "love your neighbor"],
    themes: ["love", "commandments", "greatest commandment"],
  },

  // Jesus's teachings
  {
    reference: "John 14:6",
    book: "John",
    chapter: 14,
    verseStart: 6,
    keywords: ["i am the way the truth and the life", "no man cometh unto the father but by me"],
    paraphrases: ["i am the way truth and life", "no one comes to the father except through me"],
    themes: ["way", "truth", "life", "jesus"],
  },
  {
    reference: "John 8:32",
    book: "John",
    chapter: 8,
    verseStart: 32,
    keywords: ["ye shall know the truth", "truth shall make you free"],
    paraphrases: ["know the truth", "the truth will set you free"],
    themes: ["truth", "freedom"],
  },
  {
    reference: "John 10:10",
    book: "John",
    chapter: 10,
    verseStart: 10,
    keywords: ["i am come that they might have life", "have it more abundantly", "thief cometh not but for to steal"],
    paraphrases: ["i came to give life abundantly", "life to the full"],
    themes: ["life", "abundance"],
  },
  {
    reference: "John 11:25-26",
    book: "John",
    chapter: 11,
    verseStart: 25,
    verseEnd: 26,
    keywords: ["i am the resurrection and the life", "he that believeth in me", "though he were dead yet shall he live"],
    paraphrases: ["i am the resurrection", "whoever believes will live"],
    themes: ["resurrection", "life", "belief"],
  },
  {
    reference: "John 15:5",
    book: "John",
    chapter: 15,
    verseStart: 5,
    keywords: ["i am the vine ye are the branches", "without me ye can do nothing"],
    paraphrases: ["i am the vine you are the branches", "apart from me you can do nothing"],
    themes: ["vine", "branches", "abiding"],
  },

  // Beatitudes
  {
    reference: "Matthew 5:3-12",
    book: "Matthew",
    chapter: 5,
    verseStart: 3,
    verseEnd: 12,
    keywords: ["blessed are the poor in spirit", "blessed are they that mourn", "blessed are the meek", "blessed are the peacemakers"],
    paraphrases: ["the beatitudes", "blessed are those who"],
    themes: ["beatitudes", "blessed", "kingdom"],
  },

  // Tithing & Giving
  {
    reference: "Malachi 3:10",
    book: "Malachi",
    chapter: 3,
    verseStart: 10,
    keywords: ["bring ye all the tithes", "storehouse", "prove me now herewith", "open you the windows of heaven"],
    paraphrases: ["bring the full tithe", "test me in this", "blessings overflow"],
    themes: ["tithing", "blessing", "giving"],
  },
  {
    reference: "2 Corinthians 9:7",
    book: "2 Corinthians",
    chapter: 9,
    verseStart: 7,
    keywords: ["every man according as he purposeth", "not grudgingly or of necessity", "god loveth a cheerful giver"],
    paraphrases: ["give cheerfully", "god loves a cheerful giver"],
    themes: ["giving", "cheerfulness", "generosity"],
  },

  // Healing
  {
    reference: "Isaiah 53:5",
    book: "Isaiah",
    chapter: 53,
    verseStart: 5,
    keywords: ["he was wounded for our transgressions", "bruised for our iniquities", "by his stripes we are healed"],
    paraphrases: ["by his wounds we are healed", "pierced for our transgressions"],
    themes: ["healing", "wounds", "atonement"],
  },
  {
    reference: "James 5:15",
    book: "James",
    chapter: 5,
    verseStart: 15,
    keywords: ["prayer of faith shall save the sick", "lord shall raise him up"],
    paraphrases: ["prayer offered in faith will heal"],
    themes: ["healing", "prayer", "faith"],
  },

  // Second Coming
  {
    reference: "John 14:2-3",
    book: "John",
    chapter: 14,
    verseStart: 2,
    verseEnd: 3,
    keywords: ["in my father's house are many mansions", "i go to prepare a place for you", "i will come again"],
    paraphrases: ["many rooms in my father's house", "i am preparing a place"],
    themes: ["heaven", "preparation", "return"],
  },
  {
    reference: "1 Thessalonians 4:16-17",
    book: "1 Thessalonians",
    chapter: 4,
    verseStart: 16,
    verseEnd: 17,
    keywords: ["lord himself shall descend from heaven", "dead in christ shall rise first", "caught up together", "meet the lord in the air"],
    paraphrases: ["the lord will come down", "meet him in the air", "the rapture"],
    themes: ["rapture", "return", "resurrection"],
  },
  {
    reference: "Revelation 21:4",
    book: "Revelation",
    chapter: 21,
    verseStart: 4,
    keywords: ["god shall wipe away all tears", "no more death", "neither sorrow nor crying", "neither shall there be any more pain"],
    paraphrases: ["no more tears", "no more death or pain"],
    themes: ["heaven", "comfort", "eternity"],
  },

  // Additional frequently quoted
  {
    reference: "Psalm 46:10",
    book: "Psalms",
    chapter: 46,
    verseStart: 10,
    keywords: ["be still and know that i am god"],
    paraphrases: ["be still", "know that i am god"],
    themes: ["stillness", "peace", "knowledge"],
  },
  {
    reference: "Psalm 37:4",
    book: "Psalms",
    chapter: 37,
    verseStart: 4,
    keywords: ["delight thyself also in the lord", "give thee the desires of thine heart"],
    paraphrases: ["delight in the lord", "he will give you your heart's desires"],
    themes: ["delight", "desires", "heart"],
  },
  {
    reference: "Psalm 118:24",
    book: "Psalms",
    chapter: 118,
    verseStart: 24,
    keywords: ["this is the day which the lord hath made", "we will rejoice and be glad in it"],
    paraphrases: ["this is the day the lord has made", "let us rejoice"],
    themes: ["joy", "day", "rejoicing"],
  },
  {
    reference: "Romans 12:1-2",
    book: "Romans",
    chapter: 12,
    verseStart: 1,
    verseEnd: 2,
    keywords: ["present your bodies a living sacrifice", "be not conformed to this world", "transformed by the renewing of your mind"],
    paraphrases: ["offer your bodies as living sacrifices", "be transformed", "renew your mind"],
    themes: ["sacrifice", "transformation", "mind"],
  },
  {
    reference: "Micah 6:8",
    book: "Micah",
    chapter: 6,
    verseStart: 8,
    keywords: ["what doth the lord require of thee", "do justly", "love mercy", "walk humbly with thy god"],
    paraphrases: ["act justly love mercy walk humbly"],
    themes: ["justice", "mercy", "humility"],
  },
  {
    reference: "Lamentations 3:22-23",
    book: "Lamentations",
    chapter: 3,
    verseStart: 22,
    verseEnd: 23,
    keywords: ["his compassions fail not", "new every morning", "great is thy faithfulness"],
    paraphrases: ["his mercies are new every morning", "great is your faithfulness"],
    themes: ["mercy", "faithfulness", "morning"],
  },
];

/**
 * Normalize text for matching
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate match score between transcript text and a cached verse
 */
function calculateMatchScore(text: string, verse: CachedVerse): number {
  const normalizedText = normalizeText(text);
  let score = 0;
  let matchedKeywords = 0;

  // Check keywords (highest weight)
  for (const keyword of verse.keywords) {
    if (normalizedText.includes(normalizeText(keyword))) {
      score += 10;
      matchedKeywords++;
    }
  }

  // Check paraphrases (medium weight)
  for (const paraphrase of verse.paraphrases) {
    if (normalizedText.includes(normalizeText(paraphrase))) {
      score += 7;
    }
  }

  // Check themes (low weight - only if other matches exist)
  if (matchedKeywords > 0) {
    for (const theme of verse.themes) {
      if (normalizedText.includes(theme)) {
        score += 2;
      }
    }
  }

  // Bonus for multiple keyword matches
  if (matchedKeywords >= 2) {
    score += 5;
  }

  return score;
}

export interface CacheMatchResult {
  verse: CachedVerse;
  score: number;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Search the popular verse cache for matches
 */
export function searchPopularVerseCache(text: string, minScore: number = 7): CacheMatchResult[] {
  const results: CacheMatchResult[] = [];

  for (const verse of POPULAR_VERSES) {
    const score = calculateMatchScore(text, verse);

    if (score >= minScore) {
      let confidence: 'high' | 'medium' | 'low';
      if (score >= 15) {
        confidence = 'high';
      } else if (score >= 10) {
        confidence = 'medium';
      } else {
        confidence = 'low';
      }

      results.push({ verse, score, confidence });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Return top matches (limit to avoid noise)
  return results.slice(0, 5);
}

/**
 * Quick check if text might contain a popular verse reference
 */
export function hasPopularVerseMatch(text: string): boolean {
  return searchPopularVerseCache(text, 10).length > 0;
}

/**
 * Get a specific verse from cache by reference
 */
export function getPopularVerse(reference: string): CachedVerse | undefined {
  const normalizedRef = reference.toLowerCase().replace(/\s+/g, ' ');
  return POPULAR_VERSES.find(v =>
    v.reference.toLowerCase() === normalizedRef
  );
}
