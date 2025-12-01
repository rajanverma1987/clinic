import { z } from 'zod';
import { QueueStatus, QueuePriority, QueueType } from '@/models/Queue';

/**
 * Validation schemas for Queue module
 */

export const createQueueEntrySchema = z.object({
  type: z.nativeEnum(QueueType),
  appointmentId: z.string().optional(), // Required if type is 'appointment'
  patientId: z.string().min(1, 'Patient ID is required'),
  doctorId: z.string().min(1, 'Doctor ID is required'),
  priority: z.nativeEnum(QueuePriority).optional(),
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
  priority: z.nativeEnum(QueuePriority).optional(),
  position: z.number().int().min(1).optional(),
  reason: z.string().optional(),
  displayName: z.string().optional(),
  notes: z.string().optional(),
});

export const changeQueueStatusSchema = z.object({
  status: z.nativeEnum(QueueStatus),
  notes: z.string().optional(),
});

export const queueQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.nativeEnum(QueueStatus).optional(),
  priority: z.nativeEnum(QueuePriority).optional(),
  type: z.nativeEnum(QueueType).optional(),
  appointmentId: z.string().optional(),
  date: z.string().optional(), // Filter by date
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export const reorderQueueSchema = z.object({
  queueEntryIds: z.array(z.string()).min(1, 'At least one queue entry ID is required'),
});

export type CreateQueueEntryInput = z.infer<typeof createQueueEntrySchema>;
export type UpdateQueueEntryInput = z.infer<typeof updateQueueEntrySchema>;
export type ChangeQueueStatusInput = z.infer<typeof changeQueueStatusSchema>;
export type QueueQueryInput = z.infer<typeof queueQuerySchema>;
export type ReorderQueueInput = z.infer<typeof reorderQueueSchema>;

