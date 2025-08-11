/**
 * Character Complexity Analyzer
 * Generates linguistic analysis data for Chinese characters
 * This replaces the deprecated CharacterAnalysis service
 */

import Dictionary from '@/lib/db/models/Dictionary';

export interface CharacterComplexityData {
  semanticCategory?: string;
  tonePattern?: string;
  strokeCount?: number;
  componentCount?: number;
  visualComplexity?: number;
  overallDifficulty?: number;
  radicals?: Array<{
    radical: string;
    category: string;
    position: string;
  }>;
  semanticFields?: string[];
  conceptType?: 'concrete' | 'abstract' | 'mixed';
  frequency?: number;
  contextExamples?: string[];
  collocations?: string[];
}

/**
 * Analyze character complexity and generate linguistic data
 */
export async function analyzeCharacterComplexity(
  hanzi: string,
  pinyin?: string,
  meaning?: string
): Promise<CharacterComplexityData> {
  const analysis: CharacterComplexityData = {};
  
  // Character length analysis
  const charLength = hanzi.length;
  
  // Estimate stroke count (basic heuristic - can be improved with a stroke database)
  analysis.strokeCount = estimateStrokeCount(hanzi);
  
  // Component count (for multi-character words)
  analysis.componentCount = charLength;
  
  // Tone pattern from pinyin
  if (pinyin) {
    analysis.tonePattern = extractTonePattern(pinyin);
  }
  
  // Semantic category based on meaning
  if (meaning) {
    analysis.semanticCategory = categorizeSemanticField(meaning);
    analysis.semanticFields = extractSemanticFields(meaning);
    analysis.conceptType = determineConceptType(meaning);
  }
  
  // Visual complexity (0-1 scale)
  analysis.visualComplexity = calculateVisualComplexity(analysis.strokeCount || 0, charLength);
  
  // Overall difficulty (0-1 scale)
  analysis.overallDifficulty = calculateOverallDifficulty(
    analysis.visualComplexity,
    analysis.strokeCount || 0,
    charLength
  );
  
  // Frequency (default to medium)
  analysis.frequency = 3;
  
  // Basic radicals analysis (can be enhanced with radical database)
  if (charLength === 1) {
    analysis.radicals = analyzeRadicals(hanzi);
  }
  
  return analysis;
}

/**
 * Estimate stroke count based on character complexity
 * This is a basic heuristic - ideally should use a stroke database
 */
function estimateStrokeCount(hanzi: string): number {
  // Basic estimation based on common characters
  const strokeMap: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '人': 2, '大': 3,
    '小': 3, '中': 4, '上': 3, '下': 3, '不': 4,
    '了': 2, '的': 8, '是': 9, '在': 6, '有': 6,
    '我': 7, '你': 7, '他': 5, '她': 6, '它': 5,
    '們': 10, '這': 10, '那': 6, '個': 10, '和': 8,
    '與': 13, '及': 3, '或': 8, '但': 7, '因': 6,
    '為': 9, '所': 8, '以': 5, '就': 12, '要': 9,
    '水': 4, '火': 4, '山': 3, '雨': 8, '風': 9,
    '雷': 13, '電': 13, '雪': 11, '雲': 12, '霧': 19,
    '房': 8, '間': 12, '門': 8, '窗': 12, '床': 7,
    '桌': 10, '椅': 12, '書': 10, '筆': 12, '紙': 10,
    '測': 12, '試': 13, '累': 11, '朋': 8, '友': 4,
    '愛': 13, '情': 11, '心': 4, '思': 9, '想': 13
  };
  
  // For single characters
  if (hanzi.length === 1) {
    return strokeMap[hanzi] || 8; // Default to 8 strokes if unknown
  }
  
  // For multi-character words, sum up the strokes
  let totalStrokes = 0;
  for (const char of hanzi) {
    totalStrokes += strokeMap[char] || 8;
  }
  return totalStrokes;
}

/**
 * Extract tone pattern from pinyin
 */
function extractTonePattern(pinyin: string): string {
  // Map tone marks to numbers
  const toneMarks: Record<string, string> = {
    'ā': '1', 'á': '2', 'ǎ': '3', 'à': '4',
    'ē': '1', 'é': '2', 'ě': '3', 'è': '4',
    'ī': '1', 'í': '2', 'ǐ': '3', 'ì': '4',
    'ō': '1', 'ó': '2', 'ǒ': '3', 'ò': '4',
    'ū': '1', 'ú': '2', 'ǔ': '3', 'ù': '4',
    'ǖ': '1', 'ǘ': '2', 'ǚ': '3', 'ǜ': '4',
    'Ā': '1', 'Á': '2', 'Ǎ': '3', 'À': '4',
    'Ē': '1', 'É': '2', 'Ě': '3', 'È': '4',
    'Ī': '1', 'Í': '2', 'Ǐ': '3', 'Ì': '4',
    'Ō': '1', 'Ó': '2', 'Ǒ': '3', 'Ò': '4',
    'Ū': '1', 'Ú': '2', 'Ǔ': '3', 'Ù': '4'
  };
  
  const tones: string[] = [];
  const syllables = pinyin.split(' ');
  
  for (const syllable of syllables) {
    let toneFound = false;
    for (const char of syllable) {
      if (toneMarks[char]) {
        tones.push(toneMarks[char]);
        toneFound = true;
        break;
      }
    }
    if (!toneFound && syllable.length > 0) {
      tones.push('5'); // Neutral tone
    }
  }
  
  return tones.join('-');
}

/**
 * Categorize semantic field based on meaning
 */
