/**
 * Enhanced linguistic complexity analysis using dictionary data
 * Integrates CC-CEDICT data with cognitive linguistics research
 */

import Dictionary from '@/lib/db/models/Dictionary';
import connectDB from '@/lib/db/mongodb';

// Common Chinese radicals and their semantic categories
const SEMANTIC_RADICALS: Record<string, string> = {
  '水': 'water', '氵': 'water',
  '火': 'fire', '灬': 'fire',
  '木': 'nature/plant',
  '金': 'metal', '钅': 'metal',
  '土': 'earth',
  '人': 'person', '亻': 'person',
  '心': 'emotion', '忄': 'emotion', '⺗': 'emotion',
  '手': 'action', '扌': 'action',
  '口': 'mouth/speech',
  '目': 'eye/vision',
  '耳': 'ear/hearing',
  '足': 'foot/movement', '⻊': 'foot/movement',
  '言': 'speech', '讠': 'speech',
  '走': 'movement', '辶': 'movement',
  '食': 'food', '饣': 'food',
  '衣': 'clothing', '衤': 'clothing',
  '女': 'female',
  '子': 'child',
  '马': 'horse',
  '鸟': 'bird',
  '鱼': 'fish',
  '虫': 'insect',
  '犬': 'dog', '犭': 'animal',
  '艹': 'grass/plant',
  '石': 'stone',
  '日': 'sun/day',
  '月': 'moon/month',
  '雨': 'rain',
  '风': 'wind',
  '山': 'mountain',
  '田': 'field',
  '門': 'door', '门': 'door',
  '車': 'vehicle', '车': 'vehicle',
  '疒': 'illness',
  '頁': 'head', '页': 'head',
  '馬': 'horse',
  '鳥': 'bird',
  '魚': 'fish',
  '肉': 'body/flesh', '⺼': 'body/flesh',
  '骨': 'bone',
  '竹': 'bamboo',
  '米': 'rice/grain',
  '糸': 'silk/thread', '纟': 'silk/thread',
  '貝': 'shell/money', '贝': 'shell/money',
  '玉': 'jade/precious',
  '禾': 'grain',
  '示': 'spiritual', '礻': 'spiritual',
  '立': 'standing',
  '刀': 'knife', '刂': 'knife',
  '力': 'strength',
  '攵': 'action',
  '欠': 'lacking',
  '歹': 'death/bad',
  '殳': 'weapon',
  '气': 'air/breath',
  '皮': 'skin',
  '耒': 'plow',
  '老': 'old', '耂': 'old',
  '臣': 'minister',
  '西': 'west',
  '阜': 'hill', '阝': 'place',
  '隹': 'bird',
  '青': 'green/young',
  '韋': 'leather', '韦': 'leather',
  '酉': 'alcohol',
  '豆': 'bean',
  '谷': 'valley',
  '豕': 'pig',
  '貝': 'money', '贝': 'money',
  '镸': 'long',
  '門': 'door', '门': 'door',
  '臼': 'mortar',
  '鬼': 'ghost/spirit',
  '革': 'leather/change',
  '音': 'sound',
  '頁': 'page/head', '页': 'page/head',
  '髟': 'hair',
  '鬥': 'fight', '斗': 'fight',
  '高': 'tall',
  '馬': 'horse', '马': 'horse',
  '鹿': 'deer',
  '麻': 'hemp',
  '黃': 'yellow', '黄': 'yellow',
  '黑': 'black',
  '鼠': 'rat',
  '鼻': 'nose',
  '齊': 'even', '齐': 'even',
  '齒': 'tooth', '齿': 'tooth',
  '龍': 'dragon', '龙': 'dragon',
  '龜': 'turtle', '龟': 'turtle',
  '龠': 'flute'
};

