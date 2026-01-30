/**
 * Lab Test service
 * Handles all lab test catalog-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import LabTest from '@/models/LabTest.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Create a new lab test
 */
export async function createLabTest(input, tenantId, userId) {
  await connectDB();

  // Check if test code already exists for this tenant
  const existing = await LabTest.findOne(
    withTenant(tenantId, {
      testCode: input.testCode.toUpperCase(),
    })
  );

  if (existing) {
    throw new Error('Lab test code already exists');
  }

  // Create lab test
  const labTest = await LabTest.create({
    tenantId,
    testCode: input.testCode.toUpperCase(),
    name: input.name,
    category: input.category || '',
    department: input.department || '',
    sampleType: input.sampleType,
    parameters: input.parameters || [],
    pricing: input.pricing || { price: 0 },
    tatHours: input.tatHours || 24,
    preparationRequired: input.preparationRequired || '',
    status: input.status || 'active',
  });

  // Audit log
  await AuditLogger.auditWrite(
    'lab_test',
    labTest._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return labTest;
}

/**
 * Get lab test by ID
 */
export async function getLabTestById(testId, tenantId, userId) {
  await connectDB();

  const labTest = await LabTest.findOne(
    withTenant(tenantId, {
      _id: testId,
    })
  ).lean();

  if (labTest) {
    await AuditLogger.auditRead('lab_test', testId, userId, tenantId);
  }

  return labTest;
}

/**
 * List lab tests with pagination and filters
 */
export async function listLabTests(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter = withTenant(tenantId, {});

  if (query.status) {
    filter.status = query.status;
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.department) {
    filter.department = query.department;
  }

  if (query.sampleType) {
    filter.sampleType = query.sampleType;
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { testCode: { $regex: query.search, $options: 'i' } },
      { category: { $regex: query.search, $options: 'i' } },
    ];
  }

  // Get total count
  const total = await LabTest.countDocuments(filter);

  // Get paginated results
  const labTests = await LabTest.find(filter)
    .sort({ name: 1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'lab_test',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: labTests.length, filters: query }
  );

  return createPaginationResult(labTests, total, page || 1, limit || 10);
}

/**
 * Update lab test
 */
export async function updateLabTest(testId, input, tenantId, userId) {
  await connectDB();

  const existing = await LabTest.findOne(
    withTenant(tenantId, {
      _id: testId,
    })
  );

  if (!existing) {
    return null;
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Check if test code is being changed and if it conflicts
  if (input.testCode && input.testCode.toUpperCase() !== existing.testCode) {
    const codeExists = await LabTest.findOne(
      withTenant(tenantId, {
        testCode: input.testCode.toUpperCase(),
        _id: { $ne: testId },
      })
    );

    if (codeExists) {
      throw new Error('Lab test code already exists');
    }

    updateData.testCode = input.testCode.toUpperCase();
  }

  const labTest = await LabTest.findByIdAndUpdate(
    testId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (labTest) {
    await AuditLogger.auditWrite(
      'lab_test',
      labTest._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: labTest.toObject() }
    );
  }

  return labTest;
}

/**
 * Delete lab test (soft delete by setting status to inactive)
 */
export async function deleteLabTest(testId, tenantId, userId) {
  await connectDB();

  const labTest = await LabTest.findOne(
    withTenant(tenantId, {
      _id: testId,
    })
  );

  if (!labTest) {
    return false;
  }

  // Soft delete by setting status to inactive
  labTest.status = 'inactive';
  await labTest.save();

  await AuditLogger.auditWrite(
    'lab_test',
    labTest._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}
