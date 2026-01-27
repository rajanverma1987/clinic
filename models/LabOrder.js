import mongoose, { Schema } from 'mongoose';

/**
 * LabOrder Model
 * Laboratory test orders for patients
 * Based on NEW-PLANS.md schema specification
 */
const LabOrderSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    consultationId: {
      type: Schema.Types.ObjectId,
      ref: 'ClinicalNote',
      index: true,
    },
    // Tests ordered
    tests: [{
      testId: {
        type: Schema.Types.ObjectId,
        ref: 'LabTest',
        required: true,
      },
      testName: {
        type: String,
        required: true,
      },
      priority: {
        type: String,
        enum: ['routine', 'urgent', 'stat'],
        default: 'routine',
      },
      status: {
        type: String,
        enum: ['pending', 'collected', 'processing', 'completed', 'cancelled'],
        default: 'pending',
      },
    }],
    // Sample information
    sample: {
      type: {
        type: String,
        enum: ['blood', 'urine', 'stool', 'tissue', 'other'],
      },
      collectedAt: Date,
      collectedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      barcode: {
        type: String,
        index: true,
      },
    },
    status: {
      type: String,
      enum: ['ordered', 'collected', 'processing', 'completed', 'cancelled'],
      default: 'ordered',
      index: true,
    },
    orderedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expectedCompletion: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
LabOrderSchema.index({ tenantId: 1, patientId: 1, orderedAt: -1 });
LabOrderSchema.index({ tenantId: 1, doctorId: 1, orderedAt: -1 });
LabOrderSchema.index({ tenantId: 1, status: 1, orderedAt: -1 });

export default mongoose.models.LabOrder || mongoose.model('LabOrder', LabOrderSchema);
