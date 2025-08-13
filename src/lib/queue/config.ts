/**
 * Configuration for queue workers and job processing
 * Optimized for performance and scalability
 */

// Worker concurrency settings
export const WORKER_CONCURRENCY = {
	// Number of concurrent jobs each worker type can process
	DECK_IMPORT: 2,           // Heavy I/O operation
	DECK_ENRICHMENT: 3,       // Increased from 2 for better throughput
	CARD_ENRICHMENT: 5,       // Increased from 2 for parallel processing
	BULK_IMPORT: 1,           // Single job to avoid conflicts
} as const;

// Batch processing settings
export const BATCH_CONFIG = {
	// Number of items to process in a single batch
	DECK_ENRICHMENT_BATCH_SIZE: 10,      // Cards per batch
	BULK_IMPORT_BATCH_SIZE: 10,          // Characters per batch
	DICTIONARY_BATCH_SIZE: 50,           // Dictionary lookups per batch
	
	// Delay between batches (milliseconds)
	DECK_ENRICHMENT_BATCH_DELAY: 1000,   // 1 second
	BULK_IMPORT_BATCH_DELAY: 2000,       // 2 seconds
} as const;

// Parallel processing settings
export const PARALLEL_CONFIG = {
	// Max items to process in parallel within a batch
	DECK_ENRICHMENT_PARALLEL: 5,         // Cards processed simultaneously
	CARD_ENRICHMENT_PARALLEL: 5,         // Individual card jobs
	ENRICHMENT_CONCURRENCY: 3,           // Enrichment jobs queued concurrently
} as const;

// Rate limiting settings (requests per second)
export const RATE_LIMITS = {
	// OpenAI API limits
	OPENAI_GPT4: { rate: 2, burst: 5 },          // 2/sec with burst of 5
	OPENAI_DALLE: { rate: 1, burst: 3 },         // 1/sec with burst of 3
	
	// Fal.ai API limits
	FAL_FLUX: { rate: 1, burst: 2 },             // 1/sec with burst of 2
	
	// Azure TTS limits
	AZURE_TTS: { rate: 5, burst: 10 },           // 5/sec with burst of 10
	
	// Database operation limits
	MONGODB_WRITE: { rate: 10, burst: 20 },      // 10/sec with burst of 20
	MONGODB_READ: { rate: 50, burst: 100 },      // 50/sec with burst of 100
} as const;

// Job timeout and retry settings
export const JOB_CONFIG = {
	// Lock durations (milliseconds)
	DECK_ENRICHMENT_LOCK: 600000,        // 10 minutes for large decks
	CARD_ENRICHMENT_LOCK: 300000,        // 5 minutes
	BULK_IMPORT_LOCK: 600000,            // 10 minutes for large imports
	
	// Lock renewal intervals (milliseconds)
	LOCK_RENEW_TIME: 60000,              // Renew every 1 minute
	
	// Retry configuration
	DEFAULT_ATTEMPTS: 3,
	BACKOFF_TYPE: 'exponential' as const,
	BACKOFF_DELAY: 5000,                 // 5 seconds initial delay
	
	// Job retention
	KEEP_COMPLETED: 100,                 // Keep last 100 completed jobs
	KEEP_FAILED: 50,                     // Keep last 50 failed jobs
} as const;

// Cache configuration
export const CACHE_CONFIG = {
	// TTL for various caches (milliseconds)
	DICTIONARY_CACHE_TTL: 5 * 60 * 1000,      // 5 minutes
	MEDIA_CHECK_CACHE_TTL: 5 * 60 * 1000,     // 5 minutes
	
	// Cache cleanup interval (milliseconds)
	CLEANUP_INTERVAL: 60000,                   // Clean every 1 minute
	
	// Max cache sizes
	MAX_DICTIONARY_CACHE_SIZE: 1000,          // Max 1000 entries
	MAX_MEDIA_CACHE_SIZE: 500,                // Max 500 entries
} as const;

// Performance monitoring
export const MONITORING_CONFIG = {
	// Health check intervals (milliseconds)
	HEARTBEAT_INTERVAL: 30000,                // 30 seconds
	STATS_UPDATE_INTERVAL: 10000,             // 10 seconds
	
	// Thresholds for health status
	HIGH_BACKLOG_THRESHOLD: 100,              // Jobs waiting
	HIGH_FAILURE_RATE: 0.1,                   // 10% failure rate
	
	// Adaptive rate limiting
	RATE_ADJUSTMENT_INTERVAL: 10000,          // Adjust every 10 seconds
	MIN_RATE_MULTIPLIER: 0.5,                 // Minimum 50% of base rate
	MAX_RATE_MULTIPLIER: 2.0,                 // Maximum 200% of base rate
} as const;

// Priority levels for different job types
export const JOB_PRIORITIES = {
	// Higher number = higher priority
	USER_INITIATED_ENRICHMENT: 100,           // Direct user action
	SINGLE_CARD_ENRICHMENT: 50,               // Individual card
	DECK_ENRICHMENT: 20,                      // Deck processing
	BULK_IMPORT_ENRICHMENT: 10,               // Bulk import (lower priority)
	BACKGROUND_TASK: 1,                       // Background maintenance
} as const;

// Redis configuration
export const REDIS_CONFIG = {
	// Connection pool settings
	MAX_RETRIES: 3,
	RETRY_DELAY: 1000,                        // 1 second
	CONNECTION_TIMEOUT: 10000,                // 10 seconds
	
	// Key prefixes
	QUEUE_PREFIX: 'bull',
	RATE_LIMITER_PREFIX: 'rate_limiter',
	CACHE_PREFIX: 'cache',
} as const;

// Environment-specific overrides
const ENV = process.env.NODE_ENV || 'development';

export const getWorkerConcurrency = (workerType: keyof typeof WORKER_CONCURRENCY): number => {
	// In production, scale based on available resources
	if (ENV === 'production') {
		const multiplier = parseInt(process.env.WORKER_SCALE_FACTOR || '1', 10);
		return WORKER_CONCURRENCY[workerType] * multiplier;
	}
	return WORKER_CONCURRENCY[workerType];
};

export const getRateLimit = (service: keyof typeof RATE_LIMITS) => {
	const config = RATE_LIMITS[service];
	
	// In development, reduce rate limits to avoid hitting API limits during testing
	if (ENV === 'development') {
		return {
			rate: Math.max(1, Math.floor(config.rate * 0.5)),
			burst: Math.max(1, Math.floor(config.burst * 0.5)),
		};
	}
	
	return config;
};

// Helper to get optimal batch size based on system load
export const getDynamicBatchSize = (baseSize: number, queueLength: number): number => {
	// Increase batch size for large queues to process faster
	if (queueLength > 1000) return baseSize * 2;
	if (queueLength > 500) return Math.floor(baseSize * 1.5);
	return baseSize;
};

// Export a function to log current configuration
export const logConfiguration = (): void => {
	console.log('🔧 Queue Worker Configuration:');
	console.log(`   Environment: ${ENV}`);
	console.log(`   Worker Concurrency:`, WORKER_CONCURRENCY);
	console.log(`   Batch Sizes:`, BATCH_CONFIG);
	console.log(`   Rate Limits:`, RATE_LIMITS);
	console.log(`   Cache TTLs:`, CACHE_CONFIG);
};