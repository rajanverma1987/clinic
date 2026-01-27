/**
 * Enterprise Request Logger Middleware
 * Logs all API requests with correlation IDs, performance metrics, and context
 */

import { NextResponse } from 'next/server';
import { logger, setCorrelationId, getCorrelationId } from '@/lib/utils/logger.js';
import { sanitizeForLogging } from '@/lib/utils/enterprise-helpers.js';

/**
 * Request logger middleware
 */
export function withRequestLogger(handler) {
  return async (req, ...args) => {
    // Generate or use existing correlation ID
    const correlationId = req.headers.get('x-correlation-id') || getCorrelationId();
    setCorrelationId(correlationId);
    
    const startTime = Date.now();
    const method = req.method;
    const url = req.url;
    
    // Extract user info if available
    let userInfo = null;
    if (args[0] && args[0].userId) {
      userInfo = {
        userId: args[0].userId,
        tenantId: args[0].tenantId,
        role: args[0].role,
      };
    }
    
    // Log incoming request
    logger.info('API Request', {
      method,
      url,
      correlationId,
      user: userInfo,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent')?.substring(0, 100),
    });
    
    try {
      const result = await handler(req, ...args);
      const duration = Date.now() - startTime;
      const statusCode = result?.status || 200;
      
      // Log response
      logger.api(method, url, statusCode, duration, {
        correlationId,
        user: userInfo,
      });
      
      // Add correlation ID to response headers
      if (result instanceof NextResponse) {
        result.headers.set('X-Correlation-ID', correlationId);
        result.headers.set('X-Response-Time', `${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Error logging is handled by error handler, but log here for completeness
      logger.error('Request Failed', error, {
        method,
        url,
        correlationId,
        duration,
        user: userInfo,
      });
      
      throw error;
    }
  };
}