// Tone patterns and their learning difficulty
const TONE_PATTERNS = {
  '1': { difficulty: 0.2, name: 'high level' },
  '2': { difficulty: 0.4, name: 'rising' },
  '3': { difficulty: 0.6, name: 'dipping' },
  '4': { difficulty: 0.3, name: 'falling' },
  '5': { difficulty: 0.1, name: 'neutral' },
};

export interface EnhancedCharacterComplexity {
  // Basic character info
  character: string;
  pinyin: string;
  definitions: string[];
  
  // Structural complexity
  strokeCount: number;
  radicalCount: number;
  componentCount: number;
  characterLength: number; // 1 for single, 2+ for compounds
  
  // Linguistic features
  isPhonetic: boolean;
  isSemantic: boolean;
  semanticCategory?: string;
  phoneticComponent?: string;
  tonePattern: string;
  toneDifficulty: number;
  
  // Semantic analysis
  semanticFields: string[]; // e.g., ['emotion', 'positive']
  concreteAbstract: 'concrete' | 'abstract' | 'mixed';
  polysemy: number; // Number of distinct meanings
  
  // Frequency and usage
  frequency: number; // 1-5 scale from dictionary occurrence
  contextDiversity: number; // How many different contexts it appears in
  
  // Learning metrics
  visualComplexity: number; // 0-1 scale
  phoneticTransparency: number; // 0-1 scale
  semanticTransparency: number; // 0-1 scale
  overallDifficulty: number; // 0-1 scale
}

/**
 * Analyze character complexity using dictionary data
 */
export async function analyzeCharacterWithDictionary(
  character: string
): Promise<EnhancedCharacterComplexity> {
  await connectDB();
  
  // Look up in dictionary
  const dictEntry = await Dictionary.findOne({ traditional: character });
  
  // Extract pinyin tones
  const pinyin = dictEntry?.pinyin || '';
  const tonePattern = extractTonePattern(pinyin);
  const toneDifficulty = calculateToneDifficulty(tonePattern);
  
  // Analyze definitions for semantic fields
  const definitions = dictEntry?.definitions || [];
  const semanticAnalysis = analyzeSemanticFields(definitions);
  
  // Detect components and radicals
  const components = detectComponentsWithContext(character, definitions);
  const radicalInfo = detectSemanticRadical(character);
  
  // Calculate various complexity scores
  const strokeCount = await getStrokeCount(character);
  const visualComplexity = calculateVisualComplexity(strokeCount, components.length, character.length);
  const phoneticTransparency = calculatePhoneticTransparency(character, pinyin, components);
  const semanticTransparency = calculateSemanticTransparency(radicalInfo, semanticAnalysis);
  
  // Calculate frequency from dictionary coverage
  const frequency = await calculateFrequencyScore(character);
  const contextDiversity = definitions.length;
  
  // Overall difficulty combines all factors
  const overallDifficulty = calculateOverallDifficulty({
    visualComplexity,
    phoneticTransparency,
    semanticTransparency,
    toneDifficulty,
    frequency,
    contextDiversity,
  });
  
  return {
    character,
    pinyin,
    definitions,
    strokeCount,
    radicalCount: radicalInfo.count,
    componentCount: components.length,
    characterLength: character.length,
    isPhonetic: components.some(c => c.isPhonetic),
    isSemantic: radicalInfo.hasSemantic,
    semanticCategory: radicalInfo.category,
    phoneticComponent: components.find(c => c.isPhonetic)?.component,
    tonePattern,
    toneDifficulty,
    semanticFields: semanticAnalysis.fields,
    concreteAbstract: semanticAnalysis.abstractness,
    polysemy: semanticAnalysis.polysemy,
    frequency,
    contextDiversity,
    visualComplexity,
    phoneticTransparency,
    semanticTransparency,
    overallDifficulty,
  };
}

/**
 * Extract tone pattern from pinyin
 */
function extractTonePattern(pinyin: string): string {
  return pinyin.match(/[1-5]/g)?.join('') || '';
}

