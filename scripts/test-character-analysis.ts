#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import { getCharacterAnalysisWithCache } from '../src/lib/analytics/character-analysis-service';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';

async function testCharacterAnalysis() {
  try {
    await connectDB();
    
    console.log('\n🧪 Testing character analysis service...\n');
    
    // Test with a simple character
    const testChar = '水';
    console.log(`Testing with character: ${testChar}`);
    
    // Get analysis
    const analysis = await getCharacterAnalysisWithCache(testChar);
    console.log('\nAnalysis result:');
    console.log(`  Character: ${analysis.character}`);
    console.log(`  Pinyin: ${analysis.pinyin}`);
    console.log(`  Semantic Category: ${analysis.semanticCategory}`);
    console.log(`  Overall Difficulty: ${analysis.overallDifficulty}`);
    console.log(`  Mnemonics: ${analysis.mnemonics?.join(', ') || 'None'}`);
    
    // Check if it was saved
    const savedAnalysis = await CharacterAnalysis.findOne({ character: testChar });
    if (savedAnalysis) {
      console.log('\n✅ Analysis was saved to characteranalyses collection');
      console.log(`  Last analyzed: ${savedAnalysis.lastAnalyzedAt}`);
      console.log(`  Model: ${savedAnalysis.openAIModel}`);
    } else {
      console.log('\n❌ Analysis was NOT saved to characteranalyses collection');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testCharacterAnalysis();