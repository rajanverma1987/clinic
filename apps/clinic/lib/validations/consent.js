/**
 * Validation schemas for ConsentForm and ConsentRecord modules
 */

import { z } from 'zod';

export const createConsentFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  content: z.string().min(1, 'Content is required').max(50000),
  type: z.string().max(100).optional(),
  isActive: z.boolean().optional(),
});

export const updateConsentFormSchema = createConsentFormSchema.partial();

export const consentFormQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export const createConsentRecordSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  formId: z.string().min(1, 'Form ID is required'),
  appointmentId: z.string().optional(),
  formVersion: z.number().int().min(1).optional(),
});

export const consentRecordQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  formId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});
