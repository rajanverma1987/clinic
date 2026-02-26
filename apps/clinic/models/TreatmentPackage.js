/**
 * TreatmentPackage Model
 * Defines reusable treatment packages (e.g. bundle of procedures or instructions).
 * Per FIX_PLAN: Procedure layer – treatment packages.
 * All queries must filter by tenantId.
 */

import mongoose, { Schema } from 'mongoose';

const packageItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    /** Optional procedure type/code this item maps to */
    procedureType: { type: String, trim: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: true },
);

const TreatmentPackageSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: { type: String, trim: true },
    /** Items or steps in the package */
    items: [packageItemSchema],
    /** Optional price (for display or billing) */
    price: { type: Number, min: 0 },
    currency: { type: String, trim: true, default: 'INR' },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  {
    timestamps: true,
    collection: 'treatment_packages',
  },
);

TreatmentPackageSchema.index({ tenantId: 1, isActive: 1, name: 1 });

export default mongoose.models.TreatmentPackage ||
  mongoose.model('TreatmentPackage', TreatmentPackageSchema);
