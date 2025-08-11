#!/usr/bin/env bun
/**
 * Fix cards with empty AI insights structures by regenerating them
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import { analyzeCharacterWithAI } from '../src/lib/ai/ai-provider';

async function main() {
  console.log('🔧 Fixing Empty AI Insights\n');
  console.log('=' .repeat(60));
  
  await connectDB();
  
  // Find all cards with empty AI insights structures
  const cardsWithEmptyInsights = await Card.find({
    $or: [
      // No AI insights at all
      { aiInsights: { $exists: false } },
      // Empty etymology
      { 'aiInsights.etymology.origin': { $in: [null, '', undefined] } },
      // Empty mnemonics
      { 'aiInsights.mnemonics.visual': { $in: [null, '', undefined] } },
      // No learning tips
      { 'aiInsights.learningTips.forBeginners': { $size: 0 } }
    ]
  });
  
  console.log(`Found ${cardsWithEmptyInsights.length} cards with empty or missing AI insights\n`);
  
  let fixed = 0;
  let failed = 0;
  
  for (const card of cardsWithEmptyInsights) {
    try {
      console.log(`\n📝 Processing: ${card.hanzi} (${card._id})`);
      console.log(`  Current state:`);
      console.log(`    Has aiInsights: ${!!card.aiInsights}`);
      if (card.aiInsights) {
        console.log(`    Etymology origin: ${card.aiInsights.etymology?.origin ? '✓' : '✗'}`);
        console.log(`    Mnemonics visual: ${card.aiInsights.mnemonics?.visual ? '✓' : '✗'}`);
        console.log(`    Learning tips: ${card.aiInsights.learningTips?.forBeginners?.length || 0} beginners`);
      }
      
      // Generate AI insights using OpenAI (more reliable than Ollama)
      console.log(`  🤖 Generating AI insights with OpenAI...`);
      
      const aiConfig = {
        provider: 'openai' as const,
        enabled: true
      };
      
      const aiInsights = await analyzeCharacterWithAI(card.hanzi, aiConfig);
      
      if (aiInsights && aiInsights.etymology?.origin && aiInsights.mnemonics?.visual) {
        // Update the card with new insights
        card.aiInsights = aiInsights;
        card.aiInsightsGeneratedAt = new Date();
        
        await card.save();
        
        console.log(`  ✅ Fixed! Generated full AI insights`);
        console.log(`    Etymology: ${aiInsights.etymology.origin.substring(0, 50)}...`);
        console.log(`    Mnemonics: ${aiInsights.mnemonics.visual.substring(0, 50)}...`);
        console.log(`    Common errors: ${aiInsights.commonErrors?.similarCharacters?.length || 0} chars`);
        console.log(`    Usage collocations: ${aiInsights.usage?.commonCollocations?.length || 0}`);
        console.log(`    Learning tips: ${aiInsights.learningTips?.forBeginners?.length || 0} beginners`);
        
        fixed++;
      } else {
        console.log(`  ⚠️  Generated insights were incomplete, skipping`);
        failed++;
      }
      
    } catch (error) {
      console.error(`  ❌ Error processing ${card.hanzi}:`, error);
      failed++;
    }
    
    // Add a small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Summary:\n');
  console.log(`Total cards processed: ${cardsWithEmptyInsights.length}`);
  console.log(`Successfully fixed: ${fixed}`);
  console.log(`Failed: ${failed}`);
  
  // Now check specific card
  console.log('\n' + '=' .repeat(60));
  console.log('🔍 Checking specific card: 房間\n');
  
  const roomCard = await Card.findOne({ hanzi: '房間' });
  if (roomCard) {
    console.log(`Card ID: ${roomCard._id}`);
    console.log(`Has AI insights: ${!!roomCard.aiInsights}`);
    if (roomCard.aiInsights) {
      console.log(`Etymology origin: ${roomCard.aiInsights.etymology?.origin ? '✓' : '✗'}`);
      console.log(`Mnemonics visual: ${roomCard.aiInsights.mnemonics?.visual ? '✓' : '✗'}`);
      console.log(`Common errors: ${roomCard.aiInsights.commonErrors?.similarCharacters?.length || 0} chars`);
      console.log(`Usage info: ${roomCard.aiInsights.usage?.commonCollocations?.length || 0} collocations`);
      console.log(`Learning tips: ${roomCard.aiInsights.learningTips?.forBeginners?.length || 0} for beginners`);
    }
  }
  
  process.exit(0);
}

main();