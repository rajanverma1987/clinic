import mongoose, { Schema } from 'mongoose';

export const SubscriptionStatus = {
  ACTIVE: 'ACTIVE',
  CANCELLED: 'CANCELLED',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
  PENDING: 'PENDING',
};

const SubscriptionSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    planId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.PENDING,
      required: true,
    },
    paypalSubscriptionId: {
      type: String,
      trim: true,
      index: true,
    },
    paypalApprovalUrl: {
      type: String,
      trim: true,
    },
    currentPeriodStart: {
      type: Date,
      required: true,
    },
    currentPeriodEnd: {
      type: Date,
      required: true,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SubscriptionSchema.index({ tenantId: 1 });
SubscriptionSchema.index({ paypalSubscriptionId: 1 });
SubscriptionSchema.index({ status: 1 });

export default mongoose.models.Subscription ||
  mongoose.model('Subscription', SubscriptionSchema);

