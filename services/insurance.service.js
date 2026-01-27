/**
 * Insurance service
 * Handles all insurance claim-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import InsuranceClaim, { ClaimStatus } from '@/models/InsuranceClaim.js';
import Invoice from '@/models/Invoice.js';
import Patient from '@/models/Patient.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Generate claim number
 */
async function generateClaimNumber(tenantId) {
  await connectDB();

  const lastClaim = await InsuranceClaim.findOne(
    withTenant(tenantId, {}),
    { claimNumber: 1 }
  )
    .sort({ claimNumber: -1 })
    .lean();

  if (!lastClaim || !lastClaim.claimNumber) {
    return 'CLM-0001';
  }

  const match = lastClaim.claimNumber.match(/(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `CLM-${nextNum.toString().padStart(4, '0')}`;
  }

  return 'CLM-0001';
}

/**
 * Create a new insurance claim
 */
export async function createInsuranceClaim(input, tenantId, userId) {
  await connectDB();

  // Validate invoice exists and belongs to tenant
  const invoice = await Invoice.findOne(
    withTenant(tenantId, {
      _id: input.invoiceId,
      deletedAt: null,
    })
  );

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  // Validate patient exists and matches invoice
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: input.patientId || invoice.patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Check if claim already exists for this invoice
  const existingClaim = await InsuranceClaim.findOne(
    withTenant(tenantId, {
      invoiceId: input.invoiceId,
      deletedAt: null,
    })
  );

  if (existingClaim) {
    throw new Error('Insurance claim already exists for this invoice');
  }

  // Generate claim number
  const claimNumber = await generateClaimNumber(tenantId);

  // Calculate patient responsibility
  const claimAmount = input.claimAmount || invoice.totalAmount;
  const patientResponsibility = claimAmount - (input.approvedAmount || 0);

  // Create claim
  const claim = await InsuranceClaim.create({
    tenantId,
    claimNumber,
    invoiceId: input.invoiceId,
    patientId: input.patientId || invoice.patientId.toString(),
    insuranceProvider: input.insuranceProvider,
    policyNumber: input.policyNumber,
    groupNumber: input.groupNumber || '',
    claimAmount,
    submittedAmount: input.submittedAmount || claimAmount,
    approvedAmount: input.approvedAmount || 0,
    deniedAmount: 0,
    patientResponsibility,
    status: ClaimStatus.DRAFT,
    priorAuthorization: input.priorAuthorization || {
      required: false,
    },
    notes: input.notes || '',
    createdBy: userId,
  });

  // Update invoice with insurance claim reference
  invoice.insuranceId = claim._id.toString();
  invoice.insuranceCoverage = claim.approvedAmount;
  invoice.patientPayable = patientResponsibility;
  await invoice.save();

  // Audit log
  await AuditLogger.auditWrite(
    'insurance_claim',
    claim._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return claim;
}

/**
 * Get insurance claim by ID
 */
export async function getInsuranceClaimById(claimId, tenantId, userId) {
  await connectDB();

  const claim = await InsuranceClaim.findOne(
    withTenant(tenantId, {
      _id: claimId,
      deletedAt: null,
    })
  )
    .populate('invoiceId', 'invoiceNumber totalAmount status')
    .populate('patientId', 'firstName lastName patientId')
    .lean();

  if (claim) {
    await AuditLogger.auditRead('insurance_claim', claimId, userId, tenantId);
  }

  return claim;
}

/**
 * List insurance claims with pagination and filters
 */
export async function listInsuranceClaims(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter = withTenant(tenantId, {
    deletedAt: null,
  });

  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  if (query.invoiceId) {
    filter.invoiceId = query.invoiceId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.insuranceProvider) {
    filter.insuranceProvider = { $regex: query.insuranceProvider, $options: 'i' };
  }

  if (query.startDate || query.endDate) {
    filter.createdAt = {};
    if (query.startDate) {
      filter.createdAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.createdAt.$lte = new Date(query.endDate);
    }
  }

  // Get total count
  const total = await InsuranceClaim.countDocuments(filter);

  // Get paginated results
  const claims = await InsuranceClaim.find(filter)
    .populate('invoiceId', 'invoiceNumber totalAmount')
    .populate('patientId', 'firstName lastName patientId')
    .sort({ createdAt: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'insurance_claim',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: claims.length, filters: query }
  );

  return createPaginationResult(claims, total, page || 1, limit || 10);
}

/**
 * Update insurance claim
 */
export async function updateInsuranceClaim(claimId, input, tenantId, userId) {
  await connectDB();

  const existing = await InsuranceClaim.findOne(
    withTenant(tenantId, {
      _id: claimId,
      deletedAt: null,
    })
  );

  if (!existing) {
    return null;
  }

  // Don't allow updates to paid or rejected claims
  if (existing.status === ClaimStatus.PAID || existing.status === ClaimStatus.REJECTED) {
    throw new Error('Cannot update paid or rejected claim');
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Recalculate patient responsibility if amounts changed
  if (input.approvedAmount !== undefined || input.deniedAmount !== undefined) {
    const approvedAmount = input.approvedAmount !== undefined ? input.approvedAmount : existing.approvedAmount;
    const deniedAmount = input.deniedAmount !== undefined ? input.deniedAmount : existing.deniedAmount;
    updateData.patientResponsibility = existing.claimAmount - approvedAmount - deniedAmount;
  }

  const claim = await InsuranceClaim.findByIdAndUpdate(
    claimId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('invoiceId', 'invoiceNumber totalAmount')
    .populate('patientId', 'firstName lastName patientId');

  // Update invoice if claim amounts changed
  if (input.approvedAmount !== undefined) {
    const invoice = await Invoice.findById(existing.invoiceId);
    if (invoice) {
      invoice.insuranceCoverage = claim.approvedAmount;
      invoice.patientPayable = claim.patientResponsibility;
      await invoice.save();
    }
  }

  if (claim) {
    await AuditLogger.auditWrite(
      'insurance_claim',
      claim._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: claim.toObject() }
    );
  }

  return claim;
}

/**
 * Submit insurance claim
 */
export async function submitInsuranceClaim(claimId, tenantId, userId) {
  await connectDB();

  const claim = await InsuranceClaim.findOne(
    withTenant(tenantId, {
      _id: claimId,
      deletedAt: null,
    })
  );

  if (!claim) {
    return null;
  }

  if (claim.status !== ClaimStatus.DRAFT) {
    throw new Error('Only draft claims can be submitted');
  }

  const before = claim.toObject();
  claim.status = ClaimStatus.SUBMITTED;
  claim.submittedAt = new Date();
  await claim.save();

  // Audit log
  await AuditLogger.auditWrite(
    'insurance_claim',
    claim._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: claim.toObject() },
    { action: 'submit_claim' }
  );

  return claim;
}

/**
 * Update claim status (for processing responses from insurance)
 */
export async function updateClaimStatus(claimId, status, statusData, tenantId, userId) {
  await connectDB();

  const claim = await InsuranceClaim.findOne(
    withTenant(tenantId, {
      _id: claimId,
      deletedAt: null,
    })
  );

  if (!claim) {
    return null;
  }

  const before = claim.toObject();
  const now = new Date();

  claim.status = status;

  // Set appropriate timestamps
  switch (status) {
    case ClaimStatus.UNDER_REVIEW:
      claim.reviewedAt = now;
      break;
    case ClaimStatus.APPROVED:
    case ClaimStatus.PARTIALLY_APPROVED:
      claim.approvedAt = now;
      if (statusData?.approvedAmount !== undefined) {
        claim.approvedAmount = statusData.approvedAmount;
        claim.patientResponsibility = claim.claimAmount - claim.approvedAmount;
      }
      break;
    case ClaimStatus.DENIED:
    case ClaimStatus.REJECTED:
      if (statusData?.denialReason) {
        claim.denialReason = statusData.denialReason;
      }
      if (statusData?.deniedAmount !== undefined) {
        claim.deniedAmount = statusData.deniedAmount;
        claim.patientResponsibility = claim.claimAmount - claim.deniedAmount;
      }
      break;
    case ClaimStatus.PAID:
      claim.paidAt = now;
      break;
  }

  // Update EOB if provided
  if (statusData?.eob) {
    claim.eob = {
      received: true,
      receivedAt: statusData.eob.receivedAt ? new Date(statusData.eob.receivedAt) : now,
      eobNumber: statusData.eob.eobNumber || '',
      eobUrl: statusData.eob.eobUrl || '',
    };
  }

  await claim.save();

  // Update invoice
  const invoice = await Invoice.findById(claim.invoiceId);
  if (invoice) {
    invoice.insuranceCoverage = claim.approvedAmount;
    invoice.patientPayable = claim.patientResponsibility;
    await invoice.save();
  }

  // Audit log
  await AuditLogger.auditWrite(
    'insurance_claim',
    claim._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: claim.toObject() },
    { action: 'update_status', status }
  );

  return claim;
}

/**
 * Verify insurance eligibility
 */
export async function verifyInsuranceEligibility(patientId, insuranceData, tenantId, userId) {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // This is a placeholder - in production, this would call an insurance verification API
  // For now, we'll do basic validation
  const verification = {
    eligible: true,
    verifiedAt: new Date(),
    policyNumber: insuranceData.policyNumber || patient.insurance?.policyNumber,
    groupNumber: insuranceData.groupNumber || patient.insurance?.groupNumber,
    validFrom: patient.insurance?.validFrom || new Date(),
    validUntil: patient.insurance?.validUntil || null,
    coverageType: 'unknown', // Would come from API
    copay: null, // Would come from API
    deductible: null, // Would come from API
    notes: 'Insurance verification - placeholder implementation',
  };

  // Check if insurance is expired
  if (verification.validUntil && new Date(verification.validUntil) < new Date()) {
    verification.eligible = false;
    verification.notes = 'Insurance policy has expired';
  }

  // Audit log
  await AuditLogger.auditWrite(
    'insurance_verification',
    patientId,
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { verification }
  );

  return verification;
}

/**
 * Delete insurance claim (soft delete)
 */
export async function deleteInsuranceClaim(claimId, tenantId, userId) {
  await connectDB();

  const claim = await InsuranceClaim.findOne(
    withTenant(tenantId, {
      _id: claimId,
      deletedAt: null,
    })
  );

  if (!claim) {
    return false;
  }

  // Don't allow deletion of submitted or processed claims
  if (
    claim.status !== ClaimStatus.DRAFT &&
    claim.status !== ClaimStatus.REJECTED
  ) {
    throw new Error('Cannot delete submitted or processed claims');
  }

  // Soft delete
  claim.deletedAt = new Date();
  claim.isActive = false;
  await claim.save();

  // Update invoice
  const invoice = await Invoice.findById(claim.invoiceId);
  if (invoice) {
    invoice.insuranceId = null;
    invoice.insuranceCoverage = 0;
    invoice.patientPayable = invoice.totalAmount;
    await invoice.save();
  }

  await AuditLogger.auditWrite(
    'insurance_claim',
    claim._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}
