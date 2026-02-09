import mongoose, { Schema } from 'mongoose';

/**
 * AuditLog Model
 * Tracks all user actions for HIPAA/GDPR compliance
 * Based on NEW-PLANS.md schema specification
 */
const AuditLogSchema = new Schema(
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
    action: {
      type: String,
      required: true,
      index: true,
      // Examples: 'create', 'read', 'update', 'delete', 'login', 'logout', 'export'
    },
    resource: {
      type: String,
      required: true,
      index: true,
      // Examples: 'patient', 'appointment', 'prescription', 'invoice', 'user'
    },
    resourceId: {
      type: Schema.Types.ObjectId,
      index: true,
      default: null,
    },
    details: {
      type: Schema.Types.Mixed,
      // Stores additional context about the action
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    // For sensitive operations (PHI access)
    phiAccessed: {
      type: Boolean,
      default: false,
      index: true,
    },
    // For compliance tracking
    complianceType: {
      type: String,
      enum: ['hipaa', 'gdpr', 'both', 'none'],
      default: 'none',
    },
  },
  {
    timestamps: false, // We use custom timestamp field
  }
);

// Compound indexes for common queries
AuditLogSchema.index({ tenantId: 1, timestamp: -1 });
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ resource: 1, resourceId: 1, timestamp: -1 });
AuditLogSchema.index({ phiAccessed: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });

// Text index for searching audit logs
AuditLogSchema.index({ action: 'text', resource: 'text' });

export default mongoose.models.AuditLog || mongoose.model('AuditLog', AuditLogSchema);
