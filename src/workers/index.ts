#!/usr/bin/env node

/**
 * Main worker process that runs all background jobs
 * This includes:
 * - Card enrichment workers
 * - Review reminder workers
 * 
 * Note: Reminder scheduling is handled by Railway cron jobs, not this worker
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Workers are now in /src/lib/queue/workers/ and started via /src/lib/queue/start-workers.ts
// These imports are commented out as the files don't exist in this directory
// import { startDeckEnrichmentWorker } from './deck-enrichment-worker';
// import { startDeckImportWorker } from './deck-import-worker';
// import { startCardEnrichmentWorker } from './card-enrichment-worker';
import reminderWorker from './review-reminder-worker';

async function startWorkers() {
  console.log('🚀 Starting all workers...');
  
  try {
    // Workers are started from /src/lib/queue/start-workers.ts
    // Commenting out old references
    // await startDeckEnrichmentWorker();
    // await startDeckImportWorker();
    // await startCardEnrichmentWorker();
    
    // Start reminder worker (processes jobs scheduled by Railway cron)
    console.log('Starting reminder worker...');
    await reminderWorker.run();
    
    console.log('✅ All workers started successfully');
    console.log('📝 Note: Reminder scheduling is handled by Railway cron jobs');
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down workers...');
      await reminderWorker.close();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down workers...');
      await reminderWorker.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start workers:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startWorkers();
}

export { startWorkers };