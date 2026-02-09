/**
 * Enterprise Service Wrapper Middleware
 * 
 * Provides consistent service layer integration with API routes.
 * Handles request context, error transformation, and response formatting.
 * 
 * @module middleware/service-wrapper
 * @since 1.0.0
 */

import { logger } from '@/lib/utils/logger.js';
import { recordRequest, recordError } from '@/lib/monitoring/metrics.js';
import { sanitizeForLogging } from '@/lib/utils/enterprise-helpers.js';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors/custom-errors.js';
import { errorResponse } from '@/lib/utils/api-response.js';
import { NextResponse } from 'next/server';

/**
 * Wrap service function with enterprise patterns.
 * 
 * Provides:
 * - Request context extraction (IP, user agent, correlation ID)
 * - Error handling and transformation
 * - Performance tracking
 * - Logging
 * - Response formatting
 * 
 * @function wrapService
 * @param {Function} serviceFn - Service function to wrap
 * @param {Object} [options={}] - Wrapper options
 * @param {boolean} [options.trackMetrics=true] - Whether to track metrics
 * @param {boolean} [options.logRequest=true] - Whether to log request
 * @param {string} [options.operationName] - Operation name for logging
 * @returns {Function} Wrapped service function compatible with API route handlers
 * 
 * @example
 * // In API route
 * async function getHandler(req, user) {
 *   const serviceFn = async () => {
 *     return await getPatientById(patientId, user.tenantId, user.userId);
 *   };
 *   
 *   return await wrapService(serviceFn, {
 *     operationName: 'getPatient',
 *     trackMetrics: true
 *   })(req, user);
 * }
 * 
 * @example
 * // With request context
 * const handler = wrapService(
 *   async (context) => {
 *     const { userId, tenantId, ipAddress, userAgent } = context;
 *     return await createPatient(input, tenantId, userId, ipAddress, userAgent);
 *   },
 *   { operationName: 'createPatient' }
 * );
 */
export function wrapService(serviceFn, options = {}) {
  const {
    trackMetrics = true,
    logRequest = true,
    operationName = 'serviceOperation',
  } = options;

  return async (req, user, ...args) => {
    const startTime = Date.now();
    const correlationId = req.headers.get('x-correlation-id') || 'unknown';
    
    // Extract request context
    const context = {
      userId: user?.userId,
      tenantId: user?.tenantId,
      role: user?.role,
      ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                req.headers.get('x-real-ip') ||
                'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      correlationId,
      method: req.method,
      url: req.url,
    };

    // Log request
    if (logRequest) {
      logger.info(`${operationName} - Request`, {
        ...sanitizeForLogging(context),
        operation: operationName,
      });
    }

    try {
      // Execute service function with context
      const result = await serviceFn(context, ...args);
      const duration = Date.now() - startTime;

      // Track metrics
      if (trackMetrics) {
        recordRequest(req.url, req.method, 200, duration);
      }

      // Log success
      logger.debug(`${operationName} - Success`, {
        duration,
        correlationId,
      });

      // Return formatted response
      return NextResponse.json({
        success: true,
        data: result,
      });

    } catch (error) {
      const duration = Date.now() - startTime;

      // Track error
      recordError(error, {
        operation: operationName,
        ...context,
      });

      // Transform service errors to API errors
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      let message = error.message || 'An unexpected error occurred';

      if (error instanceof ValidationError) {
        statusCode = 400;
        errorCode = 'VALIDATION_ERROR';
      } else if (error instanceof NotFoundError) {
        statusCode = 404;
        errorCode = 'NOT_FOUND';
      } else if (error instanceof ConflictError) {
        statusCode = 409;
        errorCode = 'CONFLICT';
      }

      // Log error
      logger.error(`${operationName} - Failed`, error, {
        duration,
        statusCode,
        ...sanitizeForLogging(context),
      });

      // Return error response
      return NextResponse.json(
        errorResponse(message, errorCode, process.env.NODE_ENV === 'development' ? error.stack : null),
        { status: statusCode }
      );
    }
  };
}

/**
 * Create a service handler with automatic request parsing.
 * 
 * Extracts and validates request body/query params before calling service.
 * 
 * @function createServiceHandler
 * @param {Function} serviceFn - Service function
 * @param {Object} [options={}] - Handler options
 * @param {Function} [options.parseRequest] - Function to parse request (body/query)
 * @param {Function} [options.validateInput] - Validation function (Zod schema, etc.)
 * @param {string} [options.operationName] - Operation name
 * @returns {Function} Service handler function
 * 
 * @example
 * const handler = createServiceHandler(
 *   async (context, input) => {
 *     return await createPatient(input, context.tenantId, context.userId);
 *   },
 *   {
 *     parseRequest: async (req) => await req.json(),
 *     validateInput: (data) => patientSchema.parse(data),
 *     operationName: 'createPatient'
 *   }
 * );
 */
export function createServiceHandler(serviceFn, options = {}) {
  const {
    parseRequest = async (req) => {
      if (req.method === 'GET') {
        const url = new URL(req.url);
        return Object.fromEntries(url.searchParams);
      }
      return await req.json();
    },
    validateInput = null,
    operationName = 'serviceOperation',
  } = options;

  return wrapService(async (context, ...args) => {
    // Parse request
    const rawInput = await parseRequest(context.req || args[0]);
    
    // Validate input if validator provided
    let validatedInput = rawInput;
    if (validateInput) {
      try {
        validatedInput = validateInput(rawInput);
      } catch (error) {
        throw new ValidationError(
          error.message || 'Validation failed',
          error.errors || error
        );
      }
    }

    // Call service with validated input
    return await serviceFn(context, validatedInput, ...args.slice(1));
  }, { operationName });
}
