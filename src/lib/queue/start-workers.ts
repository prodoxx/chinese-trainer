import './workers/deck-import.worker';
import './workers/deck-enrichment.worker';
import './workers/image-generation.worker';

console.log('✅ Workers started:');
console.log('   - Deck Import Worker');
console.log('   - Deck Enrichment Worker');
console.log('   - Image Generation Worker');
console.log('\nPress Ctrl+C to stop workers');

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down workers...');
  process.exit(0);
});