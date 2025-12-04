import mongoose, { Schema } from 'mongoose';

export const PlanBillingCycle = {
  MONTHLY: 'MONTHLY',
  YEARLY: 'YEARLY',
};

export const PlanStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
};

const SubscriptionPlanSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    billingCycle: {
      type: String,
      enum: Object.values(PlanBillingCycle),
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    maxUsers: {
      type: Number,
      min: 0,
    },
    maxPatients: {
      type: Number,
      min: 0,
    },
    maxStorageGB: {
      type: Number,
      min: 0,
    },
    paypalPlanId: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(PlanStatus),
      default: PlanStatus.ACTIVE,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.SubscriptionPlan ||
  mongoose.model('SubscriptionPlan', SubscriptionPlanSchema);

