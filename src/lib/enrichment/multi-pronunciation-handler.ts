/**
 * Handler for Chinese characters with multiple pronunciations
 * Maps characters to their most common usage in learning contexts
 */

interface PronunciationPreference {
  character: string;
  preferredPinyin: string[];
  preferredMeaningKeywords: string[];
  reason: string;
}

// Common characters with multiple pronunciations and their preferred meanings for learners
export const multiPronunciationPreferences: PronunciationPreference[] = [
  {
    character: '累',
    preferredPinyin: ['lei4', 'lèi'],
    preferredMeaningKeywords: ['tired', 'weary', 'exhausted'],
    reason: 'tired (lèi) is more commonly used in everyday conversation than accumulate (lěi)'
  },
  {
    character: '長',
    preferredPinyin: ['zhang3', 'zhǎng'],
    preferredMeaningKeywords: ['grow', 'chief', 'elder'],
    reason: 'grow/chief (zhǎng) is more commonly taught than long (cháng) for Traditional Chinese'
  },
  {
    character: '行',
    preferredPinyin: ['xing2', 'xíng'],
    preferredMeaningKeywords: ['walk', 'go', 'travel', 'ok'],
    reason: 'walk/go (xíng) is more commonly used than profession (háng)'
  },
  {
    character: '重',
    preferredPinyin: ['zhong4', 'zhòng'],
    preferredMeaningKeywords: ['heavy', 'weight', 'important'],
    reason: 'heavy/important (zhòng) is more commonly used than repeat (chóng)'
  },
  {
    character: '得',
    preferredPinyin: ['de2', 'dé'],
    preferredMeaningKeywords: ['obtain', 'get', 'gain'],
    reason: 'obtain/get (dé) is taught before the grammatical particle (de)'
  },
  {
    character: '好',
    preferredPinyin: ['hao3', 'hǎo'],
    preferredMeaningKeywords: ['good', 'well', 'fine'],
    reason: 'good (hǎo) is more fundamental than to like (hào)'
  },
  {
    character: '為',
    preferredPinyin: ['wei4', 'wèi'],
    preferredMeaningKeywords: ['for', 'because of', 'sake'],
    reason: 'for/because (wèi) is more commonly used than to do (wéi)'
  },
  {
    character: '樂',
    preferredPinyin: ['le4', 'lè'],
    preferredMeaningKeywords: ['happy', 'joy', 'pleasure'],
    reason: 'happy/joy (lè) is more commonly taught than music (yuè)'
  },
  {
    character: '少',
    preferredPinyin: ['shao3', 'shǎo'],
    preferredMeaningKeywords: ['few', 'little', 'less'],
    reason: 'few/little (shǎo) is more commonly used than young (shào)'
  },
  {
    character: '還',
    preferredPinyin: ['hai2', 'hái'],
    preferredMeaningKeywords: ['still', 'yet', 'also'],
    reason: 'still/yet (hái) is more commonly used than return (huán)'
  }
];

/**
 * Get the preferred dictionary entry for a character with multiple pronunciations
 */
export function getPreferredEntry(character: string, dictEntries: any[]): any {
  if (dictEntries.length <= 1) return dictEntries[0];
  
  const preference = multiPronunciationPreferences.find(p => p.character === character);
  if (!preference) return dictEntries[0];
  
  // Try to find an entry matching the preferred pronunciation
  let preferredEntry = dictEntries.find(entry => 
    preference.preferredPinyin.some(pinyin => 
      entry.pinyin.toLowerCase().includes(pinyin)
    )
  );
  
  // If not found by pinyin, try by meaning keywords
  if (!preferredEntry) {
    preferredEntry = dictEntries.find(entry =>
      entry.definitions.some((def: string) =>
        preference.preferredMeaningKeywords.some(keyword =>
          def.toLowerCase().includes(keyword)
        )
      )
    );
  }
  
  return preferredEntry || dictEntries[0];
}