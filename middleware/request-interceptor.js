/**
 * Enterprise Request/Response Interceptor
 * Provides request transformation, validation, and response modification
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger.js';
import { sanitizeForLogging } from '@/lib/utils/enterprise-helpers.js';
import { recordRequest } from '@/lib/monitoring/metrics.js';

/**
 * Request interceptor middleware
 */
export function withRequestInterceptor(handler, options = {}) {
  const {
    validateRequest = true,
    transformRequest = null,
    transformResponse = null,
    logRequest = true,
    logResponse = true,
  } = options;
  
  return async (req, ...args) => {
    const startTime = Date.now();
    const method = req.method;
    const url = req.url;
    
    // Log incoming request
    if (logRequest) {
      logger.info('Request Intercepted', {
        method,
        url,
        headers: sanitizeForLogging(Object.fromEntries(req.headers.entries())),
      });
    }
    
    try {
      // Transform request if provided
      let transformedReq = req;
      if (transformRequest) {
        transformedReq = await transformRequest(req, ...args);
      }
      
      // Validate request if enabled
      if (validateRequest) {
        // Basic validation (can be extended)
        if (!transformedReq.url) {
          throw new Error('Invalid request: missing URL');
        }
      }
      
      // Execute handler
      const result = await handler(transformedReq, ...args);
      const duration = Date.now() - startTime;
      
      // Transform response if provided
      let finalResult = result;
      if (transformResponse) {
        finalResult = await transformResponse(result, req, duration);
      }
      
      // Record metrics
      const statusCode = finalResult?.status || 200;
      recordRequest(url, method, statusCode, duration);
      
      // Log response
      if (logResponse) {
        logger.api(method, url, statusCode, duration);
      }
      
      // Add performance headers
      if (finalResult instanceof NextResponse) {
        finalResult.headers.set('X-Response-Time', `${duration}ms`);
        finalResult.headers.set('X-Request-ID', req.headers.get('x-request-id') || 'unknown');
      }
      
      return finalResult;
    } catch (error) {
      const duration = Date.now() - startTime;
      recordRequest(url, method, 500, duration);
      
      logger.error('Request Interceptor Error', error, {
        method,
        url,
        duration,
      });
      
      throw error;
    }
  };
}

/**
 * Response transformer utilities
 */
export const ResponseTransformers = {
  /**
   * Add pagination metadata to response
   */
  addPagination: (response, pagination) => {
    if (response instanceof NextResponse) {
      response.headers.set('X-Pagination-Page', String(pagination.page || 1));
      response.headers.set('X-Pagination-Limit', String(pagination.limit || 10));
      response.headers.set('X-Pagination-Total', String(pagination.total || 0));
      response.headers.set('X-Pagination-Pages', String(pagination.pages || 0));
    }
    return response;
  },
  
  /**
   * Add rate limit headers
   */
  addRateLimit: (response, limit, remaining, reset) => {
    if (response instanceof NextResponse) {
      response.headers.set('X-RateLimit-Limit', String(limit));
      response.headers.set('X-RateLimit-Remaining', String(remaining));
      response.headers.set('X-RateLimit-Reset', String(reset));
    }
    return response;
  },
  
  /**
   * Compress response (if large)
   */
  compressIfLarge: (response, threshold = 1024) => {
    // Compression is handled by Next.js, but we can add headers
    if (response instanceof NextResponse) {
      response.headers.set('Content-Encoding', 'gzip');
    }
    return response;
  },
};
