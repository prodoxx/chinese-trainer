/**
 * AI Provider - OpenAI API
 * Simplified to use OpenAI API only
 */

import type { InterpretationResult } from '../enrichment/openai-interpret';
import type { ImageSearchQueryResult } from '../enrichment/openai-query';
import type { 
  DeepLinguisticAnalysis, 
  ComprehensiveCharacterAnalysis 
} from '../analytics/openai-linguistic-analysis';

export type AIProvider = 'openai';

export interface AIProviderValidationResult {
  available: boolean;
  error?: string;
  provider: AIProvider;
}

export interface AIProviderConfig {
  provider: AIProvider;
  model?: string;
  enabled?: boolean;
}

/**
 * Validates if OpenAI API is available
 */
export async function validateAIProvider(config: AIProviderConfig): Promise<AIProviderValidationResult> {
  if (!config.enabled) {
    return {
      available: false,
      error: 'Provider is disabled',
      provider: 'openai'
    };
  }

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return {
      available: false,
      error: 'OpenAI API key not configured',
      provider: 'openai'
    };
  }
  
  return {
    available: true,
    provider: 'openai'
  };
}

/**
 * Interprets Chinese characters using OpenAI
 */
export async function interpretChinese(
  hanzi: string,
  config: AIProviderConfig,
  context?: string
): Promise<InterpretationResult> {
  
  const validation = await validateAIProvider(config);
  
  if (!validation.available) {
    throw new Error(`OpenAI API not available: ${validation.error}`);
  }

  const { interpretChinese } = await import('../enrichment/openai-interpret');
  return interpretChinese(hanzi, context);
}

/**
 * Generates image search queries using OpenAI
 */
export async function generateImageSearchQuery(
  hanzi: string,
  meaning: string,
  pinyin: string,
  config: AIProviderConfig
): Promise<ImageSearchQueryResult> {
  const validation = await validateAIProvider(config);
  
  if (!validation.available) {
    // Fallback to basic query
    console.warn(`OpenAI API not available: ${validation.error}`);
    return {
      query: meaning.split(/[;,]/)[0].trim(),
      prompt: undefined
    };
  }

  const { generateImageSearchQuery } = await import('../enrichment/openai-query');
  return generateImageSearchQuery(hanzi, meaning, pinyin);
}

/**
 * Performs comprehensive character analysis using OpenAI
 */
export async function analyzeCharacterComprehensively(
  character: string,
  pinyin: string,
  meaning: string,
  config: AIProviderConfig
): Promise<ComprehensiveCharacterAnalysis> {
  const validation = await validateAIProvider(config);
  
  if (!validation.available) {
    throw new Error(`OpenAI API not available: ${validation.error}`);
  }

  const { analyzeCharacterComprehensively } = await import('../analytics/openai-linguistic-analysis');
  return analyzeCharacterComprehensively(character, pinyin, meaning);
}

/**
 * Performs deep linguistic analysis using OpenAI
 */
export async function analyzeCharacterWithAI(
  character: string,
  config: AIProviderConfig,
  userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
): Promise<DeepLinguisticAnalysis> {
  
  const validation = await validateAIProvider(config);
  
  if (!validation.available) {
    throw new Error(`OpenAI API not available: ${validation.error}`);
  }

  const { analyzeCharacterWithOpenAI } = await import('../analytics/openai-linguistic-analysis');
  return analyzeCharacterWithOpenAI(character, userLevel);
}

/**
 * Gets the default AI provider configuration
 */
export function getDefaultAIProviderConfig(): AIProviderConfig {
  return {
    provider: 'openai',
    enabled: true
  };
}

/**
 * Gets available AI providers
 */
export async function getAvailableProviders(): Promise<AIProviderConfig[]> {
  if (process.env.OPENAI_API_KEY) {
    return [{
      provider: 'openai',
      enabled: true
    }];
  }
  
  return [];
}