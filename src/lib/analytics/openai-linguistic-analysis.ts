/**
 * OpenAI-enhanced linguistic analysis for deeper character insights
 */

import OpenAI from 'openai';
import { analyzeCharacterWithDictionary } from './enhanced-linguistic-complexity';
import type { EnhancedCharacterComplexity } from './enhanced-linguistic-complexity';

// Initialize OpenAI client with error checking
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

if (!openai && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️ OpenAI API key not configured - AI insights will not be available');
}

export interface ComprehensiveCharacterAnalysis {
  character: string;
  pinyin: string;
  semanticCategory: string;
  semanticFields: string[];
  conceptType: 'concrete' | 'abstract' | 'mixed';
  radicals: Array<{
    radical: string;
    category: string;
    position: string;
  }>;
  tonePattern: string;
  toneDescription: string;
  strokeCount: number;
  componentCount: number;
  visualComplexity: number;
  etymology: string;
  mnemonics: string[];
  commonConfusions: Array<{
    character: string;
    reason: string;
    similarity: number;
  }>;
  contextExamples: string[];
  collocations: string[];
  comprehensiveAnalysisPrompt?: string;
  confusionGenerationPrompt?: string;
}

export interface DeepLinguisticAnalysis extends EnhancedCharacterComplexity {
  // Etymology and history
  etymology?: {
    origin: string;
    evolution: string[];
    culturalContext: string;
  };
  
  // Memory aids
  mnemonics: {
    visual: string;
    story: string;
    components: string;
  };
  
  // Common errors and confusions
  commonErrors: {
    similarCharacters: string[];
    wrongContexts: string[];
    toneConfusions: string[];
  };
  
  // Usage patterns
  usage: {
    commonCollocations: string[];
    registerLevel: 'formal' | 'informal' | 'neutral' | 'literary';
    frequency: 'high' | 'medium' | 'low';
    domains: string[]; // business, daily life, academic, etc.
  };
  
  // Learning recommendations
  learningTips: {
    forBeginners: string[];
    forIntermediate: string[];
    forAdvanced: string[];
  };
  
  // The prompt used for linguistic analysis
  linguisticAnalysisPrompt?: string;
}

/**
 * Enhance character analysis with OpenAI insights
 */
