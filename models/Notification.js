import mongoose, { Schema } from 'mongoose';

/**
 * Notification Model
 * System notifications for users
 * Based on NEW-PLANS.md schema specification
 */
const NotificationSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['appointment', 'prescription', 'payment', 'lab_result', 'system'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    // Additional data for the notification
    data: {
      type: Schema.Types.Mixed,
    },
    // Delivery channels
    channels: {
      inApp: {
        sent: {
          type: Boolean,
          default: false,
        },
        read: {
          type: Boolean,
          default: false,
        },
        readAt: Date,
      },
      email: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        opened: {
          type: Boolean,
          default: false,
        },
      },
      sms: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        status: {
          type: String,
          enum: ['pending', 'delivered', 'failed'],
        },
      },
      whatsapp: {
        sent: {
          type: Boolean,
          default: false,
        },
        sentAt: Date,
        status: {
          type: String,
          enum: ['pending', 'delivered', 'failed'],
        },
      },
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes
NotificationSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, 'channels.inApp.read': 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
