import Redis from 'ioredis';
import IORedis from 'ioredis';

let redis: Redis | null = null;

// Custom DNS resolver for Railway internal networking
class RailwayRedis extends IORedis {
  constructor(options: any) {
    // If connecting to Railway internal hostname, add special handling
    if (typeof options === 'string' && options.includes('redis.railway.internal')) {
      console.log('🚂 Detected Railway internal URL, configuring for internal networking...');
      
      // Parse the URL to extract components
      const url = new URL(options);
      
      // Create connection with IPv6 support and custom DNS handling
      super({
        host: url.hostname,
        port: parseInt(url.port || '6379'),
        password: url.password || undefined,
        username: url.username || 'default',
        family: 0, // Auto-detect (tries both IPv4 and IPv6)
        // Increase timeouts for internal networking
        connectTimeout: 20000,
        commandTimeout: 10000,
        // Disable offline queue to fail fast
        enableOfflineQueue: false,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          console.log(`🔄 Retry attempt ${times} for Railway Redis connection`);
          if (times > 3) return null;
          return Math.min(times * 1000, 3000);
        },
        reconnectOnError: (err) => {
          console.log('🔧 Reconnect on error:', err.message);
          return true;
        },
      });
    } else {
      super(options);
    }
  }
}

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
      
      // Use RailwayRedis for Railway internal URLs
      redis = new RailwayRedis(options);
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
        console.error('   1. The services are not in the same Railway environment');
        console.error('   2. The Redis service name might have changed');
        console.error('   3. Try using the public Redis URL instead');
        console.error('');
        console.error('   Quick fix: Enable public networking on your Redis service');
        console.error('   and use the public URL instead of the internal one.');
      }
    });
  }
  
  return redis;
}

// Export the getter function as default
export default getRedis;