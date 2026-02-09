import { z } from 'zod';

/**
 * Validation schemas for Notification module
 */

export const createNotificationSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  type: z.enum(['appointment', 'prescription', 'payment', 'lab_result', 'system']),
  title: z.string().min(1, 'Title is required').max(200),
  message: z.string().min(1, 'Message is required').max(1000),
  emailHtml: z.string().optional(), // HTML version of email
  data: z.record(z.any()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  channels: z.object({
    email: z.boolean().optional().default(false),
    sms: z.boolean().optional().default(false),
    whatsapp: z.boolean().optional().default(false),
  }).optional(),
  userEmail: z.string().email().optional(),
  userPhone: z.string().optional(),
  expiresAt: z.string().datetime().or(z.date()).optional(),
});

export const notificationQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  userId: z.string().optional(),
  type: z.enum(['appointment', 'prescription', 'payment', 'lab_result', 'system']).optional(),
  read: z.string().transform((val) => val === 'true').optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});
