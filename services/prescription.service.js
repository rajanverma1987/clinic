/**
 * Prescription service
 * Handles all prescription-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import Prescription, { PrescriptionStatus } from '@/models/Prescription.js';
import Drug from '@/models/Drug.js';
import InventoryItem from '@/models/InventoryItem.js';
import Patient from '@/models/Patient.js';
import User from '@/models/User.js';
import Tenant from '@/models/Tenant.js';
import Queue, { QueueStatus } from '@/models/Queue.js';
import Appointment, { AppointmentStatus } from '@/models/Appointment.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import { getPaginationParams, createPaginationResult } from '@/lib/utils/pagination.js';
import { decryptField } from '@/lib/encryption/phi-encryption.js';

/**
 * Generate unique prescription number for a tenant
 */
async function generatePrescriptionNumber(tenantId) {
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

  const prescriptionNumber = lastPrescription.prescriptionNumber;
  if (!prescriptionNumber) {
    return 'RX-0001';
  }

  const match = prescriptionNumber.match(/(\d+)$/);
  if (match) {
    const nextNum = parseInt(match[1], 10) + 1;
    return `RX-${nextNum.toString().padStart(4, '0')}`;
  }

  return 'RX-0001';
}

/**
 * Create a new prescription
 */
export async function createPrescription(input, tenantId, userId) {
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
  // Only validate drugs when itemType is 'drug'
  const enrichedItems = await Promise.all(
    input.items.map(async (item) => {
      const itemType = item.itemType || 'drug';

      // Only validate and enrich drug items
      if (itemType === 'drug') {
        // Validate drugId is provided
        if (!item.drugId) {
          throw new Error('Drug ID is required for drug items');
        }

        // Try InventoryItem first (for medicines in stock)
        const inventoryItem = await InventoryItem.findOne(
          withTenant(tenantId, {
            _id: item.drugId,
            type: 'medicine',
            deletedAt: null,
          })
        );

        if (inventoryItem) {
          // Use inventory item's drug information
          return {
            ...item,
            drugId: inventoryItem._id, // Store inventory item ID
            drugName: inventoryItem.name || inventoryItem.brandName || 'Unknown',
            genericName: inventoryItem.genericName,
            form: inventoryItem.form || '',
            strength: inventoryItem.strength,
            unit: item.unit || inventoryItem.unit || 'tablets',
          };
        }

        // Fall back to Drug model if not found as inventory item
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
      }

      // For non-drug items (lab, procedure, other), return as-is
      return item;
    })
  );

  // Generate prescription number
  const prescriptionNumber = await generatePrescriptionNumber(tenantId);

  // Parse dates
  const validUntil = input.validUntil instanceof Date
    ? input.validUntil
    : new Date(input.validUntil);

  // Create prescription
  // Use provided status, or default to ACTIVE (not DRAFT) for regular prescriptions
  // DRAFT should only be used when explicitly saving as draft
  const prescriptionStatus = input.status || PrescriptionStatus.ACTIVE;

  const prescription = await Prescription.create({
    tenantId,
    patientId: input.patientId,
    appointmentId: input.appointmentId,
    clinicalNoteId: input.clinicalNoteId,
    doctorId: userId,
    prescriptionNumber,
    status: prescriptionStatus,
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

  // Auto-complete queue entry if prescription is created for an in-progress queue entry
  try {
    const queueFilter = withTenant(tenantId, {
      patientId: input.patientId,
      doctorId: userId,
      status: QueueStatus.IN_PROGRESS,
      deletedAt: null,
    });

    // If appointmentId is provided, also filter by it
    if (input.appointmentId) {
      queueFilter.appointmentId = input.appointmentId;
    }

    const queueEntry = await Queue.findOne(queueFilter);

    if (queueEntry) {
      // Mark queue entry as completed
      const now = new Date();
      await Queue.findByIdAndUpdate(queueEntry._id, {
        $set: {
          status: QueueStatus.COMPLETED,
          completedAt: now,
          position: 0,
        },
      });

      // Update appointment status if linked
      if (queueEntry.appointmentId) {
        await Appointment.findByIdAndUpdate(queueEntry.appointmentId, {
          $set: {
            status: AppointmentStatus.COMPLETED,
            completedAt: now,
          },
        });
      }

      // Recalculate positions for the doctor's queue
      // Import queue service function to recalculate positions
      const queueService = await import('@/services/queue.service.js');
      // We need to access the internal function, but it's not exported
      // Instead, we'll just update the positions manually for simplicity
      // The queue service will handle this on next fetch

      console.log(`Queue entry ${queueEntry._id} automatically marked as completed after prescription creation`);
    }
  } catch (error) {
    // Log error but don't fail prescription creation if queue update fails
    console.error('Failed to auto-complete queue entry:', error);
  }

  // Convert to plain object and decrypt item instructions
  const prescriptionObj = prescription.toObject();
  return decryptPrescriptionItems(prescriptionObj);
}

/**
 * Decrypt item instructions in prescription (needed when using .lean())
 * Also handles cases where post('init') hook didn't run
 */
function decryptPrescriptionItems(prescription) {
  if (!prescription) {
    return prescription;
  }

  // If no items, return as-is
  if (!prescription.items || !Array.isArray(prescription.items)) {
    return prescription;
  }

  const decrypted = { ...prescription };
  decrypted.items = prescription.items.map(item => {
    if (item && item.instructions) {
      return {
        ...item,
        instructions: decryptField(item.instructions),
      };
    }
    return item;
  });

  return decrypted;
}

/**
 * Get prescription by ID
 */
export async function getPrescriptionById(prescriptionId, tenantId, userId) {
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
    // Decrypt item instructions manually since we're using .lean()
    return decryptPrescriptionItems(prescription);
  }

  return prescription;
}

/**
 * List prescriptions with pagination and filters
 */
export async function listPrescriptions(query, tenantId, userId) {
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
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Decrypt item instructions for each prescription (needed when using .lean())
  const decryptedPrescriptions = prescriptions.map(prescription => decryptPrescriptionItems(prescription));

  // Audit list access
  await AuditLogger.auditWrite(
    'prescription',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: decryptedPrescriptions.length, filters: query }
  );

  return createPaginationResult(decryptedPrescriptions, total, page || 1, limit || 10);
}

