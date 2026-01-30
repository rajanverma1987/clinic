import mongoose, { Schema } from 'mongoose';

/**
 * LabTest Model
 * Catalog of available laboratory tests
 * Based on NEW-PLANS.md schema specification
 */
const LabTestSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    testCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
    },
    sampleType: {
      type: String,
      enum: ['blood', 'urine', 'stool', 'tissue', 'other'],
      required: true,
    },
    // Test parameters with reference ranges
    parameters: [{
      name: {
        type: String,
        required: true,
      },
      unit: {
        type: String,
        trim: true,
      },
      referenceRange: {
        min: Number,
        max: Number,
        text: String, // For text-based ranges
      },
      criticalValues: {
        low: Number,
        high: Number,
      },
    }],
    pricing: {
      price: {
        type: Number,
        min: 0,
        default: 0,
      },
      insurancePrice: {
        type: Number,
        min: 0,
      },
    },
    tatHours: {
      type: Number,
      min: 0,
      default: 24, // Turnaround time in hours
    },
    preparationRequired: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for tenant + test code
LabTestSchema.index({ tenantId: 1, testCode: 1 }, { unique: true });
LabTestSchema.index({ tenantId: 1, status: 1 });
LabTestSchema.index({ name: 'text', category: 'text' }); // Text search

export default mongoose.models.LabTest || mongoose.model('LabTest', LabTestSchema);
