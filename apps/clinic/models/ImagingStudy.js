import mongoose, { Schema } from 'mongoose';
import { phiEncryptionPlugin } from '@/lib/encryption/phi-encryption.js';

/**
 * ImagingStudy Model
 * Radiology/imaging study results (X-rays, CT scans, MRIs, etc.)
 * HIPAA-compliant with PHI encryption
 */
export const ImagingStudyType = {
  X_RAY: 'x_ray',
  CT_SCAN: 'ct_scan',
  MRI: 'mri',
  ULTRASOUND: 'ultrasound',
  MAMMOGRAPHY: 'mammography',
  DEXA_SCAN: 'dexa_scan',
  ECHOCARDIOGRAM: 'echocardiogram',
  OTHER: 'other',
};

export const ImagingStudyStatus = {
  ORDERED: 'ordered',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REPORTED: 'reported',
  DELIVERED: 'delivered',
};

const ImagingStudySchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    // Auto-generated study number (e.g., "IMG001234")
    studyNumber: {
      type: String,
      unique: true,
      uppercase: true,
      index: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      index: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    // Study details
    studyType: {
      type: String,
      enum: Object.values(ImagingStudyType),
      required: true,
    },
    bodyPart: {
      type: String,
      required: true,
      trim: true,
    },
    clinicalIndication: {
      type: String,
      trim: true,
      // Will be encrypted by plugin
    },
    // Study dates
    orderedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    performedAt: Date,
    reportedAt: Date,
    // Status
    status: {
      type: String,
      enum: Object.values(ImagingStudyStatus),
      required: true,
      default: ImagingStudyStatus.ORDERED,
      index: true,
    },
    // Images (URLs to stored files)
    images: [
      {
        url: String,
        thumbnailUrl: String,
        description: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Report
    report: {
      findings: {
        type: String,
        trim: true,
        // Will be encrypted by plugin
      },
      impression: {
        type: String,
        trim: true,
        // Will be encrypted by plugin
      },
      recommendations: {
        type: String,
        trim: true,
      },
      reportedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      reportedAt: Date,
    },
    // DICOM metadata (if applicable)
    dicomMetadata: {
      studyInstanceUID: String,
      seriesInstanceUID: String,
      modality: String,
      manufacturer: String,
      model: String,
    },
    // Notes
    notes: {
      type: String,
      trim: true,
    },
    // Created by
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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

// Apply PHI encryption plugin
ImagingStudySchema.plugin(phiEncryptionPlugin, {
  encryptedFields: ['clinicalIndication', 'report.findings', 'report.impression'],
});

// Compound indexes
ImagingStudySchema.index({ tenantId: 1, patientId: 1, createdAt: -1 });
ImagingStudySchema.index({ tenantId: 1, doctorId: 1, status: 1 });
ImagingStudySchema.index({ tenantId: 1, studyType: 1, status: 1 });
ImagingStudySchema.index({ tenantId: 1, studyNumber: 1 }, { unique: true });

export default mongoose.models.ImagingStudy || mongoose.model('ImagingStudy', ImagingStudySchema);
