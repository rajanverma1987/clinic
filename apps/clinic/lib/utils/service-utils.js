/**
 * Enterprise Service Utilities
 * 
 * Common utilities and helpers for service layer functions.
 * Provides consistent patterns for validation, transformation, and error handling.
 * 
 * @module lib/utils/service-utils
 * @since 1.0.0
 */

import { logger } from './logger.js';
import { ValidationError, NotFoundError, ConflictError } from '@/lib/errors/custom-errors.js';
import { withTenant } from '@/lib/db/tenant-helper.js';

/**
 * Validate required fields in input object.
 * 
 * @function validateRequired
 * @param {Object} input - Input object to validate
 * @param {string[]} requiredFields - Array of required field names
 * @param {string} [entityName='Entity'] - Entity name for error messages
 * @throws {ValidationError} If any required field is missing
 * 
 * @example
 * validateRequired(input, ['firstName', 'lastName', 'email'], 'Patient');
 */
export function validateRequired(input, requiredFields, entityName = 'Entity') {
  const missing = requiredFields.filter(field => {
    const value = input[field];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new ValidationError(
      `${entityName} validation failed: Missing required fields: ${missing.join(', ')}`
    );
  }
}

/**
 * Validate entity ownership (belongs to tenant).
 * 
 * @async
 * @function validateOwnership
 * @param {Object} Model - Mongoose model
 * @param {string} entityId - Entity ID
 * @param {string} tenantId - Tenant ID
 * @param {string} [entityName='Entity'] - Entity name for error messages
 * @returns {Promise<Object>} Found entity
 * @throws {NotFoundError} If entity not found or doesn't belong to tenant
 * 
 * @example
 * const patient = await validateOwnership(Patient, patientId, tenantId, 'Patient');
 */
export async function validateOwnership(Model, entityId, tenantId, entityName = 'Entity') {
  const entity = await Model.findOne(
    withTenant(tenantId, {
      _id: entityId,
      deletedAt: null,
    })
  ).lean();

  if (!entity) {
    throw new NotFoundError(`${entityName} not found or access denied`);
  }

  return entity;
}

/**
 * Check for duplicate entity.
 * 
 * @async
 * @function checkDuplicate
 * @param {Object} Model - Mongoose model
 * @param {Object} query - Query to check for duplicates
 * @param {string} [entityName='Entity'] - Entity name for error messages
 * @param {string} [fieldName='field'] - Field name for error message
 * @throws {ConflictError} If duplicate found
 * 
 * @example
 * await checkDuplicate(Patient, { tenantId, patientId: 'PAT-001' }, 'Patient', 'patientId');
 */
export async function checkDuplicate(Model, query, entityName = 'Entity', fieldName = 'field') {
  const existing = await Model.findOne(query).lean();
  
  if (existing) {
    throw new ConflictError(`${entityName} with this ${fieldName} already exists`);
  }
}

/**
 * Normalize date input (string or Date to Date).
 * 
 * @function normalizeDate
 * @param {string|Date} dateInput - Date input (string or Date object)
 * @param {string} [fieldName='date'] - Field name for error messages
 * @returns {Date} Normalized Date object
 * @throws {ValidationError} If date is invalid
 * 
 * @example
 * const dateOfBirth = normalizeDate(input.dateOfBirth, 'dateOfBirth');
 */
export function normalizeDate(dateInput, fieldName = 'date') {
  if (!dateInput) {
    return null;
  }

  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) {
      throw new ValidationError(`Invalid ${fieldName}: Invalid date`);
    }
    return dateInput;
  }

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    throw new ValidationError(`Invalid ${fieldName}: Cannot parse date`);
  }

  return date;
}

/**
 * Sanitize string input (trim, remove extra spaces).
 * 
 * @function sanitizeString
 * @param {string} input - String to sanitize
 * @param {boolean} [allowEmpty=false] - Whether to allow empty strings
 * @returns {string|null} Sanitized string or null
 * 
 * @example
 * const firstName = sanitizeString(input.firstName);
 */
export function sanitizeString(input, allowEmpty = false) {
  if (input === null || input === undefined) {
    return null;
  }

  const sanitized = String(input).trim().replace(/\s+/g, ' ');
  
  if (!allowEmpty && sanitized === '') {
    return null;
  }

  return sanitized;
}

/**
 * Extract pagination parameters from query.
 * 
 * @function extractPagination
 * @param {Object} query - Query parameters object
 * @returns {Object} Pagination parameters
 * @returns {number} returns.page - Page number (default: 1)
 * @returns {number} returns.limit - Items per page (default: 20, max: 100)
 * @returns {number} returns.skip - Skip value for query
 * 
 * @example
 * const { page, limit, skip } = extractPagination(queryParams);
 */
export function extractPagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build sort object from query parameters.
 * 
 * @function buildSort
 * @param {string} [sortBy='createdAt'] - Field to sort by
 * @param {string} [sortOrder='desc'] - Sort order (asc/desc)
 * @returns {Object} MongoDB sort object
 * 
 * @example
 * const sort = buildSort('firstName', 'asc'); // { firstName: 1 }
 */
export function buildSort(sortBy = 'createdAt', sortOrder = 'desc') {
  const order = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  return { [sortBy]: order };
}

/**
 * Transform error to user-friendly message.
 * 
 * @function transformError
 * @param {Error} error - Error object
 * @param {string} [defaultMessage='An error occurred'] - Default message
 * @returns {string} User-friendly error message
 * 
 * @example
 * try {
 *   await operation();
 * } catch (error) {
 *   throw new Error(transformError(error, 'Operation failed'));
 * }
 */
export function transformError(error, defaultMessage = 'An error occurred') {
  if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
    return error.message;
  }

  // MongoDB errors
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map(e => e.message);
    return messages.join(', ');
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return `${field} already exists`;
  }

  // Return original message or default
  return error.message || defaultMessage;
}

/**
 * Create standardized service response.
 * 
 * @function createServiceResponse
 * @param {*} data - Response data
 * @param {Object} [meta={}] - Additional metadata
 * @returns {Object} Standardized response object
 * 
 * @example
 * return createServiceResponse(patient, {
 *   pagination: { page: 1, total: 100 }
 * });
 */
export function createServiceResponse(data, meta = {}) {
  return {
    data,
    ...meta,
    timestamp: new Date().toISOString(),
  };
}