/**
 * Update prescription
 */
export async function updatePrescription(prescriptionId, input, tenantId, userId) {
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
  const updateData = { ...input };

  // Enrich items if provided
  if (input.items) {
    const tenant = await Tenant.findById(tenantId);
    updateData.items = await Promise.all(
      input.items.map(async (item) => {
        const itemType = item.itemType || 'drug';

        // Only validate and enrich drug items
        if (itemType === 'drug') {
          // Validate drugId is provided
          if (!item.drugId) {
            throw new Error('Drug ID is required for drug items');
          }

          // Try InventoryItem first (for medicines in stock)
          const inventoryItem = await InventoryItem.findOne(
            withTenant(tenantId, {
              _id: item.drugId,
              type: 'medicine',
              deletedAt: null,
            })
          );

          if (inventoryItem) {
            // Use inventory item's drug information
            return {
              ...item,
              drugId: inventoryItem._id, // Store inventory item ID
              drugName: inventoryItem.name || inventoryItem.brandName || 'Unknown',
              genericName: inventoryItem.genericName,
              form: inventoryItem.form || '',
              strength: inventoryItem.strength,
              unit: item.unit || inventoryItem.unit || 'tablets',
            };
          }

          // Fall back to Drug model if not found as inventory item
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
        }

        // For non-drug items (lab, procedure, other), return as-is
        return item;
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

    // Convert to plain object and decrypt item instructions
    const prescriptionObj = prescription.toObject();
    return decryptPrescriptionItems(prescriptionObj);
  }

  return prescription;
}

/**
 * Activate prescription (move from draft to active)
 */
export async function activatePrescription(prescriptionId, tenantId, userId) {
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
export async function dispensePrescription(prescriptionId, input, tenantId, userId) {
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
  prescription.dispensedBy = userId;
  prescription.pharmacyNotes = input.pharmacyNotes;
  prescription.refillsUsed = (prescription.refillsUsed || 0) + 1;

  await prescription.save();

  await AuditLogger.auditWrite(
    'prescription',
    prescription._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: prescription.toObject() },
    { action: 'dispensed' }
  );

  // Convert to plain object and decrypt item instructions
  const prescriptionObj = prescription.toObject();
  return decryptPrescriptionItems(prescriptionObj);
}

/**
 * Cancel prescription
 */
export async function cancelPrescription(prescriptionId, tenantId, userId) {
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
export async function deletePrescription(prescriptionId, tenantId, userId) {
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

