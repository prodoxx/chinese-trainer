#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';

async function checkSpecificCardInsights() {
  try {
    await connectDB();
    
    // Check for 咖啡
    const card = await Card.findOne({ hanzi: '咖啡' });
    
    if (card) {
      console.log(`\n📊 Card details for 咖啡:`);
      console.log(`ID: ${card._id}`);
      console.log(`Pinyin: ${card.pinyin}`);
      console.log(`Meaning: ${card.meaning}`);
      console.log(`Cached: ${card.cached}`);
      console.log(`Has AI insights: ${card.aiInsights ? 'Yes' : 'No'}`);
      console.log(`AI insights generated at: ${card.aiInsightsGeneratedAt || 'Never'}`);
      
      if (card.aiInsights) {
        console.log('\nAI Insights content:');
        console.log(`  Has mnemonics: ${card.aiInsights.mnemonics ? 'Yes' : 'No'}`);
        console.log(`  Has etymology: ${card.aiInsights.etymology ? 'Yes' : 'No'}`);
        console.log(`  Has learning tips: ${card.aiInsights.learningTips ? 'Yes' : 'No'}`);
      }
      
      // Check character analysis
      const analysis = await CharacterAnalysis.findOne({ character: '咖啡' });
      console.log(`\nCharacter analysis exists: ${analysis ? 'Yes' : 'No'}`);
      if (analysis) {
        console.log(`  Has mnemonics: ${analysis.mnemonics && analysis.mnemonics.length > 0 ? 'Yes' : 'No'}`);
        console.log(`  Has etymology: ${analysis.etymology ? 'Yes' : 'No'}`);
      }
    } else {
      console.log('No card found for 咖啡');
    }
    
    // Check all cards without AI insights
    const cardsWithoutAI = await Card.find({
      cached: true,
      $or: [
        { aiInsights: { $exists: false } },
        { aiInsights: null }
      ]
    });
    
    console.log(`\n⚠️  Found ${cardsWithoutAI.length} cached cards WITHOUT AI insights:`);
    cardsWithoutAI.forEach(card => {
      console.log(`  - ${card.hanzi}: cached but missing AI insights`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSpecificCardInsights();