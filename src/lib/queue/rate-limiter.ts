/**
 * Advanced rate limiting utilities for queue workers
 * Implements token bucket algorithm with burst support
 */

import Redis from 'ioredis';
import getRedis from './redis';

/**
 * Token bucket rate limiter with burst support
 * Allows temporary bursts while maintaining average rate
 */
export class TokenBucketRateLimiter {
	private tokens: number;
	private maxTokens: number;
	private refillRate: number;
	private lastRefill: number;
	private queue: Array<{ resolve: () => void; tokens: number }> = [];
	private refillTimer?: NodeJS.Timeout;

	constructor(tokensPerSecond: number, burstSize?: number) {
		this.refillRate = tokensPerSecond;
		this.maxTokens = burstSize || tokensPerSecond * 2; // Default burst = 2x rate
		this.tokens = this.maxTokens;
		this.lastRefill = Date.now();
		
		// Start refill timer
		this.refillTimer = setInterval(() => this.refill(), 100);
	}

	private refill(): void {
		const now = Date.now();
		const elapsed = (now - this.lastRefill) / 1000;
		const tokensToAdd = elapsed * this.refillRate;
		
		this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
		this.lastRefill = now;
		
		// Process queued requests
		while (this.queue.length > 0 && this.tokens >= this.queue[0].tokens) {
			const request = this.queue.shift();
			if (request) {
				this.tokens -= request.tokens;
				request.resolve();
			}
		}
	}

	async acquire(tokens: number = 1): Promise<void> {
		return new Promise<void>((resolve) => {
			this.refill(); // Ensure tokens are up to date
			
			if (this.tokens >= tokens) {
				this.tokens -= tokens;
				resolve();
			} else {
				// Queue the request
				this.queue.push({ resolve, tokens });
			}
		});
	}

	getAvailableTokens(): number {
		this.refill();
		return this.tokens;
	}

	destroy(): void {
		if (this.refillTimer) {
			clearInterval(this.refillTimer);
		}
	}
}

/**
 * Simple rate limiter with fixed delay between calls
 * Good for strict rate limits without burst
 */
export class SimpleRateLimiter {
	private lastCallTime: number = 0;
	private minDelayMs: number;

	constructor(callsPerSecond: number) {
		this.minDelayMs = 1000 / callsPerSecond;
	}

	async waitIfNeeded(): Promise<void> {
		const now = Date.now();
		const timeSinceLastCall = now - this.lastCallTime;
		
		if (timeSinceLastCall < this.minDelayMs) {
			const waitTime = this.minDelayMs - timeSinceLastCall;
			await new Promise(resolve => setTimeout(resolve, waitTime));
		}
		
		this.lastCallTime = Date.now();
	}
}

/**
 * Distributed rate limiter using Redis
 * Ensures rate limits are respected across multiple workers
 */
export class DistributedRateLimiter {
	private redis: Redis;
	private key: string;
	private maxTokens: number;
	private refillRate: number;
	private window: number;

	constructor(
		key: string,
		tokensPerSecond: number,
		burstSize?: number,
		windowSeconds: number = 1
	) {
		this.redis = getRedis();
		this.key = `rate_limiter:${key}`;
		this.refillRate = tokensPerSecond;
		this.maxTokens = burstSize || tokensPerSecond * 2;
		this.window = windowSeconds * 1000; // Convert to milliseconds
	}

	async acquire(tokens: number = 1): Promise<boolean> {
		const now = Date.now();
		const windowStart = now - this.window;
		
		// Use Redis pipeline for atomic operations
		const pipeline = this.redis.pipeline();
		
		// Remove old entries outside the window
		pipeline.zremrangebyscore(this.key, 0, windowStart);
		
		// Count tokens used in current window
		pipeline.zcard(this.key);
		
		const results = await pipeline.exec();
		if (!results) return false;
		
		const tokensUsed = results[1][1] as number;
		
		if (tokensUsed + tokens <= this.maxTokens) {
			// Add tokens with timestamp
			const multi = this.redis.multi();
			for (let i = 0; i < tokens; i++) {
				multi.zadd(this.key, now, `${now}-${i}`);
			}
			multi.expire(this.key, Math.ceil(this.window / 1000));
			await multi.exec();
			return true;
		}
		
		return false;
	}

	async waitAndAcquire(tokens: number = 1, maxWaitMs: number = 5000): Promise<void> {
		const startTime = Date.now();
		
		while (Date.now() - startTime < maxWaitMs) {
			if (await this.acquire(tokens)) {
				return;
			}
			
			// Wait before retrying
			await new Promise(resolve => setTimeout(resolve, 100));
		}
		
		throw new Error(`Rate limit exceeded: Could not acquire ${tokens} tokens within ${maxWaitMs}ms`);
	}
}

