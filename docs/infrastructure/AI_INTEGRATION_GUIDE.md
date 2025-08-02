# AI Integration Guide

## Overview

Danbing integrates OpenAI's GPT-4 for text analysis and Fal.ai's Flux-Krea-Lora for image generation throughout the system to provide comprehensive AI-powered character analysis, mnemonic visual content generation, and personalized learning insights. This guide documents how AI is used, when it's triggered, and how to optimize costs.

## AI Services Used

### GPT-4 for Character Analysis
- **Character interpretation**: Taiwan Mandarin pronunciation and meanings
- **Deep linguistic analysis**: Etymology, component breakdown, usage patterns
- **Learning optimization**: Mnemonics, memory aids, and personalized tips
- **Error analysis**: Common mistakes and confusion patterns
- **Contextual examples**: Level-appropriate sentences and collocations

### Fal.ai Flux-Krea-Lora for Visual Content
- **Mnemonic visuals**: Memory-enhancing images that help students associate meanings
- **Educational design**: Simple, clean illustrations optimized for web display
- **Learning enhancement**: Visual associations that improve character retention
- **Web-friendly**: 512x512 resolution for fast loading

## AI Integration Points

### 1. Automatic Enrichment During Import

When users import CSV decks, AI analysis is automatically triggered:

```typescript
// Card enrichment worker includes AI analysis
export const cardEnrichmentWorker = new Worker<CardEnrichmentJobData>(
  'card-enrichment',
  async (job: Job<CardEnrichmentJobData>) => {
    // ... dictionary lookup and basic enrichment
    
    // AI interpretation for Taiwan pronunciation and meaning
    const interpretation = await interpretChinese(card.hanzi);
    if (interpretation) {
      card.pinyin = interpretation.pinyin;
      card.meaning = interpretation.meaning;
    }
    
    // AI-powered mnemonic image generation with fal.ai
    const imageResult = await generateSharedImage(
      card.hanzi, 
      card.meaning, 
      card.pinyin
    );
    
    // Deep AI insights generation
    if (!card.aiInsights || force) {
      const aiInsights = await analyzeCharacterWithOpenAI(card.hanzi);
      card.aiInsights = aiInsights;
      card.aiInsightsGeneratedAt = new Date();
    }
  }
);
```

**When it happens:**
- Automatically during deck import
- On re-enrichment requests (force refresh)
- Background processing for new characters

### 2. Character Insights Modal

AI insights are displayed in the Character Insights modal:

```typescript
// Character insights API endpoint
export async function POST(request: NextRequest) {
  // Check for cached AI insights
  if (card.aiInsights && card.aiInsightsGeneratedAt) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (card.aiInsightsGeneratedAt > thirtyDaysAgo) {
      return cachedInsights;
    }
  }
  
  // Generate fresh insights if needed
  const aiInsights = await analyzeCharacterWithOpenAI(card.hanzi);
  
  // Cache for 30 days
  await Card.findByIdAndUpdate(characterId, {
    aiInsights,
    aiInsightsGeneratedAt: new Date(),
  });
}
```

**What users see:**
- Etymology and character evolution
- Component-based mnemonics
- Visual memory aids
- Common error patterns
- Usage examples and collocations
- Personalized learning tips

### 3. Confused Characters for Quizzes

AI helps identify commonly confused characters:

```typescript
// Generate confused characters for quiz distractors
export async function getConfusedCharacters(hanzi: string) {
  const analysis = await analyzeCharacterWithOpenAI(hanzi);
  
  return analysis.commonErrors.similarCharacters.map(char => ({
    character: char,
    confusionType: 'visual', // or 'semantic', 'phonetic'
    probability: 0.7
  }));
}
```

**Quiz enhancement:**
- Mini-quizzes every 3 cards use confused characters
- More challenging and realistic distractors
- Improved learning through targeted confusion resolution

## AI Analysis Structure

### Core Analysis Response

```typescript
interface DeepLinguisticAnalysis {
  etymology?: {
    origin: string;                    // Historical origin
    evolution: string[];               // Evolution stages
    culturalContext: string;           // Cultural significance
  };
  
  mnemonics: {
    visual: string;                    // Visual memory aid
    story: string;                     // Story-based mnemonic
    components: string;                // Component breakdown
  };
  
  commonErrors: {
    similarCharacters: string[];       // Visually similar chars
    wrongContexts: string[];           // Common misuse contexts
    toneConfusions: string[];          // Tone-related errors
  };
  
  usage: {
    commonCollocations: string[];      // Frequent word combinations
    registerLevel: string;             // Formal/informal/neutral
    frequency: string;                 // High/medium/low frequency
    domains: string[];                 // Subject domains (business, daily, etc.)
  };
  
  learningTips: {
    forBeginners: string[];            // Beginner-friendly tips
    forIntermediate: string[];         // Intermediate learner tips
    forAdvanced: string[];             // Advanced learner tips
  };
}
```

