import mongoose, { Schema } from 'mongoose';

/**
 * LabResult Model
 * Laboratory test results
 * Based on NEW-PLANS.md schema specification
 */
const LabResultSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'LabOrder',
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'LabTest',
      required: true,
      index: true,
    },
    // Test results
    results: [{
      parameter: {
        type: String,
        required: true,
      },
      value: {
        type: String, // Can be number or text
        required: true,
      },
      unit: {
        type: String,
        trim: true,
      },
      referenceRange: {
        type: String,
        trim: true,
      },
      flag: {
        type: String,
        enum: ['normal', 'low', 'high', 'critical'],
        default: 'normal',
      },
      notes: {
        type: String,
        trim: true,
      },
    }],
    interpretation: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: Date,
    reportUrl: {
      type: String,
    },
    status: {
      type: String,
      enum: ['draft', 'verified', 'delivered'],
      default: 'draft',
      index: true,
    },
    reportedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
LabResultSchema.index({ tenantId: 1, orderId: 1 });
LabResultSchema.index({ tenantId: 1, patientId: 1, reportedAt: -1 });
LabResultSchema.index({ tenantId: 1, status: 1 });

export default mongoose.models.LabResult || mongoose.model('LabResult', LabResultSchema);
