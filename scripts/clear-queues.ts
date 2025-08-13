#!/usr/bin/env bun

/**
 * Script to clear job queues
 * Use with caution - this will remove jobs from the queues
 */

import readline from 'readline'
import { 
  getDeckEnrichmentQueue, 
  getDeckImportQueue, 
  getCardEnrichmentQueue,
  getBulkImportQueue 
} from '../src/lib/queue/queues'
import chalk from 'chalk'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

interface QueueInfo {
  name: string
  queue: ReturnType<typeof getDeckEnrichmentQueue>
}

async function getQueueStats(queue: QueueInfo['queue']) {
  const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
    queue.getDelayedCount(),
    queue.getPausedCount()
  ])

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    paused,
    total: waiting + active + delayed + paused
  }
}

async function clearQueue(queueInfo: QueueInfo, options: {
  clearWaiting?: boolean
  clearDelayed?: boolean
  clearFailed?: boolean
  clearCompleted?: boolean
  clearAll?: boolean
}) {
  const { queue, name } = queueInfo
  
  console.log(chalk.yellow(`\n📋 Clearing ${name} queue...`))
  
  const results = {
    waiting: 0,
    delayed: 0,
    failed: 0,
    completed: 0
  }

  try {
    if (options.clearAll) {
      // Nuclear option - removes everything including active jobs
      console.log(chalk.red('  ⚠️  Obliterating entire queue (including active jobs)...'))
      await queue.obliterate({ force: true })
      console.log(chalk.green('  ✅ Queue obliterated'))
      return
    }

    // Clear specific job types
    if (options.clearWaiting) {
      const waiting = await queue.getWaiting()
      if (waiting.length > 0) {
        console.log(chalk.yellow(`  🗑️  Removing ${waiting.length} waiting jobs...`))
        for (const job of waiting) {
          await job.remove()
          results.waiting++
        }
      }
    }

    if (options.clearDelayed) {
      const delayed = await queue.getDelayed()
      if (delayed.length > 0) {
        console.log(chalk.yellow(`  🗑️  Removing ${delayed.length} delayed jobs...`))
        for (const job of delayed) {
          await job.remove()
          results.delayed++
        }
      }
    }

    if (options.clearFailed) {
      const failed = await queue.getFailed()
      if (failed.length > 0) {
        console.log(chalk.yellow(`  🗑️  Removing ${failed.length} failed jobs...`))
        for (const job of failed) {
          await job.remove()
          results.failed++
        }
      }
    }

    if (options.clearCompleted) {
      const completed = await queue.getCompleted()
      if (completed.length > 0) {
        console.log(chalk.yellow(`  🗑️  Removing ${completed.length} completed jobs...`))
        for (const job of completed) {
          await job.remove()
          results.completed++
        }
      }
    }

    // Summary
    const total = results.waiting + results.delayed + results.failed + results.completed
    if (total > 0) {
      console.log(chalk.green(`  ✅ Cleared ${total} jobs:`))
      if (results.waiting > 0) console.log(chalk.gray(`     - ${results.waiting} waiting`))
      if (results.delayed > 0) console.log(chalk.gray(`     - ${results.delayed} delayed`))
      if (results.failed > 0) console.log(chalk.gray(`     - ${results.failed} failed`))
      if (results.completed > 0) console.log(chalk.gray(`     - ${results.completed} completed`))
    } else {
      console.log(chalk.gray('  ℹ️  No jobs to clear'))
    }
  } catch (error) {
    console.error(chalk.red(`  ❌ Error clearing queue: ${error}`))
  }
}

