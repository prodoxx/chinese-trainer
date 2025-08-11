#!/usr/bin/env bun
/**
 * Test that enrichment process generates AI insights properly
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import { getCardEnrichmentQueue } from '../src/lib/queue/queues';
import getRedis from '../src/lib/queue/redis';

async function testEnrichment(hanzi: string, meaning: string, testNumber: number) {
  console.log(`\n🧪 Test ${testNumber}: Testing enrichment for "${hanzi}" (${meaning})`);
  console.log('-'.repeat(60));
  
  try {
    await connectDB();
    
    // Step 1: Create a test card WITHOUT AI insights
    console.log('1️⃣ Creating test card without AI insights...');
    
    // Delete existing card if it exists
    await Card.deleteOne({ hanzi });
    
    // Create new card with minimal data
    const newCard = await Card.create({
      hanzi,
      meaning,
      pinyin: '', // Will be filled by enrichment
      cached: false,
      aiInsights: undefined, // Explicitly no AI insights
      aiInsightsGeneratedAt: undefined
    });
    
    console.log(`   ✅ Created card with ID: ${newCard._id}`);
    console.log(`   ✅ AI insights: ${newCard.aiInsights ? 'EXISTS' : 'NONE'}`);
    
    // Step 2: Queue enrichment job
    console.log('\n2️⃣ Queueing enrichment job...');
    
    const queue = getCardEnrichmentQueue();
    const job = await queue.add('enrich-card', {
      cardId: newCard._id.toString(),
      userId: 'test-user',
      deckId: 'test-deck',
      force: false,
      aiProvider: 'openai'
    });
    
    console.log(`   ✅ Job queued with ID: ${job.id}`);
    
    // Step 3: Wait for enrichment to complete
    console.log('\n3️⃣ Waiting for enrichment to complete...');
    
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout
    let enrichedCard = null;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      enrichedCard = await Card.findById(newCard._id);
      
      // Check if enrichment is complete
      if (enrichedCard?.cached) {
        console.log(`   ✅ Enrichment completed after ${attempts + 1} seconds`);
        break;
      }
      
      // Check job status
      const jobState = await job.getState();
      if (jobState === 'failed') {
        const failedReason = job.failedReason;
        console.error(`   ❌ Job failed: ${failedReason}`);
        return false;
      }
      
      if (attempts % 5 === 0) {
        console.log(`   ⏳ Still processing... (${attempts}s elapsed, job state: ${jobState})`);
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.error('   ❌ Timeout: Enrichment took too long');
      return false;
    }
    
    // Step 4: Verify AI insights were generated
    console.log('\n4️⃣ Verifying AI insights generation...');
    
    if (!enrichedCard) {
      console.error('   ❌ Could not retrieve enriched card');
      return false;
    }
    
    // Check basic enrichment
    console.log(`   ${enrichedCard.pinyin ? '✅' : '❌'} Pinyin: ${enrichedCard.pinyin || 'MISSING'}`);
    console.log(`   ${enrichedCard.imageUrl ? '✅' : '❌'} Image: ${enrichedCard.imageUrl ? 'generated' : 'MISSING'}`);
    console.log(`   ${enrichedCard.audioUrl ? '✅' : '❌'} Audio: ${enrichedCard.audioUrl ? 'generated' : 'MISSING'}`);
    
    // Check AI insights structure
    const hasAIInsights = !!enrichedCard.aiInsights;
    console.log(`   ${hasAIInsights ? '✅' : '❌'} AI Insights structure: ${hasAIInsights ? 'EXISTS' : 'MISSING'}`);
    
    if (hasAIInsights) {
      // Check for actual content
      const hasValidContent = enrichedCard.aiInsights.etymology?.origin && 
        enrichedCard.aiInsights.mnemonics?.visual && 
        enrichedCard.aiInsights.learningTips?.forBeginners?.length > 0;
      
      console.log(`   ${hasValidContent ? '✅' : '❌'} Valid content: ${hasValidContent ? 'YES' : 'NO'}`);
      
      // Detailed check
      console.log('\n   📋 AI Insights Content Check:');
      console.log(`      ${enrichedCard.aiInsights.etymology?.origin ? '✅' : '❌'} Etymology origin`);
      console.log(`      ${enrichedCard.aiInsights.mnemonics?.visual ? '✅' : '❌'} Visual mnemonic`);
      console.log(`      ${enrichedCard.aiInsights.mnemonics?.story ? '✅' : '❌'} Story mnemonic`);
      console.log(`      ${enrichedCard.aiInsights.mnemonics?.components ? '✅' : '❌'} Component breakdown`);
      console.log(`      ${enrichedCard.aiInsights.learningTips?.forBeginners?.length > 0 ? '✅' : '❌'} Beginner tips: ${enrichedCard.aiInsights.learningTips?.forBeginners?.length || 0}`);
      console.log(`      ${enrichedCard.aiInsights.learningTips?.forIntermediate?.length > 0 ? '✅' : '❌'} Intermediate tips: ${enrichedCard.aiInsights.learningTips?.forIntermediate?.length || 0}`);
      console.log(`      ${enrichedCard.aiInsights.learningTips?.forAdvanced?.length > 0 ? '✅' : '❌'} Advanced tips: ${enrichedCard.aiInsights.learningTips?.forAdvanced?.length || 0}`);
      console.log(`      ${enrichedCard.aiInsights.commonErrors?.similarCharacters ? '✅' : '❌'} Common errors`);
      console.log(`      ${enrichedCard.aiInsights.usage?.frequency ? '✅' : '❌'} Usage info`);
      
      // Show sample content
      if (enrichedCard.aiInsights.mnemonics?.visual) {
        console.log(`\n   📝 Sample visual mnemonic:`);
        console.log(`      "${enrichedCard.aiInsights.mnemonics.visual.substring(0, 80)}..."`);
      }
      
      // Check timestamp
      console.log(`\n   ${enrichedCard.aiInsightsGeneratedAt ? '✅' : '❌'} Timestamp: ${enrichedCard.aiInsightsGeneratedAt || 'MISSING'}`);
      
      return hasValidContent;
    }
    
    return false;
    
  } catch (error) {
    console.error('   ❌ Test failed with error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Testing AI Insights Generation in Enrichment Process');
  console.log('=' .repeat(60));
  
  // Test characters
  const testCases = [
    { hanzi: '測試', meaning: 'test' },
    { hanzi: '水', meaning: 'water' },
    { hanzi: '火', meaning: 'fire' },
    { hanzi: '書', meaning: 'book' },
    { hanzi: '電腦', meaning: 'computer' }
  ];
  
  const results: boolean[] = [];
  
  // Run tests
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const success = await testEnrichment(testCase.hanzi, testCase.meaning, i + 1);
    results.push(success);
    
    if (success) {
      console.log(`\n✅ Test ${i + 1} PASSED: AI insights generated successfully!\n`);
    } else {
      console.log(`\n❌ Test ${i + 1} FAILED: AI insights not generated properly!\n`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Final summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Test Summary:');
  console.log('-'.repeat(40));
  
  const passed = results.filter(r => r).length;
  const failed = results.filter(r => !r).length;
  
  console.log(`  ✅ Passed: ${passed}/${testCases.length}`);
  console.log(`  ❌ Failed: ${failed}/${testCases.length}`);
  
  if (passed === testCases.length) {
    console.log('\n🎉 All tests passed! Enrichment is generating AI insights correctly!');
  } else {
    console.log('\n⚠️ Some tests failed. Check the enrichment worker logs for errors.');
  }
  
  // Clean up Redis connection
  const redis = getRedis();
  await redis.quit();
  
  process.exit(failed > 0 ? 1 : 0);
}

main();