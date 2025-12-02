import mongoose, { Schema, Document } from 'mongoose';

export enum SessionStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export enum SessionType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  CHAT = 'CHAT',
}

export interface ChatMessage {
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  timestamp: Date;
  isEncrypted: boolean;
}

export interface ITelemedicineSession extends Document {
  tenantId: mongoose.Types.ObjectId;
  
  // Session Details
  sessionId: string; // Unique session ID
  appointmentId?: mongoose.Types.ObjectId; // Link to appointment
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  
  // Session Info
  sessionType: SessionType;
  status: SessionStatus;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  duration?: number; // In minutes
  
  // Video/Audio
  roomId?: string; // Video service room ID
  recordingUrl?: string; // If session was recorded
  recordingConsent: boolean; // Patient consent for recording
  
  // Chat
  chatEnabled: boolean;
  chatMessages: ChatMessage[];
  
  // Attachments
  sharedFiles: Array<{
    fileName: string;
    fileUrl: string;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
  }>;
  
  // Clinical Notes
  notes?: string; // Doctor's notes post-consultation
  diagnosis?: string;
  prescriptionIds?: mongoose.Types.ObjectId[];
  
  // Metadata
  connectionQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  technicalIssues?: string;
  cancellationReason?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const TelemedicineSessionSchema = new Schema<ITelemedicineSession>(
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

export default mongoose.models.TelemedicineSession || mongoose.model<ITelemedicineSession>('TelemedicineSession', TelemedicineSessionSchema);

