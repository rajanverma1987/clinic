import mongoose, { Schema, Document } from 'mongoose';
import { phiEncryptionPlugin } from '@/lib/encryption/phi-encryption';

export enum PrescriptionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  DISPENSED = 'dispensed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface PrescriptionItem {
  drugId: mongoose.Types.ObjectId;
  drugName: string; // Snapshot of drug name at time of prescription
  genericName?: string;
  form: string;
  strength?: string;
  
  // Dosage
  frequency: string; // e.g., "twice daily", "once daily", "as needed"
  duration: number; // in days
  quantity: number; // Total quantity
  unit?: string; // e.g., "tablets", "ml", "bottles"
  
  // Instructions
  instructions?: string; // Additional instructions (encrypted if contains PHI)
  takeWithFood?: boolean;
  takeBeforeMeal?: boolean;
  takeAfterMeal?: boolean;
  
  // Substitution
  allowSubstitution: boolean; // Generic substitution allowed
}

export interface IPrescription extends Document {
  tenantId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId;
  clinicalNoteId?: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  
  // Prescription Details
  prescriptionNumber: string; // Auto-generated (e.g., RX-0001)
  status: PrescriptionStatus;
  region: string; // For region-specific formatting
  
  // Items
  items: PrescriptionItem[];
  
  // Diagnosis (encrypted)
  diagnosis?: string;
  icd10Codes?: string[];
  
  // Instructions
  additionalInstructions?: string; // Encrypted if contains PHI
  
  // Validity
  validFrom: Date;
  validUntil: Date;
  refillsAllowed?: number;
  refillsUsed?: number;
  
  // Dispensing
  dispensedAt?: Date;
  dispensedBy?: mongoose.Types.ObjectId;
  pharmacyNotes?: string;
  
  // E-signature (where allowed by region)
  doctorSignature?: string; // Base64 encoded signature image
  signedAt?: Date;
  signatureHash?: string; // For verification
  
  // Metadata
  isActive: boolean;
  deletedAt?: Date; // Soft delete
  
  createdAt: Date;
  updatedAt: Date;
}

const PrescriptionSchema = new Schema<IPrescription>(
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
    clinicalNoteId: {
      type: Schema.Types.ObjectId,
      ref: 'ClinicalNote',
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Prescription Details
    prescriptionNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(PrescriptionStatus),
      required: true,
      default: PrescriptionStatus.DRAFT,
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
        drugId: { type: Schema.Types.ObjectId, ref: 'Drug' },
        drugName: String,
        genericName: String,
        form: String,
        strength: String,
        frequency: String,
        duration: Number,
        quantity: Number,
        unit: String,
        instructions: String, // Will be encrypted
        takeWithFood: Boolean,
        takeBeforeMeal: Boolean,
        takeAfterMeal: Boolean,
        allowSubstitution: { type: Boolean, default: true },
      },
    ],
    
    // Diagnosis
    diagnosis: {
      type: String,
      // Will be encrypted
    },
    icd10Codes: [String],
    
    // Instructions
    additionalInstructions: {
      type: String,
      // Will be encrypted if contains PHI
    },
    
    // Validity
    validFrom: {
      type: Date,
      required: true,
      default: Date.now,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    refillsAllowed: {
      type: Number,
      default: 0,
    },
    refillsUsed: {
      type: Number,
      default: 0,
    },
    
    // Dispensing
    dispensedAt: Date,
    dispensedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    pharmacyNotes: String,
    
    // E-signature
    doctorSignature: String,
    signedAt: Date,
    signatureHash: String,
    
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

// Apply PHI encryption
phiEncryptionPlugin(PrescriptionSchema, [
  'diagnosis',
  'additionalInstructions',
]);

// Encrypt item instructions
PrescriptionSchema.pre('save', function (this: IPrescription, next: () => void) {
  if (this.items) {
    const { encryptField } = require('@/lib/encryption/phi-encryption');
    this.items.forEach((item) => {
      if (item.instructions) {
        item.instructions = encryptField(item.instructions);
      }
    });
  }
  next();
});

PrescriptionSchema.post('init', function (this: IPrescription) {
  if (this.items) {
    const { decryptField } = require('@/lib/encryption/phi-encryption');
    this.items.forEach((item) => {
      if (item.instructions) {
        try {
          item.instructions = decryptField(item.instructions);
        } catch (error) {
          console.error('Prescription item decryption failed:', error);
        }
      }
    });
  }
});

// Indexes
PrescriptionSchema.index({ tenantId: 1, prescriptionNumber: 1 }, { unique: true });
PrescriptionSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
PrescriptionSchema.index({ tenantId: 1, doctorId: 1, createdAt: -1 });
PrescriptionSchema.index({ tenantId: 1, status: 1 });
PrescriptionSchema.index({ tenantId: 1, validUntil: 1 }); // For expired prescriptions
PrescriptionSchema.index({ tenantId: 1, deletedAt: 1 });

export default mongoose.models.Prescription || mongoose.model<IPrescription>('Prescription', PrescriptionSchema);

