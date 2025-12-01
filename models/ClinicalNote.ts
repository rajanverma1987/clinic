import mongoose, { Schema, Document } from 'mongoose';
import { phiEncryptionPlugin } from '@/lib/encryption/phi-encryption';

export enum NoteType {
  SOAP = 'soap',
  PROGRESS = 'progress',
  CONSULTATION = 'consultation',
  PROCEDURE = 'procedure',
  FOLLOW_UP = 'follow_up',
}

export interface SOAPStructure {
  subjective?: string; // Patient's description (encrypted)
  objective?: string; // Observations, vital signs (encrypted)
  assessment?: string; // Diagnosis, evaluation (encrypted)
  plan?: string; // Treatment plan (encrypted)
}

export interface IClinicalNote extends Document {
  tenantId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  appointmentId?: mongoose.Types.ObjectId; // Optional link to appointment
  doctorId: mongoose.Types.ObjectId; // Doctor who created the note
  
  // Note Details
  type: NoteType;
  title?: string;
  
  // SOAP Structure (if type is SOAP)
  soap?: SOAPStructure;
  
  // General Content (for non-SOAP notes)
  content?: string; // Encrypted if contains PHI
  
  // Diagnosis & Codes
  diagnosis?: string; // Encrypted
  icd10Codes?: string[]; // ICD-10 diagnosis codes
  snomedCodes?: string[]; // SNOMED CT codes (optional)
  
  // Vital Signs
  vitalSigns?: {
    bloodPressure?: string; // e.g., "120/80"
    heartRate?: number;
    temperature?: number; // Celsius
    respiratoryRate?: number;
    oxygenSaturation?: number; // Percentage
    weight?: number; // kg
    height?: number; // cm
    bmi?: number;
    recordedAt?: Date;
  };
  
  // Attachments
  attachments?: Array<{
    filename: string;
    url: string;
    fileType: string;
    uploadedAt: Date;
    uploadedBy: mongoose.Types.ObjectId;
  }>;
  
  // Template
  templateId?: mongoose.Types.ObjectId; // Reference to template used
  
  // Versioning
  version: number;
  previousVersionId?: mongoose.Types.ObjectId; // Link to previous version
  
  // Metadata
  isActive: boolean;
  deletedAt?: Date; // Soft delete
  
  createdAt: Date;
  updatedAt: Date;
}

const ClinicalNoteSchema = new Schema<IClinicalNote>(
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
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Note Details
    type: {
      type: String,
      enum: Object.values(NoteType),
      required: true,
      default: NoteType.SOAP,
    },
    title: {
      type: String,
      trim: true,
    },
    
    // SOAP Structure
    soap: {
      subjective: String, // Will be encrypted
      objective: String, // Will be encrypted
      assessment: String, // Will be encrypted
      plan: String, // Will be encrypted
    },
    
    // General Content
    content: {
      type: String,
      // Will be encrypted if contains PHI
    },
    
    // Diagnosis & Codes
    diagnosis: {
      type: String,
      // Will be encrypted
    },
    icd10Codes: [String],
    snomedCodes: [String],
    
    // Vital Signs
    vitalSigns: {
      bloodPressure: String,
      heartRate: Number,
      temperature: Number,
      respiratoryRate: Number,
      oxygenSaturation: Number,
      weight: Number,
      height: Number,
      bmi: Number,
      recordedAt: Date,
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
    
    // Template
    templateId: {
      type: Schema.Types.ObjectId,
      ref: 'NoteTemplate',
    },
    
    // Versioning
    version: {
      type: Number,
      default: 1,
    },
    previousVersionId: {
      type: Schema.Types.ObjectId,
      ref: 'ClinicalNote',
    },
    
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

// Apply PHI encryption to sensitive fields
// Note: SOAP fields are nested, so we'll handle encryption in the service layer
// or use a custom pre-save hook
phiEncryptionPlugin(ClinicalNoteSchema, [
  'content',
  'diagnosis',
]);

// Custom encryption for SOAP nested fields
ClinicalNoteSchema.pre('save', function (this: IClinicalNote, next: () => void) {
  if (this.soap) {
    const { encryptField } = require('@/lib/encryption/phi-encryption');
    if (this.soap.subjective) {
      this.soap.subjective = encryptField(this.soap.subjective);
    }
    if (this.soap.objective) {
      this.soap.objective = encryptField(this.soap.objective);
    }
    if (this.soap.assessment) {
      this.soap.assessment = encryptField(this.soap.assessment);
    }
    if (this.soap.plan) {
      this.soap.plan = encryptField(this.soap.plan);
    }
  }
  next();
});

ClinicalNoteSchema.post('init', function (this: IClinicalNote) {
  if (this.soap) {
    const { decryptField } = require('@/lib/encryption/phi-encryption');
    try {
      if (this.soap.subjective) {
        this.soap.subjective = decryptField(this.soap.subjective);
      }
      if (this.soap.objective) {
        this.soap.objective = decryptField(this.soap.objective);
      }
      if (this.soap.assessment) {
        this.soap.assessment = decryptField(this.soap.assessment);
      }
      if (this.soap.plan) {
        this.soap.plan = decryptField(this.soap.plan);
      }
    } catch (error) {
      // If decryption fails, field might not be encrypted (legacy data)
      console.error('SOAP decryption failed:', error);
    }
  }
});

// Indexes
ClinicalNoteSchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
ClinicalNoteSchema.index({ tenantId: 1, doctorId: 1, createdAt: -1 });
ClinicalNoteSchema.index({ tenantId: 1, appointmentId: 1 });
ClinicalNoteSchema.index({ tenantId: 1, deletedAt: 1 });
ClinicalNoteSchema.index({ tenantId: 1, type: 1 });
ClinicalNoteSchema.index({ previousVersionId: 1 }); // For version history

export default mongoose.models.ClinicalNote || mongoose.model<IClinicalNote>('ClinicalNote', ClinicalNoteSchema);

