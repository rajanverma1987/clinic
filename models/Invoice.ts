import mongoose, { Schema, Document } from 'mongoose';

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum InvoiceItemType {
  CONSULTATION = 'consultation',
  PROCEDURE = 'procedure',
  MEDICATION = 'medication',
  LAB_TEST = 'lab_test',
  OTHER = 'other',
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  INSURANCE = 'insurance',
  OTHER = 'other',
}

export interface InvoiceItem {
  type: InvoiceItemType;
  description: string;
  quantity: number;
  unitPrice: number; // In minor units (cents/paisa)
  discount?: number; // Percentage or fixed amount
  discountAmount?: number; // In minor units
  taxRate?: number; // Percentage
  taxAmount?: number; // In minor units
  total: number; // In minor units (after discount, before tax)
  totalWithTax: number; // In minor units (after tax)
  
  // References
  appointmentId?: mongoose.Types.ObjectId;
  prescriptionId?: mongoose.Types.ObjectId;
  procedureId?: string;
}

export interface ITaxBreakdown {
  taxType: string; // 'GST', 'VAT', 'SALES_TAX'
  rate: number; // Percentage
  amount: number; // In minor units
  taxableAmount: number; // In minor units
}

export interface IInvoice extends Document {
  tenantId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  
  // Invoice Details
  invoiceNumber: string; // Auto-generated (e.g., INV-0001)
  invoiceDate: Date;
  dueDate?: Date;
  status: InvoiceStatus;
  region: string; // For region-specific tax rules
  
  // Items
  items: InvoiceItem[];
  
  // Financial Summary (all in minor units - cents/paisa)
  subtotal: number; // Before tax and discount
  totalDiscount: number;
  taxableAmount: number; // After discount, before tax
  totalTax: number;
  totalAmount: number; // Final amount (after tax)
  
  // Tax Breakdown
  taxBreakdown: ITaxBreakdown[];
  
  // Discounts
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  discountReason?: string;
  
  // Insurance
  insuranceId?: string;
  insuranceCoverage?: number; // Amount covered by insurance
  patientPayable: number; // Amount patient needs to pay
  
  // Payment
  paidAmount: number; // In minor units
  balanceAmount: number; // In minor units
  
  // Currency
  currency: string; // ISO currency code (USD, EUR, INR, etc.)
  
  // Notes
  notes?: string;
  
  // Metadata
  isActive: boolean;
  deletedAt?: Date; // Soft delete
  
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
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

export default mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

