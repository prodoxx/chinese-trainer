export interface DictionaryEntry {
  hanzi: string;
  meaning: string;
  pinyin: string;
}

export async function lookupCharacter(hanzi: string): Promise<DictionaryEntry | null> {
  try {
    // Using MDBG dictionary API (free, no key required)
    const response = await fetch(
      `https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=${encodeURIComponent(hanzi)}`
    );
    
    if (!response.ok) {
      throw new Error('Dictionary lookup failed');
    }
    
    const html = await response.text();
    
    // Simple parsing for demonstration - in production, use a proper HTML parser
    const pinyinMatch = html.match(/class="pinyin">([^<]+)</);
    const meaningMatch = html.match(/class="defs">([^<]+)</);
    
    if (pinyinMatch && meaningMatch) {
      return {
        hanzi,
        pinyin: pinyinMatch[1].trim(),
        meaning: meaningMatch[1].split(';')[0].trim(), // Take first meaning
      };
    }
    
    // Fallback to basic data
    return {
      hanzi,
      pinyin: 'Unknown',
      meaning: 'Character',
    };
    
  } catch (error) {
    console.error('Dictionary lookup error:', error);
    return null;
  }
}