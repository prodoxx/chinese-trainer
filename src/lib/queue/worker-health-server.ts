import { createServer } from 'http';
import { Queue } from 'bullmq';
import getRedis from './redis';
import { getDeckImportQueue, getDeckEnrichmentQueue, getCardEnrichmentQueue } from './queues';
import { getAllWorkerStatuses, isWorkerHealthy } from './worker-monitor';

interface WorkerHealth {
  status: 'healthy' | 'unhealthy';
  details: {
    redis: 'connected' | 'disconnected' | 'error';
    workers: {
      deckImport: WorkerStatus;
      deckEnrichment: WorkerStatus;
      cardEnrichment: WorkerStatus;
    };
    workerMonitors: Record<string, {
      lastHeartbeat: string;
      isHealthy: boolean;
      processedJobs: number;
      failedJobs: number;
    }>;
    timestamp: string;
    uptime: number;
  };
}

interface WorkerStatus {
  active: boolean;
  activeCount: number;
  waitingCount: number;
  completedCount: number;
  failedCount: number;
}

async function checkRedisConnection(): Promise<'connected' | 'disconnected' | 'error'> {
  try {
    const redis = getRedis();
    await redis.ping();
    return 'connected';
  } catch (error) {
    console.error('Redis health check failed:', error);
    return 'error';
  }
}

async function getQueueStatus(queue: Queue): Promise<WorkerStatus> {
  try {
    const counts = await queue.getJobCounts();
    const workers = await queue.getWorkers();
    
    return {
      active: workers.length > 0,
      activeCount: counts.active || 0,
      waitingCount: counts.waiting || 0,
      completedCount: counts.completed || 0,
      failedCount: counts.failed || 0,
    };
  } catch (error) {
    console.error('Failed to get queue status:', error);
    return {
      active: false,
      activeCount: 0,
      waitingCount: 0,
      completedCount: 0,
      failedCount: 0,
    };
  }
}

export function startHealthCheckServer(port: number = 3001) {
  const server = createServer(async (req, res) => {
    if (req.url === '/health' && req.method === 'GET') {
      try {
        // Check Redis connection
        const redisStatus = await checkRedisConnection();
        
        // Check each queue/worker status
        const [deckImportStatus, deckEnrichmentStatus, cardEnrichmentStatus] = await Promise.all([
          getQueueStatus(getDeckImportQueue()),
          getQueueStatus(getDeckEnrichmentQueue()),
          getQueueStatus(getCardEnrichmentQueue()),
        ]);
        
        // Get worker monitor data
        const workerMonitors = getAllWorkerStatuses();
        const workerMonitorData: Record<string, any> = {};
        
        workerMonitors.forEach((monitor, name) => {
          workerMonitorData[name] = {
            lastHeartbeat: monitor.lastHeartbeat.toISOString(),
            isHealthy: monitor.isHealthy,
            processedJobs: monitor.processedJobs,
            failedJobs: monitor.failedJobs,
          };
        });
        
        // Check worker health
        const deckImportHealthy = isWorkerHealthy('deck-import');
        const deckEnrichmentHealthy = isWorkerHealthy('deck-enrichment');
        const cardEnrichmentHealthy = isWorkerHealthy('card-enrichment');
        
        // Determine overall health
        const isHealthy = redisStatus === 'connected' && 
                         (deckImportHealthy || deckEnrichmentHealthy || cardEnrichmentHealthy);
        
        const health: WorkerHealth = {
          status: isHealthy ? 'healthy' : 'unhealthy',
          details: {
            redis: redisStatus,
            workers: {
              deckImport: deckImportStatus,
              deckEnrichment: deckEnrichmentStatus,
              cardEnrichment: cardEnrichmentStatus,
            },
            workerMonitors: workerMonitorData,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
          },
        };
        
        res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(health, null, 2));
      } catch (error) {
        console.error('Health check error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'error', 
          message: 'Health check failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    } else if (req.url === '/ready' && req.method === 'GET') {
      // Simple readiness check - just verify the server is responding
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('OK');
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
  
  server.listen(port, () => {
    console.log(`🏥 Worker health check server running on http://localhost:${port}`);
    console.log(`   - Health endpoint: http://localhost:${port}/health`);
    console.log(`   - Ready endpoint: http://localhost:${port}/ready`);
  });
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing health check server...');
    server.close(() => {
      console.log('Health check server closed');
    });
  });
  
  return server;
}