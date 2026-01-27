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
    // Auto-generated appointment number (e.g., "APT001234")
    appointmentNumber: {
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
    departmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      index: true,
    },
    
    // Appointment Details - Schedule object as per NEW-PLANS.md
    schedule: {
      date: {
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
        default: 30, // minutes
      },
    },
    // Legacy fields for backward compatibility
    appointmentDate: {
      type: Date,
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
    
    // Booking source as per NEW-PLANS.md
    bookingSource: {
      type: String,
      enum: ['walk_in', 'phone', 'online', 'app'],
      default: 'walk_in',
      index: true,
    },
    // Chief complaint (primary reason for visit)
    chiefComplaint: {
      type: String,
      trim: true,
      // Will be encrypted if contains PHI
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
    
    // Reminders sent array as per NEW-PLANS.md
    remindersSent: [{
      type: {
        type: String,
        enum: ['sms', 'email', 'whatsapp'],
        required: true,
      },
      sentAt: {
        type: Date,
        required: true,
      },
      status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'failed'],
        default: 'sent',
      },
    }],
    // Legacy reminder fields for backward compatibility
    reminderSent: {
      type: Boolean,
      default: false,
    },
    reminderSentAt: Date,
    reminderScheduledAt: Date,
    
    // Cancellation object as per NEW-PLANS.md
    cancellation: {
      cancelledAt: Date,
      cancelledBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      reason: {
        type: String,
        trim: true,
      },
    },
    // Legacy cancellation fields for backward compatibility
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
    
    // Created by user
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Pre-save hook to generate appointment number and sync schedule fields
AppointmentSchema.pre('save', async function (next) {
  // Generate appointment number if not exists
  if (!this.appointmentNumber) {
    const count = await mongoose.models.Appointment?.countDocuments({ tenantId: this.tenantId }) || 0;
    this.appointmentNumber = `APT${String(count + 1).padStart(6, '0')}`;
  }
  
  // Sync schedule.date with appointmentDate for backward compatibility
  if (this.schedule?.date && !this.appointmentDate) {
    this.appointmentDate = this.schedule.date;
  }
  if (this.appointmentDate && !this.schedule?.date) {
    if (!this.schedule) this.schedule = {};
    this.schedule.date = this.appointmentDate;
  }
  
  // Sync cancellation fields
  if (this.cancelledAt && !this.cancellation?.cancelledAt) {
    if (!this.cancellation) this.cancellation = {};
    this.cancellation.cancelledAt = this.cancelledAt;
  }
  if (this.cancelledBy && !this.cancellation?.cancelledBy) {
    if (!this.cancellation) this.cancellation = {};
    this.cancellation.cancelledBy = this.cancelledBy;
  }
  if (this.cancellationReason && !this.cancellation?.reason) {
    if (!this.cancellation) this.cancellation = {};
    this.cancellation.reason = this.cancellationReason;
  }
  
  next();
});

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

