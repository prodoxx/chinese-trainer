#!/usr/bin/env bun

/**
 * Script to check failed jobs and their error messages
 */

import { 
  getDeckEnrichmentQueue, 
  getDeckImportQueue, 
  getCardEnrichmentQueue,
  getBulkImportQueue 
} from '../src/lib/queue/queues'
import chalk from 'chalk'

async function checkFailedJobs() {
  console.log(chalk.cyan('🔍 Checking Failed Jobs'))
  console.log(chalk.cyan('=' .repeat(50)))
  
  const queues = [
    { name: 'deck-enrichment', queue: getDeckEnrichmentQueue() },
    { name: 'deck-import', queue: getDeckImportQueue() },
    { name: 'card-enrichment', queue: getCardEnrichmentQueue() },
    { name: 'bulk-import', queue: getBulkImportQueue() }
  ]

  for (const { name, queue } of queues) {
    console.log(chalk.white(`\n📦 ${name}:`))
    
    // Get queue counts
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount()
    ])
    
    console.log(chalk.gray(`  Waiting: ${waiting}, Active: ${active}, Completed: ${completed}, Failed: ${failed}, Delayed: ${delayed}`))
    
    // Get failed jobs
    if (failed > 0) {
      console.log(chalk.red(`\n  ❌ Failed Jobs (${failed}):`))
      const failedJobs = await queue.getFailed()
      
      for (const job of failedJobs.slice(0, 5)) { // Show first 5 failed jobs
        console.log(chalk.yellow(`\n  Job ID: ${job.id}`))
        console.log(chalk.gray(`  Created: ${new Date(job.timestamp).toLocaleString()}`))
        console.log(chalk.gray(`  Attempts: ${job.attemptsMade}/${job.opts.attempts || 1}`))
        console.log(chalk.gray(`  Data: ${JSON.stringify(job.data, null, 2).substring(0, 200)}...`))
        console.log(chalk.red(`  Error: ${job.failedReason}`))
        
        // Show stack trace if available
        if (job.stacktrace && job.stacktrace.length > 0) {
          console.log(chalk.red(`  Stack: ${job.stacktrace[0].substring(0, 300)}...`))
        }
      }
      
      if (failedJobs.length > 5) {
        console.log(chalk.gray(`\n  ... and ${failedJobs.length - 5} more failed jobs`))
      }
    }
    
    // Get waiting jobs preview
    if (waiting > 0) {
      console.log(chalk.blue(`\n  ⏳ Waiting Jobs (${waiting}):`))
      const waitingJobs = await queue.getWaiting(0, 3) // Get first 3
      
      for (const job of waitingJobs) {
        console.log(chalk.gray(`  - Job ${job.id}: ${JSON.stringify(job.data).substring(0, 100)}...`))
      }
      
      if (waiting > 3) {
        console.log(chalk.gray(`  ... and ${waiting - 3} more waiting`))
      }
    }
  }
  
  console.log(chalk.cyan('\n' + '=' .repeat(50)))
  console.log(chalk.green('✅ Check complete'))
  
  process.exit(0)
}

checkFailedJobs().catch(error => {
  console.error(chalk.red('❌ Error:'), error)
  process.exit(1)
})