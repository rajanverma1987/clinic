/**
 * Imaging Study service
 * Handles all imaging study-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import { generateImagingStudyNumber } from '@/lib/utils/number-generator.js';
import ImagingStudy, { ImagingStudyStatus } from '@/models/ImagingStudy.js';
import Patient from '@/models/Patient.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Create a new imaging study
 */
export async function createImagingStudy(input, tenantId, userId) {
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

  // Generate study number
  const studyNumber = await generateImagingStudyNumber(tenantId);

  // Create imaging study
  const imagingStudy = await ImagingStudy.create({
    tenantId,
    studyNumber,
    patientId: input.patientId,
    doctorId: input.doctorId || userId,
    appointmentId: input.appointmentId,
    studyType: input.studyType,
    bodyPart: input.bodyPart,
    clinicalIndication: input.clinicalIndication || '',
    orderedAt: input.orderedAt || new Date(),
    status: ImagingStudyStatus.ORDERED,
    images: input.images || [],
    notes: input.notes || '',
    createdBy: userId,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'imaging_study',
    imagingStudy._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return imagingStudy;
}

/**
 * Get imaging study by ID
 */
export async function getImagingStudyById(studyId, tenantId, userId) {
  await connectDB();

  const imagingStudy = await ImagingStudy.findOne(
    withTenant(tenantId, {
      _id: studyId,
    })
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .populate('appointmentId', 'appointmentNumber')
    .populate('report.reportedBy', 'firstName lastName')
    .lean();

  if (imagingStudy) {
    await AuditLogger.auditRead('imaging_study', studyId, userId, tenantId);
  }

  return imagingStudy;
}

/**
 * List imaging studies with pagination and filters
 */
export async function listImagingStudies(query, tenantId, userId) {
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

  if (query.studyType) {
    filter.studyType = query.studyType;
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
  const total = await ImagingStudy.countDocuments(filter);

  // Get paginated results
  const imagingStudies = await ImagingStudy.find(filter)
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .sort({ orderedAt: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'imaging_study',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: imagingStudies.length, filters: query }
  );

  return createPaginationResult(imagingStudies, total, page || 1, limit || 10);
}

/**
 * Update imaging study
 */
export async function updateImagingStudy(studyId, input, tenantId, userId) {
  await connectDB();

  const existing = await ImagingStudy.findOne(
    withTenant(tenantId, {
      _id: studyId,
    })
  );

  if (!existing) {
    return null;
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Don't allow changing patientId or studyNumber
  delete updateData.patientId;
  delete updateData.studyNumber;

  const imagingStudy = await ImagingStudy.findByIdAndUpdate(
    studyId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName');

  if (imagingStudy) {
    await AuditLogger.auditWrite(
      'imaging_study',
      imagingStudy._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: imagingStudy.toObject() }
    );
  }

  return imagingStudy;
}

/**
 * Add report to imaging study
 */
export async function addImagingReport(studyId, report, tenantId, userId) {
  await connectDB();

  const imagingStudy = await ImagingStudy.findOne(
    withTenant(tenantId, {
      _id: studyId,
    })
  );

  if (!imagingStudy) {
    return null;
  }

  const before = imagingStudy.toObject();
  
  imagingStudy.report = {
    findings: report.findings || '',
    impression: report.impression || '',
    recommendations: report.recommendations || '',
    reportedBy: userId,
    reportedAt: new Date(),
  };
  
  imagingStudy.status = ImagingStudyStatus.REPORTED;
  await imagingStudy.save();

  // Audit log
  await AuditLogger.auditWrite(
    'imaging_study',
    imagingStudy._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: imagingStudy.toObject() },
    { action: 'add_report' }
  );

  return imagingStudy;
}
