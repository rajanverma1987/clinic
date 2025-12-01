/**
 * Patient service
 * Handles all patient-related business logic
 */

import connectDB from '@/lib/db/connection';
import Patient, { IPatient } from '@/models/Patient';
import { withTenant } from '@/lib/db/tenant-helper';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger';
import { CreatePatientInput, UpdatePatientInput, PatientQueryInput } from '@/lib/validations/patient';
import { getPaginationParams, createPaginationResult, PaginationResult } from '@/lib/utils/pagination';

/**
 * Generate unique patient ID for a tenant
 */
async function generatePatientId(tenantId: string): Promise<string> {
  await connectDB();
  
  // Get the last patient number for this tenant
  const lastPatient = await Patient.findOne(
    withTenant(tenantId, {}),
    { patientId: 1 }
  )
    .sort({ patientId: -1 })
    .lean();

  if (!lastPatient) {
    return 'PAT-0001';
  }

  // Extract number from patientId (e.g., PAT-0001 -> 1)
  const match = lastPatient.patientId.match(/(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `PAT-${nextNum.toString().padStart(4, '0')}`;
  }

  return `PAT-0001`;
}

/**
 * Create a new patient
 */
export async function createPatient(
  input: CreatePatientInput,
  tenantId: string,
  userId: string
): Promise<IPatient> {
  await connectDB();

  // Generate patient ID if not provided
  let patientId = input.patientId;
  if (!patientId) {
    patientId = await generatePatientId(tenantId);
  } else {
    // Check if patientId already exists for this tenant
    const existing = await Patient.findOne(
      withTenant(tenantId, { patientId })
    );
    if (existing) {
      throw new Error('Patient ID already exists for this tenant');
    }
  }

  // Convert dateOfBirth string to Date if needed
  const dateOfBirth = input.dateOfBirth instanceof Date 
    ? input.dateOfBirth 
    : new Date(input.dateOfBirth);

  // Create patient
  const patient = await Patient.create({
    ...input,
    tenantId,
    patientId,
    dateOfBirth,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'patient',
    patient._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return patient;
}

/**
 * Get patient by ID
 */
export async function getPatientById(
  patientId: string,
  tenantId: string,
  userId: string
): Promise<IPatient | null> {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null, // Exclude soft-deleted
    })
  );

  if (patient) {
    // Audit read access
    await AuditLogger.auditRead(
      'patient',
      patient._id.toString(),
      userId,
      tenantId
    );
  }

  return patient;
}

/**
 * List patients with pagination and filters
 */
export async function listPatients(
  query: PatientQueryInput,
  tenantId: string,
  userId: string
): Promise<PaginationResult<IPatient>> {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter: any = withTenant(tenantId, {
    deletedAt: null, // Exclude soft-deleted
  });

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.gender) {
    filter.gender = query.gender;
  }

  if (query.bloodGroup) {
    filter.bloodGroup = query.bloodGroup;
  }

  // Text search
  if (query.search) {
    filter.$or = [
      { firstName: { $regex: query.search, $options: 'i' } },
      { lastName: { $regex: query.search, $options: 'i' } },
      { patientId: { $regex: query.search, $options: 'i' } },
      { phone: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
    ];
  }

  // Get total count
  const total = await Patient.countDocuments(filter);

  // Get paginated results
  const patients = await Patient.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'patient',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: patients.length, filters: query }
  );

  return createPaginationResult(patients, total, page, limit);
}

/**
 * Update patient
 */
export async function updatePatient(
  patientId: string,
  input: UpdatePatientInput,
  tenantId: string,
  userId: string
): Promise<IPatient | null> {
  await connectDB();

  // Get existing patient
  const existing = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null,
    })
  );

  if (!existing) {
    return null;
  }

  // Store before state for audit
  const before = existing.toObject();

  // Convert dateOfBirth if provided
  const updateData: any = { ...input };
  if (input.dateOfBirth) {
    updateData.dateOfBirth = input.dateOfBirth instanceof Date
      ? input.dateOfBirth
      : new Date(input.dateOfBirth);
  }

  // Remove patientId from update (shouldn't be changed)
  delete updateData.patientId;

  // Update patient
  const patient = await Patient.findByIdAndUpdate(
    patientId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (patient) {
    // Audit log with changes
    await AuditLogger.auditWrite(
      'patient',
      patient._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      {
        before,
        after: patient.toObject(),
      }
    );
  }

  return patient;
}

/**
 * Soft delete patient
 */
export async function deletePatient(
  patientId: string,
  tenantId: string,
  userId: string
): Promise<boolean> {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    return false;
  }

  // Soft delete
  patient.deletedAt = new Date();
  patient.isActive = false;
  await patient.save();

  // Audit log
  await AuditLogger.auditWrite(
    'patient',
    patient._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}

