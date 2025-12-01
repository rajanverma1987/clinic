import mongoose, { Schema, Document } from 'mongoose';

export enum PlanBillingCycle {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface ISubscriptionPlan extends Document {
  name: string;
  description?: string;
  price: number; // Price in minor units (cents)
  currency: string; // ISO currency code
  billingCycle: PlanBillingCycle;
  features: string[]; // List of features included
  maxUsers?: number; // Maximum number of users
  maxPatients?: number; // Maximum number of patients
  maxStorageGB?: number; // Maximum storage in GB
  paypalPlanId?: string; // PayPal subscription plan ID
  status: PlanStatus;
  isPopular?: boolean; // Highlight popular plan
  isHidden?: boolean; // Hide from pricing page
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
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
  mongoose.model<ISubscriptionPlan>('SubscriptionPlan', SubscriptionPlanSchema);

