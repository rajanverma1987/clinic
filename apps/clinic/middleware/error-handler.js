/**
 * Error Handler Middleware
 * Centralized error handling for API routes
 * Based on NEW-PLANS.md requirements
 */

import * as CustomErrors from '@/lib/errors/custom-errors';
import { errorToResponse } from '@/lib/errors/custom-errors';
import { errorResponse, handleMongoError } from '@/lib/utils/api-response';
import { sanitizeForLogging } from '@/lib/utils/enterprise-helpers.js';
import { getCorrelationId, logger, setCorrelationId } from '@/lib/utils/logger.js';
import { NextResponse } from 'next/server';
import { addSecurityHeaders } from './security-headers.js';

/**
 * Wrapper for API route handlers with error handling
 */
export function withErrorHandler(handler) {
  return async (req, ...args) => {
    // Set correlation ID for request tracking
    const correlationId = req.headers.get('x-correlation-id') || getCorrelationId();
    setCorrelationId(correlationId);

    const startTime = Date.now();

    try {
      const result = await handler(req, ...args);
      const duration = Date.now() - startTime;

      // Log successful request
      logger.api(req.method, req.url, result?.status || 200, duration, { correlationId });

      // Add security headers to successful responses
      if (result instanceof NextResponse) {
        result.headers.set('X-Correlation-ID', correlationId);
        return addSecurityHeaders(result);
      }
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      // In development log a short one-liner; no headers/cookies in terminal
      const isDev = process.env.NODE_ENV === 'development';
      const meta = isDev
        ? { url: req.url, method: req.method, message: error.message, duration }
        : {
            url: req.url,
            method: req.method,
            correlationId,
            duration,
            headers: sanitizeForLogging(Object.fromEntries(req.headers.entries()), [
              'cookie',
              'authorization',
              'token',
              'secret',
              'key',
              'password',
            ]),
          };
      logger.error('Request Error', error, meta);

      // Handle custom application errors
      if (error instanceof CustomErrors.AppError) {
        const response = errorToResponse(error);
        return NextResponse.json(response, { status: error.statusCode });
      }

      // Handle MongoDB errors
      if (error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) {
        const response = handleMongoError(error);
        return NextResponse.json(response, { status: 400 });
      }

      // Handle JWT errors
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return NextResponse.json(
          errorResponse('Invalid or expired token', 'AUTHENTICATION_ERROR'),
          { status: 401 },
        );
      }

      // Handle network/timeout errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return NextResponse.json(
          errorResponse('Service temporarily unavailable', 'SERVICE_UNAVAILABLE'),
          { status: 503 },
        );
      }

      // Chunk/module load failures (stale build, webpack undefined factory)
      const errMsg = (error?.message || '').toLowerCase();
      if (
        errMsg.includes("reading 'call'") ||
        errMsg.includes('chunkloaderror') ||
        (errMsg.includes('loading chunk') && errMsg.includes('failed'))
      ) {
        return NextResponse.json(
          errorResponse('Please refresh the page to load the latest version.', 'CHUNK_LOAD_FAILED'),
          { status: 500 },
        );
      }

      // Generic error fallback
      const message =
        process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message;

      return NextResponse.json(
        errorResponse(
          message,
          'INTERNAL_ERROR',
          process.env.NODE_ENV === 'development' ? error.stack : null,
        ),
        { status: 500 },
      );
    }
  };
}

/**
 * Async handler wrapper (alternative syntax)
 */
export function asyncHandler(fn) {
  return (req, ...args) => {
    return Promise.resolve(fn(req, ...args)).catch((error) => {
      return withErrorHandler(() => {
        throw error;
      })(req, ...args);
    });
  };
}
