import mongoose, { Schema, Document } from 'mongoose';

export enum QueueStatus {
  WAITING = 'waiting',
  CALLED = 'called',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
}

export enum QueuePriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum QueueType {
  APPOINTMENT = 'appointment',
  WALK_IN = 'walk_in',
}

export interface IQueue extends Document {
  tenantId: mongoose.Types.ObjectId;
  
  // Queue Entry Type
  type: QueueType; // appointment or walk_in
  appointmentId?: mongoose.Types.ObjectId; // If linked to appointment
  
  // Patient Information (for walk-ins or quick reference)
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId; // Assigned doctor
  
  // Queue Management
  queueNumber: string; // Auto-generated: Q-0001, Q-0002...
  position: number; // Current position in queue (1-based)
  priority: QueuePriority;
  status: QueueStatus;
  
  // Timing Information
  joinedAt: Date; // When patient joined queue
  calledAt?: Date; // When patient was called
  startedAt?: Date; // When consultation started
  completedAt?: Date; // When consultation completed
  estimatedWaitTime?: number; // Estimated wait time in minutes
  actualWaitTime?: number; // Actual wait time in minutes
  
  // Display Information (for public displays - no PHI)
  displayName?: string; // Patient name or queue number for display
  reason?: string; // Reason for visit (encrypted if PHI)
  
  // Queue Management
  calledBy?: mongoose.Types.ObjectId; // Staff who called the patient
  notes?: string; // General notes
  
  // Metadata
  isActive: boolean;
  deletedAt?: Date; // Soft delete
  
  createdAt: Date;
  updatedAt: Date;
}

const QueueSchema = new Schema<IQueue>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    
    // Queue Entry Type
    type: {
      type: String,
      enum: Object.values(QueueType),
      required: true,
      index: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      index: true,
    },
    
    // Patient Information
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
    
    // Queue Management
    queueNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    position: {
      type: Number,
      required: true,
      default: 1,
    },
    priority: {
      type: String,
      enum: Object.values(QueuePriority),
      required: true,
      default: QueuePriority.NORMAL,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(QueueStatus),
      required: true,
      default: QueueStatus.WAITING,
      index: true,
    },
    
    // Timing Information
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    calledAt: Date,
    startedAt: Date,
    completedAt: Date,
    estimatedWaitTime: Number, // in minutes
    actualWaitTime: Number, // in minutes
    
    // Display Information
    displayName: {
      type: String,
      trim: true,
    },
    reason: {
      type: String,
      trim: true,
      // Will be encrypted if contains PHI
    },
    
    // Queue Management
    calledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      trim: true,
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

// Compound indexes for common queries
QueueSchema.index({ tenantId: 1, doctorId: 1, status: 1, position: 1 });
QueueSchema.index({ tenantId: 1, status: 1, priority: -1, position: 1 }); // For queue ordering
QueueSchema.index({ tenantId: 1, appointmentId: 1 });
QueueSchema.index({ tenantId: 1, queueNumber: 1 }, { unique: true });
QueueSchema.index({ tenantId: 1, deletedAt: 1 });
QueueSchema.index({ tenantId: 1, joinedAt: -1 }); // For recent entries
QueueSchema.index({ tenantId: 1, doctorId: 1, status: 1, joinedAt: 1 }); // For doctor's queue

export default mongoose.models.Queue || mongoose.model<IQueue>('Queue', QueueSchema);