function categorizeSemanticField(meaning: string): string {
  const lowerMeaning = meaning.toLowerCase();
  
  // Common semantic categories
  if (lowerMeaning.includes('person') || lowerMeaning.includes('people') || 
      lowerMeaning.includes('man') || lowerMeaning.includes('woman')) {
    return 'person';
  }
  if (lowerMeaning.includes('place') || lowerMeaning.includes('location') || 
      lowerMeaning.includes('room') || lowerMeaning.includes('building')) {
    return 'place';
  }
  if (lowerMeaning.includes('time') || lowerMeaning.includes('day') || 
      lowerMeaning.includes('year') || lowerMeaning.includes('month')) {
    return 'time';
  }
  if (lowerMeaning.includes('number') || lowerMeaning.includes('quantity')) {
    return 'number';
  }
  if (lowerMeaning.includes('action') || lowerMeaning.includes('verb') || 
      lowerMeaning.includes('do') || lowerMeaning.includes('make')) {
    return 'action';
  }
  if (lowerMeaning.includes('object') || lowerMeaning.includes('thing')) {
    return 'object';
  }
  if (lowerMeaning.includes('nature') || lowerMeaning.includes('water') || 
      lowerMeaning.includes('fire') || lowerMeaning.includes('mountain')) {
    return 'nature';
  }
  if (lowerMeaning.includes('emotion') || lowerMeaning.includes('feel')) {
    return 'emotion';
  }
  
  return 'general';
}

/**
 * Extract semantic fields from meaning
 */
function extractSemanticFields(meaning: string): string[] {
  const fields: string[] = [];
  const lowerMeaning = meaning.toLowerCase();
  
  // Check for various semantic fields
  if (lowerMeaning.includes('daily') || lowerMeaning.includes('everyday')) {
    fields.push('daily life');
  }
  if (lowerMeaning.includes('food') || lowerMeaning.includes('eat')) {
    fields.push('food');
  }
  if (lowerMeaning.includes('family') || lowerMeaning.includes('relative')) {
    fields.push('family');
  }
  if (lowerMeaning.includes('work') || lowerMeaning.includes('job')) {
    fields.push('work');
  }
  if (lowerMeaning.includes('education') || lowerMeaning.includes('school')) {
    fields.push('education');
  }
  if (lowerMeaning.includes('technology') || lowerMeaning.includes('computer')) {
    fields.push('technology');
  }
  
  if (fields.length === 0) {
    fields.push('general');
  }
  
  return fields;
}

/**
 * Determine if concept is concrete or abstract
 */
function determineConceptType(meaning: string): 'concrete' | 'abstract' | 'mixed' {
  const lowerMeaning = meaning.toLowerCase();
  
  // Concrete indicators
  const concreteWords = ['object', 'thing', 'person', 'place', 'animal', 'plant', 
                         'building', 'room', 'water', 'fire', 'mountain', 'book'];
  
  // Abstract indicators  
  const abstractWords = ['emotion', 'feeling', 'thought', 'idea', 'concept', 
                        'love', 'hate', 'time', 'meaning', 'purpose'];
  
  let concreteScore = 0;
  let abstractScore = 0;
  
  for (const word of concreteWords) {
    if (lowerMeaning.includes(word)) concreteScore++;
  }
  
  for (const word of abstractWords) {
    if (lowerMeaning.includes(word)) abstractScore++;
  }
  
  if (concreteScore > abstractScore) return 'concrete';
  if (abstractScore > concreteScore) return 'abstract';
  if (concreteScore > 0 && abstractScore > 0) return 'mixed';
  
  return 'concrete'; // Default to concrete
}

/**
 * Calculate visual complexity based on strokes and character count
 */
function calculateVisualComplexity(strokeCount: number, charLength: number): number {
  // Normalize stroke count (1-30 strokes mapped to 0-1)
  const strokeComplexity = Math.min(strokeCount / 30, 1);
  
  // Multi-character penalty
  const lengthComplexity = Math.min(charLength / 4, 1);
  
  // Weighted average
  return strokeComplexity * 0.7 + lengthComplexity * 0.3;
}

/**
 * Calculate overall difficulty
 */
function calculateOverallDifficulty(
  visualComplexity: number,
  strokeCount: number,
  charLength: number
): number {
  // Factors that contribute to difficulty
  const factors = [
    visualComplexity * 0.4,           // Visual complexity weight
    Math.min(strokeCount / 20, 1) * 0.3,  // Stroke difficulty
    Math.min(charLength / 3, 1) * 0.3     // Length difficulty
  ];
  
  return factors.reduce((sum, factor) => sum + factor, 0);
}

/**
 * Basic radical analysis for single characters
 */
function analyzeRadicals(hanzi: string): Array<any> {
  // Common radicals mapping (simplified version)
  const radicalMap: Record<string, any> = {
    '水': { radical: '氵', category: 'water', position: 'left' },
    '火': { radical: '火', category: 'fire', position: 'whole' },
    '木': { radical: '木', category: 'wood', position: 'whole' },
    '金': { radical: '金', category: 'metal', position: 'whole' },
    '土': { radical: '土', category: 'earth', position: 'whole' },
    '心': { radical: '心', category: 'heart', position: 'whole' },
    '手': { radical: '扌', category: 'hand', position: 'left' },
    '口': { radical: '口', category: 'mouth', position: 'whole' },
    '人': { radical: '亻', category: 'person', position: 'left' },
    '言': { radical: '讠', category: 'speech', position: 'left' }
  };
  
  // Check if character contains known radicals
  for (const [char, radical] of Object.entries(radicalMap)) {
    if (hanzi.includes(char)) {
      return [radical];
    }
  }
  
  return [];
}