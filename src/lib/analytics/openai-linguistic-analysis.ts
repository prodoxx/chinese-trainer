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

CRITICAL RULES:
1. This is for Taiwan Mandarin, NOT Mainland Mandarin. Use ONLY Traditional Chinese characters (繁體字), NEVER Simplified Chinese (简体字).
2. ALWAYS use pinyin with tone marks (e.g., fáng jiān), NEVER tone numbers (e.g., fang2 jian1)
3. When mentioning ANY Chinese character, include its pinyin with tone marks in parentheses
4. NEVER use simplified characters like 活, 伙, 货. Use traditional: 活, 夥, 貨
5. For the character "${character}", provide confusions that are ACTUALLY similar to it, not generic examples

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
    "similarCharacters": ["Traditional Chinese (繁體字) characters similar to ${character}", "MUST be Traditional: 貨 not 货, 獲 not 获, 過 not 过", "Format: 'character (pinyin) - meaning - reason'", "Example for 火: '灰(huī) - ash - contains fire radical' NOT '货(huo) - goods'", "Max 3 items"],
    "wrongContexts": ["Contexts where ${character} is misused"],
    "toneConfusions": ["Traditional Chinese with different tone from ${character}", "For 火(huǒ) use: '貨(huò) - goods' NOT '货(huò)'", "MUST use Traditional characters"]
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

