import mongoose, { Schema } from 'mongoose';

export const InvoiceStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

export const InvoiceItemType = {
  CONSULTATION: 'consultation',
  PROCEDURE: 'procedure',
  MEDICATION: 'medication',
  LAB_TEST: 'lab_test',
  OTHER: 'other',
};

export const PaymentMethod = {
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  BANK_TRANSFER: 'bank_transfer',
  CHEQUE: 'cheque',
  INSURANCE: 'insurance',
  OTHER: 'other',
};

const InvoiceSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    
    // Invoice Details
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: Date,
    status: {
      type: String,
      enum: Object.values(InvoiceStatus),
      required: true,
      default: InvoiceStatus.DRAFT,
      index: true,
    },
    region: {
      type: String,
      required: true,
      enum: ['US', 'EU', 'APAC', 'IN', 'ME', 'CA', 'AU'],
    },
    
    // Items
    items: [
      {
        type: {
          type: String,
          enum: Object.values(InvoiceItemType),
          required: true,
        },
        description: String,
        quantity: { type: Number, required: true, default: 1 },
        unitPrice: { type: Number, required: true }, // Minor units
        discount: Number,
        discountAmount: Number, // Minor units
        taxRate: Number,
        taxAmount: Number, // Minor units
        total: { type: Number, required: true }, // Minor units
        totalWithTax: { type: Number, required: true }, // Minor units
        appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
        prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription' },
        procedureId: String,
      },
    ],
    
    // Financial Summary (all in minor units)
    subtotal: {
      type: Number,
      required: true,
      default: 0,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    taxableAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    totalTax: {
      type: Number,
      required: true,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    
    // Tax Breakdown
    taxBreakdown: [
      {
        taxType: String, // 'GST', 'VAT', 'SALES_TAX'
        rate: Number,
        amount: Number, // Minor units
        taxableAmount: Number, // Minor units
      },
    ],
    
    // Discounts
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
    },
    discountValue: Number,
    discountReason: String,
    
    // Insurance
    insuranceId: String,
    insuranceCoverage: Number, // Minor units
    patientPayable: {
      type: Number,
      required: true,
      default: 0,
    },
    
    // Payment
    paidAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      required: true,
      default: 0,
    },
    
    // Currency
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    
    // Notes
    notes: String,
    
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

// Indexes
InvoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true });
InvoiceSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
InvoiceSchema.index({ tenantId: 1, status: 1 });
InvoiceSchema.index({ tenantId: 1, invoiceDate: 1 });
InvoiceSchema.index({ tenantId: 1, deletedAt: 1 });

export default mongoose.models.Invoice || mongoose.model('Invoice', InvoiceSchema);

