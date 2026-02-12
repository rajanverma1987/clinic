/**
 * One-time tokens for super_admin to impersonate a clinic (login as that clinic's admin)
 */
import mongoose, { Schema } from 'mongoose';

const ImpersonationTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

ImpersonationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.ImpersonationToken ||
  mongoose.model('ImpersonationToken', ImpersonationTokenSchema);
