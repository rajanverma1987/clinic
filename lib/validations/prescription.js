import { z } from 'zod';

// Enums for prescription validation
export const PrescriptionStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DISPENSED: 'dispensed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

/**
 * Validation schemas for Prescription module
 */

const prescriptionItemSchema = z.object({
  itemType: z.enum(['drug', 'lab', 'procedure', 'other']).optional(),
  drugId: z.string().min(1, 'Drug ID is required').optional(),
  drugName: z.string().optional(),
  genericName: z.string().optional(),
  form: z.string().optional(),
  strength: z.string().optional(),
  frequency: z.string().min(1, 'Frequency is required').optional(),
  duration: z.number().int().positive('Duration must be positive').optional(),
  quantity: z.number().int().positive('Quantity must be positive').optional(),
  unit: z.string().optional(),
  instructions: z.string().optional(),
  takeWithFood: z.boolean().optional(),
  takeBeforeMeal: z.boolean().optional(),
  takeAfterMeal: z.boolean().optional(),
  allowSubstitution: z.boolean().optional(),
  labTestName: z.string().optional(),
  labTestCode: z.string().optional(),
  labInstructions: z.string().optional(),
  fastingRequired: z.boolean().optional(),
  procedureName: z.string().optional(),
  procedureCode: z.string().optional(),
  procedureInstructions: z.string().optional(),
  itemName: z.string().optional(),
  itemDescription: z.string().optional(),
});

export const createPrescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  clinicalNoteId: z.string().optional(),
  items: z.array(prescriptionItemSchema).min(1, 'At least one item is required'),
  diagnosis: z.string().optional(),
  icd10Codes: z.array(z.string()).optional(),
  additionalInstructions: z.string().optional(),
  validUntil: z.string().datetime().or(z.date()),
  refillsAllowed: z.number().int().min(0).optional(),
  status: z.enum([
    PrescriptionStatus.DRAFT,
    PrescriptionStatus.ACTIVE,
    PrescriptionStatus.DISPENSED,
    PrescriptionStatus.CANCELLED,
    PrescriptionStatus.EXPIRED,
  ]).optional(),
});

export const updatePrescriptionSchema = createPrescriptionSchema.partial().extend({
  patientId: z.string().optional(), // Patient shouldn't be changed
  status: z.enum([
    PrescriptionStatus.DRAFT,
    PrescriptionStatus.ACTIVE,
    PrescriptionStatus.DISPENSED,
    PrescriptionStatus.CANCELLED,
    PrescriptionStatus.EXPIRED,
  ]).optional(),
});

export const prescriptionQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  status: z.enum([
    PrescriptionStatus.DRAFT,
    PrescriptionStatus.ACTIVE,
    PrescriptionStatus.DISPENSED,
    PrescriptionStatus.CANCELLED,
    PrescriptionStatus.EXPIRED,
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export const dispensePrescriptionSchema = z.object({
  pharmacyNotes: z.string().optional(),
});

