import { z } from 'zod';
import { InventoryItemType } from '@/models/InventoryItem';
import { TransactionType } from '@/models/StockTransaction';

/**
 * Validation schemas for Inventory module
 */

const batchSchema = z.object({
  batchNumber: z.string().min(1, 'Batch number is required'),
  expiryDate: z.string().datetime().or(z.date()),
  quantity: z.number().int().positive('Quantity must be positive'),
  purchasePrice: z.number().positive().optional(),
  purchaseDate: z.string().datetime().or(z.date()).optional(),
  supplierId: z.string().optional(),
});

export const createInventoryItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional(),
  type: z.nativeEnum(InventoryItemType).optional(),
  description: z.string().optional(),
  drugId: z.string().optional(),
  genericName: z.string().optional(),
  brandName: z.string().optional(),
  form: z.string().optional(),
  strength: z.string().optional(),
  unit: z.string().optional(),
  currentStock: z.number().int().min(0).optional(), // Simplified stock input
  batches: z.array(batchSchema).optional(),
  batchNumber: z.string().optional(), // For single batch
  expiryDate: z.string().optional(), // For single batch
  supplier: z.string().optional(), // For single batch
  costPrice: z.number().positive().optional(),
  sellingPrice: z.number().positive().optional(),
  currency: z.string().optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQuantity: z.number().int().positive().optional(),
  primarySupplierId: z.string().optional(),
  location: z.string().optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema.partial();

export const inventoryItemQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  type: z.nativeEnum(InventoryItemType).optional(),
  lowStock: z.string().transform((val) => val === 'true').optional(),
  expired: z.string().transform((val) => val === 'true').optional(),
  isActive: z.string().transform((val) => val === 'true').optional(),
});

export const createStockTransactionSchema = z.object({
  inventoryItemId: z.string().min(1, 'Inventory item ID is required'),
  type: z.nativeEnum(TransactionType),
  quantity: z.number().int().refine((val) => val !== 0, {
    message: 'Quantity cannot be zero',
  }),
  batchNumber: z.string().optional(),
  expiryDate: z.string().datetime().or(z.date()).optional(),
  unitPrice: z.number().positive().optional(),
  supplierId: z.string().optional(),
  prescriptionId: z.string().optional(),
  invoiceId: z.string().optional(),
  referenceNumber: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  code: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
export type InventoryItemQueryInput = z.infer<typeof inventoryItemQuerySchema>;
export type CreateStockTransactionInput = z.infer<typeof createStockTransactionSchema>;
export type CreateSupplierInput = z.infer<typeof supplierSchema>;

