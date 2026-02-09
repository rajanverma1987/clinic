import { z } from 'zod';

/**
 * Validation schemas for Vital Signs module
 */

export const recordVitalSignsSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  consultationId: z.string().optional(),
  bloodPressure: z.string().optional(), // Format: "120/80" or "120/80 mmHg"
  heartRate: z.number().int().min(0).max(300).optional(),
  temperature: z.number().min(30).max(45).optional(), // Celsius
  respiratoryRate: z.number().int().min(0).max(100).optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(), // Percentage
  weight: z.number().min(0).max(500).optional(), // kg
  height: z.number().min(0).max(300).optional(), // cm
  recordedAt: z.string().datetime().or(z.date()).optional(),
});

export const vitalSignsHistoryQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
});
