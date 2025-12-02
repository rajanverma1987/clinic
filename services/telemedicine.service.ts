/**
 * Telemedicine Service
 * Handles video consultations, chat, and session management
 */

import connectDB from '@/lib/db/connection';
import TelemedicineSession, { ITelemedicineSession, SessionStatus, SessionType } from '@/models/TelemedicineSession';
import { withTenant } from '@/lib/db/tenant-helper';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger';

/**
 * Generate unique session ID
 */
async function generateSessionId(tenantId: string): Promise<string> {
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

  const sessionId = (lastSession as any).sessionId;
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
export async function createTelemedicineSession(
  tenantId: string,
  userId: string,
  data: {
    patientId: string;
    doctorId: string;
    sessionType: SessionType;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
    appointmentId?: string;
    chatEnabled?: boolean;
    recordingConsent?: boolean;
  }
): Promise<ITelemedicineSession> {
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
export async function getSessionById(
  sessionId: string,
  tenantId: string
): Promise<ITelemedicineSession | null> {
  await connectDB();

  return await TelemedicineSession.findOne(
    withTenant(tenantId, { _id: sessionId })
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .lean() as unknown as ITelemedicineSession | null;
}

/**
 * List sessions
 */
export async function listSessions(
  tenantId: string,
  filters?: {
    patientId?: string;
    doctorId?: string;
    status?: SessionStatus;
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ITelemedicineSession[]> {
  await connectDB();

  const query: any = withTenant(tenantId, {});

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
    .lean() as unknown as ITelemedicineSession[];
}

/**
 * Start session
 */
export async function startSession(
  sessionId: string,
  tenantId: string,
  userId: string,
  roomId?: string
): Promise<ITelemedicineSession | null> {
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
export async function endSession(
  sessionId: string,
  tenantId: string,
  userId: string,
  data?: {
    notes?: string;
    diagnosis?: string;
    connectionQuality?: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
    technicalIssues?: string;
  }
): Promise<ITelemedicineSession | null> {
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
export async function addChatMessage(
  sessionId: string,
  tenantId: string,
  senderId: string,
  senderName: string,
  message: string
): Promise<ITelemedicineSession | null> {
  await connectDB();

  const session = await TelemedicineSession.findOne(
    withTenant(tenantId, { _id: sessionId })
  );

  if (!session) return null;

  session.chatMessages.push({
    senderId: senderId as any,
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
export async function cancelSession(
  sessionId: string,
  tenantId: string,
  userId: string,
  reason?: string
): Promise<ITelemedicineSession | null> {
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

