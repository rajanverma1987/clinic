import mongoose, { Schema } from 'mongoose';

export const AppointmentStatus = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  ARRIVED: 'arrived',
  IN_QUEUE: 'in_queue',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
};

export const AppointmentType = {
  CONSULTATION: 'consultation',
  FOLLOW_UP: 'follow_up',
  CHECKUP: 'checkup',
  EMERGENCY: 'emergency',
  PROCEDURE: 'procedure',
  LAB_TEST: 'lab_test',
};

const AppointmentSchema = new Schema(
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
    
    // Telemedicine
    isTelemedicine: {
      type: Boolean,
      default: false,
      index: true,
    },
    telemedicineSessionId: {
      type: Schema.Types.ObjectId,
      ref: 'TelemedicineSession',
    },
    telemedicineConsent: {
      type: Boolean,
      default: false,
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

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

