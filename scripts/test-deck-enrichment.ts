#!/usr/bin/env bun
import connectDB from '../src/lib/db/mongodb';
import Deck from '../src/lib/db/models/Deck';
import { deckEnrichmentQueue } from '../src/lib/queue/queues';

async function testDeckEnrichment() {
  try {
    await connectDB();
    
    // Find a deck to test with
    const deck = await Deck.findOne({ status: { $ne: 'enriching' } }).limit(1);
    
    if (!deck) {
      console.log('No deck found to test with');
      process.exit(1);
    }
    
    console.log(`\n🧪 Testing deck enrichment for: ${deck.name} (${deck._id})`);
    console.log(`   Status: ${deck.status}`);
    console.log(`   Cards count: ${deck.cardsCount}`);
    
    // Queue enrichment job
    const job = await deckEnrichmentQueue().add(
      `enrich-deck-${deck._id}`,
      {
        deckId: deck._id.toString(),
        deckName: deck.name,
        sessionId: 'test-session',
        force: false
      }
    );
    
    console.log(`\n✅ Enrichment job queued: ${job.id}`);
    console.log('\nMonitor the logs to see if character analysis is being performed...');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testDeckEnrichment();