async function main() {
  console.log(chalk.cyan('🧹 Queue Clear Utility'))
  console.log(chalk.cyan('=' .repeat(50)))
  
  // Get all queues
  const queues: QueueInfo[] = [
    { name: 'deck-enrichment', queue: getDeckEnrichmentQueue() },
    { name: 'deck-import', queue: getDeckImportQueue() },
    { name: 'card-enrichment', queue: getCardEnrichmentQueue() },
    { name: 'bulk-import', queue: getBulkImportQueue() }
  ]

  // Display current queue status
  console.log(chalk.white('\n📊 Current Queue Status:'))
  console.log(chalk.gray('-'.repeat(50)))
  
  let hasJobs = false
  for (const queueInfo of queues) {
    const stats = await getQueueStats(queueInfo.queue)
    
    console.log(chalk.white(`\n${queueInfo.name}:`))
    console.log(chalk.gray(`  Waiting:   ${stats.waiting}`))
    console.log(chalk.gray(`  Active:    ${stats.active} ${stats.active > 0 ? chalk.yellow('(cannot be cleared while running)') : ''}`))
    console.log(chalk.gray(`  Delayed:   ${stats.delayed}`))
    console.log(chalk.gray(`  Failed:    ${stats.failed}`))
    console.log(chalk.gray(`  Completed: ${stats.completed}`))
    console.log(chalk.gray(`  Paused:    ${stats.paused}`))
    
    if (stats.total > 0 || stats.failed > 0 || stats.completed > 0) {
      hasJobs = true
    }
  }

  if (!hasJobs) {
    console.log(chalk.green('\n✨ All queues are already empty!'))
    rl.close()
    process.exit(0)
  }

  // Show options
  console.log(chalk.white('\n🔧 Clear Options:'))
  console.log(chalk.gray('-'.repeat(50)))
  console.log(chalk.yellow('1. Clear pending jobs only (waiting + delayed)'))
  console.log(chalk.yellow('2. Clear failed jobs only'))
  console.log(chalk.yellow('3. Clear completed jobs only'))
  console.log(chalk.yellow('4. Clear all except active'))
  console.log(chalk.red('5. OBLITERATE ALL (including active - dangerous!)'))
  console.log(chalk.gray('6. Exit'))

  const choice = await question(chalk.cyan('\nSelect option (1-6): '))

  let clearOptions = {}
  let confirmMessage = ''

  switch (choice) {
    case '1':
      clearOptions = { clearWaiting: true, clearDelayed: true }
      confirmMessage = 'clear all pending jobs (waiting + delayed)'
      break
    case '2':
      clearOptions = { clearFailed: true }
      confirmMessage = 'clear all failed jobs'
      break
    case '3':
      clearOptions = { clearCompleted: true }
      confirmMessage = 'clear all completed jobs'
      break
    case '4':
      clearOptions = { clearWaiting: true, clearDelayed: true, clearFailed: true, clearCompleted: true }
      confirmMessage = 'clear all jobs except active ones'
      break
    case '5':
      clearOptions = { clearAll: true }
      confirmMessage = chalk.red('OBLITERATE ALL QUEUES INCLUDING ACTIVE JOBS')
      break
    case '6':
      console.log(chalk.gray('\n👋 Exiting...'))
      rl.close()
      process.exit(0)
    default:
      console.log(chalk.red('\n❌ Invalid option'))
      rl.close()
      process.exit(1)
  }

  // Ask which queues to clear
  console.log(chalk.white('\n📦 Select Queues:'))
  console.log(chalk.gray('-'.repeat(50)))
  console.log(chalk.yellow('1. All queues'))
  console.log(chalk.yellow('2. Deck queues only (deck-import, deck-enrichment)'))
  console.log(chalk.yellow('3. Card queues only (card-enrichment, bulk-import)'))
  console.log(chalk.yellow('4. Specific queue'))

  const queueChoice = await question(chalk.cyan('\nSelect option (1-4): '))

  let selectedQueues: QueueInfo[] = []

  switch (queueChoice) {
    case '1':
      selectedQueues = queues
      break
    case '2':
      selectedQueues = queues.filter(q => q.name.includes('deck'))
      break
    case '3':
      selectedQueues = queues.filter(q => q.name.includes('card') || q.name.includes('bulk'))
      break
    case '4':
      console.log(chalk.white('\nAvailable queues:'))
      queues.forEach((q, i) => {
        console.log(chalk.yellow(`${i + 1}. ${q.name}`))
      })
      const queueIndex = await question(chalk.cyan('\nSelect queue number: '))
      const index = parseInt(queueIndex) - 1
      if (index >= 0 && index < queues.length) {
        selectedQueues = [queues[index]]
      } else {
        console.log(chalk.red('\n❌ Invalid queue selection'))
        rl.close()
        process.exit(1)
      }
      break
    default:
      console.log(chalk.red('\n❌ Invalid option'))
      rl.close()
      process.exit(1)
  }

  // Confirmation
  const queueNames = selectedQueues.map(q => q.name).join(', ')
  console.log(chalk.yellow(`\n⚠️  You are about to ${confirmMessage}`))
  console.log(chalk.yellow(`   Queues: ${queueNames}`))
  
  const confirm = await question(chalk.red('\nType "yes" to confirm: '))
  
  if (confirm.toLowerCase() !== 'yes') {
    console.log(chalk.gray('\n❌ Operation cancelled'))
    rl.close()
    process.exit(0)
  }

  // Clear the queues
  console.log(chalk.cyan('\n🚀 Clearing queues...'))
  
  for (const queueInfo of selectedQueues) {
    await clearQueue(queueInfo, clearOptions)
  }

  // Final status
  console.log(chalk.cyan('\n📊 Final Queue Status:'))
  console.log(chalk.gray('-'.repeat(50)))
  
  for (const queueInfo of queues) {
    const stats = await getQueueStats(queueInfo.queue)
    
    console.log(chalk.white(`\n${queueInfo.name}:`))
    const isEmpty = stats.total === 0 && stats.failed === 0 && stats.completed === 0
    if (isEmpty) {
      console.log(chalk.green('  ✨ Empty'))
    } else {
      if (stats.waiting > 0) console.log(chalk.gray(`  Waiting:   ${stats.waiting}`))
      if (stats.active > 0) console.log(chalk.yellow(`  Active:    ${stats.active}`))
      if (stats.delayed > 0) console.log(chalk.gray(`  Delayed:   ${stats.delayed}`))
      if (stats.failed > 0) console.log(chalk.gray(`  Failed:    ${stats.failed}`))
      if (stats.completed > 0) console.log(chalk.gray(`  Completed: ${stats.completed}`))
    }
  }

  console.log(chalk.green('\n✅ Queue clearing complete!'))
  rl.close()
  process.exit(0)
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('\n❌ Error:'), error)
  rl.close()
  process.exit(1)
})

// Run the script
main().catch(error => {
  console.error(chalk.red('❌ Fatal error:'), error)
  rl.close()
  process.exit(1)
})