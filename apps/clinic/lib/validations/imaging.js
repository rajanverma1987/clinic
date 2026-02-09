import { z } from 'zod';

/**
 * Validation schemas for Imaging module
 */

const imageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  thumbnailUrl: z.string().url('Invalid thumbnail URL').optional(),
  description: z.string().optional(),
});

const reportSchema = z.object({
  findings: z.string().optional(),
  impression: z.string().optional(),
  recommendations: z.string().optional(),
});

export const createImagingStudySchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().optional(),
  appointmentId: z.string().optional(),
  studyType: z.enum(['x_ray', 'ct_scan', 'mri', 'ultrasound', 'mammography', 'dexa_scan', 'echocardiogram', 'other']),
  bodyPart: z.string().min(1, 'Body part is required').max(200),
  clinicalIndication: z.string().optional(),
  orderedAt: z.string().datetime().or(z.date()).optional(),
  images: z.array(imageSchema).optional(),
  notes: z.string().optional(),
});

export const updateImagingStudySchema = createImagingStudySchema.partial().extend({
  patientId: z.string().optional(), // Patient shouldn't be changed
  status: z.enum(['ordered', 'in_progress', 'completed', 'reported', 'delivered']).optional(),
});

export const addImagingReportSchema = z.object({
  findings: z.string().optional(),
  impression: z.string().optional(),
  recommendations: z.string().optional(),
});

export const imagingStudyQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  studyType: z.enum(['x_ray', 'ct_scan', 'mri', 'ultrasound', 'mammography', 'dexa_scan', 'echocardiogram', 'other']).optional(),
  status: z.enum(['ordered', 'in_progress', 'completed', 'reported', 'delivered']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
