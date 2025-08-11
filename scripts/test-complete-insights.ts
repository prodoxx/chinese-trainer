#!/usr/bin/env bun
/**
 * Test that the Character Insights API returns ALL analysis data
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function main() {
  console.log('🧪 Testing Complete Character Insights Data\n');
  console.log('=' .repeat(60));
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Find a card with the most complete data
    const card = await Card.findOne({ 
      aiInsights: { $exists: true, $ne: null },
      semanticCategory: { $exists: true },
      mnemonics: { $exists: true },
      etymology: { $exists: true }
    });
    
    if (!card) {
      console.log('❌ No cards with complete data found');
      process.exit(1);
    }
    
    console.log(`Testing with card: ${card.hanzi} (${card.meaning})`);
    console.log(`Card ID: ${card._id}\n`);
    
    // Show what data the card has
    console.log('📋 Card Data Available:');
    console.log('-'.repeat(40));
    console.log(`  ✅ Basic: hanzi, pinyin, meaning`);
    console.log(`  ${card.semanticCategory ? '✅' : '❌'} Semantic Category: ${card.semanticCategory || 'missing'}`);
    console.log(`  ${card.strokeCount ? '✅' : '❌'} Stroke Count: ${card.strokeCount || 'missing'}`);
    console.log(`  ${card.componentCount ? '✅' : '❌'} Component Count: ${card.componentCount || 'missing'}`);
    console.log(`  ${card.visualComplexity ? '✅' : '❌'} Visual Complexity: ${card.visualComplexity || 'missing'}`);
    console.log(`  ${card.overallDifficulty ? '✅' : '❌'} Overall Difficulty: ${card.overallDifficulty || 'missing'}`);
    console.log(`  ${card.mnemonics?.length ? '✅' : '❌'} Mnemonics: ${card.mnemonics?.length || 0} items`);
    console.log(`  ${card.etymology ? '✅' : '❌'} Etymology: ${card.etymology ? 'present' : 'missing'}`);
    console.log(`  ${card.aiInsights ? '✅' : '❌'} AI Insights: ${card.aiInsights ? 'present' : 'missing'}`);
    console.log(`  ${card.commonConfusions?.length ? '✅' : '❌'} Common Confusions: ${card.commonConfusions?.length || 0} items`);
    
    // Test the API endpoint
    console.log('\n📡 Testing API endpoint...\n');
    
    const response = await fetch('http://localhost:3000/api/analytics/character-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        characterId: card._id.toString()
      })
    });
    
    if (!response.ok) {
      console.error('❌ API request failed:', response.status, response.statusText);
      process.exit(1);
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('❌ API returned error:', data.error);
      process.exit(1);
    }
    
    // Check the API response thoroughly
    console.log('📊 API Response Analysis:');
    console.log('=' .repeat(50));
    
    // Character data
    console.log('\n1️⃣ Character Data:');
    console.log(`  ✅ Hanzi: ${data.insights?.character?.hanzi}`);
    console.log(`  ✅ Pinyin: ${data.insights?.character?.pinyin}`);
    console.log(`  ✅ Meaning: ${data.insights?.character?.meaning}`);
    console.log(`  ${data.insights?.character?.imageUrl ? '✅' : '❌'} Image URL`);
    
    // Complexity analysis
    console.log('\n2️⃣ Complexity Analysis:');
    const complexity = data.insights?.complexity;
    console.log(`  ${complexity?.strokeCount ? '✅' : '❌'} Stroke Count: ${complexity?.strokeCount || 'missing'}`);
    console.log(`  ${complexity?.componentCount ? '✅' : '❌'} Component Count: ${complexity?.componentCount || 'missing'}`);
    console.log(`  ${complexity?.semanticCategory ? '✅' : '❌'} Semantic Category: ${complexity?.semanticCategory || 'missing'}`);
    console.log(`  ${complexity?.visualComplexity ? '✅' : '❌'} Visual Complexity: ${complexity?.visualComplexity || 'missing'}`);
    console.log(`  ${complexity?.overallDifficulty ? '✅' : '❌'} Overall Difficulty: ${complexity?.overallDifficulty || 'missing'}`);
    console.log(`  ${complexity?.mnemonics?.length ? '✅' : '❌'} Mnemonics: ${complexity?.mnemonics?.length || 0} items`);
    console.log(`  ${complexity?.etymology ? '✅' : '❌'} Etymology: ${complexity?.etymology ? 'present' : 'missing'}`);
    
    // AI Insights
    console.log('\n3️⃣ AI Insights:');
    const ai = data.insights?.aiInsights;
    if (ai) {
      console.log(`  ✅ Etymology Origin: ${ai.etymology?.origin ? 'present' : 'missing'}`);
      console.log(`  ✅ Visual Mnemonic: ${ai.mnemonics?.visual ? 'present' : 'missing'}`);
      console.log(`  ✅ Story Mnemonic: ${ai.mnemonics?.story ? 'present' : 'missing'}`);
      console.log(`  ✅ Component Breakdown: ${ai.mnemonics?.components ? 'present' : 'missing'}`);
      console.log(`  ✅ Learning Tips (Beginner): ${ai.learningTips?.forBeginners?.length || 0} tips`);
      console.log(`  ✅ Learning Tips (Intermediate): ${ai.learningTips?.forIntermediate?.length || 0} tips`);
      console.log(`  ✅ Learning Tips (Advanced): ${ai.learningTips?.forAdvanced?.length || 0} tips`);
      console.log(`  ✅ Common Errors: ${ai.commonErrors?.similarCharacters?.length || 0} similar chars`);
      console.log(`  ✅ Usage Info: ${ai.usage?.commonCollocations?.length || 0} collocations`);
    } else {
      console.log('  ❌ No AI insights in response');
    }
    
    // Review history
    console.log('\n4️⃣ Review History:');
    const review = data.insights?.reviewHistory;
    if (review) {
      console.log(`  ✅ Times Seen: ${review.seen || 0}`);
      console.log(`  ✅ Correct: ${review.correct || 0}`);
      console.log(`  ✅ Accuracy: ${review.accuracy?.toFixed(1) || 0}%`);
    } else {
      console.log('  ℹ️ No review history (character not studied yet)');
    }
    
    // Confusion analysis
    console.log('\n5️⃣ Confusion Analysis:');
    const confusions = data.insights?.confusionAnalysis;
    if (confusions && confusions.length > 0) {
      console.log(`  ✅ Found ${confusions.length} commonly confused characters:`);
      confusions.forEach((c: any) => {
        console.log(`     - ${c.character} (${c.meaning})`);
      });
    } else {
      console.log('  ℹ️ No confusion data available');
    }
    
    // Final verdict
    console.log('\n' + '=' .repeat(50));
    console.log('📈 Summary:');
    
    const hasAllBasicData = complexity?.strokeCount && complexity?.semanticCategory && complexity?.visualComplexity;
    const hasAllAIInsights = ai?.etymology?.origin && ai?.mnemonics?.visual && ai?.learningTips?.forBeginners?.length > 0;
    const hasEnrichmentData = complexity?.mnemonics?.length > 0 || complexity?.etymology;
    
    if (hasAllBasicData && hasAllAIInsights && hasEnrichmentData) {
      console.log('✅ ALL analysis data is being returned correctly!');
      console.log('✅ The Character Insights modal should display everything properly.');
    } else {
      console.log('⚠️ Some data is missing:');
      if (!hasAllBasicData) console.log('  - Missing some basic complexity analysis');
      if (!hasAllAIInsights) console.log('  - Missing some AI insights');
      if (!hasEnrichmentData) console.log('  - Missing mnemonics or etymology');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();