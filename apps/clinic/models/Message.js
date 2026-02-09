import mongoose, { Schema } from 'mongoose';

export const MessageFolder = {
  INBOX: 'inbox',
  SENT: 'sent',
  ARCHIVE: 'archive',
  TRASH: 'trash',
};

export const MessageStatus = {
  UNREAD: 'unread',
  READ: 'read',
  REPLIED: 'replied',
};

const MessageSchema = new Schema(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    from: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    to: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    folder: {
      type: String,
      enum: Object.values(MessageFolder),
      default: MessageFolder.INBOX,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(MessageStatus),
      default: MessageStatus.UNREAD,
      index: true,
    },
    readAt: {
      type: Date,
    },
    parentMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    attachments: [
      {
        filename: String,
        url: String,
        size: Number,
        mimeType: String,
      },
    ],
    relatedAppointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    relatedPatientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
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

// Indexes
MessageSchema.index({ from: 1, folder: 1, createdAt: -1 });
MessageSchema.index({ to: 1, folder: 1, createdAt: -1 });
// status: use field-level index: true only (no duplicate schema.index)
MessageSchema.index({ deletedAt: 1 });
MessageSchema.index({ parentMessageId: 1 });

// Virtual for unread count
MessageSchema.statics.getUnreadCount = async function (
  userId,
  tenantId,
  folder = MessageFolder.INBOX
) {
  return await this.countDocuments({
    to: userId,
    tenantId,
    folder,
    status: MessageStatus.UNREAD,
    deletedAt: null,
  });
};

const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);

export default Message;
