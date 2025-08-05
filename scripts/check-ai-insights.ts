#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function checkAIInsights() {
  try {
    await connectDB();
    
    // Count cards with AI insights
    const totalCards = await Card.countDocuments();
    const cardsWithAI = await Card.countDocuments({ 
      aiInsights: { $exists: true, $ne: null } 
    });
    
    console.log(`\n📊 AI Insights Status:`);
    console.log(`Total cards: ${totalCards}`);
    console.log(`Cards with AI insights: ${cardsWithAI}`);
    console.log(`Percentage: ${totalCards > 0 ? ((cardsWithAI / totalCards) * 100).toFixed(1) : 0}%\n`);
    
    // Get sample cards with AI insights
    const samples = await Card.find({ 
      aiInsights: { $exists: true, $ne: null } 
    }).limit(3);
    
    if (samples.length > 0) {
      console.log('📋 Sample cards with AI insights:');
      samples.forEach(card => {
        console.log(`\n${card.hanzi} (${card.pinyin}):`);
        console.log(`  Generated at: ${card.aiInsightsGeneratedAt}`);
        if (card.aiInsights) {
          console.log(`  Has mnemonics: ${card.aiInsights.mnemonics ? 'Yes' : 'No'}`);
          console.log(`  Has etymology: ${card.aiInsights.etymology ? 'Yes' : 'No'}`);
          console.log(`  Has learning tips: ${card.aiInsights.learningTips ? 'Yes' : 'No'}`);
          console.log(`  Has usage info: ${card.aiInsights.usage ? 'Yes' : 'No'}`);
        }
      });
    }
    
    // Check enriched cards without AI insights
    const enrichedWithoutAI = await Card.find({
      cached: true,
      audioUrl: { $exists: true, $ne: '' },
      imageUrl: { $exists: true, $ne: '' },
      aiInsights: { $exists: false }
    }).limit(5);
    
    if (enrichedWithoutAI.length > 0) {
      console.log(`\n⚠️  Found ${enrichedWithoutAI.length} enriched cards WITHOUT AI insights:`);
      enrichedWithoutAI.forEach(card => {
        console.log(`  - ${card.hanzi}: enriched but missing AI insights`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAIInsights();