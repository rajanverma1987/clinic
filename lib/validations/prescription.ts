import { z } from 'zod';
import { PrescriptionStatus, DrugForm } from '@/models/Prescription';

/**
 * Validation schemas for Prescription module
 */

const prescriptionItemSchema = z.object({
  drugId: z.string().min(1, 'Drug ID is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  duration: z.number().int().positive('Duration must be positive'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unit: z.string().optional(),
  instructions: z.string().optional(),
  takeWithFood: z.boolean().optional(),
  takeBeforeMeal: z.boolean().optional(),
  takeAfterMeal: z.boolean().optional(),
  allowSubstitution: z.boolean().optional(),
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
});

export const updatePrescriptionSchema = createPrescriptionSchema.partial().extend({
  patientId: z.string().optional(), // Patient shouldn't be changed
  status: z.nativeEnum(PrescriptionStatus).optional(),
});

export const prescriptionQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  status: z.nativeEnum(PrescriptionStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export const dispensePrescriptionSchema = z.object({
  pharmacyNotes: z.string().optional(),
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionSchema>;
export type UpdatePrescriptionInput = z.infer<typeof updatePrescriptionSchema>;
export type PrescriptionQueryInput = z.infer<typeof prescriptionQuerySchema>;
export type DispensePrescriptionInput = z.infer<typeof dispensePrescriptionSchema>;

