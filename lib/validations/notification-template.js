import { z } from 'zod';

/**
 * Validation schemas for Notification Template module
 */

const channelSchema = z.object({
  enabled: z.boolean().optional().default(true),
});

const emailChannelSchema = channelSchema.extend({
  subject: z.string().optional(),
  html: z.string().optional(),
  text: z.string().optional(),
});

const smsChannelSchema = channelSchema.extend({
  message: z.string().max(1600, 'SMS message must be 1600 characters or less').optional(),
});

const whatsappChannelSchema = channelSchema.extend({
  message: z.string().optional(),
});

export const createNotificationTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: z.enum(['appointment', 'prescription', 'payment', 'lab_result', 'system']),
  channels: z.object({
    email: emailChannelSchema.optional(),
    sms: smsChannelSchema.optional(),
    whatsapp: whatsappChannelSchema.optional(),
  }).optional(),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateNotificationTemplateSchema = createNotificationTemplateSchema.partial();

export const notificationTemplateQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  type: z.enum(['appointment', 'prescription', 'payment', 'lab_result', 'system']).optional(),
  isDefault: z.string().transform((val) => val === 'true').optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
  search: z.string().optional(),
});

export const applyTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  variables: z.record(z.string()).optional(),
});
