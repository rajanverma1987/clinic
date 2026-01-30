import mongoose, { Schema } from 'mongoose';

/**
 * StockBatch Model
 * Tracks medicine batches with expiry dates
 * Based on NEW-PLANS.md schema specification
 */
const StockBatchSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Drug',
      required: true,
      index: true,
    },
    batchNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    // Quantity tracking
    quantity: {
      received: {
        type: Number,
        required: true,
        min: 0,
      },
      current: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      sold: {
        type: Number,
        default: 0,
        min: 0,
      },
      returned: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    // Pricing
    pricing: {
      purchasePrice: {
        type: Number,
        required: true,
        min: 0,
      },
      sellingPrice: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    // Dates
    dates: {
      manufactured: Date,
      expiry: {
        type: Date,
        required: true,
        index: true,
      },
      received: {
        type: Date,
        default: Date.now,
      },
    },
    // Supplier information
    supplier: {
      name: {
        type: String,
        trim: true,
      },
      invoiceNumber: {
        type: String,
        trim: true,
      },
    },
    location: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'depleted'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
StockBatchSchema.index({ tenantId: 1, medicineId: 1, status: 1 });
StockBatchSchema.index({ tenantId: 1, 'dates.expiry': 1 });
StockBatchSchema.index({ tenantId: 1, batchNumber: 1 }, { unique: true });

// TTL index for expired batches (optional - for auto-cleanup after retention period)
// StockBatchSchema.index({ 'dates.expiry': 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.StockBatch || mongoose.model('StockBatch', StockBatchSchema);
