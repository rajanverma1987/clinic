import { z } from 'zod';
import { AppointmentStatus, AppointmentType } from '@/models/Appointment';

/**
 * Validation schemas for Appointment module
 */

export const createAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  appointmentDate: z.string().datetime().or(z.date()),
  startTime: z.string().datetime().or(z.date()),
  endTime: z.string().datetime().or(z.date()).optional(),
  duration: z.number().int().min(5).max(480).optional(), // 5 minutes to 8 hours
  type: z.nativeEnum(AppointmentType).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  reminderScheduledAt: z.string().datetime().or(z.date()).optional(),
});

export const updateAppointmentSchema = createAppointmentSchema.partial().extend({
  patientId: z.string().optional(), // Patient shouldn't be changed
  appointmentDate: z.string().datetime().or(z.date()).optional(),
  startTime: z.string().datetime().or(z.date()).optional(),
});

export const appointmentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  type: z.nativeEnum(AppointmentType).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  date: z.string().optional(), // Single date filter
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export const changeStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
  notes: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AppointmentQueryInput = z.infer<typeof appointmentQuerySchema>;
export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

