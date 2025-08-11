#!/usr/bin/env bun
/**
 * Final test for aiInsightsGeneratedAt field
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';
import { getCardEnrichmentQueue } from '../src/lib/queue/queues';
import { Queue } from 'bullmq';
import getRedis from '../src/lib/queue/redis';

async function main() {
  console.log('🧪 Final Test for AI Insights Timestamp\n');
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Use a simple, unique character that won't cause issues
    const testHanzi = '書'; // Simple character - "book"
    
    // Clean up any existing data
    console.log(`🧹 Cleaning up existing data for "${testHanzi}"...`);
    await Card.deleteMany({ hanzi: testHanzi });
    await CharacterAnalysis.deleteMany({ character: testHanzi });
    console.log('✅ Cleanup complete\n');
    
    // Create card
    console.log(`📝 Creating card for "${testHanzi}"...`);
    const card = new Card({
      hanzi: testHanzi,
      meaning: 'book',
      cached: false
    });
    await card.save();
    console.log(`✅ Card created: ${card._id}\n`);
    
    // Queue enrichment
    console.log('🚀 Queueing enrichment job...');
    const queue = getCardEnrichmentQueue();
    const job = await queue.add('enrich-card', {
      cardId: card._id.toString(),
      userId: 'test-user',
      deckId: null,
      force: true, // Force to ensure AI insights are generated
      aiProvider: 'openai'
    });
    console.log(`📋 Job ID: ${job.id}\n`);
    
    // Wait for completion
    console.log('⏳ Waiting for enrichment (max 60 seconds)...\n');
    const queueMonitor = new Queue('card-enrichment', { connection: getRedis() });
    
    let completed = false;
    const startTime = Date.now();
    let lastState = '';
    
    while (!completed && Date.now() - startTime < 60000) {
      const jobStatus = await queueMonitor.getJob(job.id!);
      if (!jobStatus) break;
      
      const state = await jobStatus.getState();
      if (state !== lastState) {
        console.log(`   Job state: ${state}`);
        lastState = state;
      }
      
      if (state === 'completed') {
        completed = true;
        console.log('\n✅ Enrichment completed!\n');
      } else if (state === 'failed') {
        console.error('\n❌ Job failed:', jobStatus.failedReason);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    await queueMonitor.close();
    
    if (!completed) {
      console.error('❌ Enrichment did not complete\n');
      process.exit(1);
    }
    
    // Check the result
    console.log('📊 Checking enrichment results...\n');
    const enrichedCard = await Card.findById(card._id);
    
    if (!enrichedCard) {
      console.error('❌ Card not found!');
      process.exit(1);
    }
    
    // Display results
    console.log('=' .repeat(60));
    console.log('ENRICHMENT RESULTS');
    console.log('=' .repeat(60));
    
    const results = [
      { field: 'Hanzi', value: enrichedCard.hanzi },
      { field: 'Pinyin', value: enrichedCard.pinyin || '❌ MISSING' },
      { field: 'Meaning', value: enrichedCard.meaning || '❌ MISSING' },
      { field: 'AI Insights', value: enrichedCard.aiInsights ? '✅ Present' : '❌ MISSING' },
      { field: 'AI Insights Date', value: enrichedCard.aiInsightsGeneratedAt || '❌ MISSING' },
      { field: 'Image URL', value: enrichedCard.imageUrl ? '✅ Present' : '❌ Missing' },
      { field: 'Audio URL', value: enrichedCard.audioUrl ? '✅ Present' : '❌ Missing' },
      { field: 'Cached', value: enrichedCard.cached ? '✅ Yes' : '❌ No' }
    ];
    
    results.forEach(r => {
      console.log(`${r.field.padEnd(20)}: ${r.value}`);
    });
    
    if (enrichedCard.aiInsights) {
      console.log('\n📝 AI Insights Content:');
      console.log(`   Etymology: ${enrichedCard.aiInsights.etymology?.origin ? '✅' : '❌'}`);
      console.log(`   Mnemonics: ${enrichedCard.aiInsights.mnemonics?.visual ? '✅' : '❌'}`);
      console.log(`   Learning Tips: ${enrichedCard.aiInsights.learningTips?.forBeginners ? '✅' : '❌'}`);
    }
    
    // Final verdict
    console.log('\n' + '=' .repeat(60));
    if (enrichedCard.aiInsightsGeneratedAt) {
      console.log('🎉 SUCCESS! Timestamp field is working!');
      console.log(`✅ aiInsightsGeneratedAt: ${enrichedCard.aiInsightsGeneratedAt}`);
    } else {
      console.log('❌ FAILED! Timestamp field is not being saved');
      console.log('\nDebugging info:');
      console.log('- AI insights are present:', !!enrichedCard.aiInsights);
      console.log('- Card is cached:', enrichedCard.cached);
      console.log('- Check worker logs for "📝 Before save" and "📝 After save" messages');
    }
    console.log('=' .repeat(60));
    
    // Cleanup
    await Card.deleteOne({ _id: card._id });
    await CharacterAnalysis.deleteMany({ character: testHanzi });
    console.log('\n🧹 Test data cleaned up');
    
    process.exit(enrichedCard.aiInsightsGeneratedAt ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();