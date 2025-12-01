import { z } from 'zod';

/**
 * Validation schemas for authentication
 */

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum([
    'super_admin',
    'clinic_admin',
    'doctor',
    'nurse',
    'receptionist',
    'accountant',
    'pharmacist',
  ]).optional(), // Optional - defaults to clinic_admin for public registration
  tenantId: z.string().optional(), // Optional for super_admin, required for others
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  tenantId: z.string().optional(), // For multi-tenant login
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

