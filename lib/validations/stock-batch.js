import { z } from 'zod';

/**
 * Validation schemas for Stock Batch module
 */

export const createStockBatchSchema = z.object({
  medicineId: z.string().min(1, 'Medicine ID is required'),
  batchNumber: z.string().min(1, 'Batch number is required').max(50),
  quantity: z.number().int().min(0, 'Quantity must be non-negative'),
  purchasePrice: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  manufacturedDate: z.string().datetime().or(z.date()).optional(),
  expiryDate: z.string().datetime().or(z.date()),
  receivedDate: z.string().datetime().or(z.date()).optional(),
  supplierName: z.string().max(200).optional(),
  supplierInvoiceNumber: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
});

export const updateStockBatchSchema = createStockBatchSchema.partial().extend({
  medicineId: z.string().optional(), // Medicine shouldn't be changed
  batchNumber: z.string().min(1).max(50).optional(),
});

export const stockBatchQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  medicineId: z.string().optional(),
  status: z.enum(['active', 'expired', 'depleted']).optional(),
  expiringSoon: z.string().optional(), // Number of days
  expired: z.string().transform((val) => val === 'true').optional(),
  batchNumber: z.string().optional(),
});

export const updateBatchQuantitySchema = z.object({
  quantityChange: z.number().int(),
  transactionType: z.enum(['sale', 'return', 'adjustment']),
});
