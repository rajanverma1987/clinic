/**
 * CarePlan Model
 * Chronic care plans: goals, follow-up schedule, long-term condition tracking.
 * Per FIX_PLAN: Chronic care layer. All queries must filter by tenantId.
 */

import mongoose, { Schema } from 'mongoose';

export const CarePlanStatus = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold',
  CANCELLED: 'cancelled',
};

const CarePlanSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
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
    name: { type: String, required: true, trim: true, index: true },
    condition: { type: String, trim: true, index: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, index: true },
    status: {
      type: String,
      enum: Object.values(CarePlanStatus),
      default: CarePlanStatus.ACTIVE,
      index: true,
    },
    goals: { type: String, trim: true },
    /** Follow-up interval in days */
    followUpIntervalDays: { type: Number, min: 0 },
    /** Long-term conditions (e.g. ICD codes or labels) */
    conditions: [{ type: String, trim: true }],
    notes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: 'care_plans',
  },
);

CarePlanSchema.index({ tenantId: 1, patientId: 1, status: 1 });
CarePlanSchema.index({ tenantId: 1, doctorId: 1, startDate: -1 });

export default mongoose.models.CarePlan || mongoose.model('CarePlan', CarePlanSchema);
