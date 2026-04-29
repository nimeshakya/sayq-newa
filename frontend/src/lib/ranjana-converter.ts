// Comprehensive Devanagari Script Converter for Ranjana Font

// ============================================================================
// DEVANAGARI CHARACTER MAPPINGS
// ============================================================================

// Independent vowels (Swaras)
const INDEPENDENT_VOWELS: Record<string, string> = {
  'a': 'अ',
  'aa': 'आ',
  'i': 'इ',
  'ii': 'ई',
  'u': 'उ',
  'uu': 'ऊ',
  'ri': 'ऋ',
  'e': 'ए',
  'ai': 'ऐ',
  'o': 'ओ',
  'au': 'औ',
};

// Vowel matras (attached to consonants)
const VOWEL_MATRAS: Record<string, string> = {
  'aa': 'ा',
  'i': 'ि',
  'ii': 'ी',
  'u': 'ु',
  'uu': 'ू',
  'ri': 'ृ',
  'e': 'े',
  'ai': 'ै',
  'o': 'ो',
  'au': 'ौ',
};

// Consonants (Vyanjanas)
const CONSONANTS: Record<string, string> = {
  // Velar (कवर्ग)
  'ka': 'क',
  'kha': 'ख',
  'ga': 'ग',
  'gha': 'घ',
  'nga': 'ङ',
  
  // Palatal (चवर्ग)
  'cha': 'च',
  'chha': 'छ',
  'ja': 'ज',
  'jha': 'झ',
  'nya': 'ञ',
  
  // Retroflex (टवर्ग)
  'tta': 'ट',
  'ttha': 'ठ',
  'dda': 'ड',
  'ddha': 'ढ',
  'nna': 'ण',
  
  // Dental (तवर्ग)
  'ta': 'त',
  'tha': 'थ',
  'da': 'द',
  'dha': 'ध',
  'na': 'न',
  
  // Labial (पवर्ग)
  'pa': 'प',
  'pha': 'फ',
  'ba': 'ब',
  'bha': 'भ',
  'ma': 'म',
  
  // Semivowels (अंतःस्थ)
  'ya': 'य',
  'ra': 'र',
  'la': 'ल',
  'va': 'व',
  'wa': 'व',
  
  // Sibilants (ऊष्मा)
  'sha': 'श',
  'shha': 'ष',
  'sa': 'स',
  'ha': 'ह',
};

// Conjuncts (combined consonants)
const CONJUNCTS: Record<string, string> = {
  'ksha': 'क्ष',
  'tra': 'त्र',
  'gya': 'ज्ञ',
  'jnya': 'ज्ञ',
  'shri': 'श्र',
  'shra': 'श्र',
};

// Base consonants without inherent vowel (with halant/virama)
const BASE_CONSONANTS: Record<string, string> = {
  'k': 'क्',
  'kh': 'ख्',
  'g': 'ग्',
  'gh': 'घ्',
  'ng': 'ङ्',
  'ch': 'च्',
  'chh': 'छ्',
  'j': 'ज्',
  'jh': 'झ्',
  'ny': 'ञ्',
  't': 'त्',
  'th': 'थ्',
  'd': 'ड्',
  'dh': 'ढ्',
  'dn': 'ण्',
  'p': 'प्',
  'ph': 'फ्',
  'b': 'ब्',
  'bh': 'भ्',
  'm': 'म्',
  'y': 'य्',
  'r': 'र्',
  'l': 'ल्',
  'v': 'व्',
  'w': 'व्',
  'sh': 'श्',
  's': 'स्',
  'h': 'ह्',
};

// Numerals
const NUMERALS: Record<string, string> = {
  '0': '०',
  '1': '१',
  '2': '२',
  '3': '३',
  '4': '४',
  '5': '५',
  '6': '६',
  '7': '७',
  '8': '८',
  '9': '९',
};

// ============================================================================
// ROMAN TO DEVANAGARI CONVERSION
// ============================================================================

/**
 * Check if text contains Devanagari characters
 */
