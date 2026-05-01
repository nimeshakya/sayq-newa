// Devanagari consonants mapping
export const DEVANAGARI_CONSONANTS: Record<string, string> = {
  क: "क",
  ख: "ख",
  ग: "ग",
  घ: "घ",
  ङ: "ङ",
  च: "च",
  छ: "छ",
  ज: "ज",
  झ: "झ",
  ञ: "ञ",
  ट: "ट",
  ठ: "ठ",
  ड: "ड",
  ढ: "ढ",
  ण: "ण",
  त: "त",
  थ: "थ",
  द: "द",
  ध: "ध",
  न: "न",
  प: "प",
  फ: "फ",
  ब: "ब",
  भ: "भ",
  म: "म",
  य: "य",
  र: "र",
  ल: "ल",
  व: "व",
  श: "श",
  ष: "ष",
  स: "स",
  ह: "ह",
  क्ष: "क्ष",
  त्र: "त्र",
  ज्ञ: "ज्ञ",
};

// Devanagari vowels (independent forms)
export const DEVANAGARI_VOWELS: Record<string, string> = {
  अ: "अ",
  आ: "आ",
  इ: "इ",
  ई: "ई",
  उ: "उ",
  ऊ: "ऊ",
  ऋ: "ऋ",
  ए: "ए",
  ऐ: "ऐ",
  ओ: "ओ",
  औ: "औ",
  अं: "अं",
  अः: "अः",
};

// Devanagari matras (vowel diacritics)
export const DEVANAGARI_MATRAS: Record<string, string> = {
  "ा": "ा", // aa
  "ि": "ि", // i
  "ी": "ी", // ii
  "ु": "ु", // u
  "ू": "ू", // uu
  "ृ": "ृ", // ri
  "े": "े", // e
  "ै": "ै", // ai
  "ो": "ो", // o
  "ौ": "ौ", // au
  "ं": "ं", // anusvara
  "ः": "ः", // visarga
  "्": "्", // virama (halant)
};

// Devanagari digits
export const DEVANAGARI_DIGITS: Record<string, string> = {
  "०": "०",
  "१": "१",
  "२": "२",
  "३": "३",
  "४": "४",
  "५": "५",
  "६": "६",
  "७": "७",
  "८": "८",
  "९": "९",
};

// Romanized to Devanagari mapping
export const ROMAN_TO_DEVANAGARI: Record<string, string> = {
  // Vowels
  a: "अ",
  aa: "आ",
  ā: "आ",
  i: "इ",
  ii: "ई",
  ī: "ई",
  u: "उ",
  uu: "ऊ",
  ū: "ऊ",
  ri: "ऋ",
  ṛ: "ऋ",
  e: "ए",
  ai: "ऐ",
  o: "ओ",
  au: "औ",

  // Consonants with inherent 'a'
  ka: "क",
  kha: "ख",
  ga: "ग",
  gha: "घ",
  nga: "ङ",
  cha: "च",
  chha: "छ",
  ja: "ज",
  jha: "झ",
  nya: "ञ",
  tta: "ट",
  ttha: "ठ",
  dda: "ड",
  ddha: "ढ",
  nna: "ण",
  ta: "त",
  tha: "थ",
  da: "द",
  dha: "ध",
  na: "न",
  pa: "प",
  pha: "फ",
  ba: "ब",
  bha: "भ",
  ma: "म",
  ya: "य",
  ra: "र",
  la: "ल",
  va: "व",
  wa: "व",
  sha: "श",
  shha: "ष",
  sa: "स",
  ha: "ह",

  // Base consonants (without inherent vowel - adds halant)
  k: "क्",
  kh: "ख्",
  g: "ग्",
  gh: "घ्",
  ng: "ङ्",
  ch: "च्",
  chh: "छ्",
  j: "ज्",
  jh: "झ्",
  t: "त्",
  th: "थ्",
  d: "द्",
  dh: "ध्",
  n: "न्",
  p: "प्",
  ph: "फ्",
  b: "ब्",
  bh: "भ्",
  m: "म्",
  y: "य्",
  r: "र्",
  l: "ल्",
  v: "व्",
  w: "व्",
  sh: "श्",
  s: "स्",
  h: "ह्",

  // Special conjuncts
  ksha: "क्ष",
  tra: "त्र",
  gya: "ज्ञ",
  jnya: "ज्ञ",

  // Anusvara and Visarga
  am: "ं",
  ah: "ः",

  // Digits
  "0": "०",
  "1": "१",
  "2": "२",
  "3": "३",
  "4": "४",
  "5": "५",
  "6": "६",
  "7": "७",
  "8": "८",
  "9": "९",
};

// Matra mappings for romanized vowels following consonants
export const ROMAN_VOWEL_TO_MATRA: Record<string, string> = {
  a: "", // inherent vowel, no matra needed
  aa: "ा",
  ā: "ा",
  i: "ि",
  ii: "ी",
  ī: "ी",
  u: "ु",
  uu: "ू",
  ū: "ू",
  ri: "ृ",
  ṛ: "ृ",
  e: "े",
  ai: "ै",
  o: "ो",
  au: "ौ",
};

/**
 * Check if a character is a Devanagari character
 */
export function isDevanagari(char: string): boolean {
  const code = char.charCodeAt(0);
  return code >= 0x0900 && code <= 0x097f;
}

