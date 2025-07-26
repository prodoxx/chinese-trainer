#!/usr/bin/env bun

import { deckImportQueue, deckEnrichmentQueue, imageGenerationQueue } from '@/lib/queue/queues';

async function emptyQueues() {
  console.log('🗑️  Emptying all job queues...\n');

  try {
    // Empty deck import queue
    const importJobs = await deckImportQueue.clean(0, 0, 'completed');
    const importFailed = await deckImportQueue.clean(0, 0, 'failed');
    const importWaiting = await deckImportQueue.drain();
    console.log(`📥 Deck Import Queue:`);
    console.log(`   - Removed ${importJobs.length} completed jobs`);
    console.log(`   - Removed ${importFailed.length} failed jobs`);
    console.log(`   - Removed waiting jobs`);

    // Empty deck enrichment queue
    const enrichJobs = await deckEnrichmentQueue.clean(0, 0, 'completed');
    const enrichFailed = await deckEnrichmentQueue.clean(0, 0, 'failed');
    const enrichWaiting = await deckEnrichmentQueue.drain();
    console.log(`\n🚀 Deck Enrichment Queue:`);
    console.log(`   - Removed ${enrichJobs.length} completed jobs`);
    console.log(`   - Removed ${enrichFailed.length} failed jobs`);
    console.log(`   - Removed waiting jobs`);

    // Empty image generation queue
    const imageJobs = await imageGenerationQueue.clean(0, 0, 'completed');
    const imageFailed = await imageGenerationQueue.clean(0, 0, 'failed');
    const imageWaiting = await imageGenerationQueue.drain();
    console.log(`\n🎨 Image Generation Queue:`);
    console.log(`   - Removed ${imageJobs.length} completed jobs`);
    console.log(`   - Removed ${imageFailed.length} failed jobs`);
    console.log(`   - Removed waiting jobs`);

    // Get current queue status
    console.log('\n📊 Current Queue Status:');
    
    const importCounts = await deckImportQueue.getJobCounts();
    console.log(`\n📥 Deck Import Queue:`);
    console.log(`   - Waiting: ${importCounts.waiting}`);
    console.log(`   - Active: ${importCounts.active}`);
    console.log(`   - Completed: ${importCounts.completed}`);
    console.log(`   - Failed: ${importCounts.failed}`);
    console.log(`   - Delayed: ${importCounts.delayed}`);

    const enrichCounts = await deckEnrichmentQueue.getJobCounts();
    console.log(`\n🚀 Deck Enrichment Queue:`);
    console.log(`   - Waiting: ${enrichCounts.waiting}`);
    console.log(`   - Active: ${enrichCounts.active}`);
    console.log(`   - Completed: ${enrichCounts.completed}`);
    console.log(`   - Failed: ${enrichCounts.failed}`);
    console.log(`   - Delayed: ${enrichCounts.delayed}`);

    const imageCounts = await imageGenerationQueue.getJobCounts();
    console.log(`\n🎨 Image Generation Queue:`);
    console.log(`   - Waiting: ${imageCounts.waiting}`);
    console.log(`   - Active: ${imageCounts.active}`);
    console.log(`   - Completed: ${imageCounts.completed}`);
    console.log(`   - Failed: ${imageCounts.failed}`);
    console.log(`   - Delayed: ${imageCounts.delayed}`);

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