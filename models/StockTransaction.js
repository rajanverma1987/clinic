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

export default mongoose.models.StockTransaction || mongoose.model('StockTransaction', StockTransactionSchema);

