#!/usr/bin/env bun

/**
 * Test script for the new bulk import system
 * Tests batching, concurrency, and rate limiting
 */

import { getBulkImportQueue } from '../src/lib/queue/queues'
import getRedis from '../src/lib/queue/redis'

// Test characters (mix of simple and complex)
const testCharacters = [
  '學', '習', '朋', '友', '你', '好', '謝', '謝',
  '老', '師', '學', '生', '書', '本', '電', '腦',
  '手', '機', '咖', '啡', '茶', '水', '飯', '麵',
  '家', '人', '父', '母', '兄', '弟', '姐', '妹'
]

async function testBulkImport() {
  console.log('🧪 Testing Bulk Import System')
  console.log('================================')
  
  try {
    // Get the bulk import queue
    const queue = getBulkImportQueue()
    
    // Clear any existing jobs for testing
    console.log('\n📧 Clearing existing jobs...')
    await queue.obliterate({ force: true })
    
    // Add a bulk import job
    console.log(`\n📝 Queuing bulk import job with ${testCharacters.length} characters...`)
    const job = await queue.add(
      'bulk-import',
      {
        characters: testCharacters,
        userId: 'test-user-123',
        sessionId: 'test-session-456',
        enrichImmediately: true,
        aiProvider: 'openai'
      }
    )
    
    console.log(`✅ Job queued with ID: ${job.id}`)
    
    // Monitor job progress
    console.log('\n📊 Monitoring job progress...')
    let previousProgress: any = null
    
    const checkInterval = setInterval(async () => {
      try {
        const currentJob = await queue.getJob(job.id!)
        if (!currentJob) {
          console.log('❌ Job not found')
          clearInterval(checkInterval)
          return
        }
        
        const state = await currentJob.getState()
        const progress = currentJob.progress
        
        // Only log if progress changed
        if (JSON.stringify(progress) !== JSON.stringify(previousProgress)) {
          previousProgress = progress
          
          if (typeof progress === 'object' && progress !== null) {
            console.log(`\n[${new Date().toLocaleTimeString()}] State: ${state}`)
            console.log(`  Stage: ${progress.stage}`)
            console.log(`  Message: ${progress.message}`)
            
            if (progress.processed !== undefined) {
              console.log(`  Progress: ${progress.processed}/${progress.total} characters`)
            }
            
            if (progress.batchIndex) {
              console.log(`  Batch: ${progress.batchIndex}/${progress.totalBatches}`)
            }
            
            if (progress.results) {
              console.log(`  Results:`)
              console.log(`    - Created: ${progress.results.created}`)
              console.log(`    - Skipped: ${progress.results.skipped}`)
              console.log(`    - Errors: ${progress.results.errors}`)
              if (progress.results.enrichmentQueued !== undefined) {
                console.log(`    - Enrichment Queued: ${progress.results.enrichmentQueued}`)
              }
            }
          }
        }
        
        // Check if job is complete
        if (state === 'completed') {
          console.log('\n✅ Job completed successfully!')
          const result = currentJob.returnvalue
          if (result) {
            console.log('\n📋 Final Results:')
            console.log(`  Total processed: ${result.summary.total}`)
            console.log(`  Created: ${result.summary.created}`)
            console.log(`  Skipped: ${result.summary.skipped}`)
            console.log(`  Errors: ${result.summary.errors}`)
            console.log(`  Enrichment jobs queued: ${result.summary.enrichmentQueued}`)
            
            if (result.results.errors.length > 0) {
              console.log('\n❌ Errors:')
              result.results.errors.forEach((err: any) => {
                console.log(`  - ${err.hanzi}: ${err.error}`)
              })
            }
            
            if (result.results.skipped.length > 0) {
              console.log('\n⚠️ Skipped:')
              result.results.skipped.forEach((skip: any) => {
                console.log(`  - ${skip.hanzi}: ${skip.reason}`)
              })
            }
          }
          clearInterval(checkInterval)
          process.exit(0)
        } else if (state === 'failed') {
          console.log('\n❌ Job failed!')
          console.log(`  Reason: ${currentJob.failedReason}`)
          clearInterval(checkInterval)
          process.exit(1)
        }
      } catch (error) {
        console.error('Error checking job status:', error)
      }
    }, 1000) // Check every second
    
    // Set a timeout
    setTimeout(() => {
      console.log('\n⏱️ Test timed out after 5 minutes')
      clearInterval(checkInterval)
      process.exit(1)
    }, 300000) // 5 minutes
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    process.exit(1)
  }
}

// Run the test
testBulkImport().catch(console.error)