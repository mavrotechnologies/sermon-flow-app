/**
 * Biblical Knowledge Base
 *
 * Maps biblical characters, stories, places, and concepts to their scripture references.
 * Used for contextual detection when preachers reference biblical events without
 * citing explicit chapter:verse references.
 *
 * Example: "David was dejected, had to go to Adullam" → 1 Samuel 22:1-2
 */

export interface BiblicalEntity {
  type: 'character' | 'story' | 'place' | 'concept';
  name: string;
  triggers: string[];          // Phrases that activate detection
  contextWords: string[];      // Nearby words that boost confidence
  ambiguous?: boolean;         // If true, requires contextWords to match
  primaryReference: {
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    reference: string;
  };
  secondaryReferences?: Array<{
    book: string;
    chapter: number;
    verseStart: number;
    verseEnd?: number;
    reference: string;
  }>;
}

export const BIBLICAL_KNOWLEDGE_BASE: BiblicalEntity[] = [
  // ═══════════════════════════════════════════════════════
  // CHARACTERS — Old Testament
  // ═══════════════════════════════════════════════════════

  // DAVID
  {
    type: 'character', name: 'David and Goliath',
    triggers: ['david and goliath', 'david slew goliath', 'david killed goliath', 'david fought goliath', 'sling and a stone', 'five smooth stones', 'the giant fell'],
    contextWords: ['giant', 'sling', 'stone', 'philistine', 'valley of elah', 'shepherd boy', 'armor bearer'],
    primaryReference: { book: '1 Samuel', chapter: 17, verseStart: 1, verseEnd: 50, reference: '1 Samuel 17:1-50' },
  },
  {
    type: 'character', name: 'David at Adullam',
    triggers: ['cave of adullam', 'adullam', 'david fled to the cave', 'david was dejected'],
    contextWords: ['cave', 'fled', 'distressed', 'debt', 'discontented', 'four hundred men', 'hiding'],
    primaryReference: { book: '1 Samuel', chapter: 22, verseStart: 1, verseEnd: 2, reference: '1 Samuel 22:1-2' },
  },
  {
    type: 'character', name: 'David and Bathsheba',
    triggers: ['david and bathsheba', 'bathsheba', 'david saw her bathing', 'uriah the hittite'],
    contextWords: ['rooftop', 'bathing', 'uriah', 'sin', 'adultery', 'nathan', 'thou art the man'],
    primaryReference: { book: '2 Samuel', chapter: 11, verseStart: 1, verseEnd: 27, reference: '2 Samuel 11:1-27' },
  },
  {
    type: 'character', name: 'David anointed king',
    triggers: ['david anointed', 'samuel anointed david', 'youngest son of jesse', 'son of jesse'],
    contextWords: ['samuel', 'anointed', 'horn of oil', 'jesse', 'shepherd', 'youngest'],
    primaryReference: { book: '1 Samuel', chapter: 16, verseStart: 1, verseEnd: 13, reference: '1 Samuel 16:1-13' },
  },
  {
    type: 'character', name: 'David dancing before the Lord',
    triggers: ['david danced', 'david dancing', 'danced before the lord', 'ark coming to jerusalem'],
    contextWords: ['ark', 'dancing', 'linen ephod', 'michal', 'despised'],
    primaryReference: { book: '2 Samuel', chapter: 6, verseStart: 14, verseEnd: 23, reference: '2 Samuel 6:14-23' },
  },
  {
    type: 'character', name: 'David and Saul',
    triggers: ['saul tried to kill david', 'david spared saul', 'saul threw a spear', 'david cut sauls robe'],
    contextWords: ['spear', 'cave', 'en gedi', 'jealous', 'spared'],
    primaryReference: { book: '1 Samuel', chapter: 24, verseStart: 1, verseEnd: 22, reference: '1 Samuel 24:1-22' },
  },
  {
    type: 'character', name: 'David writes Psalm 51',
    triggers: ['have mercy on me o god', 'create in me a clean heart', 'wash me thoroughly', 'against thee only have i sinned'],
    contextWords: ['repentance', 'mercy', 'clean heart', 'nathan', 'sin'],
    primaryReference: { book: 'Psalms', chapter: 51, verseStart: 1, verseEnd: 19, reference: 'Psalm 51:1-19' },
  },

  // MOSES
  {
    type: 'character', name: 'Moses and the Burning Bush',
    triggers: ['burning bush', 'bush was burning', 'moses at the bush', 'take off your sandals', 'holy ground', 'i am that i am'],
    contextWords: ['fire', 'bush', 'horeb', 'sinai', 'sandals', 'holy ground'],
    primaryReference: { book: 'Exodus', chapter: 3, verseStart: 1, verseEnd: 15, reference: 'Exodus 3:1-15' },
  },
  {
    type: 'character', name: 'Moses parting the Red Sea',
    triggers: ['parting the red sea', 'red sea parted', 'crossed the red sea', 'moses stretched his hand', 'walls of water'],
    contextWords: ['red sea', 'egypt', 'pharaoh', 'chariot', 'dry ground', 'waters'],
    primaryReference: { book: 'Exodus', chapter: 14, verseStart: 13, verseEnd: 31, reference: 'Exodus 14:13-31' },
  },
  {
    type: 'character', name: 'Moses receives the Ten Commandments',
    triggers: ['ten commandments', 'tablets of stone', 'mount sinai', 'thou shalt not'],
    contextWords: ['tablets', 'stone', 'sinai', 'commandments', 'law', 'mountain'],
    primaryReference: { book: 'Exodus', chapter: 20, verseStart: 1, verseEnd: 17, reference: 'Exodus 20:1-17' },
  },
  {
    type: 'character', name: 'Moses strikes the rock',
    triggers: ['moses struck the rock', 'water from the rock', 'moses hit the rock', 'rock at meribah'],
    contextWords: ['rock', 'water', 'meribah', 'kadesh', 'struck', 'staff'],
    primaryReference: { book: 'Numbers', chapter: 20, verseStart: 1, verseEnd: 13, reference: 'Numbers 20:1-13' },
  },
  {
    type: 'character', name: 'Baby Moses in the basket',
    triggers: ['baby moses', 'moses in the basket', 'basket in the nile', 'pharaohs daughter found'],
    contextWords: ['basket', 'nile', 'river', 'pharaohs daughter', 'bulrushes'],
    primaryReference: { book: 'Exodus', chapter: 2, verseStart: 1, verseEnd: 10, reference: 'Exodus 2:1-10' },
  },

  // ABRAHAM
  {
    type: 'character', name: 'Abraham and Isaac sacrifice',
    triggers: ['sacrifice of isaac', 'abraham offered isaac', 'mount moriah', 'god will provide the lamb', 'god tested abraham'],
    contextWords: ['isaac', 'sacrifice', 'moriah', 'ram', 'lamb', 'altar', 'knife'],
    primaryReference: { book: 'Genesis', chapter: 22, verseStart: 1, verseEnd: 19, reference: 'Genesis 22:1-19' },
  },
  {
    type: 'character', name: 'Abraham called by God',
    triggers: ['abram called', 'abraham called', 'leave your country', 'go to a land i will show you', 'great nation'],
    contextWords: ['ur', 'haran', 'called', 'nation', 'bless', 'land'],
    primaryReference: { book: 'Genesis', chapter: 12, verseStart: 1, verseEnd: 4, reference: 'Genesis 12:1-4' },
  },
  {
    type: 'character', name: 'Abraham and Sarah',
    triggers: ['abraham and sarah', 'sarah laughed', 'sarah conceived in old age', 'is anything too hard for the lord'],
    contextWords: ['sarah', 'laughter', 'old age', 'barren', 'promise', 'heir'],
    primaryReference: { book: 'Genesis', chapter: 18, verseStart: 1, verseEnd: 15, reference: 'Genesis 18:1-15' },
  },

  // JOSEPH (OT)
  {
    type: 'character', name: 'Joseph and the coat of many colors',
    triggers: ['coat of many colors', 'josephs coat', 'sold into slavery', 'brothers sold joseph', 'joseph sold by his brothers'],
    contextWords: ['coat', 'colors', 'brothers', 'jealous', 'pit', 'sold', 'slavery'],
    primaryReference: { book: 'Genesis', chapter: 37, verseStart: 1, verseEnd: 36, reference: 'Genesis 37:1-36' },
  },
  {
    type: 'character', name: 'Joseph interprets Pharaohs dreams',
    triggers: ['joseph interpreted', 'pharaohs dream', 'seven fat cows', 'seven lean cows', 'seven years of famine'],
    contextWords: ['pharaoh', 'dream', 'famine', 'plenty', 'cows', 'grain'],
    primaryReference: { book: 'Genesis', chapter: 41, verseStart: 1, verseEnd: 40, reference: 'Genesis 41:1-40' },
  },
  {
    type: 'character', name: 'Joseph forgives brothers',
    triggers: ['joseph forgave his brothers', 'you meant it for evil', 'god meant it for good', 'joseph revealed himself'],
    contextWords: ['forgave', 'evil', 'good', 'brothers', 'wept', 'egypt'],
    primaryReference: { book: 'Genesis', chapter: 50, verseStart: 15, verseEnd: 21, reference: 'Genesis 50:15-21' },
  },
  {
    type: 'character', name: 'Joseph and Potiphars wife',
    triggers: ['potiphars wife', 'joseph in potiphars house', 'joseph fled from temptation', 'joseph in prison'],
    contextWords: ['potiphar', 'temptation', 'prison', 'garment', 'fled'],
    primaryReference: { book: 'Genesis', chapter: 39, verseStart: 1, verseEnd: 23, reference: 'Genesis 39:1-23' },
  },

  // DANIEL
  {
    type: 'character', name: 'Daniel in the Lions Den',
    triggers: ['lions den', 'daniel in the den', 'daniel and the lions', 'god shut the lions mouths'],
    contextWords: ['lions', 'den', 'darius', 'decree', 'prayer', 'angel'],
    primaryReference: { book: 'Daniel', chapter: 6, verseStart: 1, verseEnd: 28, reference: 'Daniel 6:1-28' },
  },
  {
    type: 'character', name: 'Shadrach Meshach and Abednego',
    triggers: ['shadrach meshach', 'fiery furnace', 'three hebrew boys', 'thrown into the fire', 'fourth man in the fire'],
    contextWords: ['furnace', 'fire', 'nebuchadnezzar', 'bow down', 'image', 'gold'],
    primaryReference: { book: 'Daniel', chapter: 3, verseStart: 1, verseEnd: 30, reference: 'Daniel 3:1-30' },
  },
  {
    type: 'character', name: 'Daniel interprets the writing on the wall',
    triggers: ['writing on the wall', 'handwriting on the wall', 'mene mene tekel', 'belshazzars feast'],
    contextWords: ['wall', 'writing', 'belshazzar', 'feast', 'mene', 'tekel', 'weighed'],
    primaryReference: { book: 'Daniel', chapter: 5, verseStart: 1, verseEnd: 31, reference: 'Daniel 5:1-31' },
  },

  // ELIJAH
  {
    type: 'character', name: 'Elijah on Mount Carmel',
    triggers: ['mount carmel', 'prophets of baal', 'elijah challenged', 'fire came down', 'god who answers by fire'],
    contextWords: ['carmel', 'baal', 'fire', 'altar', 'prophets', 'rain'],
    primaryReference: { book: '1 Kings', chapter: 18, verseStart: 20, verseEnd: 40, reference: '1 Kings 18:20-40' },
  },
  {
    type: 'character', name: 'Elijah and the still small voice',
    triggers: ['still small voice', 'elijah at horeb', 'not in the earthquake', 'not in the fire', 'gentle whisper'],
    contextWords: ['cave', 'horeb', 'whisper', 'earthquake', 'wind', 'fire'],
    primaryReference: { book: '1 Kings', chapter: 19, verseStart: 9, verseEnd: 13, reference: '1 Kings 19:9-13' },
  },
  {
    type: 'character', name: 'Elijah taken up to heaven',
    triggers: ['elijah taken up', 'chariot of fire', 'whirlwind', 'elijahs mantle', 'elisha saw elijah taken'],
    contextWords: ['chariot', 'fire', 'whirlwind', 'mantle', 'elisha', 'jordan'],
    primaryReference: { book: '2 Kings', chapter: 2, verseStart: 1, verseEnd: 14, reference: '2 Kings 2:1-14' },
  },
  {
    type: 'character', name: 'Elijah fed by ravens',
    triggers: ['ravens fed elijah', 'elijah at the brook', 'brook cherith', 'ravens brought bread'],
    contextWords: ['ravens', 'brook', 'cherith', 'bread', 'meat', 'drought'],
    primaryReference: { book: '1 Kings', chapter: 17, verseStart: 1, verseEnd: 6, reference: '1 Kings 17:1-6' },
  },

  // NOAH
  {
    type: 'character', name: 'Noah and the Ark',
    triggers: ['noahs ark', 'noah built the ark', 'the great flood', 'two of every animal', 'forty days and forty nights'],
    contextWords: ['ark', 'flood', 'animals', 'rain', 'dove', 'rainbow', 'covenant'],
    primaryReference: { book: 'Genesis', chapter: 6, verseStart: 9, verseEnd: 22, reference: 'Genesis 6:9-22' },
  },

  // SAMSON
  {
    type: 'character', name: 'Samson and Delilah',
    triggers: ['samson and delilah', 'delilah cut his hair', 'samsons strength', 'secret of his strength'],
    contextWords: ['delilah', 'hair', 'strength', 'philistines', 'nazarite', 'bound'],
    primaryReference: { book: 'Judges', chapter: 16, verseStart: 4, verseEnd: 31, reference: 'Judges 16:4-31' },
  },

  // GIDEON
  {
    type: 'character', name: 'Gideon and the 300',
    triggers: ['gideons army', 'gideon and the 300', '300 men', 'gideons fleece', 'lapping water like a dog'],
    contextWords: ['fleece', 'trumpet', 'torch', 'jar', 'midianites', '300'],
    primaryReference: { book: 'Judges', chapter: 7, verseStart: 1, verseEnd: 25, reference: 'Judges 7:1-25' },
  },

  // JOSHUA
  {
    type: 'character', name: 'Joshua at Jericho',
    triggers: ['walls of jericho', 'jericho fell', 'marched around jericho', 'joshua fought the battle'],
    contextWords: ['walls', 'jericho', 'trumpet', 'shout', 'marched', 'seven times'],
    primaryReference: { book: 'Joshua', chapter: 6, verseStart: 1, verseEnd: 27, reference: 'Joshua 6:1-27' },
  },
  {
    type: 'character', name: 'Joshua be strong and courageous',
    triggers: ['be strong and courageous', 'be strong and of good courage', 'joshua be strong'],
    contextWords: ['strong', 'courageous', 'joshua', 'moses', 'promised land'],
    primaryReference: { book: 'Joshua', chapter: 1, verseStart: 9, reference: 'Joshua 1:9' },
  },

  // RUTH
  {
    type: 'character', name: 'Ruth and Naomi',
    triggers: ['ruth and naomi', 'where you go i will go', 'your people shall be my people', 'your god my god', 'ruth the moabite'],
    contextWords: ['naomi', 'moab', 'loyalty', 'boaz', 'kinsman redeemer'],
    primaryReference: { book: 'Ruth', chapter: 1, verseStart: 16, verseEnd: 17, reference: 'Ruth 1:16-17' },
  },

  // ESTHER
  {
    type: 'character', name: 'Esther saves her people',
    triggers: ['queen esther', 'for such a time as this', 'esther before the king', 'if i perish i perish'],
    contextWords: ['esther', 'mordecai', 'haman', 'persian', 'king', 'fasting'],
    primaryReference: { book: 'Esther', chapter: 4, verseStart: 14, reference: 'Esther 4:14' },
  },

  // JONAH
  {
    type: 'character', name: 'Jonah and the whale',
    triggers: ['jonah and the whale', 'jonah swallowed', 'big fish swallowed jonah', 'belly of the fish', 'jonah ran from god'],
    contextWords: ['whale', 'fish', 'nineveh', 'tarshish', 'ship', 'storm', 'swallowed'],
    primaryReference: { book: 'Jonah', chapter: 1, verseStart: 17, verseEnd: 17, reference: 'Jonah 1:17' },
    secondaryReferences: [
      { book: 'Jonah', chapter: 2, verseStart: 1, verseEnd: 10, reference: 'Jonah 2:1-10' },
    ],
  },

  // JOB
  {
    type: 'character', name: 'Job suffering',
    triggers: ['job suffered', 'job lost everything', 'satan tested job', 'the lord gave and the lord has taken away', 'job on the ash heap'],
    contextWords: ['suffering', 'boils', 'friends', 'patience', 'tested', 'restored', 'satan'],
    ambiguous: true,
    primaryReference: { book: 'Job', chapter: 1, verseStart: 1, verseEnd: 22, reference: 'Job 1:1-22' },
  },

  // ELISHA
  {
    type: 'character', name: 'Elisha and the Shunammite woman',
    triggers: ['shunammite woman', 'elisha raised the boy', 'elisha and the dead boy'],
    contextWords: ['shunammite', 'dead', 'boy', 'raised', 'room'],
    primaryReference: { book: '2 Kings', chapter: 4, verseStart: 8, verseEnd: 37, reference: '2 Kings 4:8-37' },
  },
  {
    type: 'character', name: 'Naaman healed of leprosy',
    triggers: ['naaman', 'naaman healed', 'dip in the jordan seven times', 'naaman the leper'],
    contextWords: ['leprosy', 'jordan', 'seven times', 'syria', 'elisha', 'healed'],
    primaryReference: { book: '2 Kings', chapter: 5, verseStart: 1, verseEnd: 14, reference: '2 Kings 5:1-14' },
  },

  // JACOB
  {
    type: 'character', name: 'Jacob wrestles with God',
    triggers: ['jacob wrestled', 'wrestling with god', 'peniel', 'i will not let you go unless you bless me'],
    contextWords: ['wrestled', 'angel', 'hip', 'bless', 'israel', 'peniel'],
    ambiguous: true,
    primaryReference: { book: 'Genesis', chapter: 32, verseStart: 22, verseEnd: 32, reference: 'Genesis 32:22-32' },
  },
  {
    type: 'character', name: 'Jacobs ladder',
    triggers: ['jacobs ladder', 'stairway to heaven', 'angels ascending and descending', 'jacob dreamed'],
    contextWords: ['ladder', 'angels', 'bethel', 'dream', 'heaven'],
    ambiguous: true,
    primaryReference: { book: 'Genesis', chapter: 28, verseStart: 10, verseEnd: 22, reference: 'Genesis 28:10-22' },
  },

  // ═══════════════════════════════════════════════════════
  // CHARACTERS — New Testament
  // ═══════════════════════════════════════════════════════

  // JESUS events
  {
    type: 'character', name: 'Jesus born in Bethlehem',
    triggers: ['born in bethlehem', 'no room in the inn', 'manger', 'baby jesus', 'christmas story', 'shepherds and angels', 'wise men visited'],
    contextWords: ['bethlehem', 'manger', 'inn', 'shepherds', 'star', 'mary', 'joseph'],
    primaryReference: { book: 'Luke', chapter: 2, verseStart: 1, verseEnd: 20, reference: 'Luke 2:1-20' },
  },
  {
    type: 'character', name: 'Jesus tempted in the wilderness',
    triggers: ['jesus tempted', 'temptation in the wilderness', 'forty days in the desert', 'satan tempted jesus', 'it is written'],
    contextWords: ['wilderness', 'desert', 'forty days', 'satan', 'devil', 'fasting', 'stones to bread'],
    primaryReference: { book: 'Matthew', chapter: 4, verseStart: 1, verseEnd: 11, reference: 'Matthew 4:1-11' },
  },
  {
    type: 'character', name: 'Jesus walks on water',
    triggers: ['walked on water', 'jesus walked on the sea', 'peter walked on water', 'walking on the water'],
    contextWords: ['water', 'storm', 'boat', 'peter', 'sea', 'galilee', 'waves', 'sinking'],
    primaryReference: { book: 'Matthew', chapter: 14, verseStart: 22, verseEnd: 33, reference: 'Matthew 14:22-33' },
  },
  {
    type: 'character', name: 'Jesus feeds the 5000',
    triggers: ['feeding of the five thousand', 'fed five thousand', 'five loaves and two fish', 'loaves and fishes', 'multiplied the bread'],
    contextWords: ['loaves', 'fish', 'baskets', 'five thousand', 'boy', 'multiply'],
    primaryReference: { book: 'John', chapter: 6, verseStart: 1, verseEnd: 14, reference: 'John 6:1-14' },
  },
  {
    type: 'character', name: 'Jesus calms the storm',
    triggers: ['jesus calmed the storm', 'peace be still', 'rebuked the wind', 'why are you afraid'],
    contextWords: ['storm', 'boat', 'wind', 'waves', 'peace', 'afraid', 'sleeping'],
    primaryReference: { book: 'Mark', chapter: 4, verseStart: 35, verseEnd: 41, reference: 'Mark 4:35-41' },
  },
  {
    type: 'character', name: 'Jesus at the Wedding in Cana',
    triggers: ['wedding at cana', 'water into wine', 'first miracle', 'cana of galilee'],
    contextWords: ['wedding', 'cana', 'wine', 'water', 'miracle', 'mother'],
    primaryReference: { book: 'John', chapter: 2, verseStart: 1, verseEnd: 11, reference: 'John 2:1-11' },
  },
  {
    type: 'character', name: 'Transfiguration of Jesus',
    triggers: ['transfiguration', 'jesus transfigured', 'face shone like the sun', 'moses and elijah appeared'],
    contextWords: ['mountain', 'shone', 'moses', 'elijah', 'cloud', 'voice', 'peter', 'tabernacle'],
    primaryReference: { book: 'Matthew', chapter: 17, verseStart: 1, verseEnd: 9, reference: 'Matthew 17:1-9' },
  },
  {
    type: 'character', name: 'Jesus raises Lazarus',
    triggers: ['lazarus raised', 'lazarus come forth', 'jesus wept', 'raising of lazarus', 'lazarus was dead four days'],
    contextWords: ['lazarus', 'tomb', 'dead', 'four days', 'mary', 'martha', 'bethany', 'wept'],
    primaryReference: { book: 'John', chapter: 11, verseStart: 1, verseEnd: 44, reference: 'John 11:1-44' },
  },
  {
    type: 'character', name: 'Jesus in Gethsemane',
    triggers: ['garden of gethsemane', 'gethsemane', 'not my will but yours', 'let this cup pass', 'sweat like blood'],
    contextWords: ['garden', 'prayer', 'cup', 'will', 'sweat', 'blood', 'disciples', 'sleeping'],
    primaryReference: { book: 'Matthew', chapter: 26, verseStart: 36, verseEnd: 46, reference: 'Matthew 26:36-46' },
  },
  {
    type: 'character', name: 'Crucifixion of Jesus',
    triggers: ['crucifixion', 'jesus crucified', 'cross of calvary', 'it is finished', 'father forgive them', 'golgotha'],
    contextWords: ['cross', 'crucified', 'calvary', 'golgotha', 'nails', 'finished', 'forgive', 'thief'],
    primaryReference: { book: 'John', chapter: 19, verseStart: 17, verseEnd: 30, reference: 'John 19:17-30' },
  },
  {
    type: 'character', name: 'Resurrection of Jesus',
    triggers: ['he is risen', 'resurrection morning', 'tomb was empty', 'rolled away the stone', 'risen from the dead'],
    contextWords: ['risen', 'tomb', 'empty', 'stone', 'angel', 'resurrection', 'sunday', 'morning'],
    primaryReference: { book: 'Matthew', chapter: 28, verseStart: 1, verseEnd: 10, reference: 'Matthew 28:1-10' },
  },
  {
    type: 'character', name: 'Jesus ascension',
    triggers: ['jesus ascended', 'taken up into heaven', 'ascension', 'a cloud received him'],
    contextWords: ['ascended', 'heaven', 'cloud', 'mount of olives', 'angels'],
    primaryReference: { book: 'Acts', chapter: 1, verseStart: 9, verseEnd: 11, reference: 'Acts 1:9-11' },
  },

  // PAUL
  {
    type: 'character', name: 'Paul on the road to Damascus',
    triggers: ['road to damascus', 'saul to paul', 'saul converted', 'scales fell from his eyes', 'why do you persecute me', 'blinding light'],
    contextWords: ['damascus', 'blind', 'light', 'ananias', 'saul', 'persecute', 'converted'],
    primaryReference: { book: 'Acts', chapter: 9, verseStart: 1, verseEnd: 19, reference: 'Acts 9:1-19' },
  },
  {
    type: 'character', name: 'Paul and Silas in prison',
    triggers: ['paul and silas', 'singing in prison', 'midnight praise', 'earthquake opened the prison', 'philippian jailer'],
    contextWords: ['prison', 'singing', 'earthquake', 'jailer', 'chains', 'midnight', 'philippian'],
    primaryReference: { book: 'Acts', chapter: 16, verseStart: 25, verseEnd: 34, reference: 'Acts 16:25-34' },
  },
  {
    type: 'character', name: 'Paul shipwrecked',
    triggers: ['paul shipwrecked', 'shipwreck on malta', 'paul on the island', 'snake bit paul'],
    contextWords: ['shipwreck', 'malta', 'storm', 'island', 'snake', 'viper'],
    primaryReference: { book: 'Acts', chapter: 27, verseStart: 1, verseEnd: 44, reference: 'Acts 27:1-44' },
  },
  {
    type: 'character', name: 'Paul thorn in the flesh',
    triggers: ['thorn in the flesh', 'my grace is sufficient', 'power made perfect in weakness', 'pauls thorn'],
    contextWords: ['thorn', 'weakness', 'grace', 'sufficient', 'strength', 'boast'],
    primaryReference: { book: '2 Corinthians', chapter: 12, verseStart: 7, verseEnd: 10, reference: '2 Corinthians 12:7-10' },
  },

  // PETER
  {
    type: 'character', name: 'Peter denies Jesus',
    triggers: ['peter denied jesus', 'peter denied him three times', 'rooster crowed', 'before the rooster crows', 'i dont know the man'],
    contextWords: ['denied', 'three times', 'rooster', 'cock', 'wept', 'courtyard'],
    primaryReference: { book: 'Matthew', chapter: 26, verseStart: 69, verseEnd: 75, reference: 'Matthew 26:69-75' },
  },
  {
    type: 'character', name: 'Peter at Pentecost',
    triggers: ['peter preached at pentecost', 'day of pentecost', 'tongues of fire', 'three thousand saved', 'they were all filled'],
    contextWords: ['pentecost', 'tongues', 'fire', 'spirit', 'three thousand', 'peter'],
    primaryReference: { book: 'Acts', chapter: 2, verseStart: 1, verseEnd: 41, reference: 'Acts 2:1-41' },
  },

  // CORNELIUS
  {
    type: 'character', name: 'Cornelius the Centurion',
    triggers: ['cornelius', 'cornelius the centurion', 'centurion cornelius', 'first gentile convert'],
    contextWords: ['centurion', 'gentile', 'peter', 'vision', 'sheet', 'caesarea', 'italian'],
    primaryReference: { book: 'Acts', chapter: 10, verseStart: 1, verseEnd: 48, reference: 'Acts 10:1-48' },
  },

  // NICODEMUS
  {
    type: 'character', name: 'Nicodemus visits Jesus',
    triggers: ['nicodemus', 'born again', 'nicodemus came at night', 'you must be born again'],
    contextWords: ['night', 'pharisee', 'born again', 'spirit', 'wind'],
    primaryReference: { book: 'John', chapter: 3, verseStart: 1, verseEnd: 21, reference: 'John 3:1-21' },
  },

  // ZACCHAEUS
  {
    type: 'character', name: 'Zacchaeus the tax collector',
    triggers: ['zacchaeus', 'zaccheus', 'wee little man', 'climbed the sycamore tree', 'come down zacchaeus'],
    contextWords: ['tree', 'sycamore', 'tax collector', 'short', 'jericho'],
    primaryReference: { book: 'Luke', chapter: 19, verseStart: 1, verseEnd: 10, reference: 'Luke 19:1-10' },
  },

  // THOMAS
  {
    type: 'character', name: 'Doubting Thomas',
    triggers: ['doubting thomas', 'thomas doubted', 'put my finger', 'unless i see the nail marks', 'my lord and my god'],
    contextWords: ['thomas', 'doubt', 'nail', 'side', 'believe', 'see'],
    primaryReference: { book: 'John', chapter: 20, verseStart: 24, verseEnd: 29, reference: 'John 20:24-29' },
  },

  // MARY MAGDALENE
  {
    type: 'character', name: 'Mary Magdalene at the tomb',
    triggers: ['mary magdalene', 'mary at the tomb', 'she saw the risen lord', 'rabboni'],
    contextWords: ['tomb', 'risen', 'rabboni', 'garden', 'weeping', 'angels'],
    primaryReference: { book: 'John', chapter: 20, verseStart: 1, verseEnd: 18, reference: 'John 20:1-18' },
  },

  // WOMAN AT THE WELL
  {
    type: 'character', name: 'Woman at the well',
    triggers: ['woman at the well', 'samaritan woman', 'living water', 'give me this water', 'you have had five husbands'],
    contextWords: ['well', 'samaritan', 'water', 'jacob', 'sychar', 'husbands', 'worship'],
    primaryReference: { book: 'John', chapter: 4, verseStart: 1, verseEnd: 42, reference: 'John 4:1-42' },
  },

  // ═══════════════════════════════════════════════════════
  // STORIES / PARABLES
  // ═══════════════════════════════════════════════════════

  {
    type: 'story', name: 'The Prodigal Son',
    triggers: ['prodigal son', 'prodigal', 'younger son who left', 'the lost son', 'father ran to meet him', 'came to his senses', 'he squandered his wealth'],
    contextWords: ['father', 'son', 'pigs', 'inheritance', 'ring', 'robe', 'fatted calf', 'elder brother'],
    primaryReference: { book: 'Luke', chapter: 15, verseStart: 11, verseEnd: 32, reference: 'Luke 15:11-32' },
  },
  {
    type: 'story', name: 'The Good Samaritan',
    triggers: ['good samaritan', 'samaritan helped', 'who is my neighbor', 'fell among thieves', 'priest passed by', 'levite passed by'],
    contextWords: ['samaritan', 'neighbor', 'jericho', 'robbers', 'priest', 'levite', 'inn', 'oil', 'wine'],
    primaryReference: { book: 'Luke', chapter: 10, verseStart: 25, verseEnd: 37, reference: 'Luke 10:25-37' },
  },
  {
    type: 'story', name: 'The Sower and the Seed',
    triggers: ['sower and the seed', 'parable of the sower', 'seed fell on rocky ground', 'seed among thorns', 'good soil'],
    contextWords: ['sower', 'seed', 'soil', 'rocky', 'thorns', 'path', 'birds', 'harvest', 'hundredfold'],
    primaryReference: { book: 'Matthew', chapter: 13, verseStart: 1, verseEnd: 23, reference: 'Matthew 13:1-23' },
  },
  {
    type: 'story', name: 'The Lost Sheep',
    triggers: ['lost sheep', 'ninety nine', 'leaving the ninety-nine', 'one lost sheep', 'goes after the one'],
    contextWords: ['sheep', 'shepherd', 'lost', 'found', 'rejoice', 'hundred'],
    primaryReference: { book: 'Luke', chapter: 15, verseStart: 1, verseEnd: 7, reference: 'Luke 15:1-7' },
  },
  {
    type: 'story', name: 'The Talents',
    triggers: ['parable of the talents', 'five talents', 'one talent', 'buried his talent', 'well done good and faithful'],
    contextWords: ['talents', 'master', 'servant', 'buried', 'faithful', 'invest'],
    primaryReference: { book: 'Matthew', chapter: 25, verseStart: 14, verseEnd: 30, reference: 'Matthew 25:14-30' },
  },
  {
    type: 'story', name: 'The Ten Virgins',
    triggers: ['ten virgins', 'wise and foolish virgins', 'lamps went out', 'bridegroom came', 'oil in their lamps'],
    contextWords: ['virgins', 'oil', 'lamps', 'bridegroom', 'midnight', 'wise', 'foolish'],
    primaryReference: { book: 'Matthew', chapter: 25, verseStart: 1, verseEnd: 13, reference: 'Matthew 25:1-13' },
  },
  {
    type: 'story', name: 'The Rich Man and Lazarus',
    triggers: ['rich man and lazarus', 'lazarus at the gate', 'great gulf fixed', 'abrahams bosom', 'drop of water on my tongue'],
    contextWords: ['rich', 'poor', 'gate', 'dogs', 'flames', 'torment', 'abraham'],
    primaryReference: { book: 'Luke', chapter: 16, verseStart: 19, verseEnd: 31, reference: 'Luke 16:19-31' },
  },
  {
    type: 'story', name: 'The Mustard Seed',
    triggers: ['mustard seed', 'smallest of all seeds', 'faith like a mustard seed'],
    contextWords: ['mustard', 'seed', 'faith', 'tree', 'birds', 'small'],
    primaryReference: { book: 'Matthew', chapter: 13, verseStart: 31, verseEnd: 32, reference: 'Matthew 13:31-32' },
  },
  {
    type: 'story', name: 'The Wheat and the Tares',
    triggers: ['wheat and tares', 'wheat and weeds', 'let both grow together', 'enemy sowed tares'],
    contextWords: ['wheat', 'tares', 'weeds', 'harvest', 'enemy', 'field'],
    primaryReference: { book: 'Matthew', chapter: 13, verseStart: 24, verseEnd: 30, reference: 'Matthew 13:24-30' },
  },
  {
    type: 'story', name: 'The Pharisee and the Tax Collector',
    triggers: ['pharisee and the tax collector', 'pharisee and publican', 'god be merciful to me a sinner', 'went home justified'],
    contextWords: ['pharisee', 'tax collector', 'publican', 'temple', 'prayer', 'humble'],
    primaryReference: { book: 'Luke', chapter: 18, verseStart: 9, verseEnd: 14, reference: 'Luke 18:9-14' },
  },
  {
    type: 'story', name: 'The Wise and Foolish Builders',
    triggers: ['wise man built his house', 'house on the rock', 'house on the sand', 'foolish builder'],
    contextWords: ['rock', 'sand', 'house', 'rain', 'flood', 'wind', 'fell', 'stood'],
    primaryReference: { book: 'Matthew', chapter: 7, verseStart: 24, verseEnd: 27, reference: 'Matthew 7:24-27' },
  },
  {
    type: 'story', name: 'The Unforgiving Servant',
    triggers: ['unforgiving servant', 'forgive seventy times seven', 'ten thousand talents', 'servant who would not forgive'],
    contextWords: ['forgive', 'debt', 'servant', 'master', 'mercy', 'prison'],
    primaryReference: { book: 'Matthew', chapter: 18, verseStart: 21, verseEnd: 35, reference: 'Matthew 18:21-35' },
  },
  {
    type: 'story', name: 'Sheep and Goats judgment',
    triggers: ['sheep and goats', 'when did we see you hungry', 'the least of these', 'whatever you did for the least'],
    contextWords: ['sheep', 'goats', 'hungry', 'thirsty', 'stranger', 'naked', 'sick', 'prison', 'judgment'],
    primaryReference: { book: 'Matthew', chapter: 25, verseStart: 31, verseEnd: 46, reference: 'Matthew 25:31-46' },
  },

  // ═══════════════════════════════════════════════════════
  // PLACES
  // ═══════════════════════════════════════════════════════

  {
    type: 'place', name: 'Garden of Eden',
    triggers: ['garden of eden', 'adam and eve', 'tree of knowledge', 'tree of life', 'forbidden fruit', 'serpent in the garden'],
    contextWords: ['eden', 'adam', 'eve', 'serpent', 'fruit', 'sin', 'fall', 'naked'],
    primaryReference: { book: 'Genesis', chapter: 3, verseStart: 1, verseEnd: 24, reference: 'Genesis 3:1-24' },
  },
  {
    type: 'place', name: 'Tower of Babel',
    triggers: ['tower of babel', 'babel', 'confused their language', 'let us build a tower'],
    contextWords: ['tower', 'language', 'confused', 'scattered', 'heaven'],
    primaryReference: { book: 'Genesis', chapter: 11, verseStart: 1, verseEnd: 9, reference: 'Genesis 11:1-9' },
  },
  {
    type: 'place', name: 'Valley of Dry Bones',
    triggers: ['valley of dry bones', 'dry bones', 'can these bones live', 'bones came together'],
    contextWords: ['bones', 'valley', 'ezekiel', 'breath', 'army', 'live', 'spirit'],
    primaryReference: { book: 'Ezekiel', chapter: 37, verseStart: 1, verseEnd: 14, reference: 'Ezekiel 37:1-14' },
  },
  {
    type: 'place', name: 'Upper Room',
    triggers: ['upper room', 'last supper', 'this is my body', 'this is my blood', 'new covenant in my blood'],
    contextWords: ['upper room', 'supper', 'bread', 'wine', 'body', 'blood', 'covenant', 'communion'],
    primaryReference: { book: 'Luke', chapter: 22, verseStart: 14, verseEnd: 23, reference: 'Luke 22:14-23' },
  },

  // ═══════════════════════════════════════════════════════
  // CONCEPTS / DOCTRINES
  // ═══════════════════════════════════════════════════════

  {
    type: 'concept', name: 'Armor of God',
    triggers: ['armor of god', 'full armor', 'put on the whole armor', 'belt of truth', 'breastplate of righteousness', 'shield of faith', 'sword of the spirit', 'helmet of salvation'],
    contextWords: ['armor', 'belt', 'breastplate', 'shield', 'sword', 'helmet', 'stand', 'wrestle', 'principalities'],
    primaryReference: { book: 'Ephesians', chapter: 6, verseStart: 10, verseEnd: 18, reference: 'Ephesians 6:10-18' },
  },
  {
    type: 'concept', name: 'Fruit of the Spirit',
    triggers: ['fruit of the spirit', 'love joy peace', 'love joy peace patience', 'patience kindness goodness'],
    contextWords: ['fruit', 'spirit', 'love', 'joy', 'peace', 'patience', 'kindness', 'goodness', 'faithfulness', 'gentleness', 'self-control'],
    primaryReference: { book: 'Galatians', chapter: 5, verseStart: 22, verseEnd: 23, reference: 'Galatians 5:22-23' },
  },
  {
    type: 'concept', name: 'Beatitudes',
    triggers: ['beatitudes', 'blessed are the poor in spirit', 'blessed are those who mourn', 'sermon on the mount', 'blessed are the meek'],
    contextWords: ['blessed', 'poor', 'mourn', 'meek', 'merciful', 'peacemakers', 'persecuted'],
    primaryReference: { book: 'Matthew', chapter: 5, verseStart: 3, verseEnd: 12, reference: 'Matthew 5:3-12' },
  },
  {
    type: 'concept', name: 'Lords Prayer',
    triggers: ['lords prayer', 'our father who art in heaven', 'our father in heaven', 'hallowed be thy name', 'thy kingdom come', 'give us this day our daily bread'],
    contextWords: ['prayer', 'father', 'heaven', 'hallowed', 'kingdom', 'bread', 'forgive', 'temptation'],
    primaryReference: { book: 'Matthew', chapter: 6, verseStart: 9, verseEnd: 13, reference: 'Matthew 6:9-13' },
  },
  {
    type: 'concept', name: 'Great Commission',
    triggers: ['great commission', 'go and make disciples', 'go ye into all the world', 'baptizing them in the name', 'teaching them to observe'],
    contextWords: ['nations', 'disciples', 'baptize', 'teach', 'go', 'commission'],
    primaryReference: { book: 'Matthew', chapter: 28, verseStart: 18, verseEnd: 20, reference: 'Matthew 28:18-20' },
  },
  {
    type: 'concept', name: 'Love chapter',
    triggers: ['love is patient', 'love is kind', 'love never fails', 'greatest of these is love', 'love chapter'],
    contextWords: ['patient', 'kind', 'envy', 'boast', 'proud', 'fails', 'faith', 'hope', 'love'],
    primaryReference: { book: '1 Corinthians', chapter: 13, verseStart: 4, verseEnd: 8, reference: '1 Corinthians 13:4-8' },
  },
  {
    type: 'concept', name: 'Born Again',
    triggers: ['born again', 'you must be born again', 'born of water and spirit', 'born from above'],
    contextWords: ['born', 'again', 'spirit', 'water', 'flesh', 'nicodemus'],
    primaryReference: { book: 'John', chapter: 3, verseStart: 3, verseEnd: 7, reference: 'John 3:3-7' },
  },
  {
    type: 'concept', name: 'I Am the Way',
    triggers: ['i am the way', 'the way the truth and the life', 'no one comes to the father except through me'],
    contextWords: ['way', 'truth', 'life', 'father', 'jesus'],
    primaryReference: { book: 'John', chapter: 14, verseStart: 6, reference: 'John 14:6' },
  },
  {
    type: 'concept', name: 'I Am the Good Shepherd',
    triggers: ['i am the good shepherd', 'good shepherd lays down his life', 'my sheep hear my voice'],
    contextWords: ['shepherd', 'sheep', 'voice', 'life', 'know'],
    primaryReference: { book: 'John', chapter: 10, verseStart: 11, verseEnd: 14, reference: 'John 10:11-14' },
  },
  {
    type: 'concept', name: 'I Am the Vine',
    triggers: ['i am the vine', 'you are the branches', 'abide in me', 'apart from me you can do nothing'],
    contextWords: ['vine', 'branches', 'abide', 'fruit', 'pruning'],
    primaryReference: { book: 'John', chapter: 15, verseStart: 1, verseEnd: 8, reference: 'John 15:1-8' },
  },
  {
    type: 'concept', name: 'I Am the Bread of Life',
    triggers: ['i am the bread of life', 'bread of life', 'whoever comes to me shall not hunger'],
    contextWords: ['bread', 'life', 'hunger', 'thirst', 'manna'],
    primaryReference: { book: 'John', chapter: 6, verseStart: 35, reference: 'John 6:35' },
  },
  {
    type: 'concept', name: 'I Am the Light of the World',
    triggers: ['i am the light of the world', 'light of the world', 'walk in darkness'],
    contextWords: ['light', 'world', 'darkness', 'follow'],
    primaryReference: { book: 'John', chapter: 8, verseStart: 12, reference: 'John 8:12' },
  },
  {
    type: 'concept', name: 'I Am the Door',
    triggers: ['i am the door', 'i am the gate', 'enter through me', 'the gate for the sheep'],
    contextWords: ['door', 'gate', 'sheep', 'enter', 'saved'],
    primaryReference: { book: 'John', chapter: 10, verseStart: 9, reference: 'John 10:9' },
  },
  {
    type: 'concept', name: 'I Am the Resurrection and the Life',
    triggers: ['i am the resurrection', 'resurrection and the life', 'whoever believes in me will live'],
    contextWords: ['resurrection', 'life', 'believe', 'die', 'live', 'lazarus'],
    primaryReference: { book: 'John', chapter: 11, verseStart: 25, verseEnd: 26, reference: 'John 11:25-26' },
  },
  {
    type: 'concept', name: 'Faith of Abraham',
    triggers: ['faith of abraham', 'abraham believed god', 'counted as righteousness', 'father of faith'],
    contextWords: ['abraham', 'faith', 'believed', 'righteousness', 'promise', 'stars'],
    primaryReference: { book: 'Genesis', chapter: 15, verseStart: 6, reference: 'Genesis 15:6' },
    secondaryReferences: [
      { book: 'Romans', chapter: 4, verseStart: 3, reference: 'Romans 4:3' },
    ],
  },
  {
    type: 'concept', name: 'New Creation in Christ',
    triggers: ['new creation', 'new creature', 'old things passed away', 'all things become new', 'if anyone is in christ'],
    contextWords: ['new', 'creation', 'old', 'passed', 'christ'],
    primaryReference: { book: '2 Corinthians', chapter: 5, verseStart: 17, reference: '2 Corinthians 5:17' },
  },
  {
    type: 'concept', name: 'The Good Fight of Faith',
    triggers: ['fight the good fight', 'good fight of faith', 'finished the race', 'kept the faith', 'crown of righteousness'],
    contextWords: ['fight', 'faith', 'race', 'crown', 'course', 'finished'],
    primaryReference: { book: '2 Timothy', chapter: 4, verseStart: 7, verseEnd: 8, reference: '2 Timothy 4:7-8' },
  },
  {
    type: 'concept', name: 'Faith Hall of Fame',
    triggers: ['by faith abraham', 'by faith moses', 'cloud of witnesses', 'hall of faith', 'faith chapter'],
    contextWords: ['faith', 'abel', 'enoch', 'noah', 'abraham', 'moses', 'rahab', 'heroes'],
    primaryReference: { book: 'Hebrews', chapter: 11, verseStart: 1, verseEnd: 40, reference: 'Hebrews 11:1-40' },
  },
  {
    type: 'concept', name: 'Do not worry',
    triggers: ['do not worry', 'do not be anxious', 'consider the lilies', 'birds of the air', 'seek first the kingdom'],
    contextWords: ['worry', 'anxious', 'lilies', 'birds', 'tomorrow', 'food', 'clothing', 'kingdom'],
    primaryReference: { book: 'Matthew', chapter: 6, verseStart: 25, verseEnd: 34, reference: 'Matthew 6:25-34' },
  },
  {
    type: 'concept', name: 'The Greatest Commandment',
    triggers: ['greatest commandment', 'love the lord your god with all your heart', 'love your neighbor as yourself'],
    contextWords: ['greatest', 'commandment', 'love', 'heart', 'soul', 'mind', 'neighbor'],
    primaryReference: { book: 'Matthew', chapter: 22, verseStart: 37, verseEnd: 39, reference: 'Matthew 22:37-39' },
  },
  {
    type: 'concept', name: 'The Golden Rule',
    triggers: ['do unto others', 'golden rule', 'as you would have them do unto you', 'treat others'],
    contextWords: ['others', 'treat', 'do', 'unto'],
    primaryReference: { book: 'Matthew', chapter: 7, verseStart: 12, reference: 'Matthew 7:12' },
  },
];