/**
 * Calculate tone difficulty based on pattern
 */
function calculateToneDifficulty(tonePattern: string): number {
  if (!tonePattern) return 0.5;
  
  const tones = tonePattern.split('');
  const avgDifficulty = tones.reduce((sum, tone) => 
    sum + (TONE_PATTERNS[tone as keyof typeof TONE_PATTERNS]?.difficulty || 0.5), 0
  ) / tones.length;
  
  // Tone sandhi rules make certain combinations harder
  if (tonePattern.includes('33')) return Math.min(1, avgDifficulty + 0.2); // 3rd tone sandhi
  if (tonePattern.includes('214')) return Math.min(1, avgDifficulty + 0.1); // Complex pattern
  
  return avgDifficulty;
}

/**
 * Analyze semantic fields from definitions
 */
function analyzeSemanticFields(definitions: string[]): {
  fields: string[];
  abstractness: 'concrete' | 'abstract' | 'mixed';
  polysemy: number;
} {
  const fields: Set<string> = new Set();
  let concreteCount = 0;
  let abstractCount = 0;
  
  // Keywords for semantic field detection
  const fieldKeywords = {
    emotion: /feel|emotion|mood|happy|sad|angry|love|hate/i,
    movement: /walk|run|go|come|move|travel/i,
    cognition: /think|know|understand|learn|remember/i,
    communication: /say|speak|tell|ask|write/i,
    perception: /see|hear|look|listen|feel|touch/i,
    time: /time|day|year|month|hour|past|future/i,
    space: /place|location|up|down|left|right|front|back/i,
    quantity: /number|many|few|more|less|count/i,
    social: /person|people|friend|family|society/i,
    nature: /water|fire|tree|mountain|sky|earth/i,
  };
  
  // Keywords for concrete vs abstract
  const concreteKeywords = /object|thing|tool|animal|plant|building|food|body/i;
  const abstractKeywords = /concept|idea|theory|emotion|quality|state|relationship/i;
  
  definitions.forEach(def => {
    // Detect semantic fields
    for (const [field, pattern] of Object.entries(fieldKeywords)) {
      if (pattern.test(def)) {
        fields.add(field);
      }
    }
    
    // Detect abstractness
    if (concreteKeywords.test(def)) concreteCount++;
    if (abstractKeywords.test(def)) abstractCount++;
  });
  
  // Determine overall abstractness
  const abstractness = 
    concreteCount > abstractCount ? 'concrete' :
    abstractCount > concreteCount ? 'abstract' : 'mixed';
  
  // Polysemy is indicated by diverse definitions
  const polysemy = Math.min(5, definitions.length);
  
  return {
    fields: Array.from(fields),
    abstractness,
    polysemy,
  };
}

/**
 * Detect components with linguistic context
 */
function detectComponentsWithContext(
  character: string, 
  _definitions: string[]
): Array<{ component: string; isPhonetic: boolean; isRadical: boolean }> {
  const components: Array<{ component: string; isPhonetic: boolean; isRadical: boolean }> = [];
  
  // Check for semantic radicals
  for (const [radical] of Object.entries(SEMANTIC_RADICALS)) {
    if (character.includes(radical) && radical !== character) {
      components.push({
        component: radical,
        isPhonetic: false,
        isRadical: true,
      });
    }
  }
  
  // Check for common phonetic components based on character patterns
  // This is simplified - ideally use a character decomposition database
  const phoneticPatterns = {
    '青': ['清', '晴', '請', '情', '精', '靜'],
    '生': ['性', '姓', '星'],
    '方': ['房', '防', '訪', '放'],
    '工': ['江', '紅', '空', '功'],
    '包': ['抱', '飽', '泡', '跑'],
  };
  
  for (const [phonetic, variants] of Object.entries(phoneticPatterns)) {
    if (variants.includes(character) || character.includes(phonetic)) {
      components.push({
        component: phonetic,
        isPhonetic: true,
        isRadical: false,
      });
    }
  }
  
  return components;
}

