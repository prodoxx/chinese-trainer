#!/usr/bin/env bun
/**
 * Fix duplicate data and test AI insights with timestamp
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import CharacterAnalysis from '../src/lib/db/models/CharacterAnalysis';
import { getCardEnrichmentQueue } from '../src/lib/queue/queues';
import { Queue } from 'bullmq';
import getRedis from '../src/lib/queue/redis';

async function cleanupDuplicates() {
  console.log('🧹 Cleaning up duplicate CharacterAnalysis entries...');
  
  // Remove all test-related character analyses
  const result = await CharacterAnalysis.deleteMany({
    character: { $regex: '測試' }
  });
  
  console.log(`Deleted ${result.deletedCount} duplicate entries\n`);
}

async function waitForJob(jobId: string | undefined, timeout = 60000): Promise<{ success: boolean; error?: string }> {
  if (!jobId) return { success: false, error: 'No job ID' };
  
  const queue = new Queue('card-enrichment', { connection: getRedis() });
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const job = await queue.getJob(jobId);
    if (!job) {
      await queue.close();
      return { success: false, error: 'Job not found' };
    }
    
    const state = await job.getState();
    
    if (state === 'completed') {
      await queue.close();
      return { success: true };
    } else if (state === 'failed') {
      const reason = job.failedReason;
      await queue.close();
      return { success: false, error: reason };
    }
    
    // Show progress
    process.stdout.write(`\r  ⏳ Job state: ${state}...`);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  await queue.close();
  return { success: false, error: 'Timeout' };
}

async function testEnrichmentWithTimestamp() {
  console.log('🧪 Testing AI insights with timestamp field\n');
  
  // Use a unique character to avoid duplicates
  const uniqueId = Date.now();
  const testHanzi = `測${uniqueId}`;
  
  try {
    // Clean up any existing data
    await Card.deleteMany({ hanzi: testHanzi });
    await CharacterAnalysis.deleteMany({ character: testHanzi });
    
    // Create a new card
    console.log(`Creating card: ${testHanzi}`);
    const card = new Card({
      hanzi: testHanzi,
      meaning: 'unique test character',
      cached: false
    });
    await card.save();
    console.log(`✅ Card created with ID: ${card._id}\n`);
    
    // Queue enrichment
    console.log('Queueing enrichment job...');
    const queue = getCardEnrichmentQueue();
    const job = await queue.add('enrich-card', {
      cardId: card._id.toString(),
      userId: 'test-user',
      deckId: null,
      force: false,
      aiProvider: 'openai'
    });
    console.log(`Job ID: ${job.id}\n`);
    
    // Wait for completion
    console.log('Waiting for enrichment to complete...');
    const result = await waitForJob(job.id, 60000);
    console.log(''); // New line after progress
    
    if (!result.success) {
      console.error(`❌ Enrichment failed: ${result.error}`);
      return false;
    }
    
    console.log('✅ Enrichment completed successfully\n');
    
    // Check the enriched card
    const enrichedCard = await Card.findById(card._id);
    if (!enrichedCard) {
      console.error('❌ Card not found after enrichment');
      return false;
    }
    
    // Detailed check
    console.log('📊 Enrichment Results:');
    console.log('='.repeat(50));
    
    const checks = [
      { name: 'Has AI Insights', value: !!enrichedCard.aiInsights },
      { name: 'Has Etymology', value: !!enrichedCard.aiInsights?.etymology },
      { name: 'Has Mnemonics', value: !!enrichedCard.aiInsights?.mnemonics },
      { name: 'Has Learning Tips', value: !!enrichedCard.aiInsights?.learningTips },
      { name: 'Has AI Insights Date', value: !!enrichedCard.aiInsightsGeneratedAt },
      { name: 'Has Image URL', value: !!enrichedCard.imageUrl },
      { name: 'Has Audio URL', value: !!enrichedCard.audioUrl },
      { name: 'Has Pinyin', value: !!enrichedCard.pinyin },
      { name: 'Is Cached', value: enrichedCard.cached === true }
    ];
    
    let allPassed = true;
    checks.forEach(check => {
      const icon = check.value ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
      if (!check.value) allPassed = false;
    });
    
    // Show actual values
    console.log('\n📝 Actual Values:');
    console.log('='.repeat(50));
    console.log(`Pinyin: ${enrichedCard.pinyin || 'N/A'}`);
    console.log(`Meaning: ${enrichedCard.meaning || 'N/A'}`);
    console.log(`AI Insights Generated At: ${enrichedCard.aiInsightsGeneratedAt || 'NOT SET'}`);
    
    if (enrichedCard.aiInsights) {
      console.log('\n🧠 AI Insights Sample:');
      if (enrichedCard.aiInsights.etymology?.origin) {
        console.log(`Etymology: ${enrichedCard.aiInsights.etymology.origin.substring(0, 80)}...`);
      }
      if (enrichedCard.aiInsights.mnemonics?.visual) {
        console.log(`Mnemonic: ${enrichedCard.aiInsights.mnemonics.visual.substring(0, 80)}...`);
      }
    }
    
    // Cleanup
    await Card.deleteOne({ _id: card._id });
    await CharacterAnalysis.deleteMany({ character: testHanzi });
    
    return allPassed;
    
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function main() {
  try {
    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected\n');
    
    // Check API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured in .env file');
    }
    console.log('✅ OpenAI API key configured\n');
    
    // Clean up duplicates
    await cleanupDuplicates();
    
    // Run test
    const success = await testEnrichmentWithTimestamp();
    
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('🎉 SUCCESS! AI insights with timestamp are working!');
      console.log('✅ AI insights are generated during enrichment');
      console.log('✅ Timestamp (aiInsightsGeneratedAt) is saved');
      console.log('✅ Card is marked as cached');
      console.log('✅ All data is properly persisted');
    } else {
      console.log('⚠️ Test failed - some fields are missing');
      console.log('Check the worker logs for more details');
    }
    console.log('='.repeat(60));
    
    process.exit(success ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Critical error:', error);
    process.exit(1);
  }
}

main();