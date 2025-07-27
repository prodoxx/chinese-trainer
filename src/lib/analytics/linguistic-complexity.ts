/**
 * Linguistic complexity analysis for Chinese characters
 * Based on cognitive linguistics research
 */

// Common Chinese radicals and their semantic categories
const SEMANTIC_RADICALS: Record<string, string> = {
  '水': 'water', '氵': 'water',
  '火': 'fire', '灬': 'fire',
  '木': 'wood/tree',
  '金': 'metal', '钅': 'metal',
  '土': 'earth',
  '人': 'person', '亻': 'person',
  '心': 'heart/emotion', '忄': 'heart/emotion',
  '手': 'hand', '扌': 'hand',
  '口': 'mouth/speech',
  '目': 'eye/vision',
  '耳': 'ear/hearing',
  '足': 'foot', '⻊': 'foot',
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
};

// Phonetic components (common ones)
const PHONETIC_COMPONENTS = new Set([
  '青', '生', '正', '成', '争', '登', '朋', '明', '京', '亭',
  '丁', '令', '平', '并', '形', '呈', '星', '聲', '輕', '情',
  '清', '請', '晴', '静', '精', '睛', '圣', '征', '症', '整',
  '政', '証', '鄭', '訂', '听', '厅', '庁', '頂', '釘', '打',
]);

export interface CharacterComplexity {
  strokeCount: number;
  radicalCount: number;
  componentCount: number;
  isPhonetic: boolean;
  isSemantic: boolean;
  semanticCategory?: string;
  phoneticHint?: string;
  visualComplexity: number; // 0-1 scale
  frequency: number; // 1-5 scale (5 = most common)
}

/**
 * Analyze the linguistic complexity of a Chinese character
 */
export function analyzeCharacterComplexity(character: string): CharacterComplexity {
  // This is a simplified analysis - in production, you'd use a proper character database
  const charCode = character.charCodeAt(0);
  
  // Estimate stroke count (simplified heuristic)
  const strokeCount = estimateStrokeCount(character);
  
  // Detect radicals and components
  const components = detectComponents(character);
  const radicalInfo = detectRadical(character);
  
  return {
    strokeCount,
    radicalCount: radicalInfo.count,
    componentCount: components.length,
    isPhonetic: components.some(c => PHONETIC_COMPONENTS.has(c)),
    isSemantic: radicalInfo.hasSemantic,
    semanticCategory: radicalInfo.category,
    phoneticHint: components.find(c => PHONETIC_COMPONENTS.has(c)),
    visualComplexity: calculateVisualComplexity(strokeCount, components.length),
    frequency: estimateFrequency(character),
  };
}

/**
 * Calculate visual complexity based on strokes and components
 */
function calculateVisualComplexity(strokeCount: number, componentCount: number): number {
  // Normalize to 0-1 scale
  const strokeComplexity = Math.min(strokeCount / 20, 1); // 20+ strokes = max complexity
  const componentComplexity = Math.min(componentCount / 5, 1); // 5+ components = max
  
  return (strokeComplexity * 0.7 + componentComplexity * 0.3); // Weighted average
}

/**
 * Estimate character frequency (1-5 scale)
 */
function estimateFrequency(character: string): number {
  // Most common characters
  const highFreq = new Set(['的', '一', '是', '了', '我', '不', '人', '在', '有', '他', '这', '中', '大', '来', '上', '个', '地', '到', '说', '们']);
  const medHighFreq = new Set(['要', '时', '出', '会', '可', '也', '你', '对', '生', '能', '而', '子', '那', '得', '于', '好', '看', '天', '当', '然']);
  const medFreq = new Set(['小', '么', '多', '之', '去', '心', '学', '都', '好', '看', '起', '发', '成', '事', '只', '作', '方', '年', '还', '因']);
  
  if (highFreq.has(character)) return 5;
  if (medHighFreq.has(character)) return 4;
  if (medFreq.has(character)) return 3;
  
  // Check if it's a common radical
  if (Object.keys(SEMANTIC_RADICALS).includes(character)) return 3;
  
  return 2; // Default to low-medium frequency
}

/**
 * Detect semantic radical and category
 */
function detectRadical(character: string): { count: number; hasSemantic: boolean; category?: string } {
  let count = 0;
  let category: string | undefined;
  let hasSemantic = false;
  
  for (const [radical, cat] of Object.entries(SEMANTIC_RADICALS)) {
    if (character.includes(radical)) {
      count++;
      hasSemantic = true;
      category = cat;
    }
  }
  
  return { count, hasSemantic, category };
}

/**
 * Detect components in a character (simplified)
 */
