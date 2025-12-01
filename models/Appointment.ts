import mongoose, { Schema, Document } from 'mongoose';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  ARRIVED = 'arrived',
  IN_QUEUE = 'in_queue',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  CHECKUP = 'checkup',
  EMERGENCY = 'emergency',
  PROCEDURE = 'procedure',
  LAB_TEST = 'lab_test',
}

export interface IAppointment extends Document {
  tenantId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId; // Assigned doctor
  
  // Appointment Details
  appointmentDate: Date;
  startTime: Date;
  endTime: Date;
  duration: number; // in minutes
  type: AppointmentType;
  status: AppointmentStatus;
  
  // Reason and Notes
  reason?: string; // Encrypted if contains PHI
  notes?: string; // General notes
  
  // Reminders
  reminderSent: boolean;
  reminderSentAt?: Date;
  reminderScheduledAt?: Date; // When to send reminder
  
  // Cancellation
  cancelledAt?: Date;
  cancelledBy?: mongoose.Types.ObjectId;
  cancellationReason?: string;
  
  // Visit Information
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Metadata
  isActive: boolean;
  deletedAt?: Date; // Soft delete
  
  createdAt: Date;
  updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
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
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Appointment Details
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
      default: 30, // Default 30 minutes
    },
    type: {
      type: String,
      enum: Object.values(AppointmentType),
      required: true,
      default: AppointmentType.CONSULTATION,
    },
    status: {
      type: String,
      enum: Object.values(AppointmentStatus),
      required: true,
      default: AppointmentStatus.SCHEDULED,
      index: true,
    },
    
    // Reason and Notes
    reason: {
      type: String,
      trim: true,
      // Will be encrypted if contains PHI
    },
    notes: {
      type: String,
      trim: true,
    },
    
    // Reminders
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: Date,
    reminderScheduledAt: Date,
    
    // Cancellation
    cancelledAt: Date,
    cancelledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: String,
    
    // Visit Information
    arrivedAt: Date,
    startedAt: Date,
    completedAt: Date,
    
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
AppointmentSchema.index({ tenantId: 1, appointmentDate: 1, status: 1 });
AppointmentSchema.index({ tenantId: 1, doctorId: 1, appointmentDate: 1 });
AppointmentSchema.index({ tenantId: 1, patientId: 1, appointmentDate: -1 });
AppointmentSchema.index({ tenantId: 1, status: 1, appointmentDate: 1 });
AppointmentSchema.index({ tenantId: 1, deletedAt: 1 });
AppointmentSchema.index({ reminderScheduledAt: 1, reminderSent: 1 }); // For reminder queries

// Index for finding appointments needing reminders
AppointmentSchema.index({
  tenantId: 1,
  reminderScheduledAt: 1,
  reminderSent: 1,
  status: 1,
});

export default mongoose.models.Appointment || mongoose.model<IAppointment>('Appointment', AppointmentSchema);

