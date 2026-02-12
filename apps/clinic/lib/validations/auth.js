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
  role: z
    .enum([
      'super_admin',
      'clinic_admin',
      'doctor',
      'manager',
      'nurse',
      'receptionist',
      'accountant',
      'pharmacist',
    ])
    .optional(), // Optional - defaults to clinic_admin for public registration
  tenantId: z.string().optional(), // Optional for super_admin, required for others
  /** Try-for-free flow: 90-day trial for Solo/Clinic; backend uses this when creating subscription. */
  trialDays: z.number().int().min(1).max(365).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  tenantId: z.string().optional(), // For multi-tenant login
  rememberMe: z.boolean().optional().default(false), // Remember me flag
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const verify2FASchema = z
  .object({
    email: z.string().email('Invalid email address'),
    otp: z
      .string()
      .length(6, 'OTP must be 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits')
      .optional(),
    recoveryCode: z.string().min(8).max(20).optional(),
    tenantId: z.string().optional(),
    rememberMe: z.boolean().optional().default(false),
  })
  .refine((data) => data.otp || data.recoveryCode, {
    message: 'Either OTP or recovery code is required',
    path: ['otp'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required').optional(), // Optional for first login
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });
