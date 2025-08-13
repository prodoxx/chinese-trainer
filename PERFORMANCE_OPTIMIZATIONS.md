# Performance Optimizations for Queue Workers

## Overview
Implemented comprehensive performance optimizations for deck enrichment, card enrichment, and bulk import workers to significantly improve processing speed while respecting API rate limits.

## Key Improvements

### 1. Batching Strategy
- **Deck Enrichment**: Process 10 cards per batch with 1-second delays
- **Bulk Import**: Process 10 characters per batch with 2-second delays  
- **Dictionary Lookups**: Batch fetch up to 50 entries at once
- Reduces database round trips and improves throughput

### 2. Parallel Processing
- **Within-Batch Parallelism**: Process up to 5 cards simultaneously per batch
- **Concurrent Workers**: 
  - Deck enrichment: 3 concurrent workers (up from 2)
  - Card enrichment: 5 concurrent workers (up from 2)
- **Smart Concurrency**: Limits prevent overwhelming APIs and databases

### 3. Advanced Rate Limiting
- **Token Bucket Algorithm**: Allows burst traffic while maintaining average rates
- **Service-Specific Limits**:
  - OpenAI: 2 req/sec with burst of 5
  - Fal.ai: 1 req/sec with burst of 3
  - Azure TTS: 5 req/sec with burst of 10
- **Adaptive Rate Limiting**: Adjusts based on error rates

### 4. Intelligent Caching
- **Dictionary Cache**: 5-minute TTL for repeated lookups
- **Media Existence Checks**: Cache shared media checks
- **Batch Pre-fetching**: Load all needed data before processing
- **Automatic Cleanup**: Periodic cache eviction

### 5. Database Optimizations
- **Bulk Operations**: Use `bulkSave()` for batch updates
- **Batch Dictionary Queries**: Single query for multiple characters
- **Reduced Round Trips**: Pre-fetch all required data

### 6. Worker Configuration
- **Centralized Config**: All settings in `src/lib/queue/config.ts`
- **Environment-Aware**: Different settings for dev/prod
- **Dynamic Scaling**: Adjust based on queue length
- **Priority System**: User-initiated tasks get higher priority

## Performance Gains

### Expected Improvements
- **3-5x faster** deck enrichment for large decks
- **2-3x faster** bulk imports with batching
- **50% reduction** in API rate limit errors
- **Better resource utilization** with parallel processing

### Benchmarks (Estimated)
| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| 100-card deck enrichment | ~8-10 min | ~2-3 min | 3-4x faster |
| 1000-character bulk import | ~25-30 min | ~8-10 min | 3x faster |
| Single card enrichment | ~15-20 sec | ~8-12 sec | 1.5x faster |

## Configuration

### Key Settings (src/lib/queue/config.ts)
```typescript
// Worker concurrency
DECK_ENRICHMENT: 3       // Process 3 decks simultaneously
CARD_ENRICHMENT: 5       // Process 5 cards simultaneously
BULK_IMPORT: 1          // Single bulk import at a time

// Batch sizes
DECK_ENRICHMENT_BATCH_SIZE: 10
BULK_IMPORT_BATCH_SIZE: 10
DICTIONARY_BATCH_SIZE: 50

// Parallel processing
DECK_ENRICHMENT_PARALLEL: 5
ENRICHMENT_CONCURRENCY: 3
```

### Rate Limits
```typescript
// API rate limits with burst support
OPENAI_GPT4: { rate: 2, burst: 5 }
FAL_FLUX: { rate: 1, burst: 2 }
AZURE_TTS: { rate: 5, burst: 10 }
```

## Architecture Changes

### 1. Worker Files
- `deck-enrichment-r2.worker.ts` - Optimized deck processing
- `card-enrichment.worker.ts` - Optimized card processing  
- `bulk-import.worker.ts` - Already optimized, updated to use config

### 2. New Modules
- `rate-limiter.ts` - Advanced rate limiting utilities
- `config.ts` - Centralized configuration

### 3. Key Features
- **Token Bucket Rate Limiter**: Smooth rate limiting with burst support
- **Adaptive Rate Limiter**: Adjusts based on success/error rates
- **Distributed Rate Limiter**: Redis-backed for multi-worker coordination
- **Service Rate Limiters**: Pre-configured for common services

## Monitoring & Observability

### Worker Health Dashboard (/admin/workers)
- Real-time worker status
- Queue statistics and backlogs
- Success/failure rates
- Performance graphs

### Key Metrics
- Jobs processed per minute
- Average processing time
- Queue depths
- API rate limit utilization
- Cache hit rates

## Best Practices

### 1. Batch Size Tuning
- Monitor queue depths
- Adjust batch sizes based on load
- Use dynamic batch sizing for large queues

### 2. Rate Limit Management
- Monitor API error rates
- Adjust burst sizes carefully
- Use adaptive rate limiting for resilience

### 3. Cache Management
- Monitor cache hit rates
- Adjust TTLs based on usage patterns
- Clear caches periodically

### 4. Worker Scaling
- Scale workers horizontally in production
- Use `WORKER_SCALE_FACTOR` environment variable
- Monitor resource usage

## Deployment Notes

### Environment Variables
```bash
# Scale workers in production
WORKER_SCALE_FACTOR=2  # Double the configured concurrency

# Adjust for different environments
NODE_ENV=production    # Enables production optimizations
```

### Railway Deployment
- Can replicate worker instances for more throughput
- Each instance respects rate limits independently
- Redis coordinates job distribution

## Future Optimizations

1. **Smart Batching**: Group similar characters for better cache hits
2. **Predictive Pre-fetching**: Load likely-needed data in advance
3. **GPU Acceleration**: For image generation tasks
4. **CDN Integration**: Cache generated media at edge
5. **WebSocket Updates**: Real-time progress for users

## Testing

### Load Testing
```bash
# Test bulk import with 1000 characters
bun run test:bulk-import --size=1000

# Test deck enrichment
bun run test:deck-enrichment --cards=500

# Monitor performance
bun run monitor:workers
```

### Performance Monitoring
- Check `/admin/workers` dashboard
- Monitor Redis memory usage
- Track API rate limit headers
- Review job completion times

## Rollback Plan

If issues arise, original workers are backed up:
- `deck-enrichment-r2.worker.backup.ts`
- `card-enrichment.worker.backup.ts`

To rollback:
1. Rename backup files back to original names
2. Remove optimized versions
3. Restart workers

## Summary

These optimizations provide significant performance improvements while maintaining system stability and respecting API rate limits. The modular design allows for easy tuning and monitoring of the system's performance.