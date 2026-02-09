import { z } from 'zod';

/**
 * Validation schemas for Referral module
 */

const referredToContactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  address: z.string().optional(),
});

export const createReferralSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  referringDoctorId: z.string().optional(),
  referredToDoctorId: z.string().optional(),
  referredToSpecialty: z.string().min(1, 'Specialty is required').max(200),
  referredToName: z.string().optional(),
  referredToClinic: z.string().optional(),
  referredToContact: referredToContactSchema.optional(),
  type: z.enum(['internal', 'external']).optional(),
  priority: z.enum(['routine', 'urgent', 'emergency']).optional(),
  reason: z.string().min(1, 'Reason is required'),
  clinicalHistory: z.string().optional(),
  referredAt: z.string().datetime().or(z.date()).optional(),
  appointmentId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateReferralSchema = createReferralSchema.partial().extend({
  patientId: z.string().optional(), // Patient shouldn't be changed
  status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled']).optional(),
});

export const addFollowUpNoteSchema = z.object({
  note: z.string().min(1, 'Note is required'),
});

export const referralQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  referringDoctorId: z.string().optional(),
  referredToDoctorId: z.string().optional(),
  referredToSpecialty: z.string().optional(),
  status: z.enum(['pending', 'accepted', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['routine', 'urgent', 'emergency']).optional(),
  type: z.enum(['internal', 'external']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
