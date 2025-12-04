import mongoose, { Schema } from 'mongoose';

export const SessionStatus = {
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
};

export const SessionType = {
  VIDEO: 'VIDEO',
  AUDIO: 'AUDIO',
  CHAT: 'CHAT',
};

const TelemedicineSessionSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
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
    
    sessionType: {
      type: String,
      enum: Object.values(SessionType),
      default: SessionType.VIDEO,
      required: true,
    },
    
    status: {
      type: String,
      enum: Object.values(SessionStatus),
      default: SessionStatus.SCHEDULED,
      required: true,
      index: true,
    },
    
    scheduledStartTime: {
      type: Date,
      required: true,
    },
    
    scheduledEndTime: {
      type: Date,
      required: true,
    },
    
    actualStartTime: Date,
    actualEndTime: Date,
    duration: Number,
    
    roomId: String,
    recordingUrl: String,
    
    recordingConsent: {
      type: Boolean,
      default: false,
    },
    
    chatEnabled: {
      type: Boolean,
      default: true,
    },
    
    chatMessages: [
      {
        senderId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        senderName: String,
        message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        isEncrypted: {
          type: Boolean,
          default: false,
        },
      },
    ],
    
    sharedFiles: [
      {
        fileName: String,
        fileUrl: String,
        uploadedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    
    notes: String,
    diagnosis: String,
    
    prescriptionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Prescription',
      },
    ],
    
    connectionQuality: {
      type: String,
      enum: ['EXCELLENT', 'GOOD', 'FAIR', 'POOR'],
    },
    
    technicalIssues: String,
    cancellationReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
TelemedicineSessionSchema.index({ tenantId: 1, sessionId: 1 });
TelemedicineSessionSchema.index({ tenantId: 1, patientId: 1 });
TelemedicineSessionSchema.index({ tenantId: 1, doctorId: 1 });
TelemedicineSessionSchema.index({ tenantId: 1, status: 1 });
TelemedicineSessionSchema.index({ tenantId: 1, scheduledStartTime: 1 });

export default mongoose.models.TelemedicineSession || mongoose.model('TelemedicineSession', TelemedicineSessionSchema);