export async function analyzeCharacterWithOpenAI(
  character: string,
  userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): Promise<DeepLinguisticAnalysis> {
  // First get base analysis from dictionary
  const baseAnalysis = await analyzeCharacterWithDictionary(character);
  
  // Check if OpenAI is available
  if (!openai) {
    console.warn(`⚠️ OpenAI not available for character ${character} - returning base analysis only`);
    throw new Error('OpenAI API key not configured');
  }
  
  try {
    // Create a comprehensive prompt for linguistic analysis
    const prompt = `Analyze the Traditional Chinese character "${character}" (${baseAnalysis.pinyin}) with meanings: ${baseAnalysis.definitions.join(', ')} for Taiwan Mandarin (臺灣國語) learners.

IMPORTANT RULES:
1. This is for Taiwan Mandarin, NOT Mainland Mandarin. Use Traditional Chinese characters and Taiwan-specific pronunciations, vocabulary, and cultural contexts.
2. ALWAYS use pinyin with tone marks (e.g., fáng jiān), NEVER tone numbers (e.g., fang2 jian1)
3. When mentioning ANY Chinese character, include its pinyin with tone marks in parentheses
   Example: 房 (fáng), 間 (jiān), NOT 房 (fang2), 間 (jian1)

Provide a detailed linguistic analysis in JSON format with the following structure:

{
  "etymology": {
    "origin": "Brief explanation of character origin - MUST use pinyin with tone marks",
    "evolution": ["Stage 1", "Stage 2", "Modern form"],
    "culturalContext": "Cultural significance or usage context in Taiwan"
  },
  "mnemonics": {
    "visual": "Visual memory aid based on character shape",
    "story": "Story-based mnemonic incorporating meaning",
    "components": "How components relate to meaning - use pinyin with tone marks"
  },
  "commonErrors": {
    "similarCharacters": ["Format: '房子 (fáng zi) - house - [reason]'", "Max 3 items", "EXCLUDE ${character}"],
    "wrongContexts": ["Common misuse contexts"],
    "toneConfusions": ["Characters with same sound but different tones - use tone marks, e.g., '方 (fāng) - square'. EXCLUDE ${character} itself"]
  },
  "usage": {
    "commonCollocations": ["Common word combinations with pinyin tone marks - e.g., '臥房 (wò fáng) - bedroom'"],
    "registerLevel": "formal, informal, neutral, or literary (choose one)",
    "frequency": "high/medium/low",
    "domains": ["Areas where commonly used"]
  },
  "learningTips": {
    "forBeginners": ["Tips for beginners - use pinyin with tone marks when mentioning characters"],
    "forIntermediate": ["Tips for intermediate learners"],
    "forAdvanced": ["Advanced usage tips"]
  }
}

Consider the character's:
- Radical: ${baseAnalysis.semanticCategory || 'none identified'}
- Components: ${baseAnalysis.componentCount} components
- Tone pattern: ${baseAnalysis.tonePattern}
- Semantic fields: ${baseAnalysis.semanticFields.join(', ')}

Focus on practical learning aids and common confusion points.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Taiwan Mandarin (臺灣國語) and Traditional Chinese linguistics expert helping create comprehensive learning materials. Provide accurate, pedagogically sound analysis specific to Taiwan Mandarin usage, pronunciation, and cultural context. CRITICAL: Always use pinyin with tone marks (ā, á, ǎ, à, ē, é, ě, è, etc.) and NEVER tone numbers (a1, a2, a3, a4). Example: Use "fáng jiān" NOT "fang2 jian1".',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 1500, // Increased to prevent truncation
      response_format: { type: 'json_object' },
    });

    // Safely parse the response with error handling
    let aiAnalysis: any = {};
    try {
      const content = response.choices[0]?.message?.content;
      if (content) {
        // Try to fix common JSON issues
        let fixedContent = content;
        
        // Check if the JSON might be truncated (doesn't end with })
        if (!fixedContent.trim().endsWith('}')) {
          console.warn(`OpenAI response appears truncated for ${character}, attempting to fix...`);
          // Try to close any open structures
          const openBraces = (fixedContent.match(/{/g) || []).length;
          const closeBraces = (fixedContent.match(/}/g) || []).length;
          const openBrackets = (fixedContent.match(/\[/g) || []).length;
          const closeBrackets = (fixedContent.match(/\]/g) || []).length;
          
          // Add missing brackets
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            fixedContent += ']';
          }
          // Add missing braces
          for (let i = 0; i < openBraces - closeBraces; i++) {
            fixedContent += '}';
          }
        }
        
        aiAnalysis = JSON.parse(fixedContent);
      }
    } catch (parseError) {
      console.error(`Failed to parse OpenAI response for ${character}:`, parseError);
      console.error('Raw response:', response.choices[0]?.message?.content?.substring(0, 500));
      // Return empty analysis rather than throwing
      aiAnalysis = {};
    }
    
    // Validate and fix registerLevel
    const validRegisterLevels = ['formal', 'informal', 'neutral', 'literary'];
    let registerLevel = aiAnalysis.usage?.registerLevel || 'neutral';
    
    // Handle cases where AI returns multiple values like "neutral/informal"
    if (registerLevel.includes('/')) {
      // Take the first valid option
      const options = registerLevel.split('/');
      registerLevel = options.find((opt: string) => validRegisterLevels.includes(opt.trim())) || 'neutral';
    }
    
    // Ensure it's a valid value
    if (!validRegisterLevels.includes(registerLevel)) {
      console.warn(`Invalid registerLevel "${registerLevel}" for character ${character}, defaulting to neutral`);
      registerLevel = 'neutral';
    }
    
    // Merge AI insights with base analysis
    return {
      ...baseAnalysis,
      etymology: aiAnalysis.etymology,
      mnemonics: aiAnalysis.mnemonics,
      commonErrors: aiAnalysis.commonErrors,
      usage: {
        ...aiAnalysis.usage,
        registerLevel,
      },
      learningTips: aiAnalysis.learningTips,
      linguisticAnalysisPrompt: prompt, // Include the prompt used
    };
  } catch (error) {
    console.error('OpenAI analysis error:', error);
    
    // Return base analysis with placeholder deep insights
    return {
      ...baseAnalysis,
      mnemonics: {
        visual: `Break down ${character} into its components`,
        story: `Create a story linking the meaning "${baseAnalysis.definitions[0]}" to the character shape`,
        components: 'Study how each component contributes to the meaning',
      },
      commonErrors: {
        similarCharacters: [],
        wrongContexts: [],
        toneConfusions: [],
      },
      usage: {
        commonCollocations: [],
        registerLevel: 'neutral',
        frequency: 'medium',
        domains: ['general'],
      },
      learningTips: {
        forBeginners: ['Focus on recognition before production'],
        forIntermediate: ['Practice in context with common collocations'],
        forAdvanced: ['Explore literary and formal usage'],
      },
    };
  }
}

/**
 * Generate personalized learning path for a character
 */
export async function generateLearningPath(
  character: string,
  userProfile: {
    level: 'beginner' | 'intermediate' | 'advanced';
    nativeLanguage: string;
    learningGoals: string[];
    previousErrors: string[];
  }
): Promise<{
  steps: Array<{
    stage: string;
    focus: string;
    activities: string[];
    duration: string;
  }>;
  relatedCharacters: string[];
  prerequisites: string[];
}> {
  const analysis = await analyzeCharacterWithOpenAI(character, userProfile.level);
  
  const prompt = `Create a personalized learning path for the Chinese character "${character}" for a ${userProfile.level} learner.

Character info:
- Meanings: ${analysis.definitions.join(', ')}
- Difficulty: ${analysis.overallDifficulty}
- Common errors: ${analysis.commonErrors.similarCharacters.join(', ')}

Learner profile:
- Native language: ${userProfile.nativeLanguage}
- Goals: ${userProfile.learningGoals.join(', ')}
- Previous errors: ${userProfile.previousErrors.join(', ')}

Provide a structured learning path in JSON format:
{
  "steps": [
    {
      "stage": "Recognition",
      "focus": "What to focus on",
      "activities": ["Activity 1", "Activity 2"],
      "duration": "10 minutes"
    }
  ],
  "relatedCharacters": ["Characters to learn together"],
  "prerequisites": ["Characters/concepts to master first"]
}`;

  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Taiwan Mandarin (臺灣國語) language learning expert creating personalized study plans for Traditional Chinese characters. Focus on Taiwan-specific usage and cultural contexts.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error('Failed to generate learning path:', error);
    
    // Fallback learning path
    return {
      steps: [
        {
          stage: 'Recognition',
          focus: 'Visual recognition and basic meaning',
          activities: ['Flash cards', 'Character matching'],
          duration: '10 minutes',
        },
        {
          stage: 'Comprehension',
          focus: 'Understanding in context',
          activities: ['Read example sentences', 'Context guessing'],
          duration: '15 minutes',
        },
        {
          stage: 'Production',
          focus: 'Active use',
          activities: ['Write sentences', 'Speaking practice'],
          duration: '20 minutes',
        },
      ],
      relatedCharacters: analysis.commonErrors.similarCharacters,
      prerequisites: [],
    };
  }
}

/**
 * Analyze confusion patterns between characters using AI
 */
export async function analyzeConfusionPatterns(
  characters: string[],
  errorHistory: Array<{ correct: string; selected: string; context?: string }>
): Promise<{
  patterns: Array<{
    type: 'visual' | 'phonetic' | 'semantic' | 'contextual';
    description: string;
    examples: Array<{ char1: string; char2: string; reason: string }>;
    remediation: string;
  }>;
  recommendations: string[];
}> {
  const prompt = `Analyze confusion patterns in Chinese character learning based on these errors:

Characters in deck: ${characters.join(', ')}
Error history: ${errorHistory.map(e => `Confused ${e.correct} with ${e.selected}`).join('; ')}

Identify:
1. Pattern types (visual similarity, phonetic confusion, semantic overlap, contextual misuse)
2. Specific character pairs that are confused
3. Remediation strategies

Provide analysis in JSON format.`;

  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Taiwan Mandarin (臺灣國語) and Traditional Chinese character learning and error analysis. Focus on Taiwan-specific pronunciation, usage patterns, and common errors.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const content = response.choices[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    // Fallback
    return {
      patterns: [],
      recommendations: ['Review confusing character pairs together', 'Focus on distinguishing features'],
    };
  } catch (error) {
    console.error('Confusion analysis error:', error);
    return {
      patterns: [],
      recommendations: ['Practice with similar characters', 'Use mnemonic devices'],
    };
  }
}

/**
 * Generate contextual examples for character learning
 */
export async function generateContextualExamples(
  character: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 3
): Promise<Array<{
  sentence: string;
  pinyin: string;
  translation: string;
  keyPoints: string[];
}>> {
  const prompt = `Generate ${count} ${difficulty} example sentences for learning the Chinese character "${character}".

Requirements:
- Difficulty level: ${difficulty}
- Include pinyin with tone marks
- Natural, practical sentences
- Highlight key learning points

Format each example as:
{
  "sentence": "Chinese sentence",
  "pinyin": "Pinyin with tone marks",
  "translation": "English translation",
  "keyPoints": ["Learning point 1", "Learning point 2"]
}

Return as JSON array.`;

  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Taiwan Mandarin (臺灣國語) language teacher creating educational example sentences using Traditional Chinese characters. Use vocabulary and contexts relevant to Taiwan.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.6,
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{"examples": []}');
    return result.examples || [];
  } catch (error) {
    console.error('Failed to generate examples:', error);
    return [];
  }
}

export async function analyzeCharacterComprehensively(
  character: string,
  pinyin: string,
  meaning: string
): Promise<ComprehensiveCharacterAnalysis> {
  const prompt = `Analyze this Traditional Chinese character/word comprehensively for Taiwan Mandarin language learning:

Character: ${character} (Traditional Chinese)
Pinyin: ${pinyin} (Taiwan Mandarin pronunciation)
Meaning: ${meaning}

CRITICAL RULES:
1. This is for Taiwan Mandarin (臺灣國語), NOT Mainland Mandarin. Use Traditional Chinese characters and Taiwan-specific pronunciations.
2. ACCURACY IS PARAMOUNT: Never confuse similar characters. For example:
   - 友 (yǒu) means "friend" - NOT to be confused with 有 (yǒu) meaning "to have"
   - 朋友 (péng yǒu) means "friend" - composed of 朋(péng) + 友(yǒu), NOT 朋 + 有
   - IMPORTANT: 朋友 does NOT contain the character 有 (to have). It contains 友 (friend).
3. ALWAYS include pinyin with tone marks when mentioning Chinese characters in explanations.
   Format: character(pinyin) - Example: 朋(péng), 友(yǒu), 有(yǒu)
4. When analyzing etymology or components, verify each character is correct:
   - Look at the actual visual components of the character
   - Do not assume characters based on pronunciation
   - 友 and 有 are DIFFERENT characters despite same pronunciation
5. Double-check every character you reference to ensure accuracy.

IMPORTANT: If analyzing a multi-character word (e.g., 朋友), analyze the WHOLE WORD, not imaginary components.
For 朋友: It consists of 朋(péng) + 友(yǒu), NOT 朋 + 有. Both characters mean "friend".

Provide a detailed JSON analysis with these exact fields:
{
  "character": "${character}",
  "pinyin": "${pinyin}",
  "semanticCategory": "single most relevant category (e.g., emotion, nature, action, person, object, abstract concept)",
  "semanticFields": ["array of related semantic domains"],
  "conceptType": "concrete/abstract/mixed",
  "radicals": [
    {
      "radical": "the radical character (for single characters) or 'N/A' for multi-character words",
      "category": "what this radical represents",
      "position": "left/right/top/bottom/enclosure"
    }
  ],
  "tonePattern": "e.g., 2-5 for second tone + neutral tone",
  "toneDescription": "e.g., rising + neutral",
  "strokeCount": number,
  "componentCount": number of distinct components,
  "visualComplexity": 0-1 scale,
  "etymology": "explanation of character/word origin - MUST include pinyin WITH TONE MARKS in parentheses for EVERY Chinese character mentioned. Example format: 朋(péng) means friend. NOT: 朋 means friend or 朋(peng2)",
  "mnemonics": ["memory aids - MUST include pinyin WITH TONE MARKS in parentheses for EVERY Chinese character. Example: The character 月(yuè) looks like a moon"],
  "commonConfusions": [
    {
      "character": "similar character that is DIFFERENT from ${character} - NEVER include ${character} itself",
      "reason": "why they're confused",
      "similarity": 0-1 scale
    }
  ],
  "contextExamples": ["example sentences using this character"],
  "collocations": ["common word combinations"]
}

CRITICAL for commonConfusions:
- NEVER include "${character}" itself in the list
- For multi-character words like 房間, suggest OTHER complete words (e.g., 時間, 空間), NOT components (房, 間)
- Each confusion must be a DIFFERENT character/word from "${character}"

Be accurate and educational. Every Chinese character mentioned MUST include its pinyin in parentheses.`;

  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert in Taiwan Mandarin (臺灣國語) and Traditional Chinese linguistics. Provide accurate, detailed character analysis for learners. CRITICAL: Never confuse similar characters (e.g., 友(yǒu) friend vs 有(yǒu) have). The word 朋友 is composed of 朋(péng) + 友(yǒu) NOT 朋 + 有. Always include pinyin with tone marks when mentioning ANY Chinese character in your explanations, using the format: character(pinyin). Verify visual components - do not assume based on pronunciation. Double-check character accuracy before responding."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from OpenAI');

    const result = JSON.parse(response) as ComprehensiveCharacterAnalysis;
    
    // Post-process to ensure the character itself is never in commonConfusions
    if (result.commonConfusions && Array.isArray(result.commonConfusions)) {
      result.commonConfusions = result.commonConfusions.filter(confusion => {
        // Remove if it's the same character
        if (confusion.character === character) {
          console.log(`Filtering out self-reference: ${character} from commonConfusions`);
          return false;
        }
        // For multi-character words, also filter out single-character components
        if (character.length > 1 && confusion.character.length === 1) {
          if (character.includes(confusion.character)) {
            console.log(`Filtering out component: ${confusion.character} from ${character}`);
            return false;
          }
        }
        return true;
      });
    }
    
    // Save the prompt used for this analysis
    result.comprehensiveAnalysisPrompt = prompt;
    
    return result;
  } catch (error) {
    console.error('OpenAI character analysis error:', error);
    // Return basic analysis as fallback
    const tones = pinyin.match(/[1-5]/g);
    const tonePattern = tones ? tones.join('-') : '';
    
    return {
      character,
      pinyin,
      semanticCategory: 'unknown',
      semanticFields: [],
      conceptType: 'mixed',
      radicals: [],
      tonePattern,
      toneDescription: 'unknown',
      strokeCount: character.length * 10, // rough estimate
      componentCount: character.length,
      visualComplexity: 0.5,
      etymology: 'Analysis unavailable',
      mnemonics: [],
      commonConfusions: [],
      contextExamples: [],
      collocations: []
    };
  }
}