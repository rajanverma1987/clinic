import mongoose, { Schema, Document } from 'mongoose';
import { phiEncryptionPlugin } from '@/lib/encryption/phi-encryption';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

export enum BloodGroup {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  UNKNOWN = 'unknown',
}

export interface IPatient extends Document {
  tenantId: mongoose.Types.ObjectId;
  
  // Demographics
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  bloodGroup?: BloodGroup;
  
  // Contact Information
  email?: string;
  phone: string;
  alternatePhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  
  // Identifiers
  patientId: string; // Clinic-specific patient ID
  nationalId?: string; // National ID/SSN (encrypted)
  insuranceId?: string;
  
  // Medical Information (PHI - encrypted)
  medicalHistory?: string; // Encrypted
  allergies?: string; // Encrypted
  currentMedications?: string; // Encrypted
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  
  // Attachments
  attachments?: Array<{
    filename: string;
    url: string;
    fileType: string;
    uploadedAt: Date;
    uploadedBy: mongoose.Types.ObjectId;
  }>;
  
  // Metadata
  notes?: string; // General notes (not PHI)
  isActive: boolean;
  deletedAt?: Date; // Soft delete
  
  createdAt: Date;
  updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
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

// Compound index for search
PatientSchema.index({
  tenantId: 1,
  firstName: 'text',
  lastName: 'text',
  patientId: 'text',
  phone: 'text',
});

export default mongoose.models.Patient || mongoose.model<IPatient>('Patient', PatientSchema);

