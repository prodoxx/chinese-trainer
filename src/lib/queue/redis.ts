import Redis from 'ioredis';

let redis: Redis | null = null;

// Get Redis connection options for BullMQ compatibility
export function getRedisOptions() {
  // Check for REDIS_URL first (Railway provides this)
  if (process.env.REDIS_URL) {
    console.log('📌 Using REDIS_URL from environment');
    return process.env.REDIS_URL;
  }
  
  // Check if we're in Railway environment with internal hostname
  const isRailway = process.env.RAILWAY_ENVIRONMENT === 'production';
  const host = process.env.REDIS_HOST || 'localhost';
  
  // If we detect Railway internal hostname but no REDIS_URL, construct it
  if (isRailway && host === 'redis.railway.internal' && process.env.REDIS_PASSWORD) {
    const port = process.env.REDIS_PORT || '6379';
    const redisUrl = `redis://default:${process.env.REDIS_PASSWORD}@${host}:${port}`;
    console.log('📌 Constructed Redis URL for Railway internal network');
    return redisUrl;
  }
  
  // Fall back to individual parameters
  console.log('📌 Using individual Redis parameters');
  return {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  };
}

// Lazy-load Redis connection
export function getRedis(): Redis {
  if (!redis) {
    const options = getRedisOptions();
    
    if (typeof options === 'string') {
      console.log('🔗 Connecting to Redis using REDIS_URL');
      redis = new Redis(options, {
        maxRetriesPerRequest: null,
      });
    } else {
      console.log('🔗 Connecting to Redis using host/port configuration');
      console.log(`   Host: ${options.host}`);
      console.log(`   Port: ${options.port}`);
      redis = new Redis(options);
    }

    // Test connection
    redis.on('connect', () => {
      console.log('✅ Connected to Redis');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis connection error:', err);
    });
  }
  
  return redis;
}

// Export the getter function as default
export default getRedis;