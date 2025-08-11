#!/usr/bin/env bun
/**
 * Check the current status of AI insights across both collections
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';

async function main() {
  console.log('📊 AI Insights Status Report\n');
  console.log('=' .repeat(60));
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Check Cards collection
    console.log('📦 Cards Collection:');
    console.log('-'.repeat(40));
    const totalCards = await Card.countDocuments();
    const cardsWithAIInsights = await Card.countDocuments({ 
      aiInsights: { $exists: true, $ne: null } 
    });
    const cardsWithValidInsights = await Card.countDocuments({
      'aiInsights.etymology.origin': { $exists: true, $ne: null },
      'aiInsights.mnemonics.visual': { $exists: true, $ne: null },
      'aiInsights.learningTips.forBeginners.0': { $exists: true }
    });
    const cardsWithTimestamp = await Card.countDocuments({ 
      aiInsightsGeneratedAt: { $exists: true, $ne: null } 
    });
    
    console.log(`  Total cards: ${totalCards}`);
    console.log(`  With AI insights structure: ${cardsWithAIInsights}`);
    console.log(`  With valid content: ${cardsWithValidInsights}`);
    console.log(`  With timestamp: ${cardsWithTimestamp}`);
    console.log(`  Empty structures: ${cardsWithAIInsights - cardsWithValidInsights}`);
    
    // Check CharacterAnalysis collection
    console.log('\n📊 CharacterAnalysis Collection:');
    console.log('-'.repeat(40));
    const totalAnalyses = await CharacterAnalysis.countDocuments();
    const analysesWithAIInsights = await CharacterAnalysis.countDocuments({ 
      aiInsights: { $exists: true, $ne: null } 
    });
    const analysesWithValidInsights = await CharacterAnalysis.countDocuments({
      'aiInsights.etymology.origin': { $exists: true, $ne: null },
      'aiInsights.mnemonics.visual': { $exists: true, $ne: null },
      'aiInsights.learningTips.forBeginners.0': { $exists: true }
    });
    
    console.log(`  Total analyses: ${totalAnalyses}`);
    console.log(`  With AI insights: ${analysesWithAIInsights}`);
    console.log(`  With valid content: ${analysesWithValidInsights}`);
    
    // Sample a few cards to show their status
    console.log('\n📝 Sample Cards with AI Insights:');
    console.log('-'.repeat(40));
    const sampleCards = await Card.find({ 
      aiInsights: { $exists: true } 
    }).limit(5);
    
    for (const card of sampleCards) {
      const hasValidContent = card.aiInsights?.etymology?.origin && 
        card.aiInsights?.mnemonics?.visual && 
        card.aiInsights?.learningTips?.forBeginners?.length > 0;
      
      console.log(`  ${card.hanzi}: ${hasValidContent ? '✅ Valid' : '❌ Empty'} (${card.meaning})`);
    }
    
    // Architecture summary
    console.log('\n🏗️ Current Architecture:');
    console.log('-'.repeat(40));
    console.log('  1. Cards collection: Stores user-specific card data');
    console.log('     - Currently has AI insights (being phased out)');
    console.log('     - Should only store user-specific data');
    console.log('');
    console.log('  2. CharacterAnalysis collection: Stores shared linguistic data');
    console.log('     - Now supports AI insights (preferred location)');
    console.log('     - Shared across all users for the same character');
    console.log('');
    console.log('  3. API Strategy:');
    console.log('     - Checks CharacterAnalysis first (shared data)');
    console.log('     - Falls back to Card if needed (legacy support)');
    console.log('     - Never generates on-demand (prevents delays)');
    
    // Recommendations
    console.log('\n💡 Recommendations:');
    console.log('-'.repeat(40));
    if (cardsWithAIInsights - cardsWithValidInsights > 0) {
      console.log('  ⚠️ Fix empty AI insights structures:');
      console.log('     bun run scripts/fix-ai-insights-structure.ts');
    }
    if (cardsWithValidInsights > analysesWithValidInsights) {
      console.log('  📤 Migrate AI insights from Cards to CharacterAnalysis');
      console.log('     (Create migration script if needed)');
    }
    console.log('  ♻️ Re-enrich cards without valid insights');
    console.log('  🔄 Update enrichment workers to save to CharacterAnalysis');
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ Status check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();