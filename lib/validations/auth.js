import { z } from 'zod';

/**
 * Validation schemas for authentication
 */

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(1, 'Phone number is required').optional(),
  // Clinic information (required for clinic_admin registration)
  clinicName: z.string().min(1, 'Clinic name is required').optional(),
  address: z.string().min(1, 'Clinic address is required').optional(),
  city: z.string().min(1, 'City is required').optional(),
  state: z.string().min(1, 'State/Province is required').optional(),
  zipCode: z.string().min(1, 'ZIP/Postal code is required').optional(),
  country: z.string().optional(),
  clinicPhone: z.string().min(1, 'Clinic phone is required').optional(),
  clinicEmail: z.string().email('Invalid clinic email').optional(),
  region: z.enum(['US', 'EU', 'APAC', 'IN', 'ME', 'CA', 'AU']).optional(),
  timezone: z.string().optional(),
  currency: z.string().optional(),
  locale: z.string().optional(),
  role: z.enum([
    'super_admin',
    'clinic_admin',
    'doctor',
    'manager',
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

