# Railway Redis Connection Solution

## The Problem

Your workers are running as a separate Railway service and cannot connect to Redis using the internal hostname `redis.railway.internal`. This is a common issue with Railway's internal networking between services.

## Solutions (in order of recommendation)

### Solution 1: Use Public Redis URL (Easiest)

1. **Enable public networking on your Redis service in Railway:**
   - Go to your Redis service in Railway dashboard
   - Click on "Settings"
   - Under "Networking", enable "Public Networking"
   - Copy the public URL (it will look like: `redis://default:password@host.railway.app:port`)

2. **Update your environment variables:**
   - Replace the internal URL with the public URL in both services
   - Set `REDIS_URL=redis://default:password@your-redis.railway.app:6379`

### Solution 2: Use IPv6 Addresses

Railway uses IPv6 for internal networking. You can use the IPv6 address directly:

1. **Find your Redis service's IPv6 address:**
   ```bash
   # SSH into your Redis service
   railway run echo $RAILWAY_PRIVATE_DOMAIN
   ```

2. **Update REDIS_URL to use IPv6:**
   ```
   REDIS_URL=redis://default:password@[your-ipv6-address]:6379
   ```

### Solution 3: Combine Services

Run workers in the same service as your main app:

1. **Create a start script** (`start.sh`):
   ```bash
   #!/bin/bash
   # Start workers in background
   bun run workers &
   WORKER_PID=$!
   
   # Start main app
   bun run start &
   APP_PID=$!
   
   # Wait for both processes
   wait $WORKER_PID $APP_PID
   ```

2. **Update your Railway start command:**
   ```
   chmod +x start.sh && ./start.sh
   ```

### Solution 4: Use Service Discovery (Advanced)

Use environment variables to reference services:

1. **In your worker service, add a reference variable:**
   - Go to your worker service settings
   - Add a new variable: `REDIS_SERVICE_URL=${{Redis.REDIS_URL}}`
   - This references the Redis service's URL dynamically

## Debugging Steps

1. **Check if both services are in the same environment:**
   ```bash
   # SSH into worker service
   railway run env | grep RAILWAY_ENVIRONMENT
   ```

2. **Test Redis connection from worker service:**
   ```bash
   # SSH into worker service
   railway run bun run scripts/test-redis.ts
   ```

3. **Check network connectivity:**
   ```bash
   # From worker service
   railway run ping6 redis.railway.internal
   ```

## Updated Code

The code has been updated to handle Railway's internal networking better:

1. **Custom RailwayRedis class** that handles IPv6 and internal DNS
2. **Automatic retry logic** with IPv4/IPv6 fallback
3. **Better error messages** for debugging

## Environment Variables

Ensure these are set in BOTH services (main app and workers):

```bash
# Option 1: Public URL (recommended)
REDIS_URL=redis://default:your-password@your-redis.railway.app:6379

# Option 2: Internal URL (requires same project/environment)
REDIS_URL=redis://default:your-password@redis.railway.internal:6379

# Option 3: IPv6 address
REDIS_URL=redis://default:your-password@[2a09:8280:1::2:4a3b]:6379
```

## Quick Fix

The fastest solution is to **enable public networking** on your Redis service and use the public URL. This bypasses all internal networking complexities.