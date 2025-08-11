#!/usr/bin/env bun
/**
 * End-to-end test of enrichment process with AI insights
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';

async function testEndToEndEnrichment(hanzi: string, meaning: string, testNumber: number) {
  console.log(`\n🧪 Test ${testNumber}: E2E enrichment for "${hanzi}" (${meaning})`);
  console.log('-'.repeat(60));
  
  try {
    await connectDB();
    
    // Step 1: Check if workers are running by checking for existing enriched cards
    console.log('1️⃣ Checking enrichment system status...');
    
    const existingEnrichedCard = await Card.findOne({ 
      cached: true,
      aiInsights: { $exists: true }
    });
    
    if (existingEnrichedCard) {
      console.log(`   ✅ Found existing enriched card: ${existingEnrichedCard.hanzi}`);
      console.log(`   ✅ System has previously enriched cards successfully`);
    } else {
      console.log(`   ⚠️ No previously enriched cards found`);
    }
    
    // Step 2: Create test card
    console.log('\n2️⃣ Creating test card...');
    
    // Delete existing card if it exists
    await Card.deleteOne({ hanzi });
    
    const newCard = await Card.create({
      hanzi,
      meaning,
      pinyin: '',
      cached: false
    });
    
    console.log(`   ✅ Created card: ${newCard._id}`);
    
    // Step 3: Trigger enrichment via API endpoint
    console.log('\n3️⃣ Triggering enrichment via API...');
    
    const enrichResponse = await fetch('http://localhost:3000/api/admin/cards/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardIds: [newCard._id.toString()],
        force: false
      })
    });
    
    if (enrichResponse.ok) {
      const result = await enrichResponse.json();
      console.log(`   ✅ Enrichment triggered: ${result.message || 'Success'}`);
    } else {
      console.log(`   ❌ API call failed: ${enrichResponse.status} ${enrichResponse.statusText}`);
      const errorText = await enrichResponse.text();
      console.log(`   Error: ${errorText}`);
      return false;
    }
    
    // Step 4: Wait for enrichment to complete
    console.log('\n4️⃣ Waiting for enrichment to complete...');
    
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    let enrichedCard = null;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      enrichedCard = await Card.findById(newCard._id);
      
      // Check if enrichment is complete
      if (enrichedCard?.cached) {
        console.log(`   ✅ Enrichment completed after ${attempts + 1} seconds`);
        break;
      }
      
      // Check for AI insights even if not marked as cached
      if (enrichedCard?.aiInsights?.etymology?.origin) {
        console.log(`   ✅ AI insights generated after ${attempts + 1} seconds (card may still be processing other enrichments)`);
        break;
      }
      
      if (attempts % 5 === 0) {
        console.log(`   ⏳ Still processing... (${attempts}s elapsed)`);
      }
      
      attempts++;
    }
    
    if (attempts >= maxAttempts) {
      console.error('   ❌ Timeout: Enrichment took too long');
      console.log('   💡 Make sure the enrichment worker is running: bun run worker');
      return false;
    }
    
    // Step 5: Verify AI insights
    console.log('\n5️⃣ Verifying AI insights...');
    
    if (!enrichedCard) {
      console.error('   ❌ Could not retrieve enriched card');
      return false;
    }
    
    // Check basic enrichment
    console.log(`   ${enrichedCard.pinyin ? '✅' : '❌'} Pinyin: ${enrichedCard.pinyin || 'MISSING'}`);
    console.log(`   ${enrichedCard.imageUrl ? '✅' : '❌'} Image: ${enrichedCard.imageUrl ? 'generated' : 'MISSING'}`);
    console.log(`   ${enrichedCard.audioUrl ? '✅' : '❌'} Audio: ${enrichedCard.audioUrl ? 'generated' : 'MISSING'}`);
    
    // Check AI insights
    const hasValidContent = enrichedCard.aiInsights?.etymology?.origin && 
      enrichedCard.aiInsights?.mnemonics?.visual && 
      enrichedCard.aiInsights?.learningTips?.forBeginners?.length > 0;
    
    console.log(`   ${hasValidContent ? '✅' : '❌'} AI Insights with valid content: ${hasValidContent ? 'YES' : 'NO'}`);
    
    if (hasValidContent) {
      console.log('\n   📋 Content verification:');
      console.log(`      ✅ Etymology: ${enrichedCard.aiInsights.etymology.origin.substring(0, 50)}...`);
      console.log(`      ✅ Visual mnemonic: ${enrichedCard.aiInsights.mnemonics.visual.substring(0, 50)}...`);
      console.log(`      ✅ Learning tips: ${enrichedCard.aiInsights.learningTips.forBeginners.length} beginner tips`);
    }
    
    console.log(`   ${enrichedCard.aiInsightsGeneratedAt ? '✅' : '❌'} Timestamp: ${enrichedCard.aiInsightsGeneratedAt || 'MISSING'}`);
    
    return hasValidContent;
    
  } catch (error) {
    console.error('   ❌ Test failed with error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 End-to-End Enrichment Test with AI Insights');
  console.log('=' .repeat(60));
  console.log('ℹ️ This test requires the enrichment worker to be running');
  console.log('ℹ️ Start it with: bun run worker\n');
  
  // Test characters
  const testCases = [
    { hanzi: '山', meaning: 'mountain' },
    { hanzi: '雨', meaning: 'rain' },
    { hanzi: '花', meaning: 'flower' }
  ];
  
  const results: boolean[] = [];
  
  // Run tests
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const success = await testEndToEndEnrichment(testCase.hanzi, testCase.meaning, i + 1);
    results.push(success);
    
    if (success) {
      console.log(`\n✅ Test ${i + 1} PASSED: Enrichment with AI insights working!\n`);
    } else {
      console.log(`\n❌ Test ${i + 1} FAILED: Check worker logs for details!\n`);
    }
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
    console.log('✅ The enrichment workers are properly configured.');
  } else if (passed > 0) {
    console.log('\n⚠️ Some tests passed. Enrichment is partially working.');
    console.log('💡 Check worker logs for failed tests.');
  } else {
    console.log('\n❌ All tests failed!');
    console.log('💡 Possible issues:');
    console.log('   1. Enrichment worker not running (start with: bun run worker)');
    console.log('   2. API endpoint not accessible');
    console.log('   3. OpenAI API key not configured');
    console.log('   4. Check server logs for errors');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

main();