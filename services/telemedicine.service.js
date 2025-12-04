/**
 * Telemedicine Service
 * Handles video consultations, chat, and session management
 */

import connectDB from '@/lib/db/connection.js';
import TelemedicineSession, { SessionStatus } from '@/models/TelemedicineSession.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Generate unique session ID
 */
async function generateSessionId(tenantId) {
  await connectDB();

  const lastSession = await TelemedicineSession.findOne(
    withTenant(tenantId, {}),
    { sessionId: 1 }
  )
    .sort({ sessionId: -1 })
    .lean();

  if (!lastSession) {
    return 'TM-0001';
  }

  const sessionId = lastSession.sessionId;
  if (!sessionId) {
    return 'TM-0001';
  }

  const match = sessionId.match(/(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `TM-${nextNum.toString().padStart(4, '0')}`;
  }

  return 'TM-0001';
}

/**
 * Create telemedicine session
 */
export async function createTelemedicineSession(tenantId, userId, data) {
  await connectDB();

  const sessionId = await generateSessionId(tenantId);

  const session = await TelemedicineSession.create({
    tenantId,
    sessionId,
    ...data,
    status: SessionStatus.SCHEDULED,
    chatEnabled: data.chatEnabled ?? true,
    recordingConsent: data.recordingConsent ?? false,
    chatMessages: [],
    sharedFiles: [],
  });

  // Audit log
  await AuditLogger.auditWrite(
    'telemedicine_session',
    session._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return session;
}

/**
 * Get session by ID
 */
export async function getSessionById(sessionId, tenantId) {
  await connectDB();

  return await TelemedicineSession.findOne(
    withTenant(tenantId, { _id: sessionId })
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .lean();
}

/**
 * List sessions
 */
export async function listSessions(tenantId, filters) {
  await connectDB();

  const query = withTenant(tenantId, {});

  if (filters?.patientId) query.patientId = filters.patientId;
  if (filters?.doctorId) query.doctorId = filters.doctorId;
  if (filters?.status) query.status = filters.status;
  if (filters?.startDate || filters?.endDate) {
    query.scheduledStartTime = {};
    if (filters.startDate) query.scheduledStartTime.$gte = filters.startDate;
    if (filters.endDate) query.scheduledStartTime.$lte = filters.endDate;
  }

  return await TelemedicineSession.find(query)
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .sort({ scheduledStartTime: -1 })
    .lean();
}

/**
 * Start session
 */
export async function startSession(sessionId, tenantId, userId, roomId) {
  await connectDB();

  const session = await TelemedicineSession.findOne(
    withTenant(tenantId, { _id: sessionId })
  );

  if (!session) return null;

  session.status = SessionStatus.IN_PROGRESS;
  session.actualStartTime = new Date();
  if (roomId) session.roomId = roomId;

  await session.save();

  // Audit log
  await AuditLogger.auditWrite(
    'telemedicine_session',
    session._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    undefined,
    { action: 'start_session' }
  );

  return session;
}

/**
 * End session
 */
export async function endSession(sessionId, tenantId, userId, data) {
  await connectDB();

  const session = await TelemedicineSession.findOne(
    withTenant(tenantId, { _id: sessionId })
  );

  if (!session) return null;

  session.status = SessionStatus.COMPLETED;
  session.actualEndTime = new Date();
  
  if (session.actualStartTime) {
    const duration = Math.round(
      (session.actualEndTime.getTime() - session.actualStartTime.getTime()) / 1000 / 60
    );
    session.duration = duration;
  }

  if (data?.notes) session.notes = data.notes;
  if (data?.diagnosis) session.diagnosis = data.diagnosis;
  if (data?.connectionQuality) session.connectionQuality = data.connectionQuality;
  if (data?.technicalIssues) session.technicalIssues = data.technicalIssues;

  await session.save();

  // Audit log
  await AuditLogger.auditWrite(
    'telemedicine_session',
    session._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    undefined,
    { action: 'end_session', duration: session.duration }
  );

  return session;
}

/**
 * Add chat message
 */
export async function addChatMessage(sessionId, tenantId, senderId, senderName, message) {
  await connectDB();

  const session = await TelemedicineSession.findOne(
    withTenant(tenantId, { _id: sessionId })
  );

  if (!session) return null;

  session.chatMessages.push({
    senderId: senderId,
    senderName,
    message,
    timestamp: new Date(),
    isEncrypted: false, // TODO: Implement encryption
  });

  await session.save();

  return session;
}

/**
 * Cancel session
 */
export async function cancelSession(sessionId, tenantId, userId, reason) {
  await connectDB();

  const session = await TelemedicineSession.findOne(
    withTenant(tenantId, { _id: sessionId })
  );

  if (!session) return null;

  session.status = SessionStatus.CANCELLED;
  if (reason) session.cancellationReason = reason;

  await session.save();

  // Audit log
  await AuditLogger.auditWrite(
    'telemedicine_session',
    session._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    undefined,
    { action: 'cancel_session', reason }
  );

  return session;
}

