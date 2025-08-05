#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import { getCharacterAnalysisWithCache } from '../src/lib/analytics/character-analysis-service';

async function testCharacterInsightsDirect() {
  try {
    await connectDB();
    
    // Find a card that has been analyzed
    const card = await Card.findOne({ hanzi: '行' });
    
    if (!card) {
      console.log('No card found for 行');
      process.exit(1);
    }
    
    console.log(`\n🧪 Testing character analysis service for: ${card.hanzi}\n`);
    
    // Call the service directly
    const complexityAnalysis = await getCharacterAnalysisWithCache(card.hanzi);
    
    console.log('✅ Analysis returned successfully\n');
    console.log('Character:', complexityAnalysis.character);
    console.log('Pinyin:', complexityAnalysis.pinyin);
    console.log('Semantic Category:', complexityAnalysis.semanticCategory);
    console.log('Overall Difficulty:', complexityAnalysis.overallDifficulty);
    console.log('\nMnemonics:', complexityAnalysis.mnemonics ? 'Yes' : 'No');
    if (complexityAnalysis.mnemonics) {
      console.log('  Count:', complexityAnalysis.mnemonics.length);
      complexityAnalysis.mnemonics.forEach((m: string, i: number) => {
        console.log(`  ${i + 1}. ${m}`);
      });
    }
    console.log('\nEtymology:', complexityAnalysis.etymology ? 'Yes' : 'No');
    if (complexityAnalysis.etymology) {
      console.log('  ', complexityAnalysis.etymology);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testCharacterInsightsDirect();