### Example AI Analysis

For the character "愛" (love):

```json
{
  "etymology": {
    "origin": "Originally depicted a person looking back with reluctance, showing emotional attachment",
    "evolution": [
      "Oracle bone: person + heart + movement",
      "Bronze: added emotional emphasis", 
      "Modern: simplified while preserving emotional core"
    ],
    "culturalContext": "Central to Chinese philosophy of relationships and familial bonds"
  },
  "mnemonics": {
    "visual": "A person (人) with a heart (心) in the middle shows love",
    "story": "Love requires giving your heart (心) to another person with graceful movement",
    "components": "爫 (claw/hand) + 冖 (cover) + 心 (heart) + 夊 (slow walk)"
  },
  "commonErrors": {
    "similarCharacters": ["受", "愛", "変"],
    "wrongContexts": ["Using for casual 'like' instead of deep love"],
    "toneConfusions": ["Fourth tone, not third tone"]
  }
}
```

## Image Generation with Fal.ai

### Mnemonic Visual Generation

Fal.ai's Flux-Krea-Lora model generates mnemonic-focused images that help students memorize characters:

```typescript
import { fal } from '@fal-ai/client';

// Generate mnemonic image (FAL_KEY is automatically picked up)
const result = await fal.run("fal-ai/flux-krea-lora", {
  prompt: mnemonicPrompt,
  num_images: 1,
  guidance_scale: 7.5,
  num_inference_steps: 25,
  width: 512,
  height: 512,
  seed: Math.floor(Math.random() * 1000000)
});
```

### Prompt Engineering for Mnemonics

The system generates mnemonic-focused prompts:

```typescript
// Example mnemonic prompts by category
const mnemonicPrompts = {
  emotion: "Mnemonic illustration: A person with exaggerated ${meaning} expression that helps students remember this emotion",
  action: "Mnemonic illustration: Dynamic figure clearly performing '${meaning}' action in a memorable way",
  quality: "Mnemonic illustration: Visual contrast clearly showing '${meaning}' quality for easy memorization",
  general: "Mnemonic illustration for '${meaning}': Create a memorable visual association that helps students instantly recall this concept"
};
```

### Image Specifications
- **Resolution**: 512x512 (web-optimized)
- **Style**: Simple educational cartoon
- **Focus**: Visual memory aids
- **No text**: Prevents answer giveaways

## Cost Optimization Strategies

### 1. Shared Analysis Results

AI insights are shared across users to minimize costs:

```typescript
// Check for existing analysis before generating new one
const existingAnalysis = await CharacterAnalysis.findOne({ 
  character: hanzi,
  analysisVersion: '1.0'
});

if (existingAnalysis && !force) {
  return existingAnalysis.analysis;
}

// Generate new analysis only if needed
const analysis = await analyzeCharacterWithOpenAI(hanzi);
```

### 2. Intelligent Caching

- **30-day cache**: AI insights cached for 30 days per character
- **Version control**: Analysis version tracking for updates
- **Selective refresh**: Only regenerate when explicitly requested

### 3. Batch Processing

Process multiple characters in single requests when possible:

```typescript
// Batch character analysis for efficiency
export async function batchAnalyzeCharacters(characters: string[]) {
  const prompt = `Analyze these Chinese characters: ${characters.join(', ')}`;
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });
  
  return parseMultipleCharacterAnalysis(response.choices[0].message.content);
}
```

### 4. Rate Limiting

Per-user limits to prevent abuse:

```typescript
// Rate limiting for AI requests
const AI_REQUESTS_PER_DAY = {
  free: 50,
  premium: 500
};

export async function checkAIRateLimit(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const usage = await getAIUsage(userId, today);
  
  const limit = await getUserTier(userId) === 'premium' 
    ? AI_REQUESTS_PER_DAY.premium 
    : AI_REQUESTS_PER_DAY.free;
    
  return usage < limit;
}
```

## Environment Configuration

### Required Environment Variables

