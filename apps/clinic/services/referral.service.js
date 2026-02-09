/**
 * Referral service
 * Handles all referral-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import { generateReferralNumber } from '@/lib/utils/number-generator.js';
import Referral, { ReferralStatus } from '@/models/Referral.js';
import Patient from '@/models/Patient.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Create a new referral
 */
export async function createReferral(input, tenantId, userId) {
  await connectDB();

  // Validate patient exists and belongs to tenant
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: input.patientId,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Generate referral number
  const referralNumber = await generateReferralNumber(tenantId);

  // Create referral
  const referral = await Referral.create({
    tenantId,
    referralNumber,
    patientId: input.patientId,
    referringDoctorId: input.referringDoctorId || userId,
    referredToDoctorId: input.referredToDoctorId,
    referredToSpecialty: input.referredToSpecialty,
    referredToName: input.referredToName || '',
    referredToClinic: input.referredToClinic || '',
    referredToContact: input.referredToContact || {},
    type: input.type || 'internal',
    priority: input.priority || 'routine',
    reason: input.reason || '',
    clinicalHistory: input.clinicalHistory || '',
    status: ReferralStatus.PENDING,
    referredAt: input.referredAt || new Date(),
    appointmentId: input.appointmentId,
    notes: input.notes || '',
    createdBy: userId,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'referral',
    referral._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return referral;
}

/**
 * Get referral by ID
 */
export async function getReferralById(referralId, tenantId, userId) {
  await connectDB();

  const referral = await Referral.findOne(
    withTenant(tenantId, {
      _id: referralId,
    })
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('referringDoctorId', 'firstName lastName')
    .populate('referredToDoctorId', 'firstName lastName')
    .populate('appointmentId', 'appointmentNumber')
    .populate('followUpNotes.addedBy', 'firstName lastName')
    .lean();

  if (referral) {
    await AuditLogger.auditRead('referral', referralId, userId, tenantId);
  }

  return referral;
}

/**
 * List referrals with pagination and filters
 */
export async function listReferrals(query, tenantId, userId) {
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

  if (query.referringDoctorId) {
    filter.referringDoctorId = query.referringDoctorId;
  }

  if (query.referredToDoctorId) {
    filter.referredToDoctorId = query.referredToDoctorId;
  }

  if (query.referredToSpecialty) {
    filter.referredToSpecialty = query.referredToSpecialty;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.startDate || query.endDate) {
    filter.referredAt = {};
    if (query.startDate) {
      filter.referredAt.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.referredAt.$lte = new Date(query.endDate);
    }
  }

  // Get total count
  const total = await Referral.countDocuments(filter);

  // Get paginated results
  const referrals = await Referral.find(filter)
    .populate('patientId', 'firstName lastName patientId')
    .populate('referringDoctorId', 'firstName lastName')
    .populate('referredToDoctorId', 'firstName lastName')
    .sort({ referredAt: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'referral',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: referrals.length, filters: query }
  );

  return createPaginationResult(referrals, total, page || 1, limit || 10);
}

/**
 * Update referral
 */
export async function updateReferral(referralId, input, tenantId, userId) {
  await connectDB();

  const existing = await Referral.findOne(
    withTenant(tenantId, {
      _id: referralId,
    })
  );

  if (!existing) {
    return null;
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Don't allow changing patientId or referralNumber
  delete updateData.patientId;
  delete updateData.referralNumber;

  const referral = await Referral.findByIdAndUpdate(
    referralId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('referringDoctorId', 'firstName lastName')
    .populate('referredToDoctorId', 'firstName lastName');

  if (referral) {
    await AuditLogger.auditWrite(
      'referral',
      referral._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: referral.toObject() }
    );
  }

  return referral;
}

/**
 * Update referral status
 */
export async function updateReferralStatus(referralId, status, tenantId, userId) {
  await connectDB();

  const referral = await Referral.findOne(
    withTenant(tenantId, {
      _id: referralId,
    })
  );

  if (!referral) {
    return null;
  }

  const before = referral.toObject();
  
  referral.status = status;
  
  if (status === ReferralStatus.ACCEPTED && !referral.acceptedAt) {
    referral.acceptedAt = new Date();
  }
  
  if (status === ReferralStatus.COMPLETED && !referral.completedAt) {
    referral.completedAt = new Date();
  }
  
  await referral.save();

  // Audit log
  await AuditLogger.auditWrite(
    'referral',
    referral._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: referral.toObject() },
    { action: 'update_status', status }
  );

  return referral;
}

/**
 * Add follow-up note to referral
 */
export async function addFollowUpNote(referralId, note, tenantId, userId) {
  await connectDB();

  const referral = await Referral.findOne(
    withTenant(tenantId, {
      _id: referralId,
    })
  );

  if (!referral) {
    return null;
  }

  const before = referral.toObject();
  
  referral.followUpNotes.push({
    note,
    addedBy: userId,
    addedAt: new Date(),
  });
  
  await referral.save();

  // Audit log
  await AuditLogger.auditWrite(
    'referral',
    referral._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: referral.toObject() },
    { action: 'add_follow_up_note' }
  );

  return referral;
}
