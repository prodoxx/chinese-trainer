import { deckEnrichmentQueue } from '../src/lib/queue/queues';
import redis from '../src/lib/queue/redis';

async function testWorkers() {
  console.log('Testing worker system...\n');
  
  try {
    // Test Redis connection
    await redis.ping();
    console.log('✅ Redis connected');
    
    // Add a test job
    const job = await deckEnrichmentQueue.add(
      'test-job',
      {
        deckId: 'test-deck-123',
        deckName: 'Test Deck',
        sessionId: 'test-session-123',
        force: false,
      }
    );
    
    console.log(`✅ Test job queued: ${job.id}`);
    console.log('\nJob will be processed by workers if they are running.');
    console.log('Start workers with: bun run worker');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await redis.quit();
  }
}

testWorkers();