import { z } from 'zod';

// Enums for appointment validation
export const AppointmentStatus = {
    SCHEDULED: 'scheduled',
    CONFIRMED: 'confirmed',
    ARRIVED: 'arrived',
    IN_QUEUE: 'in_queue',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
};

export const AppointmentType = {
    CONSULTATION: 'consultation',
    FOLLOW_UP: 'follow_up',
    CHECKUP: 'checkup',
    EMERGENCY: 'emergency',
    PROCEDURE: 'procedure',
    LAB_TEST: 'lab_test',
};

/**
 * Validation schemas for Appointment module
 */

export const createAppointmentSchema = z.object({
    patientId: z.string().min(1, 'Patient ID is required'),
    doctorId: z.string().min(1, 'Doctor ID is required'),
    appointmentDate: z.string().min(1, 'Appointment date is required').or(z.date()), // Accept date string (YYYY-MM-DD) or datetime
    startTime: z.string().datetime().or(z.date()),
    endTime: z.string().datetime().or(z.date()).optional(),
    duration: z.number().int().min(5).max(480).optional(), // 5 minutes to 8 hours
    type: z.enum([
        AppointmentType.CONSULTATION,
        AppointmentType.FOLLOW_UP,
        AppointmentType.CHECKUP,
        AppointmentType.EMERGENCY,
        AppointmentType.PROCEDURE,
        AppointmentType.LAB_TEST,
    ]).optional(),
    reason: z.string().optional(),
    notes: z.string().optional(),
    reminderScheduledAt: z.string().datetime().or(z.date()).optional(),
    isTelemedicine: z.boolean().optional(),
    telemedicineConsent: z.boolean().optional(),
    patientEmail: z.string().email().optional(),
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
    status: z.enum([
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.ARRIVED,
        AppointmentStatus.IN_QUEUE,
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    ]).optional(),
    type: z.enum([
        AppointmentType.CONSULTATION,
        AppointmentType.FOLLOW_UP,
        AppointmentType.CHECKUP,
        AppointmentType.EMERGENCY,
        AppointmentType.PROCEDURE,
        AppointmentType.LAB_TEST,
    ]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    date: z.string().optional(), // Single date filter
    isActive: z.string().transform((val) => val === 'true').optional(),
});

export const changeStatusSchema = z.object({
    status: z.enum([
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.ARRIVED,
        AppointmentStatus.IN_QUEUE,
        AppointmentStatus.IN_PROGRESS,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.NO_SHOW,
    ]),
    notes: z.string().optional(),
    cancellationReason: z.string().optional(),
});

