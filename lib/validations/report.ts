import { z } from 'zod';

/**
 * Validation schemas for Reporting module
 */

export const reportQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  doctorId: z.string().optional(),
  patientId: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month', 'year']).optional(),
  format: z.enum(['json', 'csv', 'pdf']).optional().default('json'),
});

export const revenueReportSchema = reportQuerySchema.extend({
  includeBreakdown: z.boolean().optional().default(false),
  paymentMethod: z.string().optional(),
  status: z.string().optional(),
});

export const patientReportSchema = reportQuerySchema.extend({
  groupByField: z.enum(['gender', 'age_group', 'blood_group', 'month']).optional(),
  includeNewPatients: z.boolean().optional().default(false),
});

export const appointmentReportSchema = reportQuerySchema.extend({
  status: z.string().optional(),
  type: z.string().optional(),
  includeNoShows: z.boolean().optional().default(false),
});

export const inventoryReportSchema = reportQuerySchema.extend({
  itemType: z.string().optional(),
  includeLowStock: z.boolean().optional().default(false),
  includeExpired: z.boolean().optional().default(false),
  includePredictions: z.boolean().optional().default(false),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
export type RevenueReportInput = z.infer<typeof revenueReportSchema>;
export type PatientReportInput = z.infer<typeof patientReportSchema>;
export type AppointmentReportInput = z.infer<typeof appointmentReportSchema>;
export type InventoryReportInput = z.infer<typeof inventoryReportSchema>;

