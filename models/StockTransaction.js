import mongoose, { Schema } from 'mongoose';

export const TransactionType = {
  PURCHASE: 'purchase',
  SALE: 'sale',
  ADJUSTMENT: 'adjustment',
  RETURN: 'return',
  TRANSFER: 'transfer',
  EXPIRED: 'expired',
  DAMAGED: 'damaged',
};

export const TransactionStatus = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const StockTransactionSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Drug',
      index: true,
    },
    batchId: {
      type: Schema.Types.ObjectId,
      ref: 'StockBatch',
      index: true,
    },
    // Legacy field for backward compatibility
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      index: true,
    },
    
    // Transaction Details
    transactionNumber: {
      type: String,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['purchase', 'sale', 'return', 'adjustment', 'transfer', 'waste'],
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
    
    // Reference object as per NEW-PLANS.md
    reference: {
      type: {
        type: String,
        trim: true,
      },
      id: {
        type: Schema.Types.ObjectId,
      },
      number: {
        type: String,
        trim: true,
      },
    },
    // Legacy reference fields for backward compatibility
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
    
    // Location tracking as per NEW-PLANS.md
    fromLocation: {
      type: String,
      trim: true,
    },
    toLocation: {
      type: String,
      trim: true,
    },
    
    // Notes
    reason: String,
    notes: {
      type: String,
      trim: true,
    },
    
    // Timestamp as per NEW-PLANS.md
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    // Performed by as per NEW-PLANS.md
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Legacy field for backward compatibility
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

export default mongoose.models.StockTransaction || mongoose.model('StockTransaction', StockTransactionSchema);

