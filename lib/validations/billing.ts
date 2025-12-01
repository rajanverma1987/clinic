import { z } from 'zod';
import { InvoiceStatus, InvoiceItemType, PaymentMethod } from '@/models/Invoice';
import { PaymentStatus } from '@/models/Payment';

/**
 * Validation schemas for Billing module
 */

const invoiceItemSchema = z.object({
  type: z.nativeEnum(InvoiceItemType),
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
  discount: z.number().min(0).max(100).optional(),
  discountAmount: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  appointmentId: z.string().optional(),
  prescriptionId: z.string().optional(),
  procedureId: z.string().optional(),
});

export const createInvoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  appointmentId: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().min(0).optional(),
  discountReason: z.string().optional(),
  insuranceId: z.string().optional(),
  insuranceCoverage: z.number().min(0).optional(),
  dueDate: z.string().datetime().or(z.date()).optional(),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  patientId: z.string().optional(), // Patient shouldn't be changed
  status: z.nativeEnum(InvoiceStatus).optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  status: z.nativeEnum(InvoiceStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  transactionId: z.string().optional(),
  receiptNumber: z.string().optional(),
  gateway: z.string().optional(),
  notes: z.string().optional(),
});

export const paymentQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  invoiceId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PaymentQueryInput = z.infer<typeof paymentQuerySchema>;

