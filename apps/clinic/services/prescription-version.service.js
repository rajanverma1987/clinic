/**
 * Prescription version history – record and list. Per FIX_PLAN: Governance.
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import Prescription from '@/models/Prescription.js';
import PrescriptionVersion from '@/models/PrescriptionVersion.js';

/**
 * Record a version snapshot for a prescription (call after create/update/void).
 */
export async function recordPrescriptionVersion(prescriptionId, action, tenantId, userId, reason) {
  await connectDB();

  const prescription = await Prescription.findOne(
    withTenant(tenantId, { _id: prescriptionId }),
  ).lean();

  if (!prescription) return null;

  const last = await PrescriptionVersion.findOne(withTenant(tenantId, { prescriptionId }))
    .sort({ version: -1 })
    .select('version')
    .lean();

  const version = (last?.version ?? 0) + 1;
  const snapshot = {
    status: prescription.status,
    items: prescription.items,
    prescriptionNumber: prescription.prescriptionNumber,
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    updatedAt: prescription.updatedAt,
  };

  await PrescriptionVersion.create({
    tenantId,
    prescriptionId,
    version,
    snapshot,
    action,
    changedById: userId,
    reason: reason || undefined,
  });

  return { version, action };
}

/**
 * Get version history for a prescription (for UI).
 */
export async function getPrescriptionVersionHistory(prescriptionId, tenantId, query = {}) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit || 20,
    maxLimit: 50,
  });

  const filter = withTenant(tenantId, { prescriptionId });

  const [items, total] = await Promise.all([
    PrescriptionVersion.find(filter)
      .populate('changedById', 'firstName lastName')
      .sort({ version: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    PrescriptionVersion.countDocuments(filter),
  ]);

  return createPaginationResult(items, total, page, limit);
}
