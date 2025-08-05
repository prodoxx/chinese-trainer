import { convertPinyinToneNumbersToMarks } from './pinyin';

/**
 * Clean dictionary definitions by converting embedded pinyin references
 * from tone numbers to tone marks
 * 
 * Example: "used in 道行[dao4heng2]" -> "used in 道行[dàohéng]"
 */
export function cleanDefinition(definition: string): string {
  // Pattern to match Chinese characters followed by pinyin in brackets
  // e.g., 道行[dao4heng2] or 累積[lei3ji1]
  const pinyinPattern = /\[([a-zA-Z0-9]+)\]/g;
  
  return definition.replace(pinyinPattern, (match, pinyin) => {
    // Split the pinyin into syllables (each syllable ends with a number)
    const syllables = pinyin.match(/[a-zA-Z]+[0-9]/g) || [];
    
    // Convert each syllable from tone numbers to tone marks
    const convertedSyllables = syllables.map((syllable: string) => 
      convertPinyinToneNumbersToMarks(syllable)
    );
    
    // Join the syllables back together
    const convertedPinyin = convertedSyllables.join('');
    
    return `[${convertedPinyin}]`;
  });
}

/**
 * Clean an array of definitions
 */
export function cleanDefinitions(definitions: string[]): string[] {
  return definitions.map(def => cleanDefinition(def));
}