// ===============================
// PRIORITY MAPS
// ===============================

const CONSONANTS: Record<string, string> = {
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

const VOWEL_MATRAS: Record<string, string> = {
  au: "ौ",
  ai: "ै",
  aa: "ा",
  ii: "ी",
  uu: "ू",
  ri: "ृ",
  e: "े",
  o: "ो",
  i: "ि",
  u: "ु",
};

const INDEPENDENT_VOWELS: Record<string, string> = {
  a: "अ",
  aa: "आ",
  i: "इ",
  ii: "ई",
  u: "उ",
  uu: "ऊ",
  ri: "ऋ",
  e: "ए",
  ai: "ऐ",
  o: "ओ",
  au: "औ",
};

// sorted keys (important for longest match)
const CONSONANT_KEYS = Object.keys(CONSONANTS).sort(
  (a, b) => b.length - a.length,
);
const VOWEL_KEYS = Object.keys(VOWEL_MATRAS).sort(
  (a, b) => b.length - a.length,
);
const INDEP_VOWEL_KEYS = Object.keys(INDEPENDENT_VOWELS).sort(
  (a, b) => b.length - a.length,
);

// ===============================
// DETECTION
// ===============================

export function isDevanagariText(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

// ===============================
// CONVERTER
// ===============================

export function romanToDevanagari(text: string): string {
  let result = "";
  let i = 0;
  const input = text.toLowerCase();

  while (i < input.length) {
    let matched = false;

    // punctuation / space
    if (!/[a-z0-9]/.test(input[i])) {
      result += text[i];
      i++;
      continue;
    }

    // digits
    if (/\d/.test(input[i])) {
      const numMap: Record<string, string> = {
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
      result += numMap[input[i]];
      i++;
      continue;
    }

    // =========================
    // 1. CONSONANT MATCH
    // =========================
    for (const c of CONSONANT_KEYS) {
      if (input.startsWith(c, i)) {
        const consonant = CONSONANTS[c];
        const nextIndex = i + c.length;

        // try vowel after consonant
        let vowelMatched = false;

        for (const v of VOWEL_KEYS) {
          if (input.startsWith(v, nextIndex)) {
            result += consonant + VOWEL_MATRAS[v];
            i = nextIndex + v.length;
            matched = true;
            vowelMatched = true;
            break;
          }
        }

        if (!vowelMatched) {
          // IMPORTANT FIX:
          // inherent vowel "a" → just consonant
          result += consonant;
          i = nextIndex;
          matched = true;
        }

        break;
      }
    }

    if (matched) continue;

    // =========================
    // 2. INDEPENDENT VOWEL
    // =========================
    for (const v of INDEP_VOWEL_KEYS) {
      if (input.startsWith(v, i)) {
        result += INDEPENDENT_VOWELS[v];
        i += v.length;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // fallback
    result += text[i];
    i++;
  }

  return result;
}

// ===============================
// MAIN
// ===============================

export function convertToRanjana(text: string) {
  const isDev = isDevanagariText(text);

  return {
    input: text,
    output: isDev ? text : romanToDevanagari(text),
    inputType: isDev ? "devanagari" : "roman",
  };
}
