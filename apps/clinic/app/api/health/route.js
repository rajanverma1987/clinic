/**
 * Enterprise Health Check Endpoint
 * Returns system health status, metrics, and readiness checks
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
import connectDB from '@/lib/db/connection.js';
import { getMetrics } from '@/lib/monitoring/metrics.js';
import { successResponse } from '@/lib/utils/api-response.js';
import { logger } from '@/lib/utils/logger.js';

/**
 * Check database connectivity
 */
async function checkDatabase() {
  try {
    await connectDB();
    return { status: 'healthy', latency: 0 };
  } catch (error) {
    logger.error('Database health check failed', error);
    return { status: 'unhealthy', error: error.message };
  }
}

/**
 * Check Redis connectivity (optional – reports degraded when Redis disabled/unavailable)
 */
async function checkCache() {
  try {
    const { checkRedisHealth } = await import('@/lib/cache/redis-client.js');
    const start = Date.now();
    const { available } = await checkRedisHealth();
    const latency = Date.now() - start;
    if (available) return { status: 'healthy', latency };
    return { status: 'degraded', latency, reason: 'Redis disabled or unavailable' };
  } catch (error) {
    return { status: 'degraded', error: error.message };
  }
}

/**
 * GET /api/health
 * Health check endpoint
 */
export async function GET(req) {
  const startTime = Date.now();
  
  try {
    // Run health checks in parallel
    const [database, cache] = await Promise.all([
      checkDatabase(),
      checkCache(),
    ]);
    
    const duration = Date.now() - startTime;
    
    // Determine overall health
    const isHealthy = database.status === 'healthy';
    const isDegraded = cache.status === 'degraded';
    
    const health = {
      status: isHealthy ? (isDegraded ? 'degraded' : 'healthy') : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database,
        cache,
      },
      metrics: getMetrics(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
    
    const statusCode = isHealthy ? 200 : 503;
    
    return NextResponse.json(
      successResponse(health),
      {
        status: statusCode,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'X-Health-Check-Duration': `${duration}ms`,
        },
      }
    );
  } catch (error) {
    logger.error('Health check failed', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'Health check failed',
          code: 'HEALTH_CHECK_ERROR',
        },
      },
      { status: 503 }
    );
  }
}
