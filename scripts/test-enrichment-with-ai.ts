#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import { getCharacterAnalysisWithCache } from '../src/lib/analytics/character-analysis-service';
import { analyzeCharacterWithOpenAI } from '../src/lib/analytics/openai-linguistic-analysis';

async function testEnrichmentWithAI() {
  try {
    await connectDB();
    
    // Test with a new character
    const testChar = '茶';
    
    console.log(`\n🧪 Testing enrichment for character: ${testChar}\n`);
    
    // Step 1: Character analysis (mnemonics/etymology in characteranalyses collection)
    console.log('Step 1: Getting character analysis...');
    const analysis = await getCharacterAnalysisWithCache(testChar);
    console.log('✅ Character analysis complete:');
    console.log(`  - Has mnemonics: ${analysis.mnemonics && analysis.mnemonics.length > 0 ? 'Yes' : 'No'}`);
    console.log(`  - Has etymology: ${analysis.etymology ? 'Yes' : 'No'}`);
    
    // Step 2: AI insights (visual/story mnemonics, learning tips)
    console.log('\nStep 2: Generating AI insights...');
    const aiInsights = await analyzeCharacterWithOpenAI(testChar);
    console.log('✅ AI insights complete:');
    console.log(`  - Has visual mnemonic: ${aiInsights.mnemonics?.visual ? 'Yes' : 'No'}`);
    console.log(`  - Has story mnemonic: ${aiInsights.mnemonics?.story ? 'Yes' : 'No'}`);
    console.log(`  - Has learning tips: ${aiInsights.learningTips ? 'Yes' : 'No'}`);
    
    // Step 3: Save to card (simulate what enrichment worker does)
    console.log('\nStep 3: Saving to card...');
    
    // Find or create card
    let card = await Card.findOne({ hanzi: testChar });
    if (!card) {
      card = new Card({
        hanzi: testChar,
        pinyin: 'chá',
        meaning: 'tea'
      });
    }
    
    // Save character analysis fields
    card.semanticCategory = analysis.semanticCategory;
    card.tonePattern = analysis.tonePattern;
    card.strokeCount = analysis.strokeCount;
    card.componentCount = analysis.componentCount;
    card.visualComplexity = analysis.visualComplexity;
    card.overallDifficulty = analysis.overallDifficulty;
    card.mnemonics = analysis.mnemonics;
    card.etymology = analysis.etymology;
    
    // Save AI insights
    card.aiInsights = aiInsights;
    card.aiInsightsGeneratedAt = new Date();
    
    // Mark as cached
    card.cached = true;
    
    await card.save();
    console.log('✅ Card saved successfully');
    
    // Verify
    console.log('\nVerifying saved data:');
    const savedCard = await Card.findOne({ hanzi: testChar });
    console.log(`  - Card found: ${savedCard ? 'Yes' : 'No'}`);
    console.log(`  - Has AI insights: ${savedCard?.aiInsights ? 'Yes' : 'No'}`);
    console.log(`  - AI insights generated at: ${savedCard?.aiInsightsGeneratedAt || 'Never'}`);
    console.log(`  - Cached: ${savedCard?.cached ? 'Yes' : 'No'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testEnrichmentWithAI();