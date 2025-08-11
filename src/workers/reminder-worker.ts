#!/usr/bin/env node

/**
 * Reminder worker process
 * Processes reminder jobs from the queue (scheduled by Railway cron jobs)
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Worker import removed as it's not used in current implementation
// import { Worker } from 'bullmq';
import reminderWorker from './review-reminder-worker';

async function startReminderWorker() {
  console.log('🔔 Starting reminder worker...');
  
  try {
    // Start the reminder worker
    await reminderWorker.run();
    
    console.log('✅ Reminder worker started successfully');
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down reminder worker...');
      await reminderWorker.close();
      process.exit(0);
    });
    
    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down reminder worker...');
      await reminderWorker.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start reminder worker:', error);
    process.exit(1);
  }
}

// Start if run directly
if (require.main === module) {
  startReminderWorker();
}

export { startReminderWorker };