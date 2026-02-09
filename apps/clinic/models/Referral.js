import mongoose, { Schema } from 'mongoose';
import { phiEncryptionPlugin } from '@/lib/encryption/phi-encryption.js';

/**
 * Referral Model
 * Patient referrals to specialists (internal or external)
 * HIPAA-compliant with PHI encryption
 */
export const ReferralType = {
  INTERNAL: 'internal',
  EXTERNAL: 'external',
};

export const ReferralStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const ReferralPriority = {
  ROUTINE: 'routine',
  URGENT: 'urgent',
  EMERGENCY: 'emergency',
};

const ReferralSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    // Auto-generated referral number (e.g., "REF001234")
    referralNumber: {
      type: String,
      unique: true,
      uppercase: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    referringDoctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Referred to (specialist)
    referredToDoctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    referredToSpecialty: {
      type: String,
      required: true,
      trim: true,
    },
    referredToName: {
      type: String,
      trim: true,
    },
    referredToClinic: {
      type: String,
      trim: true,
    },
    referredToContact: {
      phone: String,
      email: String,
      address: String,
    },
    // Referral details
    type: {
      type: String,
      enum: Object.values(ReferralType),
      required: true,
      default: ReferralType.INTERNAL,
    },
    priority: {
      type: String,
      enum: Object.values(ReferralPriority),
      required: true,
      default: ReferralPriority.ROUTINE,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      // Will be encrypted by plugin
    },
    clinicalHistory: {
      type: String,
      trim: true,
      // Will be encrypted by plugin
    },
    // Status tracking
    status: {
      type: String,
      enum: Object.values(ReferralStatus),
      required: true,
      default: ReferralStatus.PENDING,
      index: true,
    },
    // Dates
    referredAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    acceptedAt: Date,
    completedAt: Date,
    // Appointment link (if internal referral)
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    // Follow-up notes
    notes: {
      type: String,
      trim: true,
    },
    followUpNotes: [
      {
        note: String,
        addedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Created by
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Apply PHI encryption plugin
ReferralSchema.plugin(phiEncryptionPlugin, {
  encryptedFields: ['reason', 'clinicalHistory'],
});

// Compound indexes
ReferralSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
ReferralSchema.index({ tenantId: 1, referringDoctorId: 1, status: 1 });
ReferralSchema.index({ tenantId: 1, referredToDoctorId: 1, status: 1 });
ReferralSchema.index({ tenantId: 1, status: 1, priority: 1 });
ReferralSchema.index({ tenantId: 1, referralNumber: 1 }, { unique: true });

export default mongoose.models.Referral || mongoose.model('Referral', ReferralSchema);
