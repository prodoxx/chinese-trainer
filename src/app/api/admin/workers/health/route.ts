import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  getDeckEnrichmentQueue, 
  getDeckImportQueue, 
  getCardEnrichmentQueue,
  getBulkImportQueue 
} from '@/lib/queue/queues'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Try to get worker statuses from the health server
    let workers: any[] = []
    
    try {
      // Try to fetch from worker health server if it's running
      const healthResponse = await fetch('http://localhost:3001/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        
        // Extract worker statuses from the health server response
        if (healthData.details?.workerMonitors) {
          workers = Object.entries(healthData.details.workerMonitors).map(([name, status]: [string, any]) => ({
            name,
            lastHeartbeat: status.lastHeartbeat,
            isHealthy: status.isHealthy,
            processedJobs: status.processedJobs || 0,
            failedJobs: status.failedJobs || 0
          }))
        }
      }
    } catch (error) {
      // If health server is not available, workers array remains empty
      console.log('Worker health server not available:', error)
    }

    // Get queue statistics
    const queues = [
      { name: 'deck-enrichment', queue: getDeckEnrichmentQueue() },
      { name: 'deck-import', queue: getDeckImportQueue() },
      { name: 'card-enrichment', queue: getCardEnrichmentQueue() },
      { name: 'bulk-import', queue: getBulkImportQueue() }
    ]

    const queueStats = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
          queue.getWaitingCount(),
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getDelayedCount()
        ])

        return {
          name,
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + delayed
        }
      })
    )

    // Overall health check
    const allWorkersHealthy = workers.length > 0 && workers.every(w => w.isHealthy)
    const hasBacklog = queueStats.some(q => q.waiting > 100)
    const hasHighFailureRate = queueStats.some(q => q.failed > q.completed * 0.1) // More than 10% failure rate

    return NextResponse.json({
      status: allWorkersHealthy && !hasBacklog && !hasHighFailureRate ? 'healthy' : 'degraded',
      workers,
      queues: queueStats,
      summary: {
        totalWorkers: workers.length,
        healthyWorkers: workers.filter(w => w.isHealthy).length,
        totalQueued: queueStats.reduce((sum, q) => sum + q.total, 0),
        totalCompleted: queueStats.reduce((sum, q) => sum + q.completed, 0),
        totalFailed: queueStats.reduce((sum, q) => sum + q.failed, 0)
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Worker health check error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check worker health',
        status: 'error'
      },
      { status: 500 }
    )
  }
}