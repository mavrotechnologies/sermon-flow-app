/**
 * Script to generate a comprehensive Bible verse dataset
 * Run with: node scripts/generate-full-bible.js
 */

const fs = require('fs');
const path = require('path');

// Comprehensive list of commonly preached Bible verses
const verses = [
  // GENESIS
  { book: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth." },
  { book: "Genesis", chapter: 1, verse: 26, text: "And God said, Let us make man in our image, after our likeness." },
  { book: "Genesis", chapter: 1, verse: 27, text: "So God created man in his own image, in the image of God created he him; male and female created he them." },
  { book: "Genesis", chapter: 1, verse: 28, text: "And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it." },
  { book: "Genesis", chapter: 2, verse: 24, text: "Therefore shall a man leave his father and his mother, and shall cleave unto his wife: and they shall be one flesh." },
  { book: "Genesis", chapter: 3, verse: 15, text: "And I will put enmity between thee and the woman, and between thy seed and her seed; it shall bruise thy head, and thou shalt bruise his heel." },
  { book: "Genesis", chapter: 12, verse: 1, text: "Now the LORD had said unto Abram, Get thee out of thy country, and from thy kindred, and from thy father's house, unto a land that I will shew thee." },
  { book: "Genesis", chapter: 12, verse: 2, text: "And I will make of thee a great nation, and I will bless thee, and make thy name great; and thou shalt be a blessing." },
  { book: "Genesis", chapter: 22, verse: 14, text: "And Abraham called the name of that place Jehovahjireh: as it is said to this day, In the mount of the LORD it shall be seen." },
  { book: "Genesis", chapter: 28, verse: 15, text: "And, behold, I am with thee, and will keep thee in all places whither thou goest, and will bring thee again into this land." },
  { book: "Genesis", chapter: 50, verse: 20, text: "But as for you, ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive." },

  // EXODUS
  { book: "Exodus", chapter: 3, verse: 14, text: "And God said unto Moses, I AM THAT I AM: and he said, Thus shalt thou say unto the children of Israel, I AM hath sent me unto you." },
  { book: "Exodus", chapter: 14, verse: 14, text: "The LORD shall fight for you, and ye shall hold your peace." },
  { book: "Exodus", chapter: 15, verse: 26, text: "I am the LORD that healeth thee." },
  { book: "Exodus", chapter: 20, verse: 3, text: "Thou shalt have no other gods before me." },
  { book: "Exodus", chapter: 23, verse: 25, text: "And ye shall serve the LORD your God, and he shall bless thy bread, and thy water; and I will take sickness away from the midst of thee." },

  // LEVITICUS
  { book: "Leviticus", chapter: 19, verse: 18, text: "Thou shalt love thy neighbour as thyself: I am the LORD." },

  // NUMBERS
  { book: "Numbers", chapter: 6, verse: 24, text: "The LORD bless thee, and keep thee." },
  { book: "Numbers", chapter: 6, verse: 25, text: "The LORD make his face shine upon thee, and be gracious unto thee." },
  { book: "Numbers", chapter: 6, verse: 26, text: "The LORD lift up his countenance upon thee, and give thee peace." },
  { book: "Numbers", chapter: 23, verse: 19, text: "God is not a man, that he should lie; neither the son of man, that he should repent: hath he said, and shall he not do it? or hath he spoken, and shall he not make it good?" },

  // DEUTERONOMY
  { book: "Deuteronomy", chapter: 6, verse: 4, text: "Hear, O Israel: The LORD our God is one LORD." },
  { book: "Deuteronomy", chapter: 6, verse: 5, text: "And thou shalt love the LORD thy God with all thine heart, and with all thy soul, and with all thy might." },
  { book: "Deuteronomy", chapter: 8, verse: 18, text: "But thou shalt remember the LORD thy God: for it is he that giveth thee power to get wealth." },
  { book: "Deuteronomy", chapter: 28, verse: 1, text: "And it shall come to pass, if thou shalt hearken diligently unto the voice of the LORD thy God, to observe and to do all his commandments which I command thee this day, that the LORD thy God will set thee on high above all nations of the earth." },
  { book: "Deuteronomy", chapter: 28, verse: 13, text: "And the LORD shall make thee the head, and not the tail; and thou shalt be above only, and thou shalt not be beneath." },
  { book: "Deuteronomy", chapter: 31, verse: 6, text: "Be strong and of a good courage, fear not, nor be afraid of them: for the LORD thy God, he it is that doth go with thee; he will not fail thee, nor forsake thee." },
  { book: "Deuteronomy", chapter: 31, verse: 8, text: "And the LORD, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear not, neither be dismayed." },

  // JOSHUA
  { book: "Joshua", chapter: 1, verse: 8, text: "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success." },
  { book: "Joshua", chapter: 1, verse: 9, text: "Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest." },
  { book: "Joshua", chapter: 24, verse: 15, text: "Choose you this day whom ye will serve; but as for me and my house, we will serve the LORD." },

  // 1 SAMUEL
  { book: "1 Samuel", chapter: 15, verse: 22, text: "Behold, to obey is better than sacrifice, and to hearken than the fat of rams." },
  { book: "1 Samuel", chapter: 16, verse: 7, text: "For the LORD seeth not as man seeth; for man looketh on the outward appearance, but the LORD looketh on the heart." },
  { book: "1 Samuel", chapter: 17, verse: 47, text: "And all this assembly shall know that the LORD saveth not with sword and spear: for the battle is the LORD's, and he will give you into our hands." },

  // 2 SAMUEL
  { book: "2 Samuel", chapter: 22, verse: 31, text: "As for God, his way is perfect; the word of the LORD is tried: he is a buckler to all them that trust in him." },

  // 1 KINGS
  { book: "1 Kings", chapter: 8, verse: 56, text: "There hath not failed one word of all his good promise, which he promised by the hand of Moses his servant." },
  { book: "1 Kings", chapter: 18, verse: 21, text: "How long halt ye between two opinions? if the LORD be God, follow him." },

  // 2 CHRONICLES
  { book: "2 Chronicles", chapter: 7, verse: 14, text: "If my people, which are called by my name, shall humble themselves, and pray, and seek my face, and turn from their wicked ways; then will I hear from heaven, and will forgive their sin, and will heal their land." },
  { book: "2 Chronicles", chapter: 20, verse: 15, text: "Be not afraid nor dismayed by reason of this great multitude; for the battle is not yours, but God's." },
  { book: "2 Chronicles", chapter: 20, verse: 17, text: "Ye shall not need to fight in this battle: set yourselves, stand ye still, and see the salvation of the LORD with you." },

  // NEHEMIAH
  { book: "Nehemiah", chapter: 8, verse: 10, text: "The joy of the LORD is your strength." },

  // JOB
  { book: "Job", chapter: 13, verse: 15, text: "Though he slay me, yet will I trust in him." },
  { book: "Job", chapter: 19, verse: 25, text: "For I know that my redeemer liveth, and that he shall stand at the latter day upon the earth." },
  { book: "Job", chapter: 42, verse: 10, text: "And the LORD turned the captivity of Job, when he prayed for his friends: also the LORD gave Job twice as much as he had before." },

  // PSALMS (expanded)
  { book: "Psalms", chapter: 1, verse: 1, text: "Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful." },
  { book: "Psalms", chapter: 1, verse: 2, text: "But his delight is in the law of the LORD; and in his law doth he meditate day and night." },
  { book: "Psalms", chapter: 1, verse: 3, text: "And he shall be like a tree planted by the rivers of water, that bringeth forth his fruit in his season; his leaf also shall not wither; and whatsoever he doeth shall prosper." },
  { book: "Psalms", chapter: 8, verse: 4, text: "What is man, that thou art mindful of him? and the son of man, that thou visitest him?" },
  { book: "Psalms", chapter: 16, verse: 11, text: "Thou wilt shew me the path of life: in thy presence is fulness of joy; at thy right hand there are pleasures for evermore." },
  { book: "Psalms", chapter: 18, verse: 2, text: "The LORD is my rock, and my fortress, and my deliverer; my God, my strength, in whom I will trust; my buckler, and the horn of my salvation, and my high tower." },
  { book: "Psalms", chapter: 19, verse: 1, text: "The heavens declare the glory of God; and the firmament sheweth his handywork." },
  { book: "Psalms", chapter: 19, verse: 14, text: "Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD, my strength, and my redeemer." },
  { book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want." },
  { book: "Psalms", chapter: 23, verse: 2, text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters." },
  { book: "Psalms", chapter: 23, verse: 3, text: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake." },
  { book: "Psalms", chapter: 23, verse: 4, text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me." },
  { book: "Psalms", chapter: 23, verse: 5, text: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over." },
  { book: "Psalms", chapter: 23, verse: 6, text: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever." },
  { book: "Psalms", chapter: 24, verse: 1, text: "The earth is the LORD's, and the fulness thereof; the world, and they that dwell therein." },
  { book: "Psalms", chapter: 27, verse: 1, text: "The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?" },
  { book: "Psalms", chapter: 27, verse: 4, text: "One thing have I desired of the LORD, that will I seek after; that I may dwell in the house of the LORD all the days of my life, to behold the beauty of the LORD, and to enquire in his temple." },
  { book: "Psalms", chapter: 27, verse: 14, text: "Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD." },
  { book: "Psalms", chapter: 30, verse: 5, text: "Weeping may endure for a night, but joy cometh in the morning." },
  { book: "Psalms", chapter: 31, verse: 15, text: "My times are in thy hand: deliver me from the hand of mine enemies, and from them that persecute me." },
  { book: "Psalms", chapter: 32, verse: 8, text: "I will instruct thee and teach thee in the way which thou shalt go: I will guide thee with mine eye." },
  { book: "Psalms", chapter: 34, verse: 1, text: "I will bless the LORD at all times: his praise shall continually be in my mouth." },
  { book: "Psalms", chapter: 34, verse: 7, text: "The angel of the LORD encampeth round about them that fear him, and delivereth them." },
  { book: "Psalms", chapter: 34, verse: 8, text: "O taste and see that the LORD is good: blessed is the man that trusteth in him." },
  { book: "Psalms", chapter: 34, verse: 17, text: "The righteous cry, and the LORD heareth, and delivereth them out of all their troubles." },
  { book: "Psalms", chapter: 34, verse: 18, text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit." },
  { book: "Psalms", chapter: 37, verse: 4, text: "Delight thyself also in the LORD; and he shall give thee the desires of thine heart." },
  { book: "Psalms", chapter: 37, verse: 5, text: "Commit thy way unto the LORD; trust also in him; and he shall bring it to pass." },
  { book: "Psalms", chapter: 37, verse: 23, text: "The steps of a good man are ordered by the LORD: and he delighteth in his way." },
  { book: "Psalms", chapter: 37, verse: 25, text: "I have been young, and now am old; yet have I not seen the righteous forsaken, nor his seed begging bread." },
  { book: "Psalms", chapter: 40, verse: 1, text: "I waited patiently for the LORD; and he inclined unto me, and heard my cry." },
  { book: "Psalms", chapter: 40, verse: 2, text: "He brought me up also out of an horrible pit, out of the miry clay, and set my feet upon a rock, and established my goings." },
  { book: "Psalms", chapter: 40, verse: 3, text: "And he hath put a new song in my mouth, even praise unto our God: many shall see it, and fear, and shall trust in the LORD." },
  { book: "Psalms", chapter: 42, verse: 11, text: "Why art thou cast down, O my soul? and why art thou disquieted within me? hope thou in God: for I shall yet praise him, who is the health of my countenance, and my God." },
  { book: "Psalms", chapter: 46, verse: 1, text: "God is our refuge and strength, a very present help in trouble." },
  { book: "Psalms", chapter: 46, verse: 10, text: "Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth." },
  { book: "Psalms", chapter: 51, verse: 10, text: "Create in me a clean heart, O God; and renew a right spirit within me." },
  { book: "Psalms", chapter: 51, verse: 17, text: "The sacrifices of God are a broken spirit: a broken and a contrite heart, O God, thou wilt not despise." },
  { book: "Psalms", chapter: 55, verse: 22, text: "Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved." },
  { book: "Psalms", chapter: 56, verse: 3, text: "What time I am afraid, I will trust in thee." },
  { book: "Psalms", chapter: 62, verse: 1, text: "Truly my soul waiteth upon God: from him cometh my salvation." },
  { book: "Psalms", chapter: 63, verse: 1, text: "O God, thou art my God; early will I seek thee: my soul thirsteth for thee, my flesh longeth for thee in a dry and thirsty land, where no water is." },
  { book: "Psalms", chapter: 68, verse: 19, text: "Blessed be the Lord, who daily loadeth us with benefits, even the God of our salvation." },
  { book: "Psalms", chapter: 84, verse: 11, text: "For the LORD God is a sun and shield: the LORD will give grace and glory: no good thing will he withhold from them that walk uprightly." },
  { book: "Psalms", chapter: 91, verse: 1, text: "He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty." },
  { book: "Psalms", chapter: 91, verse: 2, text: "I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust." },
  { book: "Psalms", chapter: 91, verse: 11, text: "For he shall give his angels charge over thee, to keep thee in all thy ways." },
  { book: "Psalms", chapter: 100, verse: 4, text: "Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name." },
  { book: "Psalms", chapter: 100, verse: 5, text: "For the LORD is good; his mercy is everlasting; and his truth endureth to all generations." },
  { book: "Psalms", chapter: 103, verse: 1, text: "Bless the LORD, O my soul: and all that is within me, bless his holy name." },
  { book: "Psalms", chapter: 103, verse: 2, text: "Bless the LORD, O my soul, and forget not all his benefits." },
  { book: "Psalms", chapter: 103, verse: 3, text: "Who forgiveth all thine iniquities; who healeth all thy diseases." },
  { book: "Psalms", chapter: 103, verse: 12, text: "As far as the east is from the west, so far hath he removed our transgressions from us." },
  { book: "Psalms", chapter: 107, verse: 20, text: "He sent his word, and healed them, and delivered them from their destructions." },
  { book: "Psalms", chapter: 118, verse: 6, text: "The LORD is on my side; I will not fear: what can man do unto me?" },
  { book: "Psalms", chapter: 118, verse: 17, text: "I shall not die, but live, and declare the works of the LORD." },
  { book: "Psalms", chapter: 118, verse: 24, text: "This is the day which the LORD hath made; we will rejoice and be glad in it." },
  { book: "Psalms", chapter: 119, verse: 11, text: "Thy word have I hid in mine heart, that I might not sin against thee." },
  { book: "Psalms", chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { book: "Psalms", chapter: 121, verse: 1, text: "I will lift up mine eyes unto the hills, from whence cometh my help." },
  { book: "Psalms", chapter: 121, verse: 2, text: "My help cometh from the LORD, which made heaven and earth." },
  { book: "Psalms", chapter: 126, verse: 5, text: "They that sow in tears shall reap in joy." },
  { book: "Psalms", chapter: 133, verse: 1, text: "Behold, how good and how pleasant it is for brethren to dwell together in unity!" },
  { book: "Psalms", chapter: 138, verse: 8, text: "The LORD will perfect that which concerneth me: thy mercy, O LORD, endureth for ever: forsake not the works of thine own hands." },
  { book: "Psalms", chapter: 139, verse: 14, text: "I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well." },
  { book: "Psalms", chapter: 145, verse: 18, text: "The LORD is nigh unto all them that call upon him, to all that call upon him in truth." },
  { book: "Psalms", chapter: 147, verse: 3, text: "He healeth the broken in heart, and bindeth up their wounds." },
  { book: "Psalms", chapter: 150, verse: 6, text: "Let every thing that hath breath praise the LORD. Praise ye the LORD." },

  // PROVERBS (expanded)
  { book: "Proverbs", chapter: 1, verse: 7, text: "The fear of the LORD is the beginning of knowledge: but fools despise wisdom and instruction." },
  { book: "Proverbs", chapter: 3, verse: 5, text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding." },
  { book: "Proverbs", chapter: 3, verse: 6, text: "In all thy ways acknowledge him, and he shall direct thy paths." },
  { book: "Proverbs", chapter: 3, verse: 9, text: "Honour the LORD with thy substance, and with the firstfruits of all thine increase." },
  { book: "Proverbs", chapter: 3, verse: 10, text: "So shall thy barns be filled with plenty, and thy presses shall burst out with new wine." },
  { book: "Proverbs", chapter: 4, verse: 7, text: "Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding." },
  { book: "Proverbs", chapter: 4, verse: 18, text: "But the path of the just is as the shining light, that shineth more and more unto the perfect day." },
  { book: "Proverbs", chapter: 4, verse: 23, text: "Keep thy heart with all diligence; for out of it are the issues of life." },
  { book: "Proverbs", chapter: 9, verse: 10, text: "The fear of the LORD is the beginning of wisdom: and the knowledge of the holy is understanding." },
  { book: "Proverbs", chapter: 10, verse: 22, text: "The blessing of the LORD, it maketh rich, and he addeth no sorrow with it." },
  { book: "Proverbs", chapter: 11, verse: 24, text: "There is that scattereth, and yet increaseth; and there is that withholdeth more than is meet, but it tendeth to poverty." },
  { book: "Proverbs", chapter: 11, verse: 25, text: "The liberal soul shall be made fat: and he that watereth shall be watered also himself." },
  { book: "Proverbs", chapter: 12, verse: 18, text: "There is that speaketh like the piercings of a sword: but the tongue of the wise is health." },
  { book: "Proverbs", chapter: 13, verse: 20, text: "He that walketh with wise men shall be wise: but a companion of fools shall be destroyed." },
  { book: "Proverbs", chapter: 14, verse: 12, text: "There is a way which seemeth right unto a man, but the end thereof are the ways of death." },
  { book: "Proverbs", chapter: 15, verse: 1, text: "A soft answer turneth away wrath: but grievous words stir up anger." },
  { book: "Proverbs", chapter: 16, verse: 3, text: "Commit thy works unto the LORD, and thy thoughts shall be established." },
  { book: "Proverbs", chapter: 16, verse: 9, text: "A man's heart deviseth his way: but the LORD directeth his steps." },
  { book: "Proverbs", chapter: 16, verse: 18, text: "Pride goeth before destruction, and an haughty spirit before a fall." },
  { book: "Proverbs", chapter: 18, verse: 10, text: "The name of the LORD is a strong tower: the righteous runneth into it, and is safe." },
  { book: "Proverbs", chapter: 18, verse: 21, text: "Death and life are in the power of the tongue: and they that love it shall eat the fruit thereof." },
  { book: "Proverbs", chapter: 19, verse: 21, text: "There are many devices in a man's heart; nevertheless the counsel of the LORD, that shall stand." },
  { book: "Proverbs", chapter: 21, verse: 5, text: "The thoughts of the diligent tend only to plenteousness; but of every one that is hasty only to want." },
  { book: "Proverbs", chapter: 21, verse: 20, text: "There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up." },
  { book: "Proverbs", chapter: 22, verse: 6, text: "Train up a child in the way he should go: and when he is old, he will not depart from it." },
  { book: "Proverbs", chapter: 22, verse: 7, text: "The rich ruleth over the poor, and the borrower is servant to the lender." },
  { book: "Proverbs", chapter: 23, verse: 7, text: "For as he thinketh in his heart, so is he." },
  { book: "Proverbs", chapter: 24, verse: 3, text: "Through wisdom is an house builded; and by understanding it is established." },
  { book: "Proverbs", chapter: 24, verse: 4, text: "And by knowledge shall the chambers be filled with all precious and pleasant riches." },
  { book: "Proverbs", chapter: 24, verse: 16, text: "For a just man falleth seven times, and riseth up again: but the wicked shall fall into mischief." },
  { book: "Proverbs", chapter: 27, verse: 17, text: "Iron sharpeneth iron; so a man sharpeneth the countenance of his friend." },
  { book: "Proverbs", chapter: 29, verse: 18, text: "Where there is no vision, the people perish: but he that keepeth the law, happy is he." },
  { book: "Proverbs", chapter: 31, verse: 10, text: "Who can find a virtuous woman? for her price is far above rubies." },

  // ECCLESIASTES
  { book: "Ecclesiastes", chapter: 3, verse: 1, text: "To every thing there is a season, and a time to every purpose under the heaven." },
  { book: "Ecclesiastes", chapter: 3, verse: 11, text: "He hath made every thing beautiful in his time: also he hath set the world in their heart." },
  { book: "Ecclesiastes", chapter: 4, verse: 9, text: "Two are better than one; because they have a good reward for their labour." },
  { book: "Ecclesiastes", chapter: 4, verse: 12, text: "And if one prevail against him, two shall withstand him; and a threefold cord is not quickly broken." },
  { book: "Ecclesiastes", chapter: 10, verse: 10, text: "If the iron be blunt, and he do not whet the edge, then must he put to more strength: but wisdom is profitable to direct." },
  { book: "Ecclesiastes", chapter: 11, verse: 1, text: "Cast thy bread upon the waters: for thou shalt find it after many days." },
  { book: "Ecclesiastes", chapter: 12, verse: 13, text: "Let us hear the conclusion of the whole matter: Fear God, and keep his commandments: for this is the whole duty of man." },

  // ISAIAH
  { book: "Isaiah", chapter: 1, verse: 18, text: "Come now, and let us reason together, saith the LORD: though your sins be as scarlet, they shall be as white as snow." },
  { book: "Isaiah", chapter: 6, verse: 8, text: "Also I heard the voice of the Lord, saying, Whom shall I send, and who will go for us? Then said I, Here am I; send me." },
  { book: "Isaiah", chapter: 9, verse: 6, text: "For unto us a child is born, unto us a son is given: and the government shall be upon his shoulder: and his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace." },
  { book: "Isaiah", chapter: 26, verse: 3, text: "Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee." },
  { book: "Isaiah", chapter: 40, verse: 8, text: "The grass withereth, the flower fadeth: but the word of our God shall stand for ever." },
  { book: "Isaiah", chapter: 40, verse: 29, text: "He giveth power to the faint; and to them that have no might he increaseth strength." },
  { book: "Isaiah", chapter: 40, verse: 31, text: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint." },
  { book: "Isaiah", chapter: 41, verse: 10, text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness." },
  { book: "Isaiah", chapter: 43, verse: 2, text: "When thou passest through the waters, I will be with thee; and through the rivers, they shall not overflow thee: when thou walkest through the fire, thou shalt not be burned." },
  { book: "Isaiah", chapter: 43, verse: 18, text: "Remember ye not the former things, neither consider the things of old." },
  { book: "Isaiah", chapter: 43, verse: 19, text: "Behold, I will do a new thing; now it shall spring forth; shall ye not know it? I will even make a way in the wilderness, and rivers in the desert." },
  { book: "Isaiah", chapter: 44, verse: 3, text: "For I will pour water upon him that is thirsty, and floods upon the dry ground: I will pour my spirit upon thy seed, and my blessing upon thine offspring." },
  { book: "Isaiah", chapter: 53, verse: 4, text: "Surely he hath borne our griefs, and carried our sorrows: yet we did esteem him stricken, smitten of God, and afflicted." },
  { book: "Isaiah", chapter: 53, verse: 5, text: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed." },
  { book: "Isaiah", chapter: 54, verse: 17, text: "No weapon that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn." },
  { book: "Isaiah", chapter: 55, verse: 8, text: "For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD." },
  { book: "Isaiah", chapter: 55, verse: 9, text: "For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts." },
  { book: "Isaiah", chapter: 55, verse: 11, text: "So shall my word be that goeth forth out of my mouth: it shall not return unto me void, but it shall accomplish that which I please." },
  { book: "Isaiah", chapter: 58, verse: 11, text: "And the LORD shall guide thee continually, and satisfy thy soul in drought, and make fat thy bones: and thou shalt be like a watered garden." },
  { book: "Isaiah", chapter: 61, verse: 1, text: "The Spirit of the Lord GOD is upon me; because the LORD hath anointed me to preach good tidings unto the meek." },
  { book: "Isaiah", chapter: 61, verse: 3, text: "To appoint unto them that mourn in Zion, to give unto them beauty for ashes, the oil of joy for mourning, the garment of praise for the spirit of heaviness." },

  // JEREMIAH
  { book: "Jeremiah", chapter: 1, verse: 5, text: "Before I formed thee in the belly I knew thee; and before thou camest forth out of the womb I sanctified thee, and I ordained thee a prophet unto the nations." },
  { book: "Jeremiah", chapter: 17, verse: 7, text: "Blessed is the man that trusteth in the LORD, and whose hope the LORD is." },
  { book: "Jeremiah", chapter: 17, verse: 8, text: "For he shall be as a tree planted by the waters, and that spreadeth out her roots by the river, and shall not see when heat cometh." },
  { book: "Jeremiah", chapter: 29, verse: 11, text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end." },
  { book: "Jeremiah", chapter: 29, verse: 12, text: "Then shall ye call upon me, and ye shall go and pray unto me, and I will hearken unto you." },
  { book: "Jeremiah", chapter: 29, verse: 13, text: "And ye shall seek me, and find me, when ye shall search for me with all your heart." },
  { book: "Jeremiah", chapter: 31, verse: 3, text: "The LORD hath appeared of old unto me, saying, Yea, I have loved thee with an everlasting love: therefore with lovingkindness have I drawn thee." },
  { book: "Jeremiah", chapter: 33, verse: 3, text: "Call unto me, and I will answer thee, and shew thee great and mighty things, which thou knowest not." },

  // LAMENTATIONS
  { book: "Lamentations", chapter: 3, verse: 22, text: "It is of the LORD's mercies that we are not consumed, because his compassions fail not." },
  { book: "Lamentations", chapter: 3, verse: 23, text: "They are new every morning: great is thy faithfulness." },

  // EZEKIEL
  { book: "Ezekiel", chapter: 36, verse: 26, text: "A new heart also will I give you, and a new spirit will I put within you: and I will take away the stony heart out of your flesh, and I will give you an heart of flesh." },
  { book: "Ezekiel", chapter: 37, verse: 5, text: "Thus saith the Lord GOD unto these bones; Behold, I will cause breath to enter into you, and ye shall live." },

  // DANIEL
  { book: "Daniel", chapter: 3, verse: 17, text: "If it be so, our God whom we serve is able to deliver us from the burning fiery furnace, and he will deliver us out of thine hand, O king." },
  { book: "Daniel", chapter: 3, verse: 18, text: "But if not, be it known unto thee, O king, that we will not serve thy gods, nor worship the golden image which thou hast set up." },
  { book: "Daniel", chapter: 6, verse: 10, text: "Now when Daniel knew that the writing was signed, he went into his house; and his windows being open in his chamber toward Jerusalem, he kneeled upon his knees three times a day, and prayed." },
  { book: "Daniel", chapter: 10, verse: 12, text: "Fear not, Daniel: for from the first day that thou didst set thine heart to understand, and to chasten thyself before thy God, thy words were heard, and I am come for thy words." },
  { book: "Daniel", chapter: 11, verse: 32, text: "The people that do know their God shall be strong, and do exploits." },
  { book: "Daniel", chapter: 12, verse: 3, text: "And they that be wise shall shine as the brightness of the firmament; and they that turn many to righteousness as the stars for ever and ever." },

  // HOSEA
  { book: "Hosea", chapter: 4, verse: 6, text: "My people are destroyed for lack of knowledge: because thou hast rejected knowledge, I will also reject thee." },
  { book: "Hosea", chapter: 6, verse: 3, text: "Then shall we know, if we follow on to know the LORD: his going forth is prepared as the morning; and he shall come unto us as the rain." },

  // JOEL
  { book: "Joel", chapter: 2, verse: 25, text: "And I will restore to you the years that the locust hath eaten, the cankerworm, and the caterpiller, and the palmerworm, my great army which I sent among you." },
  { book: "Joel", chapter: 2, verse: 28, text: "And it shall come to pass afterward, that I will pour out my spirit upon all flesh; and your sons and your daughters shall prophesy, your old men shall dream dreams, your young men shall see visions." },

  // AMOS
  { book: "Amos", chapter: 3, verse: 3, text: "Can two walk together, except they be agreed?" },

  // MICAH
  { book: "Micah", chapter: 6, verse: 8, text: "He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?" },
  { book: "Micah", chapter: 7, verse: 8, text: "Rejoice not against me, O mine enemy: when I fall, I shall arise; when I sit in darkness, the LORD shall be a light unto me." },

  // HABAKKUK
  { book: "Habakkuk", chapter: 2, verse: 2, text: "And the LORD answered me, and said, Write the vision, and make it plain upon tables, that he may run that readeth it." },
  { book: "Habakkuk", chapter: 2, verse: 3, text: "For the vision is yet for an appointed time, but at the end it shall speak, and not lie: though it tarry, wait for it; because it will surely come, it will not tarry." },
  { book: "Habakkuk", chapter: 3, verse: 17, text: "Although the fig tree shall not blossom, neither shall fruit be in the vines; the labour of the olive shall fail, and the fields shall yield no meat." },
  { book: "Habakkuk", chapter: 3, verse: 18, text: "Yet I will rejoice in the LORD, I will joy in the God of my salvation." },

  // ZEPHANIAH
  { book: "Zephaniah", chapter: 3, verse: 17, text: "The LORD thy God in the midst of thee is mighty; he will save, he will rejoice over thee with joy; he will rest in his love, he will joy over thee with singing." },

  // ZECHARIAH
  { book: "Zechariah", chapter: 4, verse: 6, text: "Not by might, nor by power, but by my spirit, saith the LORD of hosts." },

  // MALACHI
  { book: "Malachi", chapter: 3, verse: 6, text: "For I am the LORD, I change not; therefore ye sons of Jacob are not consumed." },
  { book: "Malachi", chapter: 3, verse: 10, text: "Bring ye all the tithes into the storehouse, that there may be meat in mine house, and prove me now herewith, saith the LORD of hosts, if I will not open you the windows of heaven, and pour you out a blessing, that there shall not be room enough to receive it." },

  // Continue in next part...
];

// Save to file
const outputPath = path.join(__dirname, '..', 'public', 'data', 'bible-metadata-full.json');
fs.writeFileSync(outputPath, JSON.stringify(verses, null, 2));
console.log(`Generated ${verses.length} verses to ${outputPath}`);
