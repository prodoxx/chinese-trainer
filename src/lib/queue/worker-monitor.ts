import { Worker } from 'bullmq';
import getRedis from './redis';

interface WorkerMonitor {
  workerName: string;
  lastHeartbeat: Date;
  isHealthy: boolean;
  processedJobs: number;
  failedJobs: number;
}

const workerMonitors = new Map<string, WorkerMonitor>();

export function registerWorker(worker: Worker, workerName: string) {
  const monitor: WorkerMonitor = {
    workerName,
    lastHeartbeat: new Date(),
    isHealthy: true,
    processedJobs: 0,
    failedJobs: 0,
  };
  
  workerMonitors.set(workerName, monitor);
  
  // Track heartbeat on completed jobs
  worker.on('completed', (job) => {
    const mon = workerMonitors.get(workerName);
    if (mon) {
      mon.lastHeartbeat = new Date();
      mon.processedJobs++;
      mon.isHealthy = true;
    }
    console.log(`✅ ${workerName} completed job ${job.id}`);
  });
  
  // Track failures
  worker.on('failed', (job, err) => {
    const mon = workerMonitors.get(workerName);
    if (mon) {
      mon.lastHeartbeat = new Date();
      mon.failedJobs++;
    }
    console.error(`❌ ${workerName} failed job ${job?.id}:`, err.message);
  });
  
  // Track worker active state
  worker.on('active', (job) => {
    const mon = workerMonitors.get(workerName);
    if (mon) {
      mon.lastHeartbeat = new Date();
      mon.isHealthy = true;
    }
    console.log(`🔄 ${workerName} processing job ${job.id}`);
  });
  
  // Track worker errors
  worker.on('error', (err) => {
    const mon = workerMonitors.get(workerName);
    if (mon) {
      mon.isHealthy = false;
    }
    console.error(`🚨 ${workerName} error:`, err);
  });
  
  // Start heartbeat interval
  const heartbeatInterval = setInterval(async () => {
    const mon = workerMonitors.get(workerName);
    if (mon) {
      try {
        // Test Redis connection
        await getRedis().ping();
        mon.lastHeartbeat = new Date();
        mon.isHealthy = true;
      } catch (error) {
        mon.isHealthy = false;
        console.error(`💔 ${workerName} heartbeat failed:`, error);
      }
    }
  }, 30000); // Every 30 seconds
  
  // Cleanup on shutdown
  process.on('SIGTERM', () => {
    clearInterval(heartbeatInterval);
  });
  
  console.log(`📊 Monitoring registered for ${workerName}`);
}

export function getWorkerStatus(workerName: string): WorkerMonitor | undefined {
  return workerMonitors.get(workerName);
}

export function getAllWorkerStatuses(): Map<string, WorkerMonitor> {
  return workerMonitors;
}

export function isWorkerHealthy(workerName: string, maxHeartbeatAge: number = 60000): boolean {
  const monitor = workerMonitors.get(workerName);
  if (!monitor) return false;
  
  const now = new Date();
  const heartbeatAge = now.getTime() - monitor.lastHeartbeat.getTime();
  
  return monitor.isHealthy && heartbeatAge < maxHeartbeatAge;
}