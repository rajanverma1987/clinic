/**
 * PaymentDispute – Admin-managed payment/invoice disputes (Phase 6.2).
 * Super Admin can list, review, contact, escalate, resolve, or issue refund.
 */

import mongoose, { Schema } from 'mongoose';

export const DisputeStatus = {
  OPEN: 'open',
  CONTACTED: 'contacted',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
  REFUND_ISSUED: 'refund_issued',
};

const PaymentDisputeSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'Invoice',
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: { type: String, default: 'USD' },
    reason: { type: String, trim: true, required: true },
    evidence: { type: String, trim: true },
    status: {
      type: String,
      enum: Object.values(DisputeStatus),
      default: DisputeStatus.OPEN,
      // index via compound PaymentDisputeSchema.index({ tenantId: 1, status: 1 })
    },
    adminNotes: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

PaymentDisputeSchema.index({ tenantId: 1, status: 1 });
PaymentDisputeSchema.index({ createdAt: -1 });

export default mongoose.models.PaymentDispute ||
  mongoose.model('PaymentDispute', PaymentDisputeSchema);
