/**
 * Confusion Analyzer
 * Analyzes why Chinese characters are commonly confused with each other
 * Uses OpenAI to generate context-specific confusion reasons
 */

import { interpretChinese as interpretChineseWithProvider } from '@/lib/ai/ai-provider';

export interface ConfusionAnalysis {
  character: string;
  pinyin: string;
  meaning: string;
  confusionScore: number;
  reasons: string[];
  confusionTypes: {
    visual: number;
    phonetic: number;
    semantic: number;
    tonal: number;
  };
}

/**
 * Analyze confusion patterns between two characters using AI
 */
export async function analyzeCharacterConfusion(
  char1: { hanzi: string; pinyin?: string; meaning?: string },
  char2: { hanzi: string; pinyin?: string; meaning?: string },
  aiProvider: 'openai' | 'anthropic' = 'openai'
): Promise<ConfusionAnalysis> {
  try {
    const prompt = `Analyze why these Chinese characters might be confused with each other:

Character 1: ${char1.hanzi}
Pinyin 1: ${char1.pinyin || 'unknown'}
Meaning 1: ${char1.meaning || 'unknown'}

Character 2: ${char2.hanzi}
Pinyin 2: ${char2.pinyin || 'unknown'}
Meaning 2: ${char2.meaning || 'unknown'}

Please provide:
1. Specific reasons why learners confuse these characters (visual similarity, phonetic similarity, semantic overlap, tonal confusion, shared components/radicals, etc.)
2. Rate each type of confusion (0-1 scale):
   - Visual similarity (similar appearance, shared radicals/components)
   - Phonetic similarity (similar pronunciation)
   - Semantic similarity (related meanings)
   - Tonal confusion (same sound, different tones)

Format your response as JSON:
{
  "reasons": ["reason1", "reason2", ...],
  "visual": 0.0-1.0,
  "phonetic": 0.0-1.0,
  "semantic": 0.0-1.0,
  "tonal": 0.0-1.0
}`;

    // Use the AI provider to analyze confusion
    const response = await interpretChineseWithProvider(prompt, {
      provider: aiProvider as 'openai',
      enabled: true
    });

    if (response && typeof response === 'object' && 'meaning' in response) {
      // Parse the AI response - it might be in the meaning field
      try {
        const parsed = JSON.parse(response.meaning as string);
        
        return {
          character: char2.hanzi,
          pinyin: char2.pinyin || '',
          meaning: char2.meaning || '',
          confusionScore: calculateOverallConfusion(parsed),
          reasons: parsed.reasons || [],
          confusionTypes: {
            visual: parsed.visual || 0,
            phonetic: parsed.phonetic || 0,
            semantic: parsed.semantic || 0,
            tonal: parsed.tonal || 0
          }
        };
      } catch (parseError) {
        // If parsing fails, generate default analysis
        return generateDefaultAnalysis(char1, char2);
      }
    }

    // Fallback to default analysis
    return generateDefaultAnalysis(char1, char2);
  } catch (error) {
    console.error('Error analyzing character confusion:', error);
    return generateDefaultAnalysis(char1, char2);
  }
}

/**
 * Calculate overall confusion score from individual components
 */
function calculateOverallConfusion(scores: any): number {
  const weights = {
    visual: 0.4,
    phonetic: 0.3,
    semantic: 0.2,
    tonal: 0.1
  };
  
  return (
    (scores.visual || 0) * weights.visual +
    (scores.phonetic || 0) * weights.phonetic +
    (scores.semantic || 0) * weights.semantic +
    (scores.tonal || 0) * weights.tonal
  );
}

/**
 * Generate default confusion analysis based on heuristics
 */
