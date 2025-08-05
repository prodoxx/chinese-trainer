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
      // Parse and log the URL (without password)
      try {
        const url = new URL(options);
        console.log(`   Host: ${url.hostname}`);
        console.log(`   Port: ${url.port || '6379'}`);
        console.log(`   Protocol: ${url.protocol}`);
      } catch (e) {
        console.log('   URL parsing failed:', e);
      }
      
      redis = new Redis(options, {
        maxRetriesPerRequest: null,
        enableOfflineQueue: false,
        connectTimeout: 10000,
        lazyConnect: false,
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
      
      // Additional debugging for Railway
      if (err.message?.includes('ENOTFOUND') && err.message?.includes('railway.internal')) {
        console.error('🔧 Railway internal DNS resolution failed');
        console.error('   This typically means:');
        console.error('   1. The service is not running in Railway');
        console.error('   2. The service is in a different Railway project');
        console.error('   3. Private networking is not enabled');
      }
    });
  }
  
  return redis;
}

// Export the getter function as default
export default getRedis;