import mongoose, { Schema, Document } from 'mongoose';
import { PaymentMethod } from './Invoice';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

export interface IPayment extends Document {
  tenantId: mongoose.Types.ObjectId;
  invoiceId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  
  // Payment Details
  paymentNumber: string; // Auto-generated (e.g., PAY-0001)
  amount: number; // In minor units (cents/paisa)
  currency: string; // ISO currency code
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  
  // Transaction Details
  transactionId?: string; // External payment gateway transaction ID
  receiptNumber?: string;
  paymentDate: Date;
  
  // Payment Gateway
  gateway?: string; // 'stripe', 'razorpay', 'paypal', etc.
  gatewayResponse?: any; // Store gateway response
  
  // Refund
  refundAmount?: number; // In minor units
  refundReason?: string;
  refundedAt?: Date;
  refundedBy?: mongoose.Types.ObjectId;
  
  // Notes
  notes?: string;
  
  // Metadata
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  deletedAt?: Date; // Soft delete
  
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
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
      required: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    
    // Payment Details
    paymentNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
      default: PaymentStatus.PENDING,
      index: true,
    },
    
    // Transaction Details
    transactionId: String,
    receiptNumber: String,
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    
    // Payment Gateway
    gateway: String,
    gatewayResponse: Schema.Types.Mixed,
    
    // Refund
    refundAmount: Number,
    refundReason: String,
    refundedAt: Date,
    refundedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    
    // Notes
    notes: String,
    
    // Metadata
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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

// Indexes
PaymentSchema.index({ tenantId: 1, paymentNumber: 1 }, { unique: true });
PaymentSchema.index({ tenantId: 1, invoiceId: 1 });
PaymentSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
PaymentSchema.index({ tenantId: 1, status: 1 });
PaymentSchema.index({ tenantId: 1, paymentDate: 1 });
PaymentSchema.index({ transactionId: 1 });
PaymentSchema.index({ tenantId: 1, deletedAt: 1 });

export default mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

