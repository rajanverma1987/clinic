/**
 * Lab Result service
 * Handles all lab result-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import LabResult from '@/models/LabResult.js';
import LabOrder from '@/models/LabOrder.js';
import LabTest from '@/models/LabTest.js';
import Patient from '@/models/Patient.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Create a new lab result
 */
export async function createLabResult(input, tenantId, userId) {
  await connectDB();

  // Validate lab order exists and belongs to tenant
  const labOrder = await LabOrder.findOne(
    withTenant(tenantId, {
      _id: input.orderId,
    })
  );

  if (!labOrder) {
    throw new Error('Lab order not found');
  }

  // Validate test exists and belongs to tenant
  const labTest = await LabTest.findOne(
    withTenant(tenantId, {
      _id: input.testId,
      status: 'active',
    })
  );

  if (!labTest) {
    throw new Error('Lab test not found or inactive');
  }

  // Validate patient matches order
  if (labOrder.patientId.toString() !== input.patientId) {
    throw new Error('Patient ID does not match lab order');
  }

  // Process results and determine flags based on reference ranges
  const processedResults = (input.results || []).map((result) => {
    const parameter = labTest.parameters.find((p) => p.name === result.parameter);
    let flag = 'normal';

    if (parameter && parameter.referenceRange) {
      const value = parseFloat(result.value);
      if (!isNaN(value)) {
        if (parameter.referenceRange.min !== undefined && value < parameter.referenceRange.min) {
          flag = parameter.criticalValues?.low && value <= parameter.criticalValues.low ? 'critical' : 'low';
        } else if (parameter.referenceRange.max !== undefined && value > parameter.referenceRange.max) {
          flag = parameter.criticalValues?.high && value >= parameter.criticalValues.high ? 'critical' : 'high';
        }
      }
    }

    return {
      ...result,
      flag,
      referenceRange: parameter?.referenceRange
        ? parameter.referenceRange.text ||
          `${parameter.referenceRange.min || ''}-${parameter.referenceRange.max || ''}`
        : result.referenceRange || '',
    };
  });

  // Create lab result
  const labResult = await LabResult.create({
    tenantId,
    orderId: input.orderId,
    patientId: input.patientId,
    testId: input.testId,
    results: processedResults,
    interpretation: input.interpretation || '',
    remarks: input.remarks || '',
    status: 'draft',
    reportedAt: new Date(),
  });

  // Update lab order status to 'processing' if not already
  if (labOrder.status === 'collected') {
    labOrder.status = 'processing';
    await labOrder.save();
  }

  // Audit log
  await AuditLogger.auditWrite(
    'lab_result',
    labResult._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return labResult;
}

/**
 * Get lab result by ID
 */
export async function getLabResultById(resultId, tenantId, userId) {
  await connectDB();

  const labResult = await LabResult.findOne(
    withTenant(tenantId, {
      _id: resultId,
    })
  )
    .populate('orderId', 'orderNumber status')
    .populate('patientId', 'firstName lastName patientId')
    .populate('testId', 'name testCode category')
    .populate('verifiedBy', 'firstName lastName')
    .lean();

  if (labResult) {
    await AuditLogger.auditRead('lab_result', resultId, userId, tenantId);
  }

  return labResult;
}

/**
 * List lab results with pagination and filters
 */
export async function listLabResults(query, tenantId, userId) {
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

  if (query.orderId) {
    filter.orderId = query.orderId;
  }

  if (query.testId) {
    filter.testId = query.testId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.startDate || query.endDate) {
    filter.reportedAt = {};
    if (query.startDate) {
      filter.reportedAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.reportedAt.$lte = new Date(query.endDate);
    }
  }

  // Get total count
  const total = await LabResult.countDocuments(filter);

  // Get paginated results
  const labResults = await LabResult.find(filter)
    .populate('orderId', 'orderNumber')
    .populate('patientId', 'firstName lastName patientId')
    .populate('testId', 'name testCode')
    .sort({ reportedAt: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'lab_result',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: labResults.length, filters: query }
  );

  return createPaginationResult(labResults, total, page || 1, limit || 10);
}

/**
 * Update lab result
 */
export async function updateLabResult(resultId, input, tenantId, userId) {
  await connectDB();

  const existing = await LabResult.findOne(
    withTenant(tenantId, {
      _id: resultId,
    })
  );

  if (!existing) {
    return null;
  }

  // Don't allow updates to verified results
  if (existing.status === 'verified') {
    throw new Error('Cannot update verified lab result');
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Process results if provided
  if (input.results) {
    const labTest = await LabTest.findById(existing.testId);
    if (labTest) {
      const processedResults = input.results.map((result) => {
        const parameter = labTest.parameters.find((p) => p.name === result.parameter);
        let flag = 'normal';

        if (parameter && parameter.referenceRange) {
          const value = parseFloat(result.value);
          if (!isNaN(value)) {
            if (parameter.referenceRange.min !== undefined && value < parameter.referenceRange.min) {
              flag = parameter.criticalValues?.low && value <= parameter.criticalValues.low ? 'critical' : 'low';
            } else if (parameter.referenceRange.max !== undefined && value > parameter.referenceRange.max) {
              flag = parameter.criticalValues?.high && value >= parameter.criticalValues.high ? 'critical' : 'high';
            }
          }
        }

        return {
          ...result,
          flag,
          referenceRange: parameter?.referenceRange
            ? parameter.referenceRange.text ||
              `${parameter.referenceRange.min || ''}-${parameter.referenceRange.max || ''}`
            : result.referenceRange || '',
        };
      });
      updateData.results = processedResults;
    }
  }

  // Don't allow changing orderId, patientId, or testId
  delete updateData.orderId;
  delete updateData.patientId;
  delete updateData.testId;

  const labResult = await LabResult.findByIdAndUpdate(
    resultId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('orderId', 'orderNumber')
    .populate('patientId', 'firstName lastName patientId')
    .populate('testId', 'name testCode');

  if (labResult) {
    await AuditLogger.auditWrite(
      'lab_result',
      labResult._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: labResult.toObject() }
    );
  }

  return labResult;
}

/**
 * Verify lab result
 */
export async function verifyLabResult(resultId, tenantId, userId) {
  await connectDB();

  const labResult = await LabResult.findOne(
    withTenant(tenantId, {
      _id: resultId,
    })
  );

  if (!labResult) {
    return null;
  }

  if (labResult.status === 'verified') {
    throw new Error('Lab result already verified');
  }

  const before = labResult.toObject();
  labResult.status = 'verified';
  labResult.verifiedBy = userId;
  labResult.verifiedAt = new Date();
  await labResult.save();

  // Update lab order status to 'completed' if all tests are completed
  const labOrder = await LabOrder.findById(labResult.orderId);
  if (labOrder) {
    const allResults = await LabResult.find({ orderId: labOrder._id, status: 'verified' });
    const allTestsCompleted = labOrder.tests.every((test) => {
      return allResults.some((result) => result.testId.toString() === test.testId.toString());
    });

    if (allTestsCompleted && labOrder.status !== 'completed') {
      labOrder.status = 'completed';
      await labOrder.save();
    }
  }

  // Audit log
  await AuditLogger.auditWrite(
    'lab_result',
    labResult._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: labResult.toObject() },
    { action: 'verify' }
  );

  return labResult;
}

/**
 * Get results for a lab order
 */
export async function getResultsByOrderId(orderId, tenantId, userId) {
  await connectDB();

  const labOrder = await LabOrder.findOne(
    withTenant(tenantId, {
      _id: orderId,
    })
  );

  if (!labOrder) {
    throw new Error('Lab order not found');
  }

  const results = await LabResult.find(
    withTenant(tenantId, {
      orderId: orderId,
    })
  )
    .populate('testId', 'name testCode category')
    .populate('verifiedBy', 'firstName lastName')
    .sort({ reportedAt: -1 })
    .lean();

  // Audit access
  await AuditLogger.auditRead('lab_result', `order_${orderId}`, userId, tenantId);

  return results;
}
