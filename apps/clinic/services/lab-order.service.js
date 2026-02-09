/**
 * Lab Order service
 * Handles all lab order-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import LabOrder from '@/models/LabOrder.js';
import LabTest from '@/models/LabTest.js';
import Patient from '@/models/Patient.js';
import User from '@/models/User.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Generate lab order number
 */
async function generateLabOrderNumber(tenantId) {
  const { generateLabOrderNumber: generateId } = await import('@/lib/utils/number-generator.js');
  return generateId(tenantId);
}

/**
 * Create a new lab order
 */
export async function createLabOrder(input, tenantId, userId) {
  await connectDB();

  // Generate order number
  const orderNumber = await generateLabOrderNumber(tenantId);

  // Validate patient exists and belongs to tenant
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: input.patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Validate doctor exists and belongs to tenant
  const doctor = await User.findOne(
    withTenant(tenantId, {
      _id: input.doctorId || userId,
      isActive: true,
    })
  );

  if (!doctor) {
    throw new Error('Doctor not found or inactive');
  }

  // Validate tests exist and belong to tenant
  if (!input.tests || input.tests.length === 0) {
    throw new Error('At least one test is required');
  }

  const testIds = input.tests.map((t) => t.testId || t);
  const labTests = await LabTest.find(
    withTenant(tenantId, {
      _id: { $in: testIds },
      status: 'active',
    })
  );

  if (labTests.length !== testIds.length) {
    throw new Error('One or more lab tests not found or inactive');
  }

  // Build tests array with test names
  const tests = input.tests.map((t) => {
    const testId = t.testId || t;
    const labTest = labTests.find((lt) => lt._id.toString() === testId.toString());
    return {
      testId: testId,
      testName: labTest.name,
      priority: t.priority || 'routine',
      status: 'pending',
    };
  });

  // Calculate expected completion (use max TAT from tests)
  const maxTatHours = Math.max(...labTests.map((t) => t.tatHours || 24));
  const expectedCompletion = new Date();
  expectedCompletion.setHours(expectedCompletion.getHours() + maxTatHours);

  // Create lab order
  const labOrder = await LabOrder.create({
    tenantId,
    orderNumber,
    patientId: input.patientId,
    doctorId: input.doctorId || userId,
    consultationId: input.consultationId || null,
    tests,
    sample: input.sample || {},
    status: 'ordered',
    orderedAt: new Date(),
    expectedCompletion,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'lab_order',
    labOrder._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return labOrder;
}

/**
 * Get lab order by ID
 */
export async function getLabOrderById(orderId, tenantId, userId) {
  await connectDB();

  const labOrder = await LabOrder.findOne(
    withTenant(tenantId, {
      _id: orderId,
    })
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .populate('consultationId', 'consultationNumber date')
    .populate('tests.testId', 'name testCode category')
    .populate('sample.collectedBy', 'firstName lastName')
    .lean();

  if (labOrder) {
    await AuditLogger.auditRead('lab_order', orderId, userId, tenantId);
  }

  return labOrder;
}

/**
 * List lab orders with pagination and filters
 */
export async function listLabOrders(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter = withTenant(tenantId, {});

  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  if (query.doctorId) {
    filter.doctorId = query.doctorId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate || query.endDate) {
    filter.orderedAt = {};
    if (query.startDate) {
      filter.orderedAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.orderedAt.$lte = new Date(query.endDate);
    }
  }

  // Get total count
  const total = await LabOrder.countDocuments(filter);

  // Get paginated results
  const labOrders = await LabOrder.find(filter)
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .sort({ orderedAt: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'lab_order',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: labOrders.length, filters: query }
  );

  return createPaginationResult(labOrders, total, page || 1, limit || 10);
}

/**
 * Update lab order
 */
export async function updateLabOrder(orderId, input, tenantId, userId) {
  await connectDB();

  const existing = await LabOrder.findOne(
    withTenant(tenantId, {
      _id: orderId,
    })
  );

  if (!existing) {
    return null;
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Don't allow changing patientId
  delete updateData.patientId;

  const labOrder = await LabOrder.findByIdAndUpdate(
    orderId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName');

  if (labOrder) {
    await AuditLogger.auditWrite(
      'lab_order',
      labOrder._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: labOrder.toObject() }
    );
  }

  return labOrder;
}

/**
 * Update lab order status
 */
export async function updateLabOrderStatus(orderId, status, tenantId, userId) {
  await connectDB();

  const labOrder = await LabOrder.findOne(
    withTenant(tenantId, {
      _id: orderId,
    })
  );

  if (!labOrder) {
    return null;
  }

  const before = labOrder.toObject();
  labOrder.status = status;

  // Update sample collection info if status is 'collected'
  if (status === 'collected' && !labOrder.sample.collectedAt) {
    labOrder.sample.collectedAt = new Date();
    labOrder.sample.collectedBy = userId;
  }

  await labOrder.save();

  // Audit log
  await AuditLogger.auditWrite(
    'lab_order',
    labOrder._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: labOrder.toObject() },
    { statusChange: status }
  );

  return labOrder;
}

/**
 * Cancel lab order
 */
export async function cancelLabOrder(orderId, tenantId, userId) {
  return updateLabOrderStatus(orderId, 'cancelled', tenantId, userId);
}
