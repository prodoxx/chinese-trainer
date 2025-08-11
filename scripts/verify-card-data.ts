#!/usr/bin/env bun
/**
 * Verify a specific card has all data
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function main() {
  const targetHanzi = process.argv[2] || '房間';
  
  console.log(`🔍 Verifying Card Data for "${targetHanzi}"\n`);
  console.log('=' .repeat(60));
  
  try {
    await connectDB();
    
    const card = await Card.findOne({ hanzi: targetHanzi });
    
    if (!card) {
      console.log(`❌ Card not found: ${targetHanzi}`);
      process.exit(1);
    }
    
    console.log(`✅ Found card: ${card.hanzi} (${card.pinyin}) - ${card.meaning}\n`);
    
    // Check all fields
    console.log('📋 Data Completeness Check:');
    console.log('-'.repeat(40));
    
    // Basic fields
    console.log('\n1️⃣ Basic Fields:');
    console.log(`  ${card.hanzi ? '✅' : '❌'} hanzi: ${card.hanzi}`);
    console.log(`  ${card.pinyin ? '✅' : '❌'} pinyin: ${card.pinyin}`);
    console.log(`  ${card.meaning ? '✅' : '❌'} meaning: ${card.meaning}`);
    console.log(`  ${card.imageUrl ? '✅' : '❌'} imageUrl: ${card.imageUrl ? 'present' : 'missing'}`);
    console.log(`  ${card.audioUrl ? '✅' : '❌'} audioUrl: ${card.audioUrl ? 'present' : 'missing'}`);
    
    // Analysis fields
    console.log('\n2️⃣ Analysis Fields:');
    console.log(`  ${card.semanticCategory ? '✅' : '❌'} semanticCategory: ${card.semanticCategory || 'missing'}`);
    console.log(`  ${card.strokeCount ? '✅' : '❌'} strokeCount: ${card.strokeCount || 'missing'}`);
    console.log(`  ${card.componentCount ? '✅' : '❌'} componentCount: ${card.componentCount || 'missing'}`);
    console.log(`  ${card.visualComplexity ? '✅' : '❌'} visualComplexity: ${card.visualComplexity || 'missing'}`);
    console.log(`  ${card.overallDifficulty ? '✅' : '❌'} overallDifficulty: ${card.overallDifficulty || 'missing'}`);
    console.log(`  ${card.tonePattern ? '✅' : '❌'} tonePattern: ${card.tonePattern || 'missing'}`);
    
    // Enrichment fields
    console.log('\n3️⃣ Enrichment Fields:');
    console.log(`  ${card.mnemonics?.length ? '✅' : '❌'} mnemonics: ${card.mnemonics?.length || 0} items`);
    if (card.mnemonics?.length) {
      console.log(`     First: "${card.mnemonics[0].substring(0, 50)}..."`);
    }
    console.log(`  ${card.etymology ? '✅' : '❌'} etymology: ${card.etymology ? 'present' : 'missing'}`);
    if (card.etymology) {
      console.log(`     "${card.etymology.substring(0, 50)}..."`);
    }
    
    // AI Insights
    console.log('\n4️⃣ AI Insights:');
    const hasValidAIInsights = card.aiInsights?.etymology?.origin && 
      card.aiInsights?.mnemonics?.visual && 
      card.aiInsights?.learningTips?.forBeginners?.length > 0;
    
    console.log(`  ${hasValidAIInsights ? '✅' : '❌'} Valid AI Insights: ${hasValidAIInsights ? 'YES' : 'NO'}`);
    
    if (card.aiInsights) {
      console.log(`  Structure breakdown:`);
      console.log(`    ${card.aiInsights.etymology?.origin ? '✅' : '❌'} etymology.origin`);
      console.log(`    ${card.aiInsights.mnemonics?.visual ? '✅' : '❌'} mnemonics.visual`);
      console.log(`    ${card.aiInsights.mnemonics?.story ? '✅' : '❌'} mnemonics.story`);
      console.log(`    ${card.aiInsights.mnemonics?.components ? '✅' : '❌'} mnemonics.components`);
      console.log(`    ${card.aiInsights.learningTips?.forBeginners?.length > 0 ? '✅' : '❌'} learningTips.forBeginners (${card.aiInsights.learningTips?.forBeginners?.length || 0})`);
      console.log(`    ${card.aiInsights.learningTips?.forIntermediate?.length > 0 ? '✅' : '❌'} learningTips.forIntermediate (${card.aiInsights.learningTips?.forIntermediate?.length || 0})`);
      console.log(`    ${card.aiInsights.learningTips?.forAdvanced?.length > 0 ? '✅' : '❌'} learningTips.forAdvanced (${card.aiInsights.learningTips?.forAdvanced?.length || 0})`);
      console.log(`    ${card.aiInsights.commonErrors?.similarCharacters?.length > 0 ? '✅' : '❌'} commonErrors.similarCharacters (${card.aiInsights.commonErrors?.similarCharacters?.length || 0})`);
      console.log(`    ${card.aiInsights.usage?.commonCollocations?.length > 0 ? '✅' : '❌'} usage.commonCollocations (${card.aiInsights.usage?.commonCollocations?.length || 0})`);
    }
    
    console.log(`  ${card.aiInsightsGeneratedAt ? '✅' : '❌'} aiInsightsGeneratedAt: ${card.aiInsightsGeneratedAt || 'missing'}`);
    
    // Summary
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Summary:');
    
    const hasBasicData = card.hanzi && card.pinyin && card.meaning;
    const hasAnalysisData = card.semanticCategory && card.strokeCount && card.visualComplexity;
    const hasEnrichmentData = (card.mnemonics?.length > 0) || card.etymology;
    
    if (hasBasicData && hasAnalysisData && hasEnrichmentData && hasValidAIInsights) {
      console.log('✅ Card has ALL required data!');
      console.log('✅ Character Insights modal will display everything properly.');
    } else {
      console.log('⚠️ Card is missing some data:');
      if (!hasBasicData) console.log('  ❌ Missing basic data');
      if (!hasAnalysisData) console.log('  ❌ Missing analysis data');
      if (!hasEnrichmentData) console.log('  ❌ Missing enrichment data');
      if (!hasValidAIInsights) console.log('  ❌ Missing or invalid AI insights');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

main();