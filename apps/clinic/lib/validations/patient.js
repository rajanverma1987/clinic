/**
 * Patient validation schemas
 * Based on NEW-PLANS.md requirements
 */

import { z } from 'zod';

/**
 * Patient registration schema
 */
export const patientRegistrationSchema = z.object({
  // Demographics
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  dateOfBirth: z
    .string()
    .or(z.date())
    .refine((val) => {
      const date = val instanceof Date ? val : new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    }, 'Date of birth must be a valid past date'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say'], {
    errorMap: () => ({ message: 'Gender must be one of: male, female, other, prefer_not_to_say' }),
  }),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']).optional(),

  // Contact Information
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number is too long'),
  alternatePhone: z
    .string()
    .max(20, 'Alternate phone number is too long')
    .optional()
    .or(z.literal('')),
  address: z
    .object({
      street: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      zipCode: z.string().max(20).optional(),
      country: z.string().max(100).optional(),
    })
    .optional(),

  // Identifiers
  nationalId: z.string().max(50).optional().or(z.literal('')),
  insuranceId: z.string().max(50).optional().or(z.literal('')),

  // Insurance
  insurance: z
    .object({
      provider: z.string().max(100).optional(),
      policyNumber: z.string().max(50).optional(),
      groupNumber: z.string().max(50).optional(),
      validFrom: z.string().or(z.date()).optional(),
      validUntil: z.string().or(z.date()).optional(),
    })
    .optional(),

  // Emergency Contact
  emergencyContact: z
    .object({
      name: z.string().min(1, 'Emergency contact name is required').max(100),
      relationship: z.string().max(50).optional(),
      phone: z.string().min(1, 'Emergency contact phone is required').max(20),
      email: z.string().email('Invalid email address').optional().or(z.literal('')),
    })
    .optional(),

  // Medical Information
  medicalHistory: z.string().max(5000).optional().or(z.literal('')),
  allergies: z.string().max(2000).optional().or(z.literal('')),
  currentMedications: z.string().max(2000).optional().or(z.literal('')),

  // Portal Access
  portalAccess: z
    .object({
      enabled: z.boolean().optional(),
      email: z.string().email('Invalid email address').optional().or(z.literal('')),
    })
    .optional(),

  // Status
  status: z.enum(['active', 'inactive', 'deceased']).optional(),

  // Notes
  notes: z.string().max(5000).optional().or(z.literal('')),
});

/**
 * Patient update schema (all fields optional)
 */
export const patientUpdateSchema = patientRegistrationSchema.partial();

/**
 * Patient search/filter schema
 */
export const patientSearchSchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(['active', 'inactive', 'deceased', 'new']).optional(), // 'new' = registered in last 30 days
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']).optional(),
  hasInsurance: z.boolean().optional(),
  portalEnabled: z.boolean().optional(),
  dateOfBirthFrom: z.string().or(z.date()).optional(),
  dateOfBirthTo: z.string().or(z.date()).optional(),
  page: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      return isNaN(num) || num < 1 ? 1 : num;
    }),
  limit: z
    .string()
    .or(z.number())
    .optional()
    .transform((val) => {
      const num = typeof val === 'string' ? parseInt(val, 10) : val;
      return isNaN(num) || num < 1 || num > 100 ? 20 : num;
    }),
  sortBy: z
    .enum(['firstName', 'lastName', 'dateOfBirth', 'createdAt', 'patientId', 'lastVisit'])
    .optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  doctorId: z.string().optional(), // When present, scope to patients with appointments for this doctor (User id)
});
