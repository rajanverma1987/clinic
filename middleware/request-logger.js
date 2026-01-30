/**
 * Enterprise Request Logger Middleware
 * Logs all API requests with correlation IDs, performance metrics, and context
 */

import { getCorrelationId, logger, setCorrelationId } from '@/lib/utils/logger.js';
import { NextResponse } from 'next/server';

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

    // User is set by auth middleware on req; at request start it may not be set yet
    const getUserInfo = (r) => {
      const u = r?.user;
      if (!u?.userId) return null;
      return { userId: u.userId, tenantId: u.tenantId, role: u.role };
    };

    // In development skip per-request INFO to keep terminal readable; use LOG_LEVEL=DEBUG to enable
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev || process.env.LOG_LEVEL === 'DEBUG') {
      logger.info('API Request', {
        method,
        url,
        correlationId,
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent')?.substring(0, 100),
      });
    }

    try {
      const result = await handler(req, ...args);
      const duration = Date.now() - startTime;
      const statusCode = result?.status || 200;
      const userInfo = getUserInfo(req);

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
      const userInfo = getUserInfo(req);

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
