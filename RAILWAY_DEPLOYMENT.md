# Railway Deployment Guide

## Redis Configuration

### Problem
The workers are failing to connect to Redis with the error:
```
Redis connection error: [Error: getaddrinfo ENOTFOUND redis.railway.internal]
```

### Solution

#### 1. Set Environment Variables in Railway

In your Railway project, make sure BOTH the main app service AND the worker service have these environment variables:

**Option A: Using Redis URL (Recommended)**
```bash
REDIS_URL=redis://default:YOUR_REDIS_PASSWORD@redis.railway.internal:6379
```

**Option B: Using Individual Parameters**
```bash
REDIS_HOST=redis.railway.internal
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD
RAILWAY_ENVIRONMENT=production
```

#### 2. Deploy Workers as a Separate Service

If you're running workers as a separate Railway service:

1. Create a new service in Railway for workers
2. Set the start command to: `bun run workers`
3. Add the SAME Redis environment variables to the worker service
4. Ensure both services are in the same Railway project

#### 3. Alternative: Run Workers in the Same Service

If you want to run workers in the same service as your app:

1. Create a startup script:
```bash
#!/bin/bash
# start.sh
bun run workers &
bun run start
```

2. Update your Railway start command to use the script

#### 4. Verify Connection

SSH into your Railway service and run:
```bash
bun run scripts/test-redis.ts
```

This will show you which environment variables are set and test the connection.

## Environment Variables Checklist

Ensure these are set in Railway for BOTH app and worker services:

- [ ] `REDIS_URL` or (`REDIS_HOST` + `REDIS_PORT` + `REDIS_PASSWORD`)
- [ ] `MONGODB_URI`
- [ ] `NEXTAUTH_URL`
- [ ] `NEXTAUTH_SECRET`
- [ ] `GOOGLE_CLIENT_ID`
- [ ] `GOOGLE_CLIENT_SECRET`
- [ ] `OPENAI_API_KEY`
- [ ] `FAL_KEY`
- [ ] `AZURE_TTS_KEY`
- [ ] `AZURE_TTS_REGION`
- [ ] `R2_ACCOUNT_ID`
- [ ] `R2_ACCESS_KEY_ID`
- [ ] `R2_SECRET_ACCESS_KEY`
- [ ] `R2_BUCKET_NAME`
- [ ] `R2_PUBLIC_URL`

## Debugging Steps

1. Check if Redis service is running in Railway
2. Verify both services are in the same project
3. Check Railway logs for both services
4. Use `railway logs` CLI command to see real-time logs
5. SSH into the service and test Redis connection manually

## Common Issues

### Issue: Workers can't connect to Redis
- Ensure workers have the same environment variables as the main app
- Check if you're using the correct Redis hostname
- Verify Redis password is set correctly

### Issue: Different Redis instances
- Make sure you're not accidentally connecting to different Redis instances
- Use the same REDIS_URL for all services

### Issue: Missing environment variables
- Railway doesn't automatically share variables between services
- You must manually add them to each service