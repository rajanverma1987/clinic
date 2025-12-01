import mongoose, { Schema, Document } from 'mongoose';

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export interface ISubscription extends Document {
  tenantId: Schema.Types.ObjectId;
  planId: Schema.Types.ObjectId;
  status: SubscriptionStatus;
  paypalSubscriptionId?: string; // PayPal subscription ID
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  trialEnd?: Date;
  nextBillingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
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
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema);

