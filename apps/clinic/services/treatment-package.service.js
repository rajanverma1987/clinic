/**
 * Treatment package service
 * CRUD for treatment packages (tenant-scoped).
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import TreatmentPackage from '@/models/TreatmentPackage.js';

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create a treatment package
 */
export async function createTreatmentPackage(input, tenantId, userId) {
  await connectDB();

  const pkg = await TreatmentPackage.create({
    tenantId,
    name: input.name,
    description: input.description,
    items: input.items || [],
    price: input.price,
    currency: input.currency || 'INR',
    isActive: input.isActive !== false,
    createdBy: userId,
  });

  await AuditLogger.auditWrite(
    'treatment_package',
    pkg._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
  );

  return pkg;
}

/**
 * Get treatment package by ID
 */
export async function getTreatmentPackageById(packageId, tenantId, userId) {
  await connectDB();

  const pkg = await TreatmentPackage.findOne(
    withTenant(tenantId, { _id: packageId, deletedAt: null }),
  ).lean();

  if (pkg) {
    await AuditLogger.auditRead('treatment_package', packageId, userId, tenantId);
  }

  return pkg;
}

/**
 * List treatment packages with pagination
 */
export async function listTreatmentPackages(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
    maxLimit: 100,
  });

  const filter = { ...withTenant(tenantId, {}), deletedAt: null };
  if (query.isActive === 'true') filter.isActive = true;
  if (query.isActive === 'false') filter.isActive = false;
  if (query.search) {
    filter.$or = [
      { name: new RegExp(escapeRegex(query.search), 'i') },
      { description: new RegExp(escapeRegex(query.search), 'i') },
    ];
  }

  const [items, total] = await Promise.all([
    TreatmentPackage.find(filter)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    TreatmentPackage.countDocuments(filter),
  ]);

  return createPaginationResult(items, total, page, limit);
}

/**
 * Update treatment package
 */
export async function updateTreatmentPackage(packageId, input, tenantId, userId) {
  await connectDB();

  const pkg = await TreatmentPackage.findOne(
    withTenant(tenantId, { _id: packageId, deletedAt: null }),
  );
  if (!pkg) return null;

  Object.assign(pkg, input);
  await pkg.save();

  await AuditLogger.auditWrite(
    'treatment_package',
    packageId,
    userId,
    tenantId,
    AuditAction.UPDATE,
  );

  return pkg;
}

/**
 * Soft-delete treatment package
 */
export async function deleteTreatmentPackage(packageId, tenantId, userId) {
  await connectDB();

  const pkg = await TreatmentPackage.findOne(
    withTenant(tenantId, { _id: packageId, deletedAt: null }),
  );
  if (!pkg) return null;

  pkg.deletedAt = new Date();
  await pkg.save();

  await AuditLogger.auditWrite(
    'treatment_package',
    packageId,
    userId,
    tenantId,
    AuditAction.DELETE,
  );

  return pkg;
}
