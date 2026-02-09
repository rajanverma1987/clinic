import { z } from 'zod';

/**
 * Validation schemas for Patient Portal Authentication
 */

export const registerPatientSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  tenantId: z.string().optional(), // Will be extracted from context
});

export const loginPatientSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  tenantId: z.string().optional(), // Will be extracted from context
});

export const updatePatientProfileSchema = z.object({
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});
