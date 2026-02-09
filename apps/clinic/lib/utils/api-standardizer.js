/**
 * Enterprise API Standardizer
 * 
 * Provides utilities to standardize API responses, error handling,
 * and request processing across all endpoints.
 * 
 * @module lib/utils/api-standardizer
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';
import { successResponse, errorResponse, validationErrorResponse } from './api-response.js';
import { logger } from './logger.js';
import { sanitizeForLogging } from './enterprise-helpers.js';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors/custom-errors.js';

/**
 * Standardize API response format.
 * 
 * Ensures all API responses follow consistent format:
 * { success: boolean, data?: any, error?: { message, code, details } }
 * 
 * @function standardizeResponse
 * @param {*} data - Response data
 * @param {Object} [options={}] - Response options
 * @param {number} [options.statusCode=200] - HTTP status code
 * @param {Object} [options.headers={}] - Additional headers
 * @returns {NextResponse} Standardized Next.js response
 * 
 * @example
 * return standardizeResponse({ users: [...] }, { statusCode: 200 });
 */
export function standardizeResponse(data, options = {}) {
  const { statusCode = 200, headers = {} } = options;
  
  return NextResponse.json(
    successResponse(data),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

/**
 * Standardize error response format.
 * 
 * Transforms errors into consistent API error format.
 * 
 * @function standardizeError
 * @param {Error} error - Error object
 * @param {Object} [options={}] - Error options
 * @param {number} [options.statusCode] - HTTP status code (auto-detected if not provided)
 * @param {string} [options.defaultMessage='An error occurred'] - Default error message
 * @returns {NextResponse} Standardized error response
 * 
 * @example
 * try {
 *   await operation();
 * } catch (error) {
 *   return standardizeError(error);
 * }
 */
export function standardizeError(error, options = {}) {
  const { statusCode, defaultMessage = 'An error occurred' } = options;
  
  let code = 500;
  let message = error.message || defaultMessage;
  let errorCode = 'INTERNAL_ERROR';
  let details = null;

  // Determine status code and error code
  if (error instanceof ValidationError) {
    code = statusCode || 400;
    errorCode = 'VALIDATION_ERROR';
    details = error.details;
  } else if (error instanceof NotFoundError) {
    code = statusCode || 404;
    errorCode = 'NOT_FOUND';
  } else if (error instanceof ConflictError) {
    code = statusCode || 409;
    errorCode = 'CONFLICT';
  } else if (error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) {
    code = statusCode || 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    code = statusCode || 401;
    errorCode = 'AUTHENTICATION_ERROR';
    message = 'Invalid or expired token';
  } else {
    code = statusCode || 500;
  }

  // Log error
  logger.error('API Error', error, {
    statusCode: code,
    errorCode,
  });

  return NextResponse.json(
    errorResponse(
      message,
      errorCode,
      process.env.NODE_ENV === 'development' ? error.stack : details
    ),
    { status: code }
  );
}

/**
 * Parse and validate request body.
 * 
 * Safely parses JSON request body with error handling.
 * 
 * @async
 * @function parseRequestBody
 * @param {Request} req - HTTP request object
 * @param {Function} [validator] - Optional validation function (Zod schema, etc.)
 * @returns {Promise<Object>} Parsed and validated request body
 * @throws {ValidationError} If validation fails
 * 
 * @example
 * const body = await parseRequestBody(req, (data) => schema.parse(data));
 */
export async function parseRequestBody(req, validator = null) {
  try {
    const body = await req.json();
    
    if (validator) {
      try {
        return validator(body);
      } catch (error) {
        throw new ValidationError(
          error.message || 'Validation failed',
          error.errors || error
        );
      }
    }
    
    return body;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError('Invalid request body', error);
  }
}

/**
 * Parse query parameters from URL.
 * 
 * Extracts and normalizes query parameters from request URL.
 * 
 * @function parseQueryParams
 * @param {Request} req - HTTP request object
 * @param {Function} [validator] - Optional validation function
 * @returns {Object} Parsed query parameters
 * @throws {ValidationError} If validation fails
 * 
 * @example
 * const params = await parseQueryParams(req, (data) => querySchema.parse(data));
 */
export function parseQueryParams(req, validator = null) {
  const url = new URL(req.url);
  const params = {};
  
  for (const [key, value] of url.searchParams.entries()) {
    // Handle boolean strings
    if (value === 'true') {
      params[key] = true;
    } else if (value === 'false') {
      params[key] = false;
    } else {
      params[key] = value;
    }
  }
  
  if (validator) {
    try {
      return validator(params);
    } catch (error) {
      throw new ValidationError(
        error.message || 'Query validation failed',
        error.errors || error
      );
    }
  }
  
  return params;
}

/**
 * Extract request context (IP, user agent, etc.).
 * 
 * @function extractRequestContext
 * @param {Request} req - HTTP request object
 * @returns {Object} Request context
 * 
 * @example
 * const context = extractRequestContext(req);
 * // { ipAddress: '...', userAgent: '...', correlationId: '...' }
 */
export function extractRequestContext(req) {
  return {
    ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') ||
               req.headers.get('cf-connecting-ip') ||
               'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    correlationId: req.headers.get('x-correlation-id') || null,
    method: req.method,
    url: req.url,
  };
}

/**
 * Create standardized pagination response.
 * 
 * @function createPaginationResponse
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {number} pagination.page - Current page
 * @param {number} pagination.limit - Items per page
 * @param {number} pagination.total - Total items
 * @param {number} pagination.pages - Total pages
 * @returns {NextResponse} Paginated response
 * 
 * @example
 * return createPaginationResponse(users, { page: 1, limit: 20, total: 100, pages: 5 });
 */
export function createPaginationResponse(items, pagination) {
  const response = standardizeResponse({
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: pagination.total,
      pages: pagination.pages,
      hasNext: pagination.page < pagination.pages,
      hasPrev: pagination.page > 1,
    },
  });

  // Add pagination headers
  response.headers.set('X-Pagination-Page', String(pagination.page));
  response.headers.set('X-Pagination-Limit', String(pagination.limit));
  response.headers.set('X-Pagination-Total', String(pagination.total));
  response.headers.set('X-Pagination-Pages', String(pagination.pages));

  return response;
}