Focus on practical learning aids and common confusion points.\n\nFINAL CHECK: Before responding, scan your entire response. If you see ANY of these Simplified characters (货, 获, 过, 会, 说, 热, 学, 书), replace them with Traditional (貨, 獲, 過, 會, 說, 熱, 學, 書).`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '⚠️ CRITICAL: You are analyzing Traditional Chinese (繁體字) for TAIWAN users. You MUST use the Traditional Chinese writing system as used in Taiwan.\n\n🚫 NEVER write these Simplified characters:\n货 (WRONG) → 貨 (CORRECT)\n获 (WRONG) → 獲 (CORRECT)\n过 (WRONG) → 過 (CORRECT)\n会 (WRONG) → 會 (CORRECT)\n说 (WRONG) → 說 (CORRECT)\n热 (WRONG) → 熱 (CORRECT)\n学 (WRONG) → 學 (CORRECT)\n书 (WRONG) → 書 (CORRECT)\n\n✅ REQUIREMENTS:\n1. Every Chinese character MUST be Traditional (繁體字)\n2. This is for Taiwan (臺灣), not mainland China\n3. Before writing ANY character, ask yourself: "Is this the Traditional form used in Taiwan?"\n4. If you catch yourself writing Simplified, IMMEDIATELY correct it\n5. For confusions, provide characters that are ACTUALLY similar to the input, not random examples\n6. Use pinyin with tone marks (huǒ not huo3)\n\n⚠️ DOUBLE-CHECK: Review your response before submitting. If you see 货 change it to 貨. If you see 获 change it to 獲.',
        },
        {
          role: 'assistant',
          content: 'I understand. I will use ONLY Traditional Chinese characters (繁體字) as used in Taiwan. I will NOT use Simplified characters like 货, 获, 过, 会, 说. I will provide character-specific confusions that make sense for the input character.',
        },
        {
          role: 'user',
          content: prompt + '\n\nREMEMBER: Use Traditional Chinese (繁體字) ONLY. If you write 货, change it to 貨. If you write 获, change it to 獲. This is for Taiwan users.',
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

Character: ${character} (Traditional Chinese 繁體字)
Pinyin: ${pinyin} (Taiwan Mandarin pronunciation)
Meaning: ${meaning}

ABSOLUTE REQUIREMENTS FOR YOUR ANALYSIS:

1. CHARACTER SYSTEM: You MUST use Traditional Chinese characters (繁體字) as used in Taiwan.
   - This is NON-NEGOTIABLE. Every single Chinese character must be Traditional.
   - Before including any character, verify it is the Traditional form.

2. CONFUSION ANALYSIS: For "${character}", provide commonConfusions that are:
   - GENUINELY confusable with "${character}" (not random examples)
   - Based on visual similarity, phonetic similarity, or semantic overlap
   - Specific to how "${character}" is actually confused by learners

3. TAIWAN CONTEXT: All content must reflect:
   - Taiwan Mandarin pronunciation (臺灣國語)
   - Taiwan-specific vocabulary and usage
   - Cultural contexts relevant to Taiwan

4. FORMAT: Include pinyin with tone marks (ā, á, ǎ, à) for every Chinese character mentioned.

5. QUALITY: Your analysis must be accurate, educational, and specific to "${character}".

IMPORTANT: If analyzing a multi-character word (e.g., 朋友), analyze the WHOLE WORD, not imaginary components.
For 朋友: It consists of 朋(péng) + 友(yǒu), NOT 朋 + 有. Both characters mean "friend".

IMPORTANT: Analyze the SPECIFIC character "${character}" and provide confusions that make sense for THIS character.
For example:
- If analyzing 火(huǒ), appropriate confusions might be: 灰(huī)-ash, 灼(zhuó)-scorch, 滅(miè)-extinguish
- If analyzing 書(shū), appropriate confusions might be: 畫(huà)-painting, 晝(zhòu)-daytime, 盡(jìn)-exhaust
- Do NOT use generic examples like 房子, 鞋子, 帽子 unless they're genuinely similar to "${character}"

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
      "character": "A Traditional Chinese character that learners genuinely confuse with ${character}",
      "reason": "Clear explanation of why these two characters are confused (visual/phonetic/semantic)",
      "similarity": 0-1 scale indicating degree of confusion likelihood
    }
  ],
  "contextExamples": ["example sentences using this character"],
  "collocations": ["common word combinations"]
}

CRITICAL for commonConfusions:
- NEVER include "${character}" itself in the list
- Analyze "${character}" and provide REAL confusions learners face
- Each confusion must be a Traditional Chinese character:
  ✅ CORRECT: 貨(huò), 獲(huò), 過(guò), 會(huì)
  ❌ WRONG: 货(huò), 获(huò), 过(guò), 会(huì)
- Base confusions on actual similarity (visual/phonetic/semantic)
- Provide clear, specific reasons for each confusion
- This is for TAIWAN users - use Traditional Chinese ONLY

Be accurate and educational. Every Chinese character mentioned MUST include its pinyin in parentheses.\n\n🚨 LAST REMINDER: You are writing for TAIWAN. Use Traditional Chinese (繁體字). If your response contains 货 or 获 or any Simplified character, it is WRONG. Check and fix before responding.`;

  try {
    if (!openai) {
      throw new Error('OpenAI client not initialized');
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "🚨 CRITICAL WARNING: You MUST use Traditional Chinese (繁體字) as used in Taiwan. This is MANDATORY.\n\n❌ BANNED SIMPLIFIED CHARACTERS - NEVER USE THESE:\n• 货 → USE 貨 INSTEAD\n• 获 → USE 獲 INSTEAD\n• 过 → USE 過 INSTEAD\n• 会 → USE 會 INSTEAD\n• 说 → USE 說 INSTEAD\n• 热 → USE 熱 INSTEAD\n• 学 → USE 學 INSTEAD\n• 书 → USE 書 INSTEAD\n\n✅ INSTRUCTIONS:\n1. You are analyzing for TAIWAN users who use Traditional Chinese\n2. Every single Chinese character must be Traditional\n3. For commonConfusions, provide characters genuinely similar to the input\n4. Include clear reasons for each confusion\n5. Use pinyin with tone marks\n\n⚠️ FINAL CHECK: Before submitting, scan your response. If you see 货 or 获, you have made an error. Fix it."
        },
        { 
          role: "assistant", 
          content: "I understand I must use Traditional Chinese (繁體字) as used in Taiwan. I will NOT use Simplified characters. For example, I will write 貨 not 货, 獲 not 获, 過 not 过. I will provide accurate confusions specific to the input character."
        },
        { 
          role: "user", 
          content: prompt + "\n\n⚠️ FINAL REMINDER: This is for TAIWAN. Every Chinese character must be Traditional (繁體字). Do NOT use Simplified characters like 货, 获, 过. Double-check before responding."
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) throw new Error('No response from OpenAI');

    const result = JSON.parse(response) as ComprehensiveCharacterAnalysis;
    
    // Post-process to ensure quality of commonConfusions
    if (result.commonConfusions && Array.isArray(result.commonConfusions)) {
      // Filter out bad data
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