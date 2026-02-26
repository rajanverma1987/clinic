/**
 * Validation schemas for Procedure session and Treatment package modules
 */

import { z } from 'zod';

/** Procedure session */
export const procedureLogSchema = z.object({
  text: z.string().min(1, 'Log text is required').max(2000),
});

export const createProcedureSessionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  doctorId: z.string().optional(),
  type: z.string().min(1, 'Procedure type is required').max(200),
  typeCode: z.string().max(50).optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  startedAt: z.string().datetime().or(z.date()).optional(),
  endedAt: z.string().datetime().or(z.date()).optional(),
  notes: z.string().max(5000).optional(),
  treatmentPackageId: z.string().optional(),
});

export const updateProcedureSessionSchema = createProcedureSessionSchema.partial().extend({
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  log: procedureLogSchema.optional(),
});

export const procedureQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  appointmentId: z.string().optional(),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/** Treatment package */
const packageItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(200),
  description: z.string().max(500).optional(),
  procedureType: z.string().max(100).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const createTreatmentPackageSchema = z.object({
  name: z.string().min(1, 'Package name is required').max(200),
  description: z.string().max(2000).optional(),
  items: z.array(packageItemSchema).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().max(10).optional(),
  isActive: z.boolean().optional(),
});

export const updateTreatmentPackageSchema = createTreatmentPackageSchema.partial();

export const treatmentPackageQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});
