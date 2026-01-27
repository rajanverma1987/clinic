import mongoose, { Schema } from 'mongoose';

/**
 * Notification Template Model
 * Stores reusable notification templates for different types
 * Based on NEW-PLANS.md requirements
 */
const NotificationTemplateSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['appointment', 'prescription', 'payment', 'lab_result', 'system'],
      required: true,
      index: true,
    },
    channels: {
      email: {
        enabled: {
          type: Boolean,
          default: true,
        },
        subject: {
          type: String,
          trim: true,
        },
        html: {
          type: String,
        },
        text: {
          type: String,
        },
      },
      sms: {
        enabled: {
          type: Boolean,
          default: true,
        },
        message: {
          type: String,
          maxlength: 1600, // SMS character limit
        },
      },
      whatsapp: {
        enabled: {
          type: Boolean,
          default: true,
        },
        message: {
          type: String,
        },
      },
    },
    variables: {
      type: [String], // List of available variables like {{patientName}}, {{appointmentDate}}, etc.
      default: [],
    },
    isDefault: {
      type: Boolean,
      default: false,
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

// Compound indexes
NotificationTemplateSchema.index({ tenantId: 1, type: 1, isActive: 1 });
NotificationTemplateSchema.index({ tenantId: 1, name: 1 }, { unique: true });

export default mongoose.models.NotificationTemplate || mongoose.model('NotificationTemplate', NotificationTemplateSchema);