/**
 * Check if text contains Devanagari characters
 */
export function containsDevanagari(text: string): boolean {
  return text.split("").some(isDevanagari);
}

/**
 * Convert Romanized text to Devanagari
 */
export function romanToDevanagari(text: string): string {
  // Simple syllable-based conversion
  let result = "";
  let i = 0;
  const lowerText = text.toLowerCase();

  while (i < lowerText.length) {
    let matched = false;

    // Try matching longer sequences first (up to 4 characters)
    for (let len = 4; len >= 1; len--) {
      const substr = lowerText.substring(i, i + len);

      if (ROMAN_TO_DEVANAGARI[substr]) {
        result += ROMAN_TO_DEVANAGARI[substr];
        i += len;
        matched = true;
        break;
      }
    }

    if (!matched) {
      // Keep original character if no mapping found
      result += text[i];
      i++;
    }
  }

  return result;
}

/**
 * Advanced Romanized to Devanagari conversion with proper syllable handling
 */
export function advancedRomanToDevanagari(text: string): string {
  // Consonants regex pattern
  const consonants =
    "kh|gh|ng|chh|ch|jh|th|dh|ph|bh|sh|k|g|c|j|t|d|n|p|b|m|y|r|l|v|w|s|h";
  const vowels = "aa|ai|au|ii|uu|a|i|u|e|o|ā|ī|ū|ṛ";

  // Build syllable pattern
  const syllablePattern = new RegExp(`(${consonants})(${vowels})?`, "gi");

  let result = "";
  let lastIndex = 0;
  let match;

  const lowerText = text.toLowerCase();

  while ((match = syllablePattern.exec(lowerText)) !== null) {
    // Add any text before this match
    if (match.index > lastIndex) {
      const between = text.substring(lastIndex, match.index);
      // Convert standalone vowels
      result += convertStandaloneVowels(between);
    }

    const consonant = match[1].toLowerCase();
    const vowel = match[2]?.toLowerCase() || "a";

    // Get base consonant
    const baseConsonant = getDevanagariConsonant(consonant);
    const matra = ROMAN_VOWEL_TO_MATRA[vowel] || "";

    result += baseConsonant + matra;
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    result += convertStandaloneVowels(text.substring(lastIndex));
  }

  return result;
}

function getDevanagariConsonant(roman: string): string {
  const consonantMap: Record<string, string> = {
    kh: "ख",
    gh: "घ",
    ng: "ङ",
    chh: "छ",
    ch: "च",
    jh: "झ",
    th: "थ",
    dh: "ध",
    ph: "फ",
    bh: "भ",
    sh: "श",
    k: "क",
    g: "ग",
    c: "च",
    j: "ज",
    t: "त",
    d: "द",
    n: "न",
    p: "प",
    b: "ब",
    m: "म",
    y: "य",
    r: "र",
    l: "ल",
    v: "व",
    w: "व",
    s: "स",
    h: "ह",
  };
  return consonantMap[roman] || roman;
}

function convertStandaloneVowels(text: string): string {
  const vowelMap: Record<string, string> = {
    aa: "आ",
    ai: "ऐ",
    au: "औ",
    ii: "ई",
    uu: "ऊ",
    a: "अ",
    i: "इ",
    u: "उ",
    e: "ए",
    o: "ओ",
    ā: "आ",
    ī: "ई",
    ū: "ऊ",
    ṛ: "ऋ",
  };

  let result = "";
  let i = 0;
  const lower = text.toLowerCase();

  while (i < lower.length) {
    let matched = false;
    for (let len = 2; len >= 1; len--) {
      const substr = lower.substring(i, i + len);
      if (vowelMap[substr]) {
        result += vowelMap[substr];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += text[i];
      i++;
    }
  }

  return result;
}

/**
 * Main conversion function - handles both Devanagari and Romanized input
 * Returns text ready to be rendered with Nithya Ranjana font
 */
export function convertToRanjana(text: string): {
  input: string;
  output: string;
  inputType: "devanagari" | "roman";
} {
  const inputType = containsDevanagari(text) ? "devanagari" : "roman";

  let output: string;

  if (inputType === "devanagari") {
    // Devanagari text is passed through - the Ranjana font will render it
    output = text;
  } else {
    // Convert Romanized text to Devanagari first
    output = advancedRomanToDevanagari(text);
  }

  return {
    input: text,
    output,
    inputType,
  };
}

/**
 * Get character mapping information for debugging/display
 */
export function getCharacterInfo(char: string): {
  unicode: string;
  name: string;
  type: "consonant" | "vowel" | "matra" | "digit" | "other";
} {
  const code = char.charCodeAt(0);
  const unicode = `U+${code.toString(16).toUpperCase().padStart(4, "0")}`;

  if (DEVANAGARI_CONSONANTS[char]) {
    return { unicode, name: `Devanagari consonant ${char}`, type: "consonant" };
  }
  if (DEVANAGARI_VOWELS[char]) {
    return { unicode, name: `Devanagari vowel ${char}`, type: "vowel" };
  }
  if (DEVANAGARI_MATRAS[char]) {
    return { unicode, name: `Devanagari matra ${char}`, type: "matra" };
  }
  if (DEVANAGARI_DIGITS[char]) {
    return { unicode, name: `Devanagari digit ${char}`, type: "digit" };
  }

  return { unicode, name: char, type: "other" };
}
