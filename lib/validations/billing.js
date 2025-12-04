import { z } from 'zod';

// Enums for billing validation
export const InvoiceStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const InvoiceItemType = {
  CONSULTATION: 'consultation',
  PROCEDURE: 'procedure',
  MEDICATION: 'medication',
  LAB_TEST: 'lab_test',
  OTHER: 'other',
};

export const PaymentMethod = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  INSURANCE: 'insurance',
  OTHER: 'other',
};

export const PaymentStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
};

/**
 * Validation schemas for Billing module
 */

const invoiceItemSchema = z.object({
  type: z.enum([
    InvoiceItemType.CONSULTATION,
    InvoiceItemType.PROCEDURE,
    InvoiceItemType.MEDICATION,
    InvoiceItemType.LAB_TEST,
    InvoiceItemType.OTHER,
  ]),
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
  status: z.enum([
    InvoiceStatus.DRAFT,
    InvoiceStatus.PENDING,
    InvoiceStatus.PARTIAL,
    InvoiceStatus.PAID,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.REFUNDED,
  ]).optional(),
});

export const invoiceQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  patientId: z.string().optional(),
  status: z.enum([
    InvoiceStatus.DRAFT,
    InvoiceStatus.PENDING,
    InvoiceStatus.PARTIAL,
    InvoiceStatus.PAID,
    InvoiceStatus.CANCELLED,
    InvoiceStatus.REFUNDED,
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z.number().positive('Amount must be positive'),
  paymentMethod: z.enum([
    PaymentMethod.CASH,
    PaymentMethod.CARD,
    PaymentMethod.UPI,
    PaymentMethod.BANK_TRANSFER,
    PaymentMethod.CHEQUE,
    PaymentMethod.INSURANCE,
    PaymentMethod.OTHER,
  ]),
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
  status: z.enum([
    PaymentStatus.PENDING,
    PaymentStatus.COMPLETED,
    PaymentStatus.FAILED,
    PaymentStatus.REFUNDED,
    PaymentStatus.CANCELLED,
  ]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

