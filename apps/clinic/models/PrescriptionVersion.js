/**
 * PrescriptionVersion Model
 * Stores version history for prescriptions (create/update/void). Per FIX_PLAN: Governance – prescription change tracking.
 * All queries filter by tenantId.
 */

import mongoose, { Schema } from 'mongoose';

const PrescriptionVersionSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    prescriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Prescription',
      required: true,
      index: true,
    },
    version: { type: Number, required: true, index: true },
    /** Snapshot of prescription at this version (items, status, etc.) */
    snapshot: { type: Schema.Types.Mixed },
    /** create | update | void */
    action: { type: String, required: true, index: true },
    changedById: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    changedAt: { type: Date, required: true, default: Date.now, index: true },
    reason: { type: String, trim: true },
  },
  {
    timestamps: true,
    collection: 'prescription_versions',
  },
);

PrescriptionVersionSchema.index({ tenantId: 1, prescriptionId: 1, version: 1 });

export default mongoose.models.PrescriptionVersion ||
  mongoose.model('PrescriptionVersion', PrescriptionVersionSchema);
