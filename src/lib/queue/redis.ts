import Redis from 'ioredis';

let redis: Redis | null = null;

// Lazy-load Redis connection
export function getRedis(): Redis {
  if (!redis) {
    // Check for REDIS_URL first (Railway provides this)
    if (process.env.REDIS_URL) {
      console.log('🔗 Connecting to Redis using REDIS_URL');
      redis = new Redis(process.env.REDIS_URL);
    } else {
      // Fall back to individual parameters
      console.log('🔗 Connecting to Redis using host/port configuration');
      console.log(`   Host: ${process.env.REDIS_HOST || 'localhost'}`);
      console.log(`   Port: ${process.env.REDIS_PORT || '6379'}`);
      
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        maxRetriesPerRequest: null,
      });
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