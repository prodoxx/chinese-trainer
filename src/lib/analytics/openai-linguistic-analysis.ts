/**
 * OpenAI-enhanced linguistic analysis for deeper character insights
 */

import OpenAI from 'openai';
import { EnhancedCharacterComplexity, analyzeCharacterWithDictionary } from './enhanced-linguistic-complexity';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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
  
  try {
    // Create a comprehensive prompt for linguistic analysis
    const prompt = `Analyze the Chinese character "${character}" (${baseAnalysis.pinyin}) with meanings: ${baseAnalysis.definitions.join(', ')}.

Provide a detailed linguistic analysis in JSON format with the following structure:

{
  "etymology": {
    "origin": "Brief explanation of character origin",
    "evolution": ["Stage 1", "Stage 2", "Modern form"],
    "culturalContext": "Cultural significance or usage context"
  },
  "mnemonics": {
    "visual": "Visual memory aid based on character shape",
    "story": "Story-based mnemonic incorporating meaning",
    "components": "How components relate to meaning"
  },
  "commonErrors": {
    "similarCharacters": ["List of visually/phonetically similar characters"],
    "wrongContexts": ["Common misuse contexts"],
    "toneConfusions": ["Characters with same sound but different tones"]
  },
  "usage": {
    "commonCollocations": ["Common word combinations"],
    "registerLevel": "formal/informal/neutral/literary",
    "frequency": "high/medium/low",
    "domains": ["Areas where commonly used"]
  },
  "learningTips": {
    "forBeginners": ["Tips for beginners"],
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
          content: 'You are a Chinese linguistics expert helping create comprehensive learning materials. Provide accurate, pedagogically sound analysis.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: 'json_object' },
    });

    const aiAnalysis = JSON.parse(response.choices[0]?.message?.content || '{}');
    
    // Merge AI insights with base analysis
    return {
      ...baseAnalysis,
      etymology: aiAnalysis.etymology,
      mnemonics: aiAnalysis.mnemonics,
      commonErrors: aiAnalysis.commonErrors,
      usage: aiAnalysis.usage,
      learningTips: aiAnalysis.learningTips,
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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Chinese language learning expert creating personalized study plans.',
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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in Chinese character learning and error analysis.',
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
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Chinese language teacher creating educational example sentences.',
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