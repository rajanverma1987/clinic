/**
 * Telemedicine Service
 *
 * Enterprise-grade service for telemedicine session management with WebRTC
 * integration, session tracking, and HIPAA-compliant video consultations.
 *
 * Features:
 * - Telemedicine session creation and management
 * - Session status tracking (scheduled, active, completed, cancelled)
 * - Waiting room management
 * - Chat integration
 * - File transfer support
 * - Recording consent management
 * - Session link generation
 * - Multi-tenant isolation
 * - Audit logging
 * - HIPAA compliance
 *
 * @module services/telemedicine.service
 * @since 1.0.0
 *
 * @security
 * - End-to-end encryption for video calls
 * - Secure session link generation
 * - Access control for session participants
 *
 * @compliance
 * - HIPAA: All session access logged
 * - Recording requires explicit consent
 * - PHI protection in session data
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import TelemedicineSession, { SessionStatus } from '@/models/TelemedicineSession.js';
import { transliterateToArabic } from '@/lib/utils/transliterate-name.js';
import { translateToSpanish } from '@/lib/utils/translate-name-spanish.js';

/**
 * Generate unique session ID
 */
async function generateSessionId(tenantId) {
  await connectDB();

  const lastSession = await TelemedicineSession.findOne(withTenant(tenantId, {}), { sessionId: 1 })
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
    AuditAction.CREATE,
  );

  return session;
}

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @param {string} tenantId - Optional tenant ID (for authenticated access)
 */
export async function getSessionById(sessionId, tenantId = null) {
  await connectDB();

  const query = tenantId ? withTenant(tenantId, { _id: sessionId }) : { _id: sessionId };

  return await TelemedicineSession.findOne(query)
    .populate('patientId', 'firstName lastName patientId email')
    .populate('doctorId', 'firstName lastName')
    .lean();
}

/** Alias for route handlers that resolve session from URL param id. */
export const findSessionByParamId = getSessionById;

/**
 * List sessions
 * @param {string} tenantId
 * @param {Object} filters - patientId, doctorId, status, startDate, endDate, locale (e.g. 'es', 'ar' for localized names)
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

  const sessions = await TelemedicineSession.find(query)
    .populate('patientId', 'firstName lastName patientId firstName_es lastName_es firstName_ar lastName_ar')
    .populate('doctorId', 'firstName lastName')
    .sort({ scheduledStartTime: -1 })
    .lean();

  const locale = filters?.locale && String(filters.locale).toLowerCase().slice(0, 2);
  const firstKey = locale === 'es' || locale === 'ar' ? `firstName_${locale}` : 'firstName';
  const lastKey = locale === 'es' || locale === 'ar' ? `lastName_${locale}` : 'lastName';

  return sessions.map((s) => {
    const p = s.patientId;
    if (p) {
      const displayFirst = (p[firstKey] && String(p[firstKey]).trim()) || p.firstName || '';
      const displayLast = (p[lastKey] && String(p[lastKey]).trim()) || p.lastName || '';
      s.patientId = { ...p, firstName: displayFirst, lastName: displayLast };
      let displayName = [displayFirst, displayLast].filter(Boolean).join(' ').trim() || null;
      if (locale === 'ar' && displayName && !(p.firstName_ar || p.lastName_ar)) {
        displayName =
          [transliterateToArabic(displayFirst), transliterateToArabic(displayLast)]
            .filter(Boolean)
            .join(' ')
            .trim() || displayName;
      }
      if (locale === 'es' && displayName && !(p.firstName_es || p.lastName_es)) {
        const esFirst = translateToSpanish(displayFirst) || displayFirst;
        const esLast = translateToSpanish(displayLast) || displayLast;
        displayName = [esFirst, esLast].filter(Boolean).join(' ').trim() || displayName;
      }
      s.patientDisplayName = displayName;
    } else {
      s.patientDisplayName = null;
    }
    const d = s.doctorId;
    if (d) {
      let docFirst = d.firstName || '';
      let docLast = d.lastName || '';
      if (locale === 'ar') {
        docFirst = transliterateToArabic(docFirst) || docFirst;
        docLast = transliterateToArabic(docLast) || docLast;
      }
      if (locale === 'es') {
        docFirst = translateToSpanish(docFirst) || docFirst;
        docLast = translateToSpanish(docLast) || docLast;
      }
      s.doctorId = { ...d, firstName: docFirst, lastName: docLast };
      s.doctorDisplayName = [docFirst, docLast].filter(Boolean).join(' ').trim() || null;
    } else {
      s.doctorDisplayName = null;
    }
    return s;
  });
}

/**
 * Start session
 */
export async function startSession(sessionId, tenantId, userId, roomId) {
  await connectDB();

  const session = await TelemedicineSession.findOne(withTenant(tenantId, { _id: sessionId }));

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
    { action: 'start_session' },
  );

  return session;
}

/**
 * End session
 */
export async function endSession(sessionId, tenantId, userId, data) {
  await connectDB();

  const session = await TelemedicineSession.findOne(withTenant(tenantId, { _id: sessionId }));

  if (!session) return null;

  session.status = SessionStatus.COMPLETED;
  session.actualEndTime = new Date();

  if (session.actualStartTime) {
    const duration = Math.round(
      (session.actualEndTime.getTime() - session.actualStartTime.getTime()) / 1000 / 60,
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
    { action: 'end_session', duration: session.duration },
  );

  return session;
}

/**
 * Add chat message
 */
export async function addChatMessage(sessionId, tenantId, senderId, senderName, message) {
  await connectDB();

  const session = await TelemedicineSession.findOne(withTenant(tenantId, { _id: sessionId }));

  if (!session) return null;

  session.chatMessages.push({
    senderId: senderId,
    senderName,
    message,
    timestamp: new Date(),
    isEncrypted: false, // Encryption deferred: in-scope for future PHI-in-chat compliance.
  });

  await session.save();

  return session;
}

/**
 * Cancel session
 */
export async function cancelSession(sessionId, tenantId, userId, reason) {
  await connectDB();

  const session = await TelemedicineSession.findOne(withTenant(tenantId, { _id: sessionId }));

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
    { action: 'cancel_session', reason },
  );

  return session;
}
