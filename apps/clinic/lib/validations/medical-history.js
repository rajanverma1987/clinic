import { z } from 'zod';

/**
 * Validation schemas for Medical History module
 */

export const addMedicalHistoryConditionSchema = z.object({
  condition: z.string().min(1, 'Condition is required').max(500),
  diagnosed_date: z.string().datetime().or(z.date()),
  status: z.enum(['active', 'resolved']).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateMedicalHistoryConditionSchema = addMedicalHistoryConditionSchema.partial();
