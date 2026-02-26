/**
 * Location (branch) model for multi-location support (L1).
 * Referenced by branchId on Patient, Appointment, Prescription.
 */

import mongoose, { Schema } from 'mongoose';

const LocationSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true, index: true },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    phone: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true, collection: 'locations' },
);

LocationSchema.index({ tenantId: 1, isActive: 1 });

export default mongoose.models.Location || mongoose.model('Location', LocationSchema);
