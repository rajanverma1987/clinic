import mongoose, { Schema } from 'mongoose';
import { phiEncryptionPlugin } from '@/lib/encryption/phi-encryption.js';
import { logger } from '@/lib/utils/logger.js';

export const NoteType = {
  SOAP: 'soap',
  PROGRESS: 'progress',
  CONSULTATION: 'consultation',
  PROCEDURE: 'procedure',
  FOLLOW_UP: 'follow_up',
};

const ClinicalNoteSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    // Auto-generated consultation number (e.g., "CON001234")
    consultationNumber: {
      type: String,
      uppercase: true,
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
    // Consultation date as per NEW-PLANS.md
    date: {
      type: Date,
      default: Date.now,
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
    
    // Status as per NEW-PLANS.md
    status: {
      type: String,
      enum: ['draft', 'completed', 'reviewed'],
      default: 'draft',
      index: true,
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
    // Edit tracking as per NEW-PLANS.md
    editedAt: Date,
    editedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
phiEncryptionPlugin(ClinicalNoteSchema, [
  'content',
  'diagnosis',
]);

// Custom encryption for SOAP nested fields
ClinicalNoteSchema.pre('save', function (next) {
  if (this.soap) {
    const { encryptField } = require('@/lib/encryption/phi-encryption.js');
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

ClinicalNoteSchema.post('init', function () {
  if (this.soap) {
    const { decryptField } = require('@/lib/encryption/phi-encryption.js');
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
      logger.error('ClinicalNote SOAP decryption failed', { message: error?.message });
    }
  }
});

// Pre-save hook to generate consultation number
ClinicalNoteSchema.pre('save', async function (next) {
  // Generate consultation number if not exists
  if (!this.consultationNumber && this.tenantId) {
    const { generateConsultationNumber } = await import('@/lib/utils/number-generator.js');
    try {
      this.consultationNumber = await generateConsultationNumber(this.tenantId);
    } catch (error) {
      logger.error('ClinicalNote consultation number generation failed', { message: error?.message });
      // Continue without number if generation fails
    }
  }
  
  // Set date if not provided
  if (!this.date) {
    this.date = new Date();
  }
  
  next();
});

// Indexes
ClinicalNoteSchema.index({ tenantId: 1, patientId: 1, date: -1 });
ClinicalNoteSchema.index({ tenantId: 1, doctorId: 1, date: -1 });
ClinicalNoteSchema.index({ tenantId: 1, appointmentId: 1 });
ClinicalNoteSchema.index({ tenantId: 1, deletedAt: 1 });
ClinicalNoteSchema.index({ tenantId: 1, type: 1 });
ClinicalNoteSchema.index({ tenantId: 1, status: 1 });
ClinicalNoteSchema.index({ consultationNumber: 1 }, { unique: true, sparse: true });
ClinicalNoteSchema.index({ previousVersionId: 1 }); // For version history

export default mongoose.models.ClinicalNote || mongoose.model('ClinicalNote', ClinicalNoteSchema);

