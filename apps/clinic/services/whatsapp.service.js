/**
 * WhatsApp Service
 * Handles WhatsApp Business API integration for two-way communication
 * Based on NEW-PLANS.md requirements
 */

import connectDB from '@/lib/db/connection.js';
import WhatsAppMessage from '@/models/WhatsAppMessage.js';
import Patient from '@/models/Patient.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import { sendWhatsApp } from '@/services/notification.service.js';

/**
 * Send WhatsApp message and log it
 */
export async function sendWhatsAppMessage(input, tenantId, userId) {
  await connectDB();

  // Find patient by phone if patientId not provided
  let patientId = input.patientId;
  if (!patientId && input.phoneNumber) {
    const patient = await Patient.findOne(
      withTenant(tenantId, {
        phone: input.phoneNumber,
        deletedAt: null,
      })
    ).lean();
    patientId = patient?._id;
  }

  // Send message via notification service
  const result = await sendWhatsApp(input.phoneNumber, input.message, tenantId);

  // Log the message
  const message = await WhatsAppMessage.create({
    tenantId,
    patientId,
    userId,
    direction: 'outbound',
    from: process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER,
    to: input.phoneNumber,
    messageBody: input.message,
    messageSid: result.messageId,
    status: result.success ? 'sent' : 'failed',
    messageType: input.templateName ? 'template' : 'text',
    templateName: input.templateName,
    relatedTo: input.relatedTo,
    sentAt: new Date(),
    errorMessage: result.error,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'whatsapp_message',
    message._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
    undefined,
    { direction: 'outbound', to: input.phoneNumber }
  );

  return {
    message,
    sendResult: result,
  };
}

/**
 * Log incoming WhatsApp message (from webhook)
 */
export async function logIncomingMessage(webhookData, tenantId) {
  await connectDB();

  const from = webhookData.From?.replace('whatsapp:', '') || webhookData.from;
  const messageBody = webhookData.Body || webhookData.messageBody || '';
  const messageSid = webhookData.MessageSid || webhookData.messageSid;

  // Find patient by phone
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      phone: from,
      deletedAt: null,
    })
  ).lean();

  // Log the message
  const message = await WhatsAppMessage.create({
    tenantId,
    patientId: patient?._id,
    direction: 'inbound',
    from: from,
    to: process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER,
    messageBody: messageBody,
    messageSid: messageSid,
    status: 'delivered',
    messageType: 'text',
    webhookData: webhookData,
    sentAt: new Date(webhookData.Timestamp || Date.now()),
  });

  // Audit log
  await AuditLogger.auditWrite(
    'whatsapp_message',
    message._id.toString(),
    'system',
    tenantId,
    AuditAction.CREATE,
    undefined,
    { direction: 'inbound', from: from }
  );

  return message;
}

/**
 * Update message status (from webhook)
 */
export async function updateMessageStatus(messageSid, status, webhookData, tenantId) {
  await connectDB();

  const updateData = {
    status: status.toLowerCase(),
    webhookData: webhookData,
  };

  if (status === 'delivered') {
    updateData.deliveredAt = new Date();
  } else if (status === 'read') {
    updateData.readAt = new Date();
  }

  const message = await WhatsAppMessage.findOneAndUpdate(
    withTenant(tenantId, {
      messageSid: messageSid,
    }),
    { $set: updateData },
    { new: true }
  );

  return message;
}

/**
 * List WhatsApp messages
 */
export async function listWhatsAppMessages(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  const filter = withTenant(tenantId, {});

  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  if (query.direction) {
    filter.direction = query.direction;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.from) {
    filter.from = { $regex: query.from, $options: 'i' };
  }

  if (query.startDate || query.endDate) {
    filter.sentAt = {};
    if (query.startDate) {
      filter.sentAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.sentAt.$lte = new Date(query.endDate);
    }
  }

  const total = await WhatsAppMessage.countDocuments(filter);

  const messages = await WhatsAppMessage.find(filter)
    .populate('patientId', 'firstName lastName phone')
    .populate('userId', 'firstName lastName')
    .sort({ sentAt: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  await AuditLogger.auditWrite(
    'whatsapp_message',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: messages.length, filters: query }
  );

  return createPaginationResult(messages, total, page || 1, limit || 10);
}

/**
 * Get conversation thread (messages between patient and clinic)
 */
export async function getConversationThread(patientId, tenantId, userId) {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null,
    })
  ).lean();

  if (!patient) {
    return null;
  }

  const messages = await WhatsAppMessage.find(
    withTenant(tenantId, {
      $or: [
        { patientId: patientId },
        { from: patient.phone },
        { to: patient.phone },
      ],
    })
  )
    .sort({ sentAt: 1 })
    .lean();

  await AuditLogger.auditRead('whatsapp_message', `conversation_${patientId}`, userId, tenantId);

  return {
    patient: {
      id: patient._id.toString(),
      name: `${patient.firstName} ${patient.lastName}`,
      phone: patient.phone,
    },
    messages,
  };
}
