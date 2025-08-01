import { NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import redis from '@/lib/queue/redis';
import mongoose from 'mongoose';

export async function GET() {
  const startTime = Date.now();
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      openai: 'unknown',
      r2: 'unknown'
    },
    responseTime: 0
  };

  try {
    // Check MongoDB connection
    try {
      await connectDB();
      await Promise.race([
        // Try a simple database operation with timeout
        new Promise(async (resolve) => {
          if (mongoose.connection.readyState === 1) {
            resolve('connected');
          } else {
            resolve('disconnected');
          }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
      healthCheck.services.database = 'healthy';
    } catch (error) {
      healthCheck.services.database = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    // Check Redis connection
    try {
      await Promise.race([
        redis.ping(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
      healthCheck.services.redis = 'healthy';
    } catch (error) {
      healthCheck.services.redis = 'unhealthy';
      healthCheck.status = 'degraded';
    }

    // Check OpenAI API key
    healthCheck.services.openai = process.env.OPENAI_API_KEY ? 'configured' : 'missing';
    if (!process.env.OPENAI_API_KEY) {
      healthCheck.status = 'degraded';
    }

    // Check R2 configuration
    const r2Required = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET_NAME'];
    const r2Missing = r2Required.filter(key => !process.env[key]);
    healthCheck.services.r2 = r2Missing.length === 0 ? 'configured' : `missing: ${r2Missing.join(', ')}`;
    if (r2Missing.length > 0) {
      healthCheck.status = 'degraded';
    }

    // Calculate response time
    healthCheck.responseTime = Date.now() - startTime;

    // Determine overall status
    const unhealthyServices = Object.values(healthCheck.services).filter(
      status => status === 'unhealthy' || status.toString().startsWith('missing')
    );
    
    if (unhealthyServices.length > 0) {
      healthCheck.status = unhealthyServices.length === Object.keys(healthCheck.services).length ? 'unhealthy' : 'degraded';
    }

    const statusCode = healthCheck.status === 'ok' ? 200 : healthCheck.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthCheck, { status: statusCode });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime,
      services: healthCheck.services
    }, { status: 503 });
  }
}