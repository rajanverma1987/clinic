/**
 * Consent form template service – CRUD, tenant-scoped.
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import ConsentForm from '@/models/ConsentForm.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function createConsentForm(input, tenantId, userId) {
  await connectDB();

  const form = await ConsentForm.create({
    tenantId,
    name: input.name,
    content: input.content,
    type: input.type,
    isActive: input.isActive !== false,
    createdBy: userId,
  });

  await AuditLogger.auditWrite(
    'consent_form',
    form._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
  );
  return form;
}

export async function getConsentFormById(formId, tenantId, userId) {
  await connectDB();

  const form = await ConsentForm.findOne(
    withTenant(tenantId, { _id: formId, deletedAt: null }),
  ).lean();

  if (form) await AuditLogger.auditRead('consent_form', formId, userId, tenantId);
  return form;
}

export async function listConsentForms(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
    maxLimit: 100,
  });
  const filter = { ...withTenant(tenantId, {}), deletedAt: null };
  if (query.isActive === 'true') filter.isActive = true;
  if (query.isActive === 'false') filter.isActive = false;
  if (query.search) filter.name = new RegExp(escapeRegex(query.search), 'i');

  const [items, total] = await Promise.all([
    ConsentForm.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ConsentForm.countDocuments(filter),
  ]);

  return createPaginationResult(items, total, page, limit);
}

export async function updateConsentForm(formId, input, tenantId, userId) {
  await connectDB();

  const form = await ConsentForm.findOne(withTenant(tenantId, { _id: formId, deletedAt: null }));
  if (!form) return null;

  if (input.content && input.content !== form.content) {
    form.version = (form.version || 1) + 1;
  }
  Object.assign(form, input);
  await form.save();

  await AuditLogger.auditWrite('consent_form', formId, userId, tenantId, AuditAction.UPDATE);
  return form;
}

export async function deleteConsentForm(formId, tenantId, userId) {
  await connectDB();

  const form = await ConsentForm.findOne(withTenant(tenantId, { _id: formId, deletedAt: null }));
  if (!form) return null;

  form.deletedAt = new Date();
  await form.save();

  await AuditLogger.auditWrite('consent_form', formId, userId, tenantId, AuditAction.DELETE);
  return form;
}
