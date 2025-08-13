# Bulk Import System Documentation

## Overview

The Bulk Import System has been upgraded to use an asynchronous, queue-based architecture with batching, concurrency control, and rate limiting. This ensures reliable processing of large character imports while respecting API rate limits.

## Architecture

### Components

1. **Bulk Import Queue** (`bulk-import`)
   - Handles bulk character import jobs
   - Configured with exponential backoff retry logic
   - Maintains job history for tracking

2. **Bulk Import Worker** (`bulk-import.worker.ts`)
   - Processes import jobs in batches
   - Implements rate limiting for API calls
   - Queues enrichment jobs for created cards

3. **API Endpoints**
   - `POST /api/admin/cards/bulk-import` - Start import job
   - `GET /api/admin/cards/bulk-import?jobId=xxx` - Check job status

4. **Frontend Progress Tracking**
   - Real-time progress updates
   - Batch progress visualization
   - Results summary display

## Features

### Batching
- **Batch Size**: 10 characters per batch
- **Batch Delay**: 2 seconds between batches
- Prevents overwhelming the database
- Provides smooth progress updates

### Rate Limiting
- **OpenAI**: 2 calls per second
- **Fal.ai**: 1 call per second
- Automatic rate limiting for enrichment jobs
- Random delays (0-5s) for load distribution

### Concurrency Control
- Single bulk import job at a time
- Card enrichment: 2 concurrent jobs
- Priority system (bulk imports have lower priority)

### Error Handling
- Exponential backoff retry (3 attempts)
- Per-character error tracking
- Non-blocking: errors don't stop entire import

### Progress Tracking
- Real-time progress updates
- Batch-level tracking
- Created/skipped/error counts
- Enrichment job tracking

## Usage

### Starting a Bulk Import

```javascript
// API Request
POST /api/admin/cards/bulk-import
{
  "characters": ["學", "習", "朋", "友"],
  "enrichImmediately": true,
  "aiProvider": "openai"
}

// Response
{
  "success": true,
  "jobId": "123",
  "sessionId": "456",
  "message": "Bulk import started for 4 characters",
  "status": "queued",
  "totalCharacters": 4
}
```

### Monitoring Progress

```javascript
// Poll for status
GET /api/admin/cards/bulk-import?jobId=123

// Response
{
  "jobId": "123",
  "state": "active",
  "progress": {
    "stage": "processing",
    "message": "Processing batch 1 of 1",
    "processed": 2,
    "total": 4,
    "batchIndex": 1,
    "totalBatches": 1,
    "results": {
      "created": 1,
      "skipped": 1,
      "errors": 0
    }
  }
}
```

## Worker Deployment

### Railway Configuration

For optimal performance, deploy workers as separate instances:

1. **Main Workers** (`workers` process)
   - Handles deck operations
   - Card enrichment
   - Bulk imports

2. **Bulk Import Workers** (optional dedicated instance)
   - Can be scaled horizontally
   - Set environment variable: `WORKER_TYPE=bulk-import`

### Environment Variables

```bash
# Redis connection
REDIS_URL=redis://...

# API Keys
OPENAI_API_KEY=...
FAL_API_KEY=...

# Worker configuration
WORKER_HEALTH_PORT=3001
WORKER_CONCURRENCY=2  # For card enrichment
BULK_IMPORT_BATCH_SIZE=10  # Characters per batch
BULK_IMPORT_BATCH_DELAY=2000  # Ms between batches
```

## Monitoring

### Health Check Endpoint

```javascript
GET /api/admin/workers/health

// Response
{
  "status": "healthy",
  "workers": [
    {
      "name": "bulk-import",
      "lastHeartbeat": "2024-01-01T12:00:00Z",
      "isHealthy": true,
      "processedJobs": 10,
      "failedJobs": 0
    }
  ],
  "queues": [
    {
      "name": "bulk-import",
      "waiting": 0,
      "active": 1,
      "completed": 10,
      "failed": 0,
      "delayed": 0,
      "total": 0
    }
  ]
}
```

### Testing

Run the test script to verify the system:

```bash
bun run scripts/test-bulk-import.ts
```

## Performance Considerations

### Expected Processing Times

- **10 characters**: ~15 seconds
- **100 characters**: ~2-3 minutes
- **1000 characters**: ~20-30 minutes

Times include:
- Character validation
- Database operations
- Enrichment queueing
- Rate limiting delays

### Optimization Tips

1. **Pre-validation**: Validate characters client-side
2. **Batch Size**: Adjust based on system load
3. **Worker Scaling**: Add more worker instances for large imports
4. **Cache Warming**: Pre-generate shared media

## Troubleshooting

### Common Issues

1. **Import Stuck**
   - Check worker health: `/api/admin/workers/health`
   - Verify Redis connection
   - Check job queue in Redis

2. **Slow Processing**
   - Increase batch size (if DB can handle)
   - Reduce batch delay
   - Add more worker instances

3. **High Failure Rate**
   - Check API rate limits
   - Verify API keys are valid
   - Review error logs in job results

### Debug Commands

```bash
# Check queue status
bun run scripts/empty-queues.ts

# Monitor Redis
redis-cli monitor

# Check worker logs
railway logs -s workers
```

## Future Improvements

1. **Adaptive Batching**: Adjust batch size based on performance
2. **Parallel Processing**: Process multiple batches concurrently
3. **Smart Retries**: Different retry strategies per error type
4. **Caching Layer**: Cache API responses for duplicate characters
5. **WebSocket Updates**: Real-time progress without polling