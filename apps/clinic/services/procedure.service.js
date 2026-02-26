/**
 * Procedure service
 * Handles procedure session and procedure log business logic.
 * All operations are tenant-scoped.
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { generateProcedureNumber } from '@/lib/utils/number-generator.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import Patient from '@/models/Patient.js';
import ProcedureSession, { ProcedureSessionStatus } from '@/models/ProcedureSession.js';

/**
 * Create a new procedure session
 */
export async function createProcedureSession(input, tenantId, userId) {
  await connectDB();

  const patient = await Patient.findOne(withTenant(tenantId, { _id: input.patientId }));
  if (!patient) {
    throw new Error('Patient not found');
  }

  const procedureNumber = await generateProcedureNumber(tenantId);

  const session = await ProcedureSession.create({
    tenantId,
    procedureNumber,
    patientId: input.patientId,
    appointmentId: input.appointmentId,
    doctorId: input.doctorId || userId,
    type: input.type,
    typeCode: input.typeCode,
    status: input.status || ProcedureSessionStatus.SCHEDULED,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    notes: input.notes,
    treatmentPackageId: input.treatmentPackageId,
    logs: [],
    createdBy: userId,
  });

  await AuditLogger.auditWrite(
    'procedure_session',
    session._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
  );

  return session;
}

/**
 * Get procedure session by ID
 */
export async function getProcedureSessionById(sessionId, tenantId, userId) {
  await connectDB();

  const session = await ProcedureSession.findOne(
    withTenant(tenantId, { _id: sessionId, deletedAt: null }),
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .populate('appointmentId', 'appointmentNumber appointmentTime')
    .populate('logs.addedBy', 'firstName lastName')
    .populate('treatmentPackageId', 'name')
    .lean();

  if (session) {
    await AuditLogger.auditRead('procedure_session', sessionId, userId, tenantId);
  }

  return session;
}

/**
 * List procedure sessions with pagination and filters
 */
export async function listProcedureSessions(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
    maxLimit: 100,
  });

  const filter = { ...withTenant(tenantId, {}), deletedAt: null };
  if (query.patientId) filter.patientId = query.patientId;
  if (query.doctorId) filter.doctorId = query.doctorId;
  if (query.appointmentId) filter.appointmentId = query.appointmentId;
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = new RegExp(escapeRegex(query.type), 'i');
  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
  }

  const [items, total] = await Promise.all([
    ProcedureSession.find(filter)
      .populate('patientId', 'firstName lastName patientId')
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ProcedureSession.countDocuments(filter),
  ]);

  return createPaginationResult(items, total, page, limit);
}

/**
 * Update procedure session
 */
export async function updateProcedureSession(sessionId, input, tenantId, userId) {
  await connectDB();

  const session = await ProcedureSession.findOne(
    withTenant(tenantId, { _id: sessionId, deletedAt: null }),
  );
  if (!session) return null;

  const update = { ...input };
  delete update.log;
  if (input.status === ProcedureSessionStatus.IN_PROGRESS && !session.startedAt) {
    update.startedAt = new Date();
  }
  if (input.status === ProcedureSessionStatus.COMPLETED && !session.endedAt) {
    update.endedAt = new Date();
  }

  if (Object.keys(update).length) {
    Object.assign(session, update);
  }
  if (input.log && input.log.text) {
    session.logs = session.logs || [];
    session.logs.push({
      at: new Date(),
      text: input.log.text,
      addedBy: userId,
    });
  }
  await session.save();

  await AuditLogger.auditWrite(
    'procedure_session',
    sessionId,
    userId,
    tenantId,
    AuditAction.UPDATE,
  );

  return session;
}

/**
 * Soft-delete procedure session
 */
export async function deleteProcedureSession(sessionId, tenantId, userId) {
  await connectDB();

  const session = await ProcedureSession.findOne(
    withTenant(tenantId, { _id: sessionId, deletedAt: null }),
  );
  if (!session) return null;

  session.deletedAt = new Date();
  await session.save();

  await AuditLogger.auditWrite(
    'procedure_session',
    sessionId,
    userId,
    tenantId,
    AuditAction.DELETE,
  );

  return session;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
