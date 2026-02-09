import { z } from 'zod';

/**
 * Validation schemas for Note Template module
 */

const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  label: z.string().min(1, 'Field label is required'),
  type: z.enum(['text', 'textarea', 'number', 'select', 'checkbox', 'date']),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(),
  placeholder: z.string().optional(),
  defaultValue: z.string().optional(),
});

const soapSectionSchema = z.object({
  fields: z.array(fieldSchema).optional(),
  defaultText: z.string().optional(),
});

const soapTemplateSchema = z.object({
  subjective: soapSectionSchema.optional(),
  objective: soapSectionSchema.optional(),
  assessment: soapSectionSchema.optional(),
  plan: soapSectionSchema.optional(),
});

export const createNoteTemplateSchema = z.object({
  doctorId: z.string().optional(),
  specialty: z.string().max(100).optional(),
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().max(500).optional(),
  type: z.string().default('soap'),
  fields: z.array(fieldSchema).optional(),
  soapTemplate: soapTemplateSchema.optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const updateNoteTemplateSchema = createNoteTemplateSchema.partial();

export const noteTemplateQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  doctorId: z.string().optional(),
  specialty: z.string().optional(),
  type: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  isDefault: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  search: z.string().optional(),
});
