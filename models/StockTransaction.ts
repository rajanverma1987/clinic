import mongoose, { Schema, Document } from 'mongoose';

export enum TransactionType {
  PURCHASE = 'purchase',
  SALE = 'sale',
  ADJUSTMENT = 'adjustment',
  RETURN = 'return',
  TRANSFER = 'transfer',
  EXPIRED = 'expired',
  DAMAGED = 'damaged',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface IStockTransaction extends Document {
  tenantId: mongoose.Types.ObjectId;
  inventoryItemId: mongoose.Types.ObjectId;
  
  // Transaction Details
  transactionNumber: string; // Auto-generated (e.g., STX-0001)
  type: TransactionType;
  status: TransactionStatus;
  
  // Quantity
  quantity: number; // Positive for in, negative for out
  batchNumber?: string;
  expiryDate?: Date;
  
  // Pricing
  unitPrice?: number; // In minor units
  totalAmount?: number; // In minor units
  currency: string;
  
  // References
  supplierId?: mongoose.Types.ObjectId;
  prescriptionId?: mongoose.Types.ObjectId;
  invoiceId?: mongoose.Types.ObjectId;
  referenceNumber?: string; // PO number, invoice number, etc.
  
  // Notes
  reason?: string; // For adjustments, returns, etc.
  notes?: string;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  deletedAt?: Date; // Soft delete
  
  createdAt: Date;
  updatedAt: Date;
}

const StockTransactionSchema = new Schema<IStockTransaction>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: true,
      index: true,
    },
    
    // Transaction Details
    transactionNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(TransactionType),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(TransactionStatus),
      required: true,
      default: TransactionStatus.PENDING,
      index: true,
    },
    
    // Quantity
    quantity: {
      type: Number,
      required: true,
    },
    batchNumber: String,
    expiryDate: Date,
    
    // Pricing
    unitPrice: Number, // Minor units
    totalAmount: Number, // Minor units
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    
    // References
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
    },
    referenceNumber: String,
    
    // Notes
    reason: String,
    notes: String,
    
    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
StockTransactionSchema.index({ tenantId: 1, transactionNumber: 1 }, { unique: true });
StockTransactionSchema.index({ tenantId: 1, inventoryItemId: 1, createdAt: -1 });
StockTransactionSchema.index({ tenantId: 1, type: 1, status: 1 });
StockTransactionSchema.index({ tenantId: 1, createdAt: 1 });
StockTransactionSchema.index({ tenantId: 1, deletedAt: 1 });

export default mongoose.models.StockTransaction || mongoose.model<IStockTransaction>('StockTransaction', StockTransactionSchema);

