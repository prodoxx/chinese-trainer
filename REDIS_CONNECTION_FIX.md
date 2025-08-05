# Redis Connection Fix for Railway

## Problem
The error `getaddrinfo ENOTFOUND redis.railway.internal` occurs because:
- The hostname `redis.railway.internal` only works within Railway's infrastructure
- It cannot be resolved when running locally or outside Railway

## Solutions

### 1. For Local Development
Update your local `.env` file with local Redis settings:
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

Or if using the Redis from docker-compose:
```bash
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 2. For Railway Production
In Railway dashboard, set these environment variables:
```bash
REDIS_HOST=redis.railway.internal
REDIS_PORT=6379
REDIS_PASSWORD=<your-redis-password>
```

### 3. Alternative: Use Redis URL
Modify the Redis connection to support both URL and individual parameters:

```typescript
// src/lib/queue/redis.ts
import Redis from 'ioredis';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    // Check for REDIS_URL first (Railway provides this)
    if (process.env.REDIS_URL) {
      redis = new Redis(process.env.REDIS_URL);
    } else {
      // Fall back to individual parameters
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

export default getRedis;
```

### 4. Railway Service Variables
Railway provides these variables automatically:
- `REDIS_URL` - Full connection URL
- `REDISHOST` - Hostname (usually redis.railway.internal)
- `REDISPORT` - Port number
- `REDISUSER` - Username (if applicable)
- `REDISPASSWORD` - Password

### 5. Debug Steps
1. Check Railway dashboard for the correct Redis service variables
2. Ensure both your app and Redis are in the same Railway project
3. Verify Redis service is running in Railway
4. Check if you're using private networking (redis.railway.internal) vs public URL

### 6. Testing Connection
Add this debug script to test Redis connection:

```typescript
// scripts/test-redis.ts
import { getRedis } from '../src/lib/queue/redis';

async function testRedis() {
  console.log('Testing Redis connection...');
  console.log('REDIS_URL:', process.env.REDIS_URL ? 'Set' : 'Not set');
  console.log('REDIS_HOST:', process.env.REDIS_HOST);
  console.log('REDIS_PORT:', process.env.REDIS_PORT);
  
  try {
    const redis = getRedis();
    await redis.ping();
    console.log('✅ Redis connection successful!');
    
    // Test write/read
    await redis.set('test:key', 'test-value');
    const value = await redis.get('test:key');
    console.log('✅ Redis read/write test:', value);
    
    await redis.del('test:key');
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    process.exit(1);
  }
}

testRedis();
```

Run with: `bun run scripts/test-redis.ts`