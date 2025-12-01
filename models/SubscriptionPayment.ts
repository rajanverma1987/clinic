import mongoose, { Schema, Document } from 'mongoose';

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  PAYPAL = 'PAYPAL',
  STRIPE = 'STRIPE',
  MANUAL = 'MANUAL',
}

export interface ISubscriptionPayment extends Document {
  subscriptionId: Schema.Types.ObjectId;
  tenantId: Schema.Types.ObjectId;
  amount: number; // Amount in minor units (cents)
  currency: string;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  paypalTransactionId?: string;
  paypalOrderId?: string;
  invoiceId?: string;
  paidAt?: Date;
  failureReason?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPaymentSchema = new Schema<ISubscriptionPayment>(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: true,
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    paypalTransactionId: {
      type: String,
      trim: true,
    },
    paypalOrderId: {
      type: String,
      trim: true,
    },
    invoiceId: {
      type: String,
      trim: true,
    },
    paidAt: {
      type: Date,
    },
    failureReason: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SubscriptionPaymentSchema.index({ subscriptionId: 1 });
SubscriptionPaymentSchema.index({ tenantId: 1 });
SubscriptionPaymentSchema.index({ status: 1 });
SubscriptionPaymentSchema.index({ paypalTransactionId: 1 });

export default mongoose.models.SubscriptionPayment ||
  mongoose.model<ISubscriptionPayment>('SubscriptionPayment', SubscriptionPaymentSchema);

