import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  tenantId: mongoose.Types.ObjectId;
  
  // Supplier Details
  name: string;
  code?: string; // Supplier code/ID
  contactPerson?: string;
  
  // Contact Information
  email?: string;
  phone?: string;
  alternatePhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  // Business Information
  taxId?: string; // Tax ID / GST number
  registrationNumber?: string;
  
  // Payment Terms
  paymentTerms?: string; // e.g., "Net 30", "COD"
  creditLimit?: number; // In minor units
  
  // Metadata
  notes?: string;
  isActive: boolean;
  deletedAt?: Date; // Soft delete
  
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    
    // Supplier Details
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      trim: true,
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    
    // Contact Information
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    
    // Business Information
    taxId: String,
    registrationNumber: String,
    
    // Payment Terms
    paymentTerms: String,
    creditLimit: Number,
    
    // Metadata
    notes: String,
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
SupplierSchema.index({ tenantId: 1, name: 1 });
SupplierSchema.index({ tenantId: 1, code: 1 });
SupplierSchema.index({ tenantId: 1, deletedAt: 1 });
SupplierSchema.index({ tenantId: 1, isActive: 1 });

export default mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);

