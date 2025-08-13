import './workers/deck-import.worker';
import './workers/deck-enrichment-r2.worker';
import './workers/card-enrichment.worker';
import './workers/bulk-import.worker';
import { startHealthCheckServer } from './worker-health-server';

// Start health check server
const healthPort = parseInt(process.env.WORKER_HEALTH_PORT || '3001');
startHealthCheckServer(healthPort);

console.log('✅ Workers started:');
console.log('   - Deck Import Worker');
console.log('   - Deck Enrichment Worker (R2 Storage)');
console.log('   - Card Enrichment Worker');
console.log('   - Bulk Import Worker');
console.log('\nPress Ctrl+C to stop workers');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down workers...');
  process.exit(0);
});