function detectComponents(character: string): string[] {
  const components: string[] = [];
  
  // This is a simplified approach - in reality, you'd need a proper decomposition database
  // For now, check for common components
  const commonComponents = [
    ...Object.keys(SEMANTIC_RADICALS),
    ...Array.from(PHONETIC_COMPONENTS),
  ];
  
  for (const component of commonComponents) {
    if (character.includes(component) && component !== character) {
      components.push(component);
    }
  }
  
  return components;
}

/**
 * Estimate stroke count (simplified heuristic)
 */
function estimateStrokeCount(character: string): number {
  // This is a very rough estimate based on Unicode position
  // In production, use a proper stroke count database
  const code = character.charCodeAt(0);
  
  // Simple characters (1-5 strokes)
  if ('一二三四五六七八九十'.includes(character)) return character === '一' ? 1 : 2 + Math.floor(Math.random() * 3);
  
  // Check if it's a known radical
  if (Object.keys(SEMANTIC_RADICALS).includes(character)) {
    if ('人口日月'.includes(character)) return 2 + Math.floor(Math.random() * 2);
    if ('水火木金土'.includes(character)) return 4 + Math.floor(Math.random() * 2);
  }
  
  // Estimate based on visual complexity (very rough)
  const components = detectComponents(character);
  return Math.max(5, Math.min(20, 5 + components.length * 3));
}

/**
 * Calculate confusion probability between two characters
 */
export function calculateConfusionProbability(char1: string, char2: string): {
  visual: number;
  semantic: number;
  phonetic: number;
  total: number;
} {
  const comp1 = analyzeCharacterComplexity(char1);
  const comp2 = analyzeCharacterComplexity(char2);
  
  // Visual similarity (shared components)
  const sharedComponents = detectComponents(char1).filter(c => 
    detectComponents(char2).includes(c)
  );
  const visualSimilarity = sharedComponents.length > 0 ? 0.3 + (sharedComponents.length * 0.2) : 0;
  
  // Semantic similarity (same radical category)
  const semanticSimilarity = comp1.semanticCategory === comp2.semanticCategory && comp1.semanticCategory ? 0.4 : 0;
  
  // Phonetic similarity (shared phonetic component)
  const phoneticSimilarity = comp1.phoneticHint === comp2.phoneticHint && comp1.phoneticHint ? 0.5 : 0;
  
  // Total confusion probability
  const total = Math.min(1, visualSimilarity * 0.4 + semanticSimilarity * 0.3 + phoneticSimilarity * 0.3);
  
  return {
    visual: visualSimilarity,
    semantic: semanticSimilarity,
    phonetic: phoneticSimilarity,
    total,
  };
}

/**
 * Analyze learning difficulty based on multiple factors
 */
export function analyzeLearningDifficulty(
  character: string,
  userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): {
  difficulty: number; // 0-1 scale
  factors: {
    visualComplexity: number;
    frequencyScore: number;
    componentFamiliarity: number;
    semanticTransparency: number;
  };
  recommendations: string[];
} {
  const complexity = analyzeCharacterComplexity(character);
  
  // Calculate difficulty factors
  const visualComplexity = complexity.visualComplexity;
  const frequencyScore = 1 - (complexity.frequency - 1) / 4; // Invert: high frequency = low difficulty
  const componentFamiliarity = complexity.isPhonetic || complexity.isSemantic ? 0.3 : 0.7;
  const semanticTransparency = complexity.semanticCategory ? 0.2 : 0.6;
  
  // Adjust for user level
  const levelMultiplier = userLevel === 'beginner' ? 1.2 : userLevel === 'intermediate' ? 1 : 0.8;
  
  // Calculate overall difficulty
  const difficulty = Math.min(1, 
    (visualComplexity * 0.3 + 
     frequencyScore * 0.3 + 
     componentFamiliarity * 0.2 + 
     semanticTransparency * 0.2) * levelMultiplier
  );
  
  // Generate recommendations
  const recommendations: string[] = [];
  if (visualComplexity > 0.7) {
    recommendations.push('Break down character into components for easier memorization');
  }
  if (complexity.isPhonetic) {
    recommendations.push(`Use phonetic component "${complexity.phoneticHint}" as memory aid`);
  }
  if (complexity.semanticCategory) {
    recommendations.push(`Associate with ${complexity.semanticCategory} category`);
  }
  if (frequencyScore > 0.7) {
    recommendations.push('This is a less common character - focus on recognition first');
  }
  
  return {
    difficulty,
    factors: {
      visualComplexity,
      frequencyScore,
      componentFamiliarity,
      semanticTransparency,
    },
    recommendations,
  };
}