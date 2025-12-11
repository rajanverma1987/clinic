import mongoose, { Schema } from 'mongoose';

const TenantSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    region: {
      type: String,
      required: true,
      enum: ['US', 'EU', 'APAC', 'IN', 'ME', 'CA', 'AU'],
    },
    settings: {
      currency: {
        type: String,
        required: true,
        default: 'USD',
      },
      locale: {
        type: String,
        required: true,
        default: 'en-US',
      },
      timezone: {
        type: String,
        required: true,
        default: 'UTC',
      },
      prescriptionValidityDays: {
        type: Number,
        default: 30, // days
      },
      taxRules: {
        country: String,
        taxType: {
          type: String,
          enum: ['GST', 'VAT', 'SALES_TAX'],
        },
        rate: Number,
      },
      dataRetentionYears: Number,
      complianceSettings: {
        hipaa: Boolean,
        gdpr: Boolean,
        pipeda: Boolean,
        privacyAct: Boolean,
      },
      queueSettings: {
        displayOrder: {
          type: String,
          enum: ['priority', 'fifo', 'appointment_time'],
          default: 'priority',
        },
        averageConsultationTime: {
          type: Number,
          default: 30, // minutes
        },
        enablePublicDisplay: {
          type: Boolean,
          default: false,
        },
        showEstimatedWaitTime: {
          type: Boolean,
          default: true,
        },
        autoCallNext: {
          type: Boolean,
          default: false,
        },
        maxQueueLength: Number,
      },
      clinicHours: [
        {
          day: String,
          isOpen: {
            type: Boolean,
            default: true,
          },
          timeSlots: [
            {
              startTime: String,
              endTime: String,
            },
          ],
        },
      ],
      smtp: {
        enabled: {
          type: Boolean,
          default: false,
        },
        host: String,
        port: {
          type: Number,
          default: 587,
        },
        secure: {
          type: Boolean,
          default: false,
        },
        user: String,
        password: String,
        fromEmail: String,
        fromName: String,
        rejectUnauthorized: {
          type: Boolean,
          default: true,
        },
      },
      holidays: [
        {
          id: String,
          name: String,
          date: Date,
          isRecurring: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
TenantSchema.index({ slug: 1 });
TenantSchema.index({ region: 1 });

export default mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);
