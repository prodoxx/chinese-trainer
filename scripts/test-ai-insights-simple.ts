#!/usr/bin/env bun
/**
 * Simple test to verify AI insights are being saved with date
 */

import connectDB from '../src/lib/db/mongodb';
import Card from '../src/lib/db/models/Card';
import { getCardEnrichmentQueue } from '../src/lib/queue/queues';
import { Queue } from 'bullmq';
import getRedis from '../src/lib/queue/redis';

async function main() {
  console.log('🧪 Simple AI Insights Test\n');
  
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');
    
    // Create a test card
    const testHanzi = '測試_' + Date.now();
    console.log(`Creating test card: ${testHanzi}`);
    
    const card = new Card({
      hanzi: testHanzi,
      meaning: 'test',
      cached: false
    });
    await card.save();
    console.log(`Card created with ID: ${card._id}\n`);
    
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
    console.log('Waiting for enrichment (max 60 seconds)...');
    const queueMonitor = new Queue('card-enrichment', { connection: getRedis() });
    
    let completed = false;
    const startTime = Date.now();
    
    while (!completed && Date.now() - startTime < 60000) {
      const jobStatus = await queueMonitor.getJob(job.id!);
      if (!jobStatus) {
        console.error('Job not found!');
        break;
      }
      
      const state = await jobStatus.getState();
      console.log(`Job state: ${state}`);
      
      if (state === 'completed') {
        completed = true;
        console.log('✅ Enrichment completed!\n');
      } else if (state === 'failed') {
        console.error('❌ Job failed:', jobStatus.failedReason);
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    await queueMonitor.close();
    
    // Check the card
    console.log('Checking enriched card...');
    const enrichedCard = await Card.findById(card._id);
    
    if (!enrichedCard) {
      throw new Error('Card not found!');
    }
    
    console.log('\n📊 Results:');
    console.log('Has AI Insights:', !!enrichedCard.aiInsights);
    console.log('Has Etymology:', !!enrichedCard.aiInsights?.etymology);
    console.log('Has Mnemonics:', !!enrichedCard.aiInsights?.mnemonics);
    console.log('Has Learning Tips:', !!enrichedCard.aiInsights?.learningTips);
    console.log('AI Insights Generated At:', enrichedCard.aiInsightsGeneratedAt);
    console.log('Type of aiInsightsGeneratedAt:', typeof enrichedCard.aiInsightsGeneratedAt);
    
    // Debug: Show raw document
    console.log('\n🔍 Raw document aiInsightsGeneratedAt field:');
    const rawDoc = await Card.collection.findOne({ _id: card._id });
    console.log('Raw aiInsightsGeneratedAt:', rawDoc?.aiInsightsGeneratedAt);
    console.log('Type:', typeof rawDoc?.aiInsightsGeneratedAt);
    
    if (enrichedCard.aiInsights) {
      console.log('\n✅ AI insights are present!');
      if (enrichedCard.aiInsightsGeneratedAt) {
        console.log('✅ Generation date is saved!');
      } else {
        console.log('❌ Generation date is missing!');
        console.log('\n⚠️ This might be a Mongoose schema issue');
      }
    } else {
      console.log('❌ AI insights are missing!');
    }
    
    // Cleanup
    await Card.deleteOne({ _id: card._id });
    console.log('\n🧹 Test card deleted');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

main();