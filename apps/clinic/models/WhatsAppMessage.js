import mongoose, { Schema } from 'mongoose';

/**
 * WhatsApp Message Model
 * Logs all WhatsApp messages (incoming and outgoing) for two-way communication
 * Based on NEW-PLANS.md requirements
 */
const WhatsAppMessageSchema = new Schema(
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
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Message direction
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true,
      index: true,
    },
    // Phone numbers
    from: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    to: {
      type: String,
      required: true,
      trim: true,
    },
    // Message content
    messageBody: {
      type: String,
      required: true,
    },
    messageSid: {
      type: String,
      trim: true,
    },
    // Message status (for outbound)
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'failed', 'undelivered'],
      default: 'queued',
      index: true,
    },
    // Message type
    messageType: {
      type: String,
      enum: ['text', 'template', 'media', 'location', 'interactive'],
      default: 'text',
    },
    // Template name (if template message)
    templateName: {
      type: String,
      trim: true,
    },
    // Media URLs (if media message)
    mediaUrl: {
      type: String,
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'audio', 'document'],
    },
    // Related entities
    relatedTo: {
      type: {
        type: String,
        enum: ['appointment', 'prescription', 'invoice', 'lab_result', 'general'],
      },
      id: {
        type: Schema.Types.ObjectId,
      },
    },
    // Twilio webhook data
    webhookData: {
      type: Schema.Types.Mixed,
    },
    // Error information (if failed)
    errorMessage: {
      type: String,
    },
    // Timestamps
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
WhatsAppMessageSchema.index({ tenantId: 1, patientId: 1, sentAt: -1 });
WhatsAppMessageSchema.index({ tenantId: 1, from: 1, sentAt: -1 });
WhatsAppMessageSchema.index({ tenantId: 1, direction: 1, status: 1 });
WhatsAppMessageSchema.index({ messageSid: 1 }, { unique: true, sparse: true });

export default mongoose.models.WhatsAppMessage || mongoose.model('WhatsAppMessage', WhatsAppMessageSchema);
