/**
 * Validation schemas for Task module
 */

import { z } from 'zod';

export const createTaskSchema = z.object({
  assigneeId: z.string().min(1, 'Assignee is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  relatedEntityType: z.string().max(50).optional(),
  relatedEntityId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
});

export const taskQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  assigneeId: z.string().optional(),
  createdById: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
});
