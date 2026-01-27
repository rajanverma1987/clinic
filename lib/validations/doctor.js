import { z } from 'zod';

/**
 * Validation schemas for Doctor module
 */

const professionalSchema = z.object({
  licenseNumber: z.string().optional(),
  specialization: z.array(z.string()).optional(),
  qualification: z.string().optional(),
  experienceYears: z.number().int().min(0).optional(),
  languages: z.array(z.string()).optional(),
});

const scheduleSlotSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format'),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm format'),
  slotDuration: z.number().int().min(5).max(480).optional(),
});

const leaveSchema = z.object({
  from: z.string().datetime().or(z.date()),
  to: z.string().datetime().or(z.date()),
  reason: z.string().optional(),
});

const scheduleSchema = z.object({
  workingDays: z.array(z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])).optional(),
  slots: z.array(scheduleSlotSchema).optional(),
  leaves: z.array(leaveSchema).optional(),
});

export const createDoctorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  professional: professionalSchema.optional(),
  schedule: scheduleSchema.optional(),
  consultationFee: z.number().min(0).optional(),
  departments: z.array(z.string()).optional(),
  bio: z.string().optional(),
  signature: z.string().optional(),
  status: z.enum(['active', 'on_leave', 'inactive']).optional(),
});

export const updateDoctorSchema = createDoctorSchema.partial().extend({
  userId: z.string().optional(), // User ID shouldn't be changed
});

export const doctorQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['active', 'on_leave', 'inactive']).optional(),
  departmentId: z.string().optional(),
  specialization: z.string().optional(),
});

export const addLeaveSchema = z.object({
  from: z.string().datetime().or(z.date()),
  to: z.string().datetime().or(z.date()),
  reason: z.string().optional(),
});

export const updateScheduleSchema = scheduleSchema;
