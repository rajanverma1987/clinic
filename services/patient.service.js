/**
 * Patient service
 * Handles all patient-related business logic
 * Based on NEW-PLANS.md requirements
 */

import { logCreate, logDelete, logPHIAccess, logUpdate } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { notifyPatientUpdated } from '@/lib/realtime/integration-helpers.js';
import { generatePatientId } from '@/lib/utils/number-generator.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import Appointment from '@/models/Appointment.js';
import Patient from '@/models/Patient.js';

/**
 * Create a new patient
 */
export async function createPatient(input, tenantId, userId) {
  await connectDB();

  // Generate patient ID if not provided
  let patientId = input.patientId;
  if (!patientId) {
    patientId = await generatePatientId(tenantId);
  } else {
    // Check if patientId already exists for this tenant
    const existing = await Patient.findOne(withTenant(tenantId, { patientId }));
    if (existing) {
      throw new Error('Patient ID already exists for this tenant');
    }
  }

  // Convert dateOfBirth string to Date if needed
  const dateOfBirth =
    input.dateOfBirth instanceof Date ? input.dateOfBirth : new Date(input.dateOfBirth);

  // Convert insurance dates if provided
  const insurance = input.insurance
    ? {
        ...input.insurance,
        validFrom: input.insurance.validFrom
          ? input.insurance.validFrom instanceof Date
            ? input.insurance.validFrom
            : new Date(input.insurance.validFrom)
          : undefined,
        validUntil: input.insurance.validUntil
          ? input.insurance.validUntil instanceof Date
            ? input.insurance.validUntil
            : new Date(input.insurance.validUntil)
          : undefined,
      }
    : undefined;

  // Create patient
  const patient = await Patient.create({
    ...input,
    tenantId,
    patientId,
    dateOfBirth,
    insurance,
    createdBy: userId,
    status: input.status || 'active',
  });

  // Get IP and user agent for audit (from request if available)
  const ipAddress = 'unknown'; // Will be passed from route
  const userAgent = 'unknown'; // Will be passed from route

  // Audit log
  await logCreate(
    userId,
    tenantId,
    'patient',
    patient._id.toString(),
    { patientId: patient.patientId, name: `${patient.firstName} ${patient.lastName}` },
    ipAddress,
    userAgent
  );

  return patient;
}

/**
 * Get patient by ID
 */
export async function getPatientById(
  patientId,
  tenantId,
  userId,
  ipAddress = 'unknown',
  userAgent = 'unknown'
) {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null, // Exclude soft-deleted
    })
  )
    .populate('createdBy', 'firstName lastName email')
    .populate('familyMembers', 'firstName lastName patientId');

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Log PHI access
  await logPHIAccess(userId, tenantId, 'patient', patient._id.toString(), ipAddress, userAgent);

  return patient;
}

/**
 * Search and filter patients
 */
