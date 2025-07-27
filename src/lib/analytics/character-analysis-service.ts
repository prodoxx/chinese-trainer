/**
 * Character Analysis Service with Caching
 * Uses OpenAI for comprehensive analysis and caches results in MongoDB
 */

import CharacterAnalysis from '@/lib/db/models/CharacterAnalysis';
import Dictionary from '@/lib/db/models/Dictionary';
import connectDB from '@/lib/db/mongodb';
import { analyzeCharacterComprehensively, ComprehensiveCharacterAnalysis } from './openai-linguistic-analysis';
import { EnhancedCharacterComplexity } from './enhanced-linguistic-complexity';

/**
 * Get character analysis with caching
 * First checks cache, then uses OpenAI if needed
 */
export async function getCharacterAnalysisWithCache(
  character: string
): Promise<EnhancedCharacterComplexity> {
  await connectDB();
  
  // Try to get from cache first
  let analysis = await CharacterAnalysis.findOne({ character });
  
  // If not in cache or older than 90 days, get fresh analysis
  if (!analysis || isAnalysisStale(analysis.lastAnalyzedAt)) {
    // Get basic info from dictionary
    const dictEntry = await Dictionary.findOne({ traditional: character });
    const pinyin = dictEntry?.pinyin || '';
    const meaning = dictEntry?.definitions?.[0] || '';
    
    // Get comprehensive analysis from OpenAI
    const openAIAnalysis = await analyzeCharacterComprehensively(
      character,
      pinyin,
      meaning
    );
    
    // Save to cache
    analysis = await CharacterAnalysis.findOneAndUpdate(
      { character },
      {
        character: openAIAnalysis.character,
        pinyin: openAIAnalysis.pinyin,
        semanticCategory: openAIAnalysis.semanticCategory,
        semanticFields: openAIAnalysis.semanticFields,
        conceptType: openAIAnalysis.conceptType,
        strokeCount: openAIAnalysis.strokeCount,
        componentCount: openAIAnalysis.componentCount,
        radicals: openAIAnalysis.radicals,
        tonePattern: openAIAnalysis.tonePattern,
        toneDescription: openAIAnalysis.toneDescription,
        toneDifficulty: calculateToneDifficulty(openAIAnalysis.tonePattern),
        mnemonics: openAIAnalysis.mnemonics,
        etymology: openAIAnalysis.etymology,
        commonConfusions: openAIAnalysis.commonConfusions,
        visualComplexity: openAIAnalysis.visualComplexity,
        phoneticTransparency: 0.5, // Default, could be enhanced
        semanticTransparency: openAIAnalysis.radicals.length > 0 ? 0.7 : 0.3,
        overallDifficulty: calculateOverallDifficulty(openAIAnalysis),
        frequency: 3, // Default medium frequency
        contextExamples: openAIAnalysis.contextExamples,
        collocations: openAIAnalysis.collocations,
        openAIModel: 'gpt-4o-mini',
        analysisVersion: '2.0',
        lastAnalyzedAt: new Date()
      },
      { upsert: true, new: true }
    );
  }
  
  // Convert to EnhancedCharacterComplexity format
  return {
    character: analysis.character,
    pinyin: analysis.pinyin,
    definitions: analysis.contextExamples.slice(0, 3), // Use examples as definitions
    strokeCount: analysis.strokeCount,
    radicalCount: analysis.radicals.length,
    componentCount: analysis.componentCount,
    characterLength: character.length,
    isPhonetic: false, // Could be enhanced
    isSemantic: analysis.radicals.length > 0,
    semanticCategory: analysis.semanticCategory,
    phoneticComponent: undefined,
    tonePattern: analysis.tonePattern,
    toneDifficulty: analysis.toneDifficulty,
    semanticFields: analysis.semanticFields,
    concreteAbstract: analysis.conceptType,
    polysemy: analysis.contextExamples.length,
    frequency: analysis.frequency,
    contextDiversity: analysis.collocations.length,
    visualComplexity: analysis.visualComplexity,
    phoneticTransparency: analysis.phoneticTransparency,
    semanticTransparency: analysis.semanticTransparency,
    overallDifficulty: analysis.overallDifficulty
  };
}

/**
 * Check if analysis is stale (older than 90 days)
 */
function isAnalysisStale(lastAnalyzedAt: Date): boolean {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  return lastAnalyzedAt < ninetyDaysAgo;
}

/**
 * Calculate tone difficulty based on pattern
 */
function calculateToneDifficulty(tonePattern: string): number {
  if (!tonePattern) return 0.5;
  
  const tones = tonePattern.split('-');
  const toneDifficulties: Record<string, number> = {
    '1': 0.2,
    '2': 0.4,
    '3': 0.6,
    '4': 0.3,
    '5': 0.1
  };
  
  const avgDifficulty = tones.reduce((sum, tone) => 
    sum + (toneDifficulties[tone] || 0.5), 0
  ) / tones.length;
  
  // Tone sandhi rules make certain combinations harder
  if (tonePattern.includes('3-3')) return Math.min(1, avgDifficulty + 0.2);
  if (tonePattern.includes('2-1-4')) return Math.min(1, avgDifficulty + 0.1);
  
  return avgDifficulty;
}

/**
 * Calculate overall difficulty from various factors
 */
function calculateOverallDifficulty(analysis: ComprehensiveCharacterAnalysis): number {
  const factors = [
    analysis.visualComplexity * 0.3,
    calculateToneDifficulty(analysis.tonePattern) * 0.2,
    (analysis.strokeCount / 30) * 0.2, // Normalize stroke count
    (analysis.componentCount / 5) * 0.1, // Normalize component count
    (analysis.commonConfusions.length / 5) * 0.2 // Confusion potential
  ];
  
  return Math.min(1, factors.reduce((sum, factor) => sum + factor, 0));
}

/**
 * Get similar characters based on cached analysis
 */
export async function getSimilarCharacters(
  character: string,
  limit: number = 5
): Promise<Array<{ character: string; similarity: number; reason: string }>> {
  await connectDB();
  
  // Get the character's analysis
  const analysis = await CharacterAnalysis.findOne({ character });
  if (!analysis) return [];
  
  // Find characters with similar semantic categories or radicals
  const similar = await CharacterAnalysis.find({
    character: { $ne: character },
    $or: [
      { semanticCategory: analysis.semanticCategory },
      { 'radicals.radical': { $in: analysis.radicals.map(r => r.radical) } },
      { semanticFields: { $in: analysis.semanticFields } }
    ]
  })
  .limit(limit * 2)
  .select('character radicals semanticCategory');
  
  // Calculate similarity scores
  const similarities = similar.map(other => {
    let score = 0;
    let reasons = [];
    
    if (other.semanticCategory === analysis.semanticCategory) {
      score += 0.4;
      reasons.push('same category');
    }
    
    const sharedRadicals = other.radicals.filter(r1 => 
      analysis.radicals.some(r2 => r1.radical === r2.radical)
    );
    if (sharedRadicals.length > 0) {
      score += 0.3 * (sharedRadicals.length / Math.max(other.radicals.length, analysis.radicals.length));
      reasons.push(`shared radical: ${sharedRadicals[0].radical}`);
    }
    
    return {
      character: other.character,
      similarity: score,
      reason: reasons.join(', ')
    };
  });
  
  // Sort by similarity and return top matches
  return similarities
    .filter(s => s.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}