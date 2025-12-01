import mongoose, { Schema, Document } from 'mongoose';

export enum DrugForm {
  TABLET = 'tablet',
  CAPSULE = 'capsule',
  SYRUP = 'syrup',
  INJECTION = 'injection',
  DROPS = 'drops',
  CREAM = 'cream',
  OINTMENT = 'ointment',
  INHALER = 'inhaler',
  PATCH = 'patch',
  OTHER = 'other',
}

export interface IDrug extends Document {
  tenantId?: mongoose.Types.ObjectId; // null = global drug database
  name: string;
  genericName?: string;
  brandName?: string;
  
  // Drug Details
  form: DrugForm;
  strength?: string; // e.g., "500mg", "10ml"
  unit?: string; // e.g., "mg", "ml", "units"
  
  // Classification
  category?: string; // e.g., "antibiotic", "analgesic"
  schedule?: string; // Controlled substance schedule
  
  // Regional Information
  region?: string; // 'US', 'EU', 'IN', etc. - null = all regions
  localName?: string; // Local name in region
  availableInRegions?: string[]; // Regions where drug is available
  
  // Prescription Requirements
  requiresPrescription: boolean;
  maxQuantity?: number; // Maximum quantity per prescription
  commonDosages?: string[]; // Common dosage instructions
  
  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DrugSchema = new Schema<IDrug>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      default: null, // null = global drug
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
      index: true,
    },
    brandName: {
      type: String,
      trim: true,
    },
    
    // Drug Details
    form: {
      type: String,
      enum: Object.values(DrugForm),
      required: true,
    },
    strength: {
      type: String,
      trim: true,
    },
    unit: {
      type: String,
      trim: true,
    },
    
    // Classification
    category: {
      type: String,
      trim: true,
      index: true,
    },
    schedule: {
      type: String,
      trim: true,
    },
    
    // Regional Information
    region: {
      type: String,
      trim: true,
    },
    localName: {
      type: String,
      trim: true,
    },
    availableInRegions: [String],
    
    // Prescription Requirements
    requiresPrescription: {
      type: Boolean,
      default: true,
    },
    maxQuantity: Number,
    commonDosages: [String],
    
    // Metadata
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DrugSchema.index({ name: 'text', genericName: 'text', brandName: 'text' });
DrugSchema.index({ tenantId: 1, isActive: 1 });
DrugSchema.index({ region: 1, isActive: 1 });
DrugSchema.index({ category: 1 });

export default mongoose.models.Drug || mongoose.model<IDrug>('Drug', DrugSchema);