export async function searchPatients(
  filters,
  tenantId,
  userId,
  ipAddress = 'unknown',
  userAgent = 'unknown'
) {
  await connectDB();

  const { page, limit } = getPaginationParams({ page: filters.page, limit: filters.limit });
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

  // Build query
  const query = withTenant(tenantId, {
    deletedAt: null, // Exclude soft-deleted
  });

  // Search filter
  if (filters.search) {
    const searchRegex = { $regex: filters.search, $options: 'i' };
    query.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { patientId: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
    ];
  }

  // Status filter (CursorMD/New Phase 2.6: All/Active/New/Inactive)
  if (filters.status) {
    if (filters.status === 'new') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query.createdAt = { $gte: thirtyDaysAgo };
    } else {
      query.status = filters.status;
    }
  }

  // Gender filter
  if (filters.gender) {
    query.gender = filters.gender;
  }

  // Blood group filter
  if (filters.bloodGroup) {
    query.bloodGroup = filters.bloodGroup;
  }

  // Insurance filter
  if (filters.hasInsurance !== undefined) {
    if (filters.hasInsurance) {
      query['insurance.provider'] = { $exists: true, $ne: null, $ne: '' };
    } else {
      query.$or = [
        { 'insurance.provider': { $exists: false } },
        { 'insurance.provider': null },
        { 'insurance.provider': '' },
      ];
    }
  }

  // Portal enabled filter
  if (filters.portalEnabled !== undefined) {
    query['portalAccess.enabled'] = filters.portalEnabled;
  }

  // Date of birth range filter
  if (filters.dateOfBirthFrom || filters.dateOfBirthTo) {
    query.dateOfBirth = {};
    if (filters.dateOfBirthFrom) {
      query.dateOfBirth.$gte =
        filters.dateOfBirthFrom instanceof Date
          ? filters.dateOfBirthFrom
          : new Date(filters.dateOfBirthFrom);
    }
    if (filters.dateOfBirthTo) {
      query.dateOfBirth.$lte =
        filters.dateOfBirthTo instanceof Date
          ? filters.dateOfBirthTo
          : new Date(filters.dateOfBirthTo);
    }
  }

  // Doctor scope: only patients who have at least one appointment with this doctor
  if (filters.doctorId) {
    const patientIds = await Appointment.distinct(
      'patientId',
      withTenant(tenantId, { doctorId: filters.doctorId })
    );
    if (!patientIds || patientIds.length === 0) {
      return createPaginationResult([], 0, page, limit);
    }
    query._id = { $in: patientIds };
  }

  // Sort by last visit: use aggregation with lookup on appointments
  const useLastVisitSort = sortBy === 'lastVisit';
  const sortField = useLastVisitSort ? 'lastAppointmentDate' : sortBy;
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  let patients;
  let total;

  if (useLastVisitSort) {
    const skip = (page - 1) * limit;
    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: 'appointments',
          let: { pid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$patientId', '$$pid'] }, tenantId: tenantId } },
            { $sort: { appointmentDate: -1 } },
            { $limit: 1 },
            { $project: { appointmentDate: 1 } },
          ],
          as: 'lastAppt',
        },
      },
      { $addFields: { lastAppointmentDate: { $arrayElemAt: ['$lastAppt.appointmentDate', 0] } } },
      { $sort: { lastAppointmentDate: sortDir === 1 ? 1 : -1, createdAt: -1 } },
      { $project: { lastAppt: 0 } },
    ];
    const [aggResult, countResult] = await Promise.all([
      Patient.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
        { $project: { medicalHistory: 0, allergies: 0, currentMedications: 0 } },
      ]),
      Patient.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    patients = aggResult;
    total = countResult[0]?.total ?? 0;
  } else {
    const paginationSkip = (page - 1) * limit;
    [patients, total] = await Promise.all([
      Patient.find(query)
        .select('-medicalHistory -allergies -currentMedications')
        .sort({ [sortField]: sortDir })
        .limit(limit)
        .skip(paginationSkip)
        .lean(),
      Patient.countDocuments(query),
    ]);
  }

  // Log search (PHI access)
  await logPHIAccess(
    userId,
    tenantId,
    'patient',
    null, // No specific patient ID for search
    ipAddress,
    userAgent
  );

  return createPaginationResult(patients, total, page, limit);
}

/**
 * Update patient
 */
export async function updatePatient(
  patientId,
  input,
  tenantId,
  userId,
  ipAddress = 'unknown',
  userAgent = 'unknown'
) {
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

  // Convert dates if provided
  const updateData = { ...input };
  if (input.dateOfBirth) {
    updateData.dateOfBirth =
      input.dateOfBirth instanceof Date ? input.dateOfBirth : new Date(input.dateOfBirth);
  }

  if (input.insurance) {
    updateData.insurance = {
      ...input.insurance,
      validFrom: input.insurance.validFrom
        ? input.insurance.validFrom instanceof Date
          ? input.insurance.validFrom
          : new Date(input.insurance.validFrom)
        : undefined,
      validUntil: input.insurance.validUntil
        ? input.insurance.validUntil instanceof Date
          ? input.insurance.validUntil
          : new Date(input.insurance.validUntil)
        : undefined,
    };
  }

  // Update patient
  Object.assign(patient, updateData);
  await patient.save();

  // Audit log
  await logUpdate(
    userId,
    tenantId,
    'patient',
    patient._id.toString(),
    { changes: Object.keys(updateData), patientId: patient.patientId },
    ipAddress,
    userAgent
  );

  await notifyPatientUpdated(tenantId, patient._id.toString(), patient.toObject?.() ?? patient);

  return patient;
}

/**
 * Delete patient (soft delete)
 */
export async function deletePatient(
  patientId,
  tenantId,
  userId,
  ipAddress = 'unknown',
  userAgent = 'unknown'
) {
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

  // Soft delete
  patient.deletedAt = new Date();
  patient.isActive = false;
  await patient.save();

  // Audit log
  await logDelete(
    userId,
    tenantId,
    'patient',
    patient._id.toString(),
    { patientId: patient.patientId, name: `${patient.firstName} ${patient.lastName}` },
    ipAddress,
    userAgent
  );

  return patient;
}

/**
 * Get patient statistics
 */
export async function getPatientStats(tenantId, userId) {
  await connectDB();

  const stats = await Patient.aggregate([
    {
      $match: withTenant(tenantId, {
        deletedAt: null,
      }),
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        inactive: {
          $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] },
        },
        withInsurance: {
          $sum: { $cond: [{ $ifNull: ['$insurance.provider', false] }, 1, 0] },
        },
        portalEnabled: {
          $sum: { $cond: [{ $ifNull: ['$portalAccess.enabled', false] }, 1, 0] },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      total: 0,
      active: 0,
      inactive: 0,
      withInsurance: 0,
      portalEnabled: 0,
    }
  );
}
