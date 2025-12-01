import { z } from 'zod';
import { NoteType } from '@/models/ClinicalNote';

/**
 * Validation schemas for Clinical Note module
 */

const vitalSignsSchema = z.object({
  bloodPressure: z.string().optional(),
  heartRate: z.number().int().positive().optional(),
  temperature: z.number().positive().optional(),
  respiratoryRate: z.number().int().positive().optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  bmi: z.number().positive().optional(),
  recordedAt: z.string().datetime().or(z.date()).optional(),
});

const soapStructureSchema = z.object({
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
});

export const createClinicalNoteSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  type: z.nativeEnum(NoteType).optional(),
  title: z.string().optional(),
  
  // SOAP Structure (if type is SOAP)
  soap: soapStructureSchema.optional(),
  
  // General Content (if type is not SOAP)
  content: z.string().optional(),
  
  // Diagnosis
  diagnosis: z.string().optional(),
  icd10Codes: z.array(z.string()).optional(),
  snomedCodes: z.array(z.string()).optional(),
  
  // Vital Signs
  vitalSigns: vitalSignsSchema.optional(),
  
  // Template
  templateId: z.string().optional(),
});

export const updateClinicalNoteSchema = createClinicalNoteSchema.partial().extend({
  patientId: z.string().optional(), // Patient shouldn't be changed
});

export const clinicalNoteQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  appointmentId: z.string().optional(),
  type: z.nativeEnum(NoteType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export type CreateClinicalNoteInput = z.infer<typeof createClinicalNoteSchema>;
export type UpdateClinicalNoteInput = z.infer<typeof updateClinicalNoteSchema>;
export type ClinicalNoteQueryInput = z.infer<typeof clinicalNoteQuerySchema>;

