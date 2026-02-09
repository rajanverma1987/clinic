import { z } from 'zod';

// Enums for queue validation
export const QueueStatus = {
  WAITING: 'waiting',
  CALLED: 'called',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled',
};

export const QueuePriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const QueueType = {
  APPOINTMENT: 'appointment',
  WALK_IN: 'walk_in',
};

/**
 * Validation schemas for Queue module
 */

export const createQueueEntrySchema = z.object({
  type: z.enum([QueueType.APPOINTMENT, QueueType.WALK_IN]),
  appointmentId: z.string().optional(), // Required if type is 'appointment'
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  priority: z.enum([
    QueuePriority.LOW,
    QueuePriority.NORMAL,
    QueuePriority.HIGH,
    QueuePriority.URGENT,
  ]).optional(),
  reason: z.string().optional(),
  displayName: z.string().optional(),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // If type is appointment, appointmentId should be provided
    if (data.type === QueueType.APPOINTMENT && !data.appointmentId) {
      return false;
    }
    return true;
  },
  {
    message: 'Appointment ID is required when type is appointment',
    path: ['appointmentId'],
  }
);

export const updateQueueEntrySchema = z.object({
  priority: z.enum([
    QueuePriority.LOW,
    QueuePriority.NORMAL,
    QueuePriority.HIGH,
    QueuePriority.URGENT,
  ]).optional(),
  position: z.number().int().min(1).optional(),
  reason: z.string().optional(),
  displayName: z.string().optional(),
  notes: z.string().optional(),
});

export const changeQueueStatusSchema = z.object({
  status: z.enum([
    QueueStatus.WAITING,
    QueueStatus.CALLED,
    QueueStatus.IN_PROGRESS,
    QueueStatus.COMPLETED,
    QueueStatus.SKIPPED,
    QueueStatus.CANCELLED,
  ]),
  notes: z.string().optional(),
});

export const queueQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.enum([
    QueueStatus.WAITING,
    QueueStatus.CALLED,
    QueueStatus.IN_PROGRESS,
    QueueStatus.COMPLETED,
    QueueStatus.SKIPPED,
    QueueStatus.CANCELLED,
  ]).optional(),
  priority: z.enum([
    QueuePriority.LOW,
    QueuePriority.NORMAL,
    QueuePriority.HIGH,
    QueuePriority.URGENT,
  ]).optional(),
  type: z.enum([QueueType.APPOINTMENT, QueueType.WALK_IN]).optional(),
  appointmentId: z.string().optional(),
  date: z.string().optional(), // Filter by date
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export const reorderQueueSchema = z.object({
  queueEntryIds: z.array(z.string()).min(1, 'At least one queue entry ID is required'),
});

