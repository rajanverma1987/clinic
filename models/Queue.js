import mongoose, { Schema } from 'mongoose';

export const QueueStatus = {
  WAITING: 'waiting',
  CALLED: 'called',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped',
  CANCELLED: 'cancelled',
};

export const QueuePriority = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const QueueType = {
  APPOINTMENT: 'appointment',
  WALK_IN: 'walk_in',
};

const QueueSchema = new Schema(
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

export default mongoose.models.Queue || mongoose.model('Queue', QueueSchema);

