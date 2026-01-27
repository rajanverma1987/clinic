import mongoose, { Schema } from 'mongoose';

/**
 * Session Model
 * Tracks user sessions for authentication and security
 * Based on NEW-PLANS.md schema specification
 */
const SessionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    token: {
      type: String,
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      index: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      expires: 0, // TTL index - auto-delete expired sessions
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user + active sessions
SessionSchema.index({ userId: 1, isActive: 1 });
SessionSchema.index({ tenantId: 1, userId: 1 });

// TTL index for auto-cleanup of expired sessions
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);
