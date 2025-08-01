/**
 * Convert pinyin with tone numbers to pinyin with tone marks
 * e.g., "ni3 hao3" → "nǐ hǎo"
 * Handles tones 1-4 with diacritics and tone 5 (neutral tone) without marks
 * e.g., "cong1 ming5" → "cōng ming"
 */
export function convertPinyinToneNumbersToMarks(pinyin: string): string {
  if (!pinyin) return '';
  
  const toneMap: { [key: string]: { [tone: string]: string } } = {
    'a': { '1': 'ā', '2': 'á', '3': 'ǎ', '4': 'à' },
    'e': { '1': 'ē', '2': 'é', '3': 'ě', '4': 'è' },
    'i': { '1': 'ī', '2': 'í', '3': 'ǐ', '4': 'ì' },
    'o': { '1': 'ō', '2': 'ó', '3': 'ǒ', '4': 'ò' },
    'u': { '1': 'ū', '2': 'ú', '3': 'ǔ', '4': 'ù' },
    'ü': { '1': 'ǖ', '2': 'ǘ', '3': 'ǚ', '4': 'ǜ' },
    'v': { '1': 'ǖ', '2': 'ǘ', '3': 'ǚ', '4': 'ǜ' }, // Alternative for ü
  };
  
  return pinyin.split(' ').map(syllable => {
    // Handle u: notation (e.g., nu:3 → nǚ)
    syllable = syllable.replace('u:', 'ü');
    
    // Extract tone number (1-5, where 5 is neutral tone)
    const toneMatch = syllable.match(/([a-züA-ZÜ]+)([1-5])/);
    if (!toneMatch) return syllable;
    
    const [, letters, tone] = toneMatch;
    const lowerLetters = letters.toLowerCase();
    
    // Tone 5 is neutral tone - just return the letters without tone marks
    if (tone === '5') {
      // Preserve original capitalization
      if (letters[0] === letters[0].toUpperCase()) {
        return letters[0].toUpperCase() + lowerLetters.slice(1);
      }
      return lowerLetters;
    }
    
    // Apply tone mark according to pinyin rules
    // Priority: a/e > o > last vowel in -iu > i/u/ü
    let result = '';
    let toneApplied = false;
    
    for (let i = 0; i < lowerLetters.length; i++) {
      const char = lowerLetters[i];
      
      if (!toneApplied) {
        // Check if this is where we should apply the tone
        if (char === 'a' || char === 'e') {
          // a and e always get the tone
          result += toneMap[char]?.[tone] || char;
          toneApplied = true;
        } else if (char === 'o') {
          // o gets tone if no a or e
          const hasAorE = lowerLetters.includes('a') || lowerLetters.includes('e');
          if (!hasAorE) {
            result += toneMap[char]?.[tone] || char;
            toneApplied = true;
          } else {
            result += char;
          }
        } else if ((char === 'i' || char === 'u' || char === 'ü' || char === 'v')) {
          // Check if this is the last vowel or special case -iu
          const remainingChars = lowerLetters.slice(i + 1);
          const hasMoreVowels = remainingChars.match(/[aeiouüv]/);
          
          // Special case: in "iu", u gets the tone
          if (char === 'i' && lowerLetters[i + 1] === 'u') {
            result += char;
          } else if (!hasMoreVowels || (char === 'u' && lowerLetters[i - 1] === 'i')) {
            result += toneMap[char]?.[tone] || char;
            toneApplied = true;
          } else {
            result += char;
          }
        } else {
          result += char;
        }
      } else {
        result += char;
      }
    }
    
    // Preserve original capitalization
    if (letters[0] === letters[0].toUpperCase()) {
      result = result[0].toUpperCase() + result.slice(1);
    }
    
    return result;
  }).join(' ');
}

/**
 * Check if pinyin already has tone marks
 */
export function hasToneMarks(pinyin: string): boolean {
  return /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/.test(pinyin);
}