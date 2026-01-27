/**
 * Doctor Service
 * 
 * Enterprise-grade service for doctor profile management with schedule,
 * department assignment, and professional information tracking.
 * 
 * Features:
 * - Doctor profile creation and management
 * - Professional information (qualifications, specializations, experience)
 * - Schedule management (working days, time slots, leaves)
 * - Department assignment
 * - Consultation fee management
 * - Availability tracking
 * - Multi-tenant isolation
 * - Audit logging
 * 
 * @module services/doctor.service
 * @since 1.0.0
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import Doctor from '@/models/Doctor.js';
import User from '@/models/User.js';
import Department from '@/models/Department.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import { logger } from '@/lib/utils/logger.js';
import { measureTime } from '@/lib/utils/enterprise-helpers.js';

/**
 * Create a new doctor profile
 */
export async function createDoctor(input, tenantId, userId) {
  await connectDB();

  // Validate user exists and belongs to tenant
  const user = await User.findOne(
    withTenant(tenantId, {
      _id: input.userId,
      isActive: true,
    })
  );

  if (!user) {
    throw new Error('User not found or inactive');
  }

  // Check if doctor profile already exists for this user
  const existing = await Doctor.findOne(
    withTenant(tenantId, {
      userId: input.userId,
    })
  );

  if (existing) {
    throw new Error('Doctor profile already exists for this user');
  }

  // Validate departments if provided
  if (input.departments && input.departments.length > 0) {
    const departments = await Department.find(
      withTenant(tenantId, {
        _id: { $in: input.departments },
        deletedAt: null,
      })
    );

    if (departments.length !== input.departments.length) {
      throw new Error('One or more departments not found');
    }
  }

  // Create doctor profile
  const doctor = await Doctor.create({
    tenantId,
    userId: input.userId,
    professional: input.professional || {},
    schedule: input.schedule || {
      workingDays: [],
      slots: [],
      leaves: [],
    },
    consultationFee: input.consultationFee || 0,
    departments: input.departments || [],
    bio: input.bio || '',
    signature: input.signature || '',
    status: input.status || 'active',
  });

  // Audit log
  await AuditLogger.auditWrite(
    'doctor',
    doctor._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return doctor;
}

/**
 * Get doctor by ID
 */
export async function getDoctorById(doctorId, tenantId, userId) {
  await connectDB();

  const doctor = await Doctor.findOne(
    withTenant(tenantId, {
      _id: doctorId,
    })
  )
    .populate('userId', 'firstName lastName email phone avatar')
    .populate('departments', 'name code')
    .lean();

  if (doctor) {
    await AuditLogger.auditRead('doctor', doctorId, userId, tenantId);
  }

  return doctor;
}

/**
 * Get doctor by user ID
 */
export async function getDoctorByUserId(userId, tenantId) {
  await connectDB();

  const doctor = await Doctor.findOne(
    withTenant(tenantId, {
      userId: userId,
    })
  )
    .populate('userId', 'firstName lastName email phone avatar')
    .populate('departments', 'name code')
    .lean();

  return doctor;
}

/**
 * List doctors with pagination and filters
 */
export async function listDoctors(query, tenantId, userId) {
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

  if (query.departmentId) {
    filter.departments = query.departmentId;
  }

  if (query.specialization) {
    filter['professional.specialization'] = { $in: [query.specialization] };
  }

  // Get total count
  const total = await Doctor.countDocuments(filter);

  // Get paginated results
  const doctors = await Doctor.find(filter)
    .populate('userId', 'firstName lastName email phone avatar')
    .populate('departments', 'name code')
    .sort({ createdAt: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'doctor',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: doctors.length, filters: query }
  );

  return createPaginationResult(doctors, total, page || 1, limit || 10);
}

/**
 * Update doctor profile
 */
export async function updateDoctor(doctorId, input, tenantId, userId) {
  await connectDB();

  const existing = await Doctor.findOne(
    withTenant(tenantId, {
      _id: doctorId,
    })
  );

  if (!existing) {
    return null;
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Validate departments if provided
  if (input.departments && input.departments.length > 0) {
    const departments = await Department.find(
      withTenant(tenantId, {
        _id: { $in: input.departments },
        deletedAt: null,
      })
    );

    if (departments.length !== input.departments.length) {
      throw new Error('One or more departments not found');
    }
  }

  // Don't allow changing userId
  delete updateData.userId;

  const doctor = await Doctor.findByIdAndUpdate(
    doctorId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('userId', 'firstName lastName email phone avatar')
    .populate('departments', 'name code');

  if (doctor) {
    await AuditLogger.auditWrite(
      'doctor',
      doctor._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: doctor.toObject() }
    );
  }

  return doctor;
}

/**
 * Add leave to doctor schedule
 */
export async function addDoctorLeave(doctorId, leaveData, tenantId, userId) {
  await connectDB();

  const doctor = await Doctor.findOne(
    withTenant(tenantId, {
      _id: doctorId,
    })
  );

  if (!doctor) {
    return null;
  }

  const leave = {
    from: leaveData.from instanceof Date ? leaveData.from : new Date(leaveData.from),
    to: leaveData.to instanceof Date ? leaveData.to : new Date(leaveData.to),
    reason: leaveData.reason || '',
  };

  // Validate date range
  if (leave.from > leave.to) {
    throw new Error('Leave start date must be before end date');
  }

  // Add leave to schedule
  if (!doctor.schedule) {
    doctor.schedule = { workingDays: [], slots: [], leaves: [] };
  }
  if (!doctor.schedule.leaves) {
    doctor.schedule.leaves = [];
  }

  doctor.schedule.leaves.push(leave);
  await doctor.save();

  // Audit log
  await AuditLogger.auditWrite(
    'doctor',
    doctor._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    undefined,
    { action: 'add_leave', leave }
  );

  return doctor;
}

/**
 * Remove leave from doctor schedule
 */
export async function removeDoctorLeave(doctorId, leaveIndex, tenantId, userId) {
  await connectDB();

  const doctor = await Doctor.findOne(
    withTenant(tenantId, {
      _id: doctorId,
    })
  );

  if (!doctor) {
    return null;
  }

  if (!doctor.schedule?.leaves || !doctor.schedule.leaves[leaveIndex]) {
    throw new Error('Leave not found');
  }

  const removedLeave = doctor.schedule.leaves[leaveIndex];
  doctor.schedule.leaves.splice(leaveIndex, 1);
  await doctor.save();

  // Audit log
  await AuditLogger.auditWrite(
    'doctor',
    doctor._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    undefined,
    { action: 'remove_leave', leave: removedLeave }
  );

  return doctor;
}

/**
 * Update doctor schedule
 */
export async function updateDoctorSchedule(doctorId, scheduleData, tenantId, userId) {
  await connectDB();

  const doctor = await Doctor.findOne(
    withTenant(tenantId, {
      _id: doctorId,
    })
  );

  if (!doctor) {
    return null;
  }

  const before = doctor.schedule ? doctor.schedule.toObject() : null;

  // Update schedule
  doctor.schedule = {
    workingDays: scheduleData.workingDays || doctor.schedule?.workingDays || [],
    slots: scheduleData.slots || doctor.schedule?.slots || [],
    leaves: scheduleData.leaves || doctor.schedule?.leaves || [],
  };

  await doctor.save();

  // Audit log
  await AuditLogger.auditWrite(
    'doctor',
    doctor._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: doctor.schedule.toObject() },
    { action: 'update_schedule' }
  );

  return doctor;
}

/**
 * Delete doctor profile (soft delete)
 */
export async function deleteDoctor(doctorId, tenantId, userId) {
  await connectDB();

  const doctor = await Doctor.findOne(
    withTenant(tenantId, {
      _id: doctorId,
    })
  );

  if (!doctor) {
    return false;
  }

  // Soft delete by setting status to inactive
  doctor.status = 'inactive';
  await doctor.save();

  await AuditLogger.auditWrite(
    'doctor',
    doctor._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}
