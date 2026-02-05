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

const dayKeySchema = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);
const daySlotSchema = z.object({ startTime: z.string(), endTime: z.string() });
const emergencySlotSchema = z.object({ date: z.string(), startTime: z.string(), endTime: z.string() });
const blockedSlotSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  reason: z.string().optional(),
});

export const updateSchedulePayloadSchema = z.object({
  schedule: z.record(dayKeySchema, daySlotSchema).optional(),
  breaks: z.record(dayKeySchema, daySlotSchema).optional(),
  slotDuration: z.number().int().min(5).max(120).optional(),
  bufferTime: z.number().int().min(0).max(60).optional(),
  advanceBookingMinDays: z.number().int().min(0).optional(),
  advanceBookingMaxDays: z.number().int().min(0).optional(),
  isOnline: z.boolean().optional(),
  emergencySlots: z.array(emergencySlotSchema).optional(),
  blockedSlots: z.array(blockedSlotSchema).optional(),
  clinicId: z.string().optional(),
});

const clinicEntrySchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  lat: z.string().optional(),
  lng: z.string().optional(),
  photos: z.array(z.any()).optional(),
  facilities: z.array(z.string()).optional(),
  parkingInfo: z.string().optional(),
  publicTransportAccess: z.string().optional(),
});

const procedureFeeSchema = z.object({
  name: z.string().optional(),
  fee: z.number().min(0).optional(),
});

export const createDoctorSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  professional: professionalSchema.optional(),
  schedule: scheduleSchema.optional(),
  consultationFee: z.number().min(0).optional(),
  videoConsultationFee: z.number().min(0).optional(),
  followUpFee: z.number().min(0).optional(),
  procedureFees: z.array(procedureFeeSchema).optional(),
  insuranceAccepted: z.array(z.string()).optional(),
  clinics: z.array(clinicEntrySchema).optional(),
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

export const updateScheduleSchema = updateSchedulePayloadSchema;
