import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  getDeckEnrichmentQueue, 
  getDeckImportQueue, 
  getCardEnrichmentQueue,
  getBulkImportQueue 
} from '@/lib/queue/queues'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { 
      queues = [], 
      clearWaiting = false,
      clearDelayed = false,
      clearFailed = false,
      clearCompleted = false,
      clearAll = false
    } = await request.json()

    // Get queue instances
    const queueMap: Record<string, ReturnType<typeof getDeckEnrichmentQueue>> = {
      'deck-enrichment': getDeckEnrichmentQueue(),
      'deck-import': getDeckImportQueue(),
      'card-enrichment': getCardEnrichmentQueue(),
      'bulk-import': getBulkImportQueue()
    }

    const results: Record<string, any> = {}

    // Process each selected queue
    for (const queueName of queues) {
      const queue = queueMap[queueName]
      if (!queue) {
        results[queueName] = { error: 'Queue not found' }
        continue
      }

      const cleared = {
        waiting: 0,
        delayed: 0,
        failed: 0,
        completed: 0,
        obliterated: false
      }

      try {
        if (clearAll) {
          // Nuclear option - removes everything including active jobs
          await queue.obliterate({ force: true })
          cleared.obliterated = true
        } else {
          // Clear specific job types
          if (clearWaiting) {
            const waiting = await queue.getWaiting()
            for (const job of waiting) {
              await job.remove()
              cleared.waiting++
            }
          }

          if (clearDelayed) {
            const delayed = await queue.getDelayed()
            for (const job of delayed) {
              await job.remove()
              cleared.delayed++
            }
          }

          if (clearFailed) {
            const failed = await queue.getFailed()
            for (const job of failed) {
              await job.remove()
              cleared.failed++
            }
          }

          if (clearCompleted) {
            const completed = await queue.getCompleted()
            for (const job of completed) {
              await job.remove()
              cleared.completed++
            }
          }
        }

        results[queueName] = {
          success: true,
          cleared,
          totalCleared: cleared.waiting + cleared.delayed + cleared.failed + cleared.completed
        }
      } catch (error) {
        console.error(`Error clearing queue ${queueName}:`, error)
        results[queueName] = {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Calculate totals
    const totalCleared = Object.values(results).reduce((sum, r: any) => 
      sum + (r.totalCleared || 0), 0
    )

    return NextResponse.json({
      success: true,
      message: `Cleared ${totalCleared} jobs from ${queues.length} queue(s)`,
      results
    })
  } catch (error) {
    console.error('Clear queues error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to clear queues',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}