/**
 * Detect semantic radical with category
 */
function detectSemanticRadical(character: string): {
  count: number;
  hasSemantic: boolean;
  category?: string;
} {
  let count = 0;
  let categories: Set<string> = new Set();
  let hasSemantic = false;
  
  // For compound words, check each character separately
  const chars = character.split('');
  
  for (const char of chars) {
    for (const [radical, cat] of Object.entries(SEMANTIC_RADICALS)) {
      if (char.includes(radical)) {
        count++;
        hasSemantic = true;
        categories.add(cat);
      }
    }
  }
  
  // Return the most relevant category
  // For emotions, prioritize emotion category
  let category: string | undefined;
  if (categories.has('emotion')) {
    category = 'emotion';
  } else if (categories.size > 0) {
    category = Array.from(categories)[0];
  }
  
  return { count, hasSemantic, category };
}

/**
 * Get actual stroke count from dictionary or estimation
 */
async function getStrokeCount(character: string): Promise<number> {
  // In production, this would query a stroke count database
  // For now, use character length and complexity as proxy
  
  // Single characters
  if (character.length === 1) {
    // Simple characters
    if ('一二三四五六七八九十'.includes(character)) {
      return '一二三'.includes(character) ? character.length : 2 + Math.floor(Math.random() * 3);
    }
    
    // Estimate based on visual density
    const components = detectComponentsWithContext(character, []);
    return Math.max(4, Math.min(20, 5 + components.length * 4));
  }
  
  // Multi-character words - sum of components
  let totalStrokes = 0;
  for (const char of character) {
    totalStrokes += await getStrokeCount(char);
  }
  return totalStrokes;
}

/**
 * Calculate visual complexity
 */
function calculateVisualComplexity(
  strokeCount: number,
  componentCount: number,
  characterLength: number
): number {
  // Normalize stroke count (5-15 strokes is typical range)
  const strokeComplexity = Math.min(1, Math.max(0, (strokeCount - 5) / 10));
  
  // Component complexity
  const componentComplexity = Math.min(1, componentCount / 4);
  
  // Length penalty for multi-character words
  const lengthPenalty = (characterLength - 1) * 0.1;
  
  return Math.min(1, strokeComplexity * 0.5 + componentComplexity * 0.3 + lengthPenalty * 0.2);
}

/**
 * Calculate phonetic transparency
 */
function calculatePhoneticTransparency(
  character: string,
  pinyin: string,
  components: Array<{ component: string; isPhonetic: boolean }>
): number {
  const phoneticComponent = components.find(c => c.isPhonetic);
  if (!phoneticComponent) return 0;
  
  // Check if phonetic component sounds similar to character
  // This is simplified - ideally compare actual pronunciations
  return 0.7; // Placeholder - would need phonetic similarity calculation
}

/**
 * Calculate semantic transparency
 */
function calculateSemanticTransparency(
  radicalInfo: { hasSemantic: boolean; category?: string },
  semanticAnalysis: { fields: string[] }
): number {
  if (!radicalInfo.hasSemantic) return 0;
  
  // Check if radical category matches semantic fields
  const radicalMatchesFields = radicalInfo.category && 
    semanticAnalysis.fields.some(field => 
      field.toLowerCase().includes(radicalInfo.category!.toLowerCase()) ||
      radicalInfo.category!.toLowerCase().includes(field.toLowerCase())
    );
  
  return radicalMatchesFields ? 0.8 : 0.4;
}

/**
 * Calculate frequency score from dictionary data
 */
async function calculateFrequencyScore(character: string): Promise<number> {
  // Count occurrences in dictionary definitions
  const count = await Dictionary.countDocuments({
    $or: [
      { traditional: { $regex: character } },
      { definitions: { $elemMatch: { $regex: character } } }
    ]
  });
  
  // Normalize to 1-5 scale
  if (count > 1000) return 5;
  if (count > 500) return 4;
  if (count > 100) return 3;
  if (count > 10) return 2;
  return 1;
}