function generateDefaultAnalysis(
  char1: { hanzi: string; pinyin?: string; meaning?: string },
  char2: { hanzi: string; pinyin?: string; meaning?: string }
): ConfusionAnalysis {
  const reasons: string[] = [];
  const scores = {
    visual: 0,
    phonetic: 0,
    semantic: 0,
    tonal: 0
  };

  // Check for shared characters (for multi-character words)
  const chars1 = char1.hanzi.split('');
  const chars2 = char2.hanzi.split('');
  const sharedChars = chars1.filter(c => chars2.includes(c));
  
  if (sharedChars.length > 0) {
    reasons.push(`Share character(s): ${sharedChars.join(', ')}`);
    scores.visual = sharedChars.length / Math.max(chars1.length, chars2.length);
  }

  // Check for suffix patterns (like 子)
  if (char1.hanzi.endsWith('子') && char2.hanzi.endsWith('子')) {
    reasons.push('Both end with 子 (zi) suffix');
    scores.visual = Math.max(scores.visual, 0.3);
  }

  // Check phonetic similarity
  if (char1.pinyin && char2.pinyin) {
    const p1 = char1.pinyin.toLowerCase().replace(/[0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, '');
    const p2 = char2.pinyin.toLowerCase().replace(/[0-9āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/g, '');
    
    if (p1 === p2) {
      reasons.push('Same pronunciation (different tones)');
      scores.phonetic = 0.8;
      scores.tonal = 0.9;
    } else if (p1.includes(p2) || p2.includes(p1)) {
      reasons.push('Similar pronunciation');
      scores.phonetic = 0.5;
    }
  }

  // Check semantic categories
  if (char1.meaning && char2.meaning) {
    const foodWords = ['bun', 'dumpling', 'food', 'eat', 'steam', 'cook', 'bread'];
    const isFood1 = foodWords.some(w => char1.meaning!.toLowerCase().includes(w));
    const isFood2 = foodWords.some(w => char2.meaning!.toLowerCase().includes(w));
    
    if (isFood1 && isFood2) {
      reasons.push('Both are food items');
      scores.semantic = 0.6;
    }
  }

  // If no specific reasons found, add generic one
  if (reasons.length === 0) {
    reasons.push('May be confused due to learning context');
  }

  return {
    character: char2.hanzi,
    pinyin: char2.pinyin || '',
    meaning: char2.meaning || '',
    confusionScore: calculateOverallConfusion(scores),
    reasons,
    confusionTypes: scores
  };
}

/**
 * Get commonly confused characters for a given character
 */
export async function getCommonlyConfusedCharacters(
  hanzi: string,
  limit: number = 3
): Promise<string[]> {
  // Common confusion patterns based on character structure
  const confusionPatterns: Record<string, string[]> = {
    '包子': ['房子', '餃子', '饅頭'],
    '房子': ['包子', '箱子', '孩子'],
    '餃子': ['包子', '筷子', '粽子'],
    '饅頭': ['包子', '麵包', '饅'],
    '測試': ['測驗', '考試', '試驗'],
    '朋友': ['友好', '友誼', '友人'],
    '可以': ['可能', '可是', '可愛'],
    '但是': ['但', '可是', '不過'],
    '因為': ['因', '為了', '所以'],
    '所以': ['因為', '以為', '以後']
  };

  // Return known confusions or generate based on character components
  if (confusionPatterns[hanzi]) {
    return confusionPatterns[hanzi].slice(0, limit);
  }

  // For characters ending with common suffixes
  if (hanzi.endsWith('子')) {
    return ['包子', '房子', '餃子'].filter(c => c !== hanzi).slice(0, limit);
  }

  // For two-character words, find words sharing characters
  if (hanzi.length === 2) {
    const char1 = hanzi[0];
    const char2 = hanzi[1];
    const similar: string[] = [];
    
    // Add variations with first character
    if (char1 === '可') similar.push('可能', '可是', '可愛');
    if (char1 === '因') similar.push('因為', '因此', '原因');
    if (char1 === '所') similar.push('所以', '所有', '場所');
    
    // Add variations with second character
    if (char2 === '是') similar.push('但是', '可是', '就是');
    if (char2 === '為') similar.push('因為', '為了', '以為');
    
    return similar.filter(c => c !== hanzi).slice(0, limit);
  }

  // Default: return empty array
  return [];
}