import mongoose, { Schema } from 'mongoose';
import { phiEncryptionPlugin } from '@/lib/encryption/phi-encryption.js';

export const PrescriptionStatus = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  DISPENSED: 'dispensed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
};

export const PrescriptionItemType = {
  DRUG: 'drug',
  LAB: 'lab',
  PROCEDURE: 'procedure',
  OTHER: 'other',
};

const PrescriptionSchema = new Schema(
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
    
    // Items - Flexible structure to support drugs, labs, procedures, and other items
    items: [
      {
        itemType: {
          type: String,
          enum: Object.values(PrescriptionItemType),
          default: PrescriptionItemType.DRUG,
        },
        // Drug-specific fields
        drugId: { type: Schema.Types.ObjectId, ref: 'Drug' },
        drugName: String,
        genericName: String,
        form: String,
        strength: String,
        frequency: String,
        duration: Number,
        quantity: Number,
        unit: String,
        takeWithFood: Boolean,
        takeBeforeMeal: Boolean,
        takeAfterMeal: Boolean,
        allowSubstitution: Boolean,
        // Lab-specific fields
        labTestName: String,
        labTestCode: String,
        labInstructions: String,
        fastingRequired: Boolean,
        // Procedure-specific fields
        procedureName: String,
        procedureCode: String,
        procedureInstructions: String,
        // Other/Common fields
        itemName: String,
        itemDescription: String,
        instructions: String, // Will be encrypted
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
PrescriptionSchema.pre('save', function (next) {
  if (this.items) {
    const { encryptField } = require('@/lib/encryption/phi-encryption.js');
    this.items.forEach((item) => {
      if (item.instructions) {
        item.instructions = encryptField(item.instructions);
      }
    });
  }
  next();
});

PrescriptionSchema.post('init', function () {
  if (this.items) {
    const { decryptField } = require('@/lib/encryption/phi-encryption.js');
    this.items.forEach((item) => {
      if (item.instructions) {
        // decryptField now handles errors gracefully and returns original value if decryption fails
        item.instructions = decryptField(item.instructions);
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

export default mongoose.models.Prescription || mongoose.model('Prescription', PrescriptionSchema);

