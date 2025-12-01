import { z } from 'zod';
import { Gender, BloodGroup } from '@/models/Patient';

/**
 * Validation schemas for Patient module
 */

const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
});

const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: z.string().min(1, 'Emergency contact phone is required'),
  email: z.string().email('Invalid email').optional(),
});

// Emergency contact schema for updates - all fields optional, and the whole object is optional
const emergencyContactUpdateSchema = z.object({
  name: z.string().optional(),
  relationship: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
}).optional();

export const createPatientSchema = z.object({
  // Demographics
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  dateOfBirth: z.union([
    z.string().datetime(), // ISO 8601 datetime string (e.g., "1986-01-01T00:00:00Z")
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').transform((val) => {
      // Convert YYYY-MM-DD to ISO datetime string
      return new Date(val + 'T00:00:00Z').toISOString();
    }), // Date string (YYYY-MM-DD) - will be converted to ISO datetime
    z.date(), // Date object
  ]),
  gender: z.nativeEnum(Gender),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  
  // Contact Information
  email: z.string().email('Invalid email').optional(),
  phone: z.string().min(1, 'Phone number is required'),
  alternatePhone: z.string().optional(),
  address: addressSchema.optional(),
  
  // Identifiers
  patientId: z.string().min(1, 'Patient ID must be at least 1 character').max(50).optional(), // Optional - will be auto-generated if not provided
  nationalId: z.string().optional(),
  insuranceId: z.string().optional(),
  
  // Medical Information (PHI)
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  emergencyContact: emergencyContactSchema.optional(),
  
  // Metadata
  notes: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial().extend({
  patientId: z.string().optional(), // Patient ID shouldn't be changed
  emergencyContact: emergencyContactUpdateSchema, // Override with optional schema for updates
});

export const patientQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  gender: z.nativeEnum(Gender).optional(),
  bloodGroup: z.nativeEnum(BloodGroup).optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type PatientQueryInput = z.infer<typeof patientQuerySchema>;