/**
 * Service-specific rate limiters with predefined configurations
 */
export class ServiceRateLimiters {
	private static instance: ServiceRateLimiters;
	private limiters: Map<string, TokenBucketRateLimiter>;

	private constructor() {
		this.limiters = new Map();
		this.initializeLimiters();
	}

	private initializeLimiters(): void {
		// OpenAI rate limits
		this.limiters.set('openai-gpt4', new TokenBucketRateLimiter(2, 5)); // 2/sec, burst of 5
		this.limiters.set('openai-dalle', new TokenBucketRateLimiter(1, 3)); // 1/sec, burst of 3
		
		// Fal.ai rate limits
		this.limiters.set('fal-flux', new TokenBucketRateLimiter(1, 2)); // 1/sec, burst of 2
		
		// Azure TTS rate limits
		this.limiters.set('azure-tts', new TokenBucketRateLimiter(5, 10)); // 5/sec, burst of 10
		
		// Database operation limits
		this.limiters.set('mongodb-write', new TokenBucketRateLimiter(10, 20)); // 10/sec, burst of 20
		this.limiters.set('mongodb-read', new TokenBucketRateLimiter(50, 100)); // 50/sec, burst of 100
	}

	static getInstance(): ServiceRateLimiters {
		if (!ServiceRateLimiters.instance) {
			ServiceRateLimiters.instance = new ServiceRateLimiters();
		}
		return ServiceRateLimiters.instance;
	}

	getLimiter(service: string): TokenBucketRateLimiter | undefined {
		return this.limiters.get(service);
	}

	async acquireToken(service: string, tokens: number = 1): Promise<void> {
		const limiter = this.limiters.get(service);
		if (!limiter) {
			throw new Error(`No rate limiter configured for service: ${service}`);
		}
		await limiter.acquire(tokens);
	}

	destroy(): void {
		for (const limiter of this.limiters.values()) {
			limiter.destroy();
		}
	}
}

/**
 * Adaptive rate limiter that adjusts based on error rates
 */
export class AdaptiveRateLimiter {
	private baseRate: number;
	private currentRate: number;
	private minRate: number;
	private maxRate: number;
	private limiter: TokenBucketRateLimiter;
	private errorCount: number = 0;
	private successCount: number = 0;
	private adjustmentInterval: NodeJS.Timeout;

	constructor(
		baseRatePerSecond: number,
		minRatePerSecond: number = 0.5,
		maxRatePerSecond: number = 10
	) {
		this.baseRate = baseRatePerSecond;
		this.currentRate = baseRatePerSecond;
		this.minRate = minRatePerSecond;
		this.maxRate = maxRatePerSecond;
		this.limiter = new TokenBucketRateLimiter(this.currentRate);
		
		// Adjust rate every 10 seconds
		this.adjustmentInterval = setInterval(() => this.adjustRate(), 10000);
	}

	private adjustRate(): void {
		const total = this.errorCount + this.successCount;
		if (total === 0) return;
		
		const errorRate = this.errorCount / total;
		
		if (errorRate > 0.1) {
			// High error rate, slow down
			this.currentRate = Math.max(this.minRate, this.currentRate * 0.8);
		} else if (errorRate < 0.01 && this.successCount > 10) {
			// Low error rate, speed up
			this.currentRate = Math.min(this.maxRate, this.currentRate * 1.2);
		} else {
			// Gradually return to base rate
			this.currentRate = this.currentRate * 0.9 + this.baseRate * 0.1;
		}
		
		// Reset counters
		this.errorCount = 0;
		this.successCount = 0;
		
		// Create new limiter with adjusted rate
		this.limiter.destroy();
		this.limiter = new TokenBucketRateLimiter(this.currentRate);
		
		console.log(`Rate limiter adjusted to ${this.currentRate.toFixed(2)} requests/sec`);
	}

	async acquire(tokens: number = 1): Promise<void> {
		await this.limiter.acquire(tokens);
	}

	recordSuccess(): void {
		this.successCount++;
	}

	recordError(): void {
		this.errorCount++;
	}

	getCurrentRate(): number {
		return this.currentRate;
	}

	destroy(): void {
		clearInterval(this.adjustmentInterval);
		this.limiter.destroy();
	}
}

// Export singleton instance for service rate limiters
export const serviceRateLimiters = ServiceRateLimiters.getInstance();