export function isDevanagariText(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Convert standalone Roman text to Devanagari
 * Handles complex syllable structures, conjuncts, and matras
 */
export function romanToDevanagari(romanText: string): string {
  if (!romanText) return '';
  if (isDevanagariText(romanText)) return romanText;

  const text = romanText.toLowerCase().trim();
  let result = '';
  let i = 0;

  while (i < text.length) {
    // Skip spaces and punctuation
    if (text[i] === ' ' || text[i] === ',' || text[i] === '.' || text[i] === '!' || text[i] === '?') {
      result += text[i];
      i++;
      continue;
    }

    // Check for numerals
    if (/\d/.test(text[i])) {
      result += NUMERALS[text[i]] || text[i];
      i++;
      continue;
    }

    // Check for non-alphabetic characters
    if (!/[a-z]/.test(text[i])) {
      result += text[i];
      i++;
      continue;
    }

    let matched = false;

    // Try to match conjuncts first (4-character sequences)
    for (let len = 4; len >= 3; len--) {
      if (i + len <= text.length) {
        const substr = text.substring(i, i + len);

        // Check conjuncts
        for (const [conjunct, devanagari] of Object.entries(CONJUNCTS)) {
          if (substr.startsWith(conjunct)) {
            const afterConjunct = text.substring(i + conjunct.length);

            // Check if next is a vowel matra
            let hasVowelMatra = false;
            for (const [vowel, matra] of Object.entries(VOWEL_MATRAS)) {
              if (afterConjunct.startsWith(vowel)) {
                result += devanagari + matra;
                i += conjunct.length + vowel.length;
                matched = true;
                hasVowelMatra = true;
                break;
              }
            }

            if (hasVowelMatra) break;

            // If no matra, add with inherent 'a'
            if (!matched) {
              result += devanagari;
              i += conjunct.length;
              matched = true;
              break;
            }
          }
        }

        if (matched) break;
      }
    }

    if (matched) continue;

    // Try to match consonant + vowel combinations (longest first)
    for (let len = 5; len >= 2; len--) {
      if (i + len <= text.length) {
        const substr = text.substring(i, i + len);

        for (const [consonant, consonantChar] of Object.entries(CONSONANTS)) {
          if (substr.startsWith(consonant)) {
            const afterConsonant = substr.substring(consonant.length);

            // Check for vowel matra
            let vowelMatched = false;
            for (const [vowel, matra] of Object.entries(VOWEL_MATRAS)) {
              if (afterConsonant.startsWith(vowel)) {
                result += consonantChar + matra;
                i += consonant.length + vowel.length;
                matched = true;
                vowelMatched = true;
                break;
              }
            }

            if (vowelMatched) break;

            // No matra found, consonant alone is added with inherent 'a'
            if (!matched) {
              result += consonantChar;
              i += consonant.length;
              matched = true;
              break;
            }
          }
        }

        if (matched) break;
      }
    }

    if (matched) continue;

    // Try to match standalone consonants (no vowel after)
    for (const [consonant, consonantChar] of Object.entries(CONSONANTS)) {
      if (text.substring(i).startsWith(consonant)) {
        // Check if next character is not a vowel
        const nextChar = text[i + consonant.length];
        const isNextVowel = nextChar && /[aeiou]/.test(nextChar);

        if (!isNextVowel) {
          result += consonantChar;
          i += consonant.length;
          matched = true;
          break;
        }
      }
    }

    if (matched) continue;

    // Try to match standalone vowels
    for (const [vowel, vowelChar] of Object.entries(INDEPENDENT_VOWELS)) {
      if (text.substring(i).startsWith(vowel)) {
        result += vowelChar;
        i += vowel.length;
        matched = true;
        break;
      }
    }

    if (matched) continue;

    // If nothing matches, keep the original character
    result += text[i];
    i++;
  }

  return result;
}

/**
 * Main conversion function
 * Detects input type and converts accordingly
 */
export function convertToRanjana(text: string): {
  input: string;
  output: string;
  inputType: 'devanagari' | 'roman';
} {
  const isDevanagari = isDevanagariText(text);

  return {
    input: text,
    output: isDevanagari ? text : romanToDevanagari(text),
    inputType: isDevanagari ? 'devanagari' : 'roman',
  };
}

/**
 * Get character metadata for display
 */
export function getCharacterInfo(char: string): {
  unicode: string;
  codePoint: number;
  isDevanagari: boolean;
} {
  return {
    unicode: char,
    codePoint: char.charCodeAt(0),
    isDevanagari: isDevanagariText(char),
  };
}
