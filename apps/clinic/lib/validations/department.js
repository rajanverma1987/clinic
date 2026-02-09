import { z } from 'zod';

/**
 * Validation schemas for Department module
 */

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
  code: z.string().min(1, 'Department code is required').max(10).regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers'),
  description: z.string().max(500).optional(),
  headDoctor: z.string().optional(),
  location: z.string().max(200).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  code: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 'Code must contain only uppercase letters and numbers').optional(),
});

export const departmentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  headDoctor: z.string().optional(),
});
