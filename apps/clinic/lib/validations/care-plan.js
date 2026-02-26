/**
 * Validation schemas for CarePlan module
 */

import { z } from 'zod';

export const createCarePlanSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(200),
  condition: z.string().max(200).optional(),
  startDate: z.string().datetime().or(z.date()),
  endDate: z.string().datetime().or(z.date()).optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional(),
  goals: z.string().max(2000).optional(),
  followUpIntervalDays: z.number().int().min(0).optional(),
  conditions: z.array(z.string().max(100)).optional(),
  notes: z.string().max(5000).optional(),
});

export const updateCarePlanSchema = createCarePlanSchema.partial();

export const carePlanQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  status: z.enum(['active', 'completed', 'on_hold', 'cancelled']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
