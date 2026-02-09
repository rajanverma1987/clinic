/**
 * Unit tests for API response utilities
 * Tests the standard API response wrapper functions
 */

import { successResponse, errorResponse, errorToResponse } from '../api-response';
import * as CustomErrors from '@/lib/errors/custom-errors';

describe('API Response Utilities', () => {
  describe('successResponse', () => {
    it('should return success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const result = successResponse(data);

      expect(result).toEqual({
        success: true,
        data,
      });
    });

    it('should handle null data', () => {
      const result = successResponse(null);

      expect(result).toEqual({
        success: true,
        data: null,
      });
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const result = successResponse(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
    });
  });

  describe('errorResponse', () => {
    it('should return error response with message and code', () => {
      const result = errorResponse('Test error', 'TEST_ERROR');

      expect(result).toEqual({
        success: false,
        error: {
          message: 'Test error',
          code: 'TEST_ERROR',
          details: undefined,
        },
      });
    });

    it('should include details when provided', () => {
      const details = { field: 'email', reason: 'Invalid format' };
      const result = errorResponse('Validation failed', 'VALIDATION_ERROR', details);

      expect(result.error.details).toEqual(details);
    });
  });

  describe('errorToResponse', () => {
    it('should convert AppError to response format', () => {
      const error = new CustomErrors.ValidationError('Invalid input', { field: 'email' });
      const result = errorToResponse(error);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Invalid input');
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.details).toEqual({ field: 'email' });
    });

    it('should handle generic errors', () => {
      const error = new Error('Generic error');
      const result = errorToResponse(error);

      expect(result.success).toBe(false);
      expect(result.error.message).toBe('Generic error');
      expect(result.error.code).toBe('INTERNAL_ERROR');
    });

    it('should hide stack trace in production', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      const result = errorToResponse(error);

      expect(result.error.details).toBeNull();
      
      // Reset for other tests
      process.env.NODE_ENV = 'test';
    });
  });
});
