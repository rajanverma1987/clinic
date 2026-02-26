/**
 * ConsentForm Model
 * Reusable consent form templates (tenant-scoped). Per FIX_PLAN: Consent management.
 */

import mongoose, { Schema } from 'mongoose';

const ConsentFormSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    content: { type: String, required: true, trim: true },
    type: { type: String, trim: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    version: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: 'consent_forms',
  },
);

ConsentFormSchema.index({ tenantId: 1, isActive: 1, name: 1 });

export default mongoose.models.ConsentForm || mongoose.model('ConsentForm', ConsentFormSchema);
