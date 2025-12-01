/**
 * Prescription service
 * Handles all prescription-related business logic
 */

import connectDB from '@/lib/db/connection';
import Prescription, { IPrescription, PrescriptionStatus } from '@/models/Prescription';
import Drug from '@/models/Drug';
import Patient from '@/models/Patient';
import User from '@/models/User';
import Tenant from '@/models/Tenant';
import { withTenant } from '@/lib/db/tenant-helper';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger';
import {
  CreatePrescriptionInput,
  UpdatePrescriptionInput,
  PrescriptionQueryInput,
  DispensePrescriptionInput,
} from '@/lib/validations/prescription';
import { getPaginationParams, createPaginationResult, PaginationResult } from '@/lib/utils/pagination';

/**
 * Generate unique prescription number for a tenant
 */
async function generatePrescriptionNumber(tenantId: string): Promise<string> {
  await connectDB();

  const lastPrescription = await Prescription.findOne(
    withTenant(tenantId, {}),
    { prescriptionNumber: 1 }
  )
    .sort({ prescriptionNumber: -1 })
    .lean();

  if (!lastPrescription) {
    return 'RX-0001';
  }

  const match = lastPrescription.prescriptionNumber.match(/(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `RX-${nextNum.toString().padStart(4, '0')}`;
  }

  return 'RX-0001';
}

/**
 * Create a new prescription
 */
export async function createPrescription(
  input: CreatePrescriptionInput,
  tenantId: string,
  userId: string
): Promise<IPrescription> {
  await connectDB();

  // Validate patient
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: input.patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Validate doctor
  const doctor = await User.findOne(
    withTenant(tenantId, {
      _id: userId,
      isActive: true,
    })
  );

  if (!doctor) {
    throw new Error('Doctor not found or inactive');
  }

  // Get tenant region
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Validate and enrich prescription items
  const enrichedItems = await Promise.all(
    input.items.map(async (item) => {
      const drug = await Drug.findById(item.drugId);
      if (!drug) {
        throw new Error(`Drug not found: ${item.drugId}`);
      }

      // Check if drug is available in tenant's region
      if (drug.region && drug.region !== tenant.region && !drug.availableInRegions?.includes(tenant.region)) {
        throw new Error(`Drug ${drug.name} is not available in region ${tenant.region}`);
      }

      return {
        ...item,
        drugId: drug._id,
        drugName: drug.name,
        genericName: drug.genericName,
        form: drug.form,
        strength: drug.strength,
        unit: item.unit || drug.unit || 'tablets',
      };
    })
  );

  // Generate prescription number
  const prescriptionNumber = await generatePrescriptionNumber(tenantId);

  // Parse dates
  const validUntil = input.validUntil instanceof Date
    ? input.validUntil
    : new Date(input.validUntil);

  // Create prescription
  const prescription = await Prescription.create({
    tenantId,
    patientId: input.patientId,
    appointmentId: input.appointmentId,
    clinicalNoteId: input.clinicalNoteId,
    doctorId: userId,
    prescriptionNumber,
    status: PrescriptionStatus.DRAFT,
    region: tenant.region,
    items: enrichedItems,
    diagnosis: input.diagnosis,
    icd10Codes: input.icd10Codes,
    additionalInstructions: input.additionalInstructions,
    validFrom: new Date(),
    validUntil,
    refillsAllowed: input.refillsAllowed || 0,
    refillsUsed: 0,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'prescription',
    prescription._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return prescription;
}

/**
 * Get prescription by ID
 */
export async function getPrescriptionById(
  prescriptionId: string,
  tenantId: string,
  userId: string
): Promise<IPrescription | null> {
  await connectDB();

  const prescription = await Prescription.findOne(
    withTenant(tenantId, {
      _id: prescriptionId,
      deletedAt: null,
    })
  )
    .populate('patientId', 'firstName lastName patientId phone')
    .populate('doctorId', 'firstName lastName')
    .populate('items.drugId', 'name genericName form strength')
    .lean();

  if (prescription) {
    await AuditLogger.auditRead('prescription', prescriptionId, userId, tenantId);
  }

  return prescription as IPrescription | null;
}

/**
 * List prescriptions with pagination and filters
 */
export async function listPrescriptions(
  query: PrescriptionQueryInput,
  tenantId: string,
  userId: string
): Promise<PaginationResult<IPrescription>> {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter: any = withTenant(tenantId, {
    deletedAt: null,
  });

  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  if (query.doctorId) {
    filter.doctorId = query.doctorId;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  // Date filters
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
  const total = await Prescription.countDocuments(filter);

  // Get paginated results
  const prescriptions = await Prescription.find(filter)
    .populate('patientId', 'firstName lastName patientId')
    .populate('doctorId', 'firstName lastName')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'prescription',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: prescriptions.length, filters: query }
  );

  return createPaginationResult(prescriptions, total, page, limit);
}

/**
 * Update prescription
 */
export async function updatePrescription(
  prescriptionId: string,
  input: UpdatePrescriptionInput,
  tenantId: string,
  userId: string
): Promise<IPrescription | null> {
  await connectDB();

  const existing = await Prescription.findOne(
    withTenant(tenantId, {
      _id: prescriptionId,
      deletedAt: null,
    })
  );

  if (!existing) {
    return null;
  }

  // Don't allow updates to dispensed or cancelled prescriptions
  if (
    existing.status === PrescriptionStatus.DISPENSED ||
    existing.status === PrescriptionStatus.CANCELLED
  ) {
    throw new Error('Cannot update dispensed or cancelled prescription');
  }

  const before = existing.toObject();
  const updateData: any = { ...input };

  // Enrich items if provided
  if (input.items) {
    const tenant = await Tenant.findById(tenantId);
    updateData.items = await Promise.all(
      input.items.map(async (item) => {
        const drug = await Drug.findById(item.drugId);
        if (!drug) {
          throw new Error(`Drug not found: ${item.drugId}`);
        }

        return {
          ...item,
          drugId: drug._id,
          drugName: drug.name,
          genericName: drug.genericName,
          form: drug.form,
          strength: drug.strength,
          unit: item.unit || drug.unit || 'tablets',
        };
      })
    );
  }

  // Parse validUntil if provided
  if (input.validUntil) {
    updateData.validUntil = input.validUntil instanceof Date
      ? input.validUntil
      : new Date(input.validUntil);
  }

  // Remove patientId from update
  delete updateData.patientId;

  const prescription = await Prescription.findByIdAndUpdate(
    prescriptionId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (prescription) {
    await AuditLogger.auditWrite(
      'prescription',
      prescription._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: prescription.toObject() }
    );
  }

  return prescription;
}

/**
 * Activate prescription (move from draft to active)
 */
export async function activatePrescription(
  prescriptionId: string,
  tenantId: string,
  userId: string
): Promise<IPrescription | null> {
  return updatePrescription(
    prescriptionId,
    { status: PrescriptionStatus.ACTIVE },
    tenantId,
    userId
  );
}

/**
 * Dispense prescription
 */
export async function dispensePrescription(
  prescriptionId: string,
  input: DispensePrescriptionInput,
  tenantId: string,
  userId: string
): Promise<IPrescription | null> {
  await connectDB();

  const prescription = await Prescription.findOne(
    withTenant(tenantId, {
      _id: prescriptionId,
      deletedAt: null,
    })
  );

  if (!prescription) {
    return null;
  }

  if (prescription.status !== PrescriptionStatus.ACTIVE) {
    throw new Error('Only active prescriptions can be dispensed');
  }

  if (new Date() > prescription.validUntil) {
    throw new Error('Prescription has expired');
  }

  const before = prescription.toObject();

  prescription.status = PrescriptionStatus.DISPENSED;
  prescription.dispensedAt = new Date();
  prescription.dispensedBy = userId as any;
  prescription.pharmacyNotes = input.pharmacyNotes;
  prescription.refillsUsed = (prescription.refillsUsed || 0) + 1;

  await prescription.save();

  await AuditLogger.auditWrite(
    'prescription',
    prescription._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: prescription.toObject(), action: 'dispensed' }
  );

  return prescription;
}

/**
 * Cancel prescription
 */
export async function cancelPrescription(
  prescriptionId: string,
  tenantId: string,
  userId: string
): Promise<IPrescription | null> {
  return updatePrescription(
    prescriptionId,
    { status: PrescriptionStatus.CANCELLED },
    tenantId,
    userId
  );
}

/**
 * Soft delete prescription
 */
export async function deletePrescription(
  prescriptionId: string,
  tenantId: string,
  userId: string
): Promise<boolean> {
  await connectDB();

  const prescription = await Prescription.findOne(
    withTenant(tenantId, {
      _id: prescriptionId,
      deletedAt: null,
    })
  );

  if (!prescription) {
    return false;
  }

  prescription.deletedAt = new Date();
  prescription.isActive = false;
  await prescription.save();

  await AuditLogger.auditWrite(
    'prescription',
    prescription._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}