/**
 * Calculate overall learning difficulty
 */
function calculateOverallDifficulty(factors: {
  visualComplexity: number;
  phoneticTransparency: number;
  semanticTransparency: number;
  toneDifficulty: number;
  frequency: number;
  contextDiversity: number;
}): number {
  const {
    visualComplexity,
    phoneticTransparency,
    semanticTransparency,
    toneDifficulty,
    frequency,
    contextDiversity,
  } = factors;
  
  // Normalize frequency (high frequency = lower difficulty)
  const frequencyDifficulty = 1 - (frequency - 1) / 4;
  
  // Normalize context diversity (more contexts = harder)
  const contextDifficulty = Math.min(1, contextDiversity / 10);
  
  // Transparency reduces difficulty
  const transparencyBonus = (phoneticTransparency + semanticTransparency) / 2;
  
  // Weighted combination
  const difficulty = 
    visualComplexity * 0.25 +
    toneDifficulty * 0.15 +
    frequencyDifficulty * 0.20 +
    contextDifficulty * 0.15 +
    (1 - transparencyBonus) * 0.25;
  
  return Math.min(1, Math.max(0, difficulty));
}

/**
 * Compare two characters for confusion probability using dictionary data
 */
export async function calculateEnhancedConfusionProbability(
  char1: string,
  char2: string
): Promise<{
  visual: number;
  semantic: number;
  phonetic: number;
  tonal: number;
  total: number;
}> {
  const [analysis1, analysis2] = await Promise.all([
    analyzeCharacterWithDictionary(char1),
    analyzeCharacterWithDictionary(char2),
  ]);
  
  // Visual similarity based on shared components
  const sharedComponents = analysis1.componentCount > 0 && analysis2.componentCount > 0
    ? 0.3 : 0;
  const visualSimilarity = sharedComponents;
  
  // Semantic similarity based on shared fields
  const sharedFields = analysis1.semanticFields.filter(f => 
    analysis2.semanticFields.includes(f)
  );
  const semanticSimilarity = sharedFields.length > 0 
    ? Math.min(0.8, sharedFields.length * 0.3) : 0;
  
  // Phonetic similarity based on pinyin
  const pinyinSimilarity = calculatePinyinSimilarity(
    analysis1.pinyin,
    analysis2.pinyin
  );
  
  // Tonal similarity
  const tonalSimilarity = analysis1.tonePattern === analysis2.tonePattern ? 0.5 : 0;
  
  // Total confusion probability
  const total = Math.min(1,
    visualSimilarity * 0.3 +
    semanticSimilarity * 0.2 +
    pinyinSimilarity * 0.3 +
    tonalSimilarity * 0.2
  );
  
  return {
    visual: visualSimilarity,
    semantic: semanticSimilarity,
    phonetic: pinyinSimilarity,
    tonal: tonalSimilarity,
    total,
  };
}

/**
 * Calculate pinyin similarity
 */
function calculatePinyinSimilarity(pinyin1: string, pinyin2: string): number {
  if (pinyin1 === pinyin2) return 1;
  
  // Remove tones for comparison
  const base1 = pinyin1.replace(/[1-5]/g, '');
  const base2 = pinyin2.replace(/[1-5]/g, '');
  
  if (base1 === base2) return 0.7; // Same sound, different tone
  
  // Check for similar initials or finals
  // This is simplified - ideally use phonetic distance metrics
  const initial1 = base1.match(/^[bcdfghjklmnpqrstwxyz]+/)?.[0] || '';
  const initial2 = base2.match(/^[bcdfghjklmnpqrstwxyz]+/)?.[0] || '';
  
  if (initial1 === initial2 && initial1) return 0.4;
  
  return 0;
}