import { z } from 'zod';

/**
 * Validation schemas for GDPR operations
 */

export const exportPatientDataSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  format: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});

export const anonymizePatientDataSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
});

export const deletePatientDataSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  reason: z.string().min(10, 'Reason is required (minimum 10 characters)'),
  confirm: z.boolean().refine((val) => val === true, {
    message: 'Deletion must be confirmed',
  }),
});

export const rectifyPatientDataSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  corrections: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
    dateOfBirth: z.string().datetime().or(z.date()).optional(),
    gender: z.string().optional(),
    bloodGroup: z.string().optional(),
    alternatePhone: z.string().optional(),
  }),
});
