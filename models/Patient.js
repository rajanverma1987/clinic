import mongoose, { Schema } from 'mongoose';
import { phiEncryptionPlugin } from '@/lib/encryption/phi-encryption.js';

export const Gender = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer_not_to_say',
};

export const BloodGroup = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: 'O+',
  O_NEGATIVE: 'O-',
  UNKNOWN: 'unknown',
};

const PatientSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    
    // Demographics
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: Object.values(Gender),
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: Object.values(BloodGroup),
    },
    
    // Contact Information
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
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
    
    // Identifiers
    patientId: {
      type: String,
      required: true,
      trim: true,
    },
    nationalId: {
      type: String,
      trim: true,
      // Will be encrypted by plugin
    },
    insuranceId: {
      type: String,
      trim: true,
    },
    
    // Medical Information (PHI - will be encrypted)
    medicalHistory: {
      type: String,
      // Will be encrypted by plugin
    },
    allergies: {
      type: String,
      // Will be encrypted by plugin
    },
    currentMedications: {
      type: String,
      // Will be encrypted by plugin
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
      email: String,
    },
    
    // Insurance information (as per NEW-PLANS.md)
    insurance: {
      provider: String,
      policyNumber: String,
      groupNumber: String,
      validFrom: Date,
      validUntil: Date,
    },
    
    // Family members (as per NEW-PLANS.md)
    familyMembers: [{
      type: Schema.Types.ObjectId,
      ref: 'Patient',
    }],
    
    // Patient portal access (as per NEW-PLANS.md)
    portalAccess: {
      enabled: {
        type: Boolean,
        default: false,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      lastLogin: Date,
      emailVerified: {
        type: Boolean,
        default: false,
      },
      verificationToken: {
        type: String,
        select: false, // Don't return by default
      },
      verificationExpires: {
        type: Date,
      },
    },
    
    // Status (as per NEW-PLANS.md)
    status: {
      type: String,
      enum: ['active', 'inactive', 'deceased'],
      default: 'active',
      index: true,
    },
    
    // Attachments
    attachments: [
      {
        filename: String,
        url: String,
        fileType: String,
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    
    // Created by (as per NEW-PLANS.md)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    
    // Metadata
    notes: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    // Admin flag (Super Admin)
    flagged: {
      type: Boolean,
      default: false,
      index: true,
    },
    flaggedAt: { type: Date },
    flaggedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    flagReason: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Apply PHI encryption plugin to sensitive fields
phiEncryptionPlugin(PatientSchema, [
  'nationalId',
  'medicalHistory',
  'allergies',
  'currentMedications',
]);

// Indexes for performance
PatientSchema.index({ tenantId: 1, patientId: 1 }, { unique: true });
PatientSchema.index({ tenantId: 1, email: 1 });
PatientSchema.index({ tenantId: 1, phone: 1 });
PatientSchema.index({ tenantId: 1, lastName: 1, firstName: 1 });
PatientSchema.index({ tenantId: 1, deletedAt: 1 }); // For soft delete queries
PatientSchema.index({ tenantId: 1, isActive: 1 });
PatientSchema.index({ tenantId: 1, status: 1 });
PatientSchema.index({ tenantId: 1, 'portalAccess.enabled': 1 });
PatientSchema.index({ tenantId: 1, 'portalAccess.email': 1 });

// Compound index for search
PatientSchema.index({
  tenantId: 1,
  firstName: 'text',
  lastName: 'text',
  patientId: 'text',
  phone: 'text',
});

export default mongoose.models.Patient || mongoose.model('Patient', PatientSchema);

