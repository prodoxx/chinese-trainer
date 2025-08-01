#!/usr/bin/env bun

import { deckImportQueue, deckEnrichmentQueue, cardEnrichmentQueue } from '@/lib/queue/queues';

async function emptyQueues() {
  console.log('🗑️  Emptying all job queues...\n');

  try {
    // Empty deck import queue
    const importJobs = await deckImportQueue().clean(0, 0, 'completed');
    const importFailed = await deckImportQueue().clean(0, 0, 'failed');
    const importWaiting = await deckImportQueue().drain();
    console.log(`📥 Deck Import Queue:`);
    console.log(`   - Removed ${importJobs.length} completed jobs`);
    console.log(`   - Removed ${importFailed.length} failed jobs`);
    console.log(`   - Removed waiting jobs`);

    // Empty deck enrichment queue
    const enrichJobs = await deckEnrichmentQueue().clean(0, 0, 'completed');
    const enrichFailed = await deckEnrichmentQueue().clean(0, 0, 'failed');
    const enrichWaiting = await deckEnrichmentQueue().drain();
    console.log(`\n🚀 Deck Enrichment Queue:`);
    console.log(`   - Removed ${enrichJobs.length} completed jobs`);
    console.log(`   - Removed ${enrichFailed.length} failed jobs`);
    console.log(`   - Removed waiting jobs`);

    // Empty card enrichment queue
    const cardJobs = await cardEnrichmentQueue().clean(0, 0, 'completed');
    const cardFailed = await cardEnrichmentQueue().clean(0, 0, 'failed');
    const cardWaiting = await cardEnrichmentQueue().drain();
    console.log(`\n💳 Card Enrichment Queue:`);
    console.log(`   - Removed ${cardJobs.length} completed jobs`);
    console.log(`   - Removed ${cardFailed.length} failed jobs`);
    console.log(`   - Removed waiting jobs`);

    // Get current queue status
    console.log('\n📊 Current Queue Status:');
    
    const importCounts = await deckImportQueue().getJobCounts();
    console.log(`\n📥 Deck Import Queue:`);
    console.log(`   - Waiting: ${importCounts.waiting}`);
    console.log(`   - Active: ${importCounts.active}`);
    console.log(`   - Completed: ${importCounts.completed}`);
    console.log(`   - Failed: ${importCounts.failed}`);
    console.log(`   - Delayed: ${importCounts.delayed}`);

    const enrichCounts = await deckEnrichmentQueue().getJobCounts();
    console.log(`\n🚀 Deck Enrichment Queue:`);
    console.log(`   - Waiting: ${enrichCounts.waiting}`);
    console.log(`   - Active: ${enrichCounts.active}`);
    console.log(`   - Completed: ${enrichCounts.completed}`);
    console.log(`   - Failed: ${enrichCounts.failed}`);
    console.log(`   - Delayed: ${enrichCounts.delayed}`);

    const cardCounts = await cardEnrichmentQueue().getJobCounts();
    console.log(`\n💳 Card Enrichment Queue:`);
    console.log(`   - Waiting: ${cardCounts.waiting}`);
    console.log(`   - Active: ${cardCounts.active}`);
    console.log(`   - Completed: ${cardCounts.completed}`);
    console.log(`   - Failed: ${cardCounts.failed}`);
    console.log(`   - Delayed: ${cardCounts.delayed}`);

    console.log('\n✅ All queues have been emptied!');
    
    // Close connections
    await deckImportQueue.close();
    await deckEnrichmentQueue.close();
    await imageGenerationQueue.close();
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error emptying queues:', error);
    process.exit(1);
  }
}

// Run the script
emptyQueues();