```bash
# OpenAI API Configuration
OPENAI_API_KEY=sk-...                    # OpenAI API key
OPENAI_MODEL_GPT=gpt-4                   # GPT model for text analysis

# Fal.ai API Configuration  
FAL_KEY=...                              # Fal.ai API key for image generation

# Rate limiting
OPENAI_MAX_REQUESTS_PER_MINUTE=60        # Rate limit
OPENAI_MAX_TOKENS_PER_REQUEST=4000       # Token limit per request
```

### Model Selection Strategy

```typescript
// Adaptive model selection based on task complexity
export function getOptimalModel(taskType: string, characterComplexity: number) {
  switch (taskType) {
    case 'basic_interpretation':
      return 'gpt-3.5-turbo';  // Faster, cheaper for simple tasks
    
    case 'deep_analysis':
      return characterComplexity > 0.7 ? 'gpt-4' : 'gpt-3.5-turbo';
      
    case 'etymology':
      return 'gpt-4';  // Requires deeper knowledge
      
    default:
      return 'gpt-3.5-turbo';
  }
}
```

## Error Handling

### Graceful Degradation

```typescript
export async function analyzeCharacterWithFallback(hanzi: string) {
  try {
    // Primary: Full AI analysis
    return await analyzeCharacterWithOpenAI(hanzi);
  } catch (aiError) {
    console.error('AI analysis failed:', aiError);
    
    try {
      // Fallback: Dictionary-based analysis
      return await generateBasicAnalysisFromDictionary(hanzi);
    } catch (dictError) {
      // Final fallback: Minimal structure
      return {
        mnemonics: {
          visual: `Character: ${hanzi}`,
          story: 'AI analysis temporarily unavailable',
          components: 'Basic character'
        },
        commonErrors: { similarCharacters: [], wrongContexts: [], toneConfusions: [] },
        usage: { commonCollocations: [], registerLevel: 'neutral', frequency: 'unknown', domains: [] },
        learningTips: { forBeginners: ['Practice writing this character'], forIntermediate: [], forAdvanced: [] }
      };
    }
  }
}
```

### Retry Logic

```typescript
export async function makeOpenAIRequest(prompt: string, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,  // More consistent results
        max_tokens: 2000
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      if (attempt === retries - 1) throw error;
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}
```

## Monitoring and Analytics

### Usage Tracking

```typescript
// Track AI API usage for cost analysis
export async function logAIUsage(userId: string, operation: string, tokens: number, cost: number) {
  await AIUsageLog.create({
    userId,
    operation,
    tokens,
    estimatedCost: cost,
    timestamp: new Date(),
    model: 'gpt-4'
  });
}
```

### Cost Analysis

```typescript
// Calculate daily AI costs
export async function getDailyAICosts(date: string) {
  const usage = await AIUsageLog.aggregate([
    { $match: { timestamp: { $gte: new Date(date), $lt: new Date(date + ' 23:59:59') } } },
    { $group: {
        _id: '$operation',
        totalTokens: { $sum: '$tokens' },
        totalCost: { $sum: '$estimatedCost' },
        requestCount: { $sum: 1 }
      }
    }
  ]);
  
  return usage;
}
```

## Best Practices

### 1. Prompt Engineering

- **Specific instructions**: Clear, detailed prompts for consistent results
- **Taiwan context**: Always specify Taiwan Mandarin vs Mainland
- **Output format**: Structured JSON responses for easy parsing
- **Examples**: Include examples in prompts for better results

### 2. Quality Control

- **Validation**: Verify AI responses before caching
- **Human review**: Periodic review of AI-generated content
- **User feedback**: Collect user ratings on AI insights quality

### 3. Performance Optimization

- **Parallel processing**: Run AI analysis in background workers
- **Smart caching**: Share results across users for common characters
- **Lazy loading**: Generate insights on-demand for Character Insights modal

## Future Enhancements

### Planned AI Features

1. **Personalized Learning Paths**: AI-generated study sequences based on user progress
2. **Adaptive Difficulty**: Dynamic adjustment of quiz difficulty using AI analysis
3. **Conversation Practice**: AI-powered dialogue practice with Taiwan Mandarin context
4. **Writing Analysis**: AI feedback on character stroke order and handwriting
5. **Cultural Context**: Enhanced cultural and historical context for characters

### Advanced Integration

1. **Real-time Analysis**: Streaming AI responses for better UX
2. **Multi-modal Learning**: Combine text, image, and audio AI generation
3. **Collaborative AI**: AI insights that improve based on community usage
4. **Predictive Analytics**: AI-powered predictions of learning success

This comprehensive AI integration makes Danbing uniquely powerful for Traditional Chinese learning while maintaining cost efficiency through intelligent caching and optimization strategies.