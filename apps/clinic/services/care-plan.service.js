/**
 * Care plan service – CRUD, tenant-scoped. Per FIX_PLAN: Chronic care layer.
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import CarePlan, { CarePlanStatus } from '@/models/CarePlan.js';
import Patient from '@/models/Patient.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function createCarePlan(input, tenantId, userId) {
  await connectDB();

  const patient = await Patient.findOne(withTenant(tenantId, { _id: input.patientId }));
  if (!patient) throw new Error('Patient not found');

  const plan = await CarePlan.create({
    tenantId,
    patientId: input.patientId,
    doctorId: input.doctorId || userId,
    name: input.name,
    condition: input.condition,
    startDate: input.startDate,
    endDate: input.endDate,
    status: input.status || CarePlanStatus.ACTIVE,
    goals: input.goals,
    followUpIntervalDays: input.followUpIntervalDays,
    conditions: input.conditions || [],
    notes: input.notes,
    createdBy: userId,
  });

  await AuditLogger.auditWrite(
    'care_plan',
    plan._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
  );
  return plan;
}

export async function getCarePlanById(planId, tenantId, userId) {
  await connectDB();

  const plan = await CarePlan.findOne(withTenant(tenantId, { _id: planId, deletedAt: null }))
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .lean();

  if (plan) await AuditLogger.auditRead('care_plan', planId, userId, tenantId);
  return plan;
}

export async function listCarePlans(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
    maxLimit: 100,
  });
  const filter = { ...withTenant(tenantId, {}), deletedAt: null };
  if (query.patientId) filter.patientId = query.patientId;
  if (query.doctorId) filter.doctorId = query.doctorId;
  if (query.status) filter.status = query.status;
  if (query.startDate) filter.startDate = { $gte: new Date(query.startDate) };
  if (query.endDate) filter.endDate = { $lte: new Date(query.endDate) };

  const [items, total] = await Promise.all([
    CarePlan.find(filter)
      .populate('patientId', 'firstName lastName patientId')
      .populate('doctorId', 'firstName lastName')
      .sort({ startDate: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CarePlan.countDocuments(filter),
  ]);

  return createPaginationResult(items, total, page, limit);
}

export async function updateCarePlan(planId, input, tenantId, userId) {
  await connectDB();

  const plan = await CarePlan.findOne(withTenant(tenantId, { _id: planId, deletedAt: null }));
  if (!plan) return null;

  Object.assign(plan, input);
  await plan.save();

  await AuditLogger.auditWrite('care_plan', planId, userId, tenantId, AuditAction.UPDATE);
  return plan;
}

export async function deleteCarePlan(planId, tenantId, userId) {
  await connectDB();

  const plan = await CarePlan.findOne(withTenant(tenantId, { _id: planId, deletedAt: null }));
  if (!plan) return null;

  plan.deletedAt = new Date();
  await plan.save();

  await AuditLogger.auditWrite('care_plan', planId, userId, tenantId, AuditAction.DELETE);
  return plan;
}
