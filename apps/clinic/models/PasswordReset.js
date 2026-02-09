import mongoose, { Schema } from 'mongoose';

const PasswordResetSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    secretCode: {
      type: String,
      required: true,
      length: 6,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: false, // Allow null for super_admin users
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      index: { expireAfterSeconds: 0 },
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for email + tenantId + used (sparse to handle null tenantId)
PasswordResetSchema.index({ email: 1, tenantId: 1, used: 1 }, { sparse: true });
PasswordResetSchema.index({ secretCode: 1, tenantId: 1 }, { sparse: true });
// Additional index for super_admin (email only, no tenantId)
PasswordResetSchema.index({ email: 1, used: 1 });

export default mongoose.models.PasswordReset || mongoose.model('PasswordReset', PasswordResetSchema);

