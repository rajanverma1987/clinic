/**
 * Consent record service – record consent, list by patient/form, tenant-scoped.
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import ConsentForm from '@/models/ConsentForm.js';
import ConsentRecord from '@/models/ConsentRecord.js';
import Patient from '@/models/Patient.js';

export async function createConsentRecord(input, tenantId, userId) {
  await connectDB();

  const [patient, form] = await Promise.all([
    Patient.findOne(withTenant(tenantId, { _id: input.patientId })),
    ConsentForm.findOne(withTenant(tenantId, { _id: input.formId, deletedAt: null })),
  ]);
  if (!patient) throw new Error('Patient not found');
  if (!form) throw new Error('Consent form not found');

  const record = await ConsentRecord.create({
    tenantId,
    patientId: input.patientId,
    formId: input.formId,
    appointmentId: input.appointmentId,
    formVersion: input.formVersion || form.version || 1,
    recordedById: userId,
  });

  await AuditLogger.auditWrite(
    'consent_record',
    record._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
  );
  return record;
}

export async function getConsentRecordById(recordId, tenantId, userId) {
  await connectDB();

  const record = await ConsentRecord.findOne(
    withTenant(tenantId, { _id: recordId, deletedAt: null }),
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('formId', 'name type')
    .populate('recordedById', 'firstName lastName')
    .lean();

  if (record) await AuditLogger.auditRead('consent_record', recordId, userId, tenantId);
  return record;
}

export async function listConsentRecords(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
    maxLimit: 100,
  });
  const filter = { ...withTenant(tenantId, {}), deletedAt: null };
  if (query.patientId) filter.patientId = query.patientId;
  if (query.formId) filter.formId = query.formId;
  if (query.fromDate)
    filter.consentedAt = { ...(filter.consentedAt || {}), $gte: new Date(query.fromDate) };
  if (query.toDate)
    filter.consentedAt = { ...(filter.consentedAt || {}), $lte: new Date(query.toDate) };

  const [items, total] = await Promise.all([
    ConsentRecord.find(filter)
      .populate('patientId', 'firstName lastName patientId')
      .populate('formId', 'name type')
      .sort({ consentedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ConsentRecord.countDocuments(filter),
  ]);

  return createPaginationResult(items, total, page, limit);
}
