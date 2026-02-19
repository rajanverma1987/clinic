import mongoose, { Schema } from 'mongoose';

/**
 * Insurance Claim Model
 * Tracks insurance claims for invoices
 * Based on NEW-PLANS.md requirements
 */

export const ClaimStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  APPROVED: 'approved',
  PARTIALLY_APPROVED: 'partially_approved',
  DENIED: 'denied',
  PAID: 'paid',
  REJECTED: 'rejected',
};

const InsuranceClaimSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    // Auto-generated claim number (e.g. CLM-0001); unique per tenant via compound index
    claimNumber: {
      type: String,
      uppercase: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    // Insurance provider information
    insuranceProvider: {
      type: String,
      required: true,
      trim: true,
    },
    policyNumber: {
      type: String,
      required: true,
      trim: true,
    },
    groupNumber: {
      type: String,
      trim: true,
    },
    // Claim details
    claimAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    submittedAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    approvedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    deniedAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    patientResponsibility: {
      type: Number,
      required: true,
      min: 0,
    },
    // Claim status
    status: {
      type: String,
      enum: Object.values(ClaimStatus),
      required: true,
      default: ClaimStatus.DRAFT,
      index: true,
    },
    // Dates
    submittedAt: Date,
    reviewedAt: Date,
    approvedAt: Date,
    paidAt: Date,
    // EOB (Explanation of Benefits)
    eob: {
      received: Boolean,
      receivedAt: Date,
      eobNumber: String,
      eobUrl: String,
    },
    // Prior authorization
    priorAuthorization: {
      required: Boolean,
      authorizationNumber: String,
      authorizedAmount: Number,
      authorizedUntil: Date,
    },
    // Denial information
    denialReason: String,
    appealRequired: Boolean,
    appealDeadline: Date,
    // Notes
    notes: String,
    // Created by
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
  },
);

// Compound indexes
InsuranceClaimSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
InsuranceClaimSchema.index({ tenantId: 1, invoiceId: 1 });
InsuranceClaimSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
InsuranceClaimSchema.index({ tenantId: 1, claimNumber: 1 }, { unique: true });

export default mongoose.models.InsuranceClaim ||
  mongoose.model('InsuranceClaim', InsuranceClaimSchema);
