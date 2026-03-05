/**
 * Prescription Service
 *
 * Enterprise-grade service for prescription management with comprehensive
 * business logic, drug validation, inventory integration, and compliance.
 *
 * Features:
 * - Prescription creation with drug validation
 * - Inventory stock checking
 * - Prescription number generation
 * - Refill management
 * - PHI encryption/decryption
 * - Queue integration
 * - Multi-tenant isolation
 * - Audit logging
 * - HIPAA compliance
 *
 * @module services/prescription.service
 * @since 1.0.0
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { decryptField } from '@/lib/encryption/phi-encryption.js';
import { measureTime } from '@/lib/utils/enterprise-helpers.js';
import { logger } from '@/lib/utils/logger.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import Appointment, { AppointmentStatus } from '@/models/Appointment.js';
import Drug from '@/models/Drug.js';
import InventoryItem from '@/models/InventoryItem.js';
import Patient from '@/models/Patient.js';
import Prescription, { PrescriptionStatus } from '@/models/Prescription.js';
import Queue, { QueueStatus } from '@/models/Queue.js';
import { TransactionType } from '@/models/StockTransaction.js';
import Tenant from '@/models/Tenant.js';
import User from '@/models/User.js';
import mongoose from 'mongoose';
import { createStockTransaction } from './inventory.service.js';
import { recordPrescriptionVersion } from './prescription-version.service.js';
import { recalculatePositions } from './queue.service.js';
import { transliterateToArabic } from '@/lib/utils/transliterate-name.js';
import { translateToSpanish } from '@/lib/utils/translate-name-spanish.js';

/**
 * Generate unique prescription number for a tenant
 */
async function generatePrescriptionNumber(tenantId) {
  await connectDB();

  const lastPrescription = await Prescription.findOne(withTenant(tenantId, {}), {
    prescriptionNumber: 1,
  })
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
    }),
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Validate doctor
  const doctor = await User.findOne(
    withTenant(tenantId, {
      _id: userId,
      isActive: true,
    }),
  );

  if (!doctor) {
    throw new Error('Doctor not found or inactive');
  }

  // Get tenant region
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new Error('Tenant not found');
  }

  // Check for duplicate prescription for same appointment
  // Prevent creating multiple prescriptions for the same appointment
  if (input.appointmentId) {
    const existingPrescription = await Prescription.findOne(
      withTenant(tenantId, {
        appointmentId: input.appointmentId,
        patientId: input.patientId,
        doctorId: userId,
        status: { $ne: 'CANCELLED' },
        deletedAt: null,
      }),
    ).lean();

    if (existingPrescription) {
      throw new Error(
        `A prescription already exists for this appointment (${existingPrescription.prescriptionNumber}). ` +
          `Please update the existing prescription instead of creating a new one.`,
      );
    }
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
          }),
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
        if (
          drug.region &&
          drug.region !== tenant.region &&
          !drug.availableInRegions?.includes(tenant.region)
        ) {
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
    }),
  );

  // Generate prescription number
  const prescriptionNumber = await generatePrescriptionNumber(tenantId);

  // Parse dates
  const validUntil =
    input.validUntil instanceof Date ? input.validUntil : new Date(input.validUntil);

  // Create prescription
  // Use provided status, or default to ACTIVE (not DRAFT) for regular prescriptions
  // DRAFT should only be used when explicitly saving as draft
  const prescriptionStatus = input.status || PrescriptionStatus.ACTIVE;

  const now = new Date();
  const signPayload =
    prescriptionStatus === PrescriptionStatus.ACTIVE &&
    (input.doctorSignature || input.signedByTitle || input.signedByLicense)
      ? {
          doctorSignature: input.doctorSignature,
          signedAt: now,
          signedByTitle: input.signedByTitle,
          signedByLicense: input.signedByLicense,
        }
      : {};

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
    chiefComplaint: input.chiefComplaint,
    followUpDate: input.followUpDate ? new Date(input.followUpDate) : undefined,
    followUpType: input.followUpType,
    followUpAutoSchedule: input.followUpAutoSchedule || false,
    additionalInstructions: input.additionalInstructions,
    validFrom: now,
    validUntil,
    refillsAllowed: input.refillsAllowed || 0,
    refillsUsed: 0,
    ...signPayload,
  });

  // Audit log
  await AuditLogger.auditWrite(
    'prescription',
    prescription._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
  );

  await recordPrescriptionVersion(prescription._id.toString(), 'create', tenantId, userId, null);

  // Auto-complete queue entry if prescription is created for an in-progress queue entry
  // Improved error handling to prevent silent failures
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
      const queueUpdateResult = await Queue.findByIdAndUpdate(queueEntry._id, {
        $set: {
          status: QueueStatus.COMPLETED,
          completedAt: now,
          position: 0,
        },
      });

      if (!queueUpdateResult) {
        logger.error(
          `[Prescription] Failed to update queue entry ${queueEntry._id} to completed status`,
        );
        // Log but don't fail prescription creation
      } else {
        logger.info(`[Prescription] Successfully completed queue entry ${queueEntry._id}`);
      }

      // Update appointment status if linked
      if (queueEntry.appointmentId) {
        try {
          const appointmentUpdateResult = await Appointment.findByIdAndUpdate(
            queueEntry.appointmentId,
            {
              $set: {
                status: AppointmentStatus.COMPLETED,
                completedAt: now,
              },
            },
          );

          if (!appointmentUpdateResult) {
            logger.error(
              `[Prescription] Failed to update appointment ${queueEntry.appointmentId} to completed status`,
            );
          } else {
            logger.info(
              `[Prescription] Successfully completed appointment ${queueEntry.appointmentId}`,
            );
          }
        } catch (appointmentError) {
          logger.error(
            `[Prescription] Error updating appointment ${queueEntry.appointmentId}:`,
            appointmentError,
          );
          // Log error but don't fail prescription creation
        }
      }

      // Recalculate positions for other queue entries
      try {
        await recalculatePositions(tenantId, userId);
        logger.info(
          `[Prescription] Successfully recalculated queue positions for doctor ${userId}`,
        );
      } catch (recalcError) {
        logger.error(`[Prescription] Failed to recalculate queue positions:`, recalcError);
        // Log but don't fail - positions will be recalculated on next queue operation
      }

      logger.info(
        `[Prescription] Queue entry ${queueEntry._id} automatically marked as completed after prescription creation`,
      );
    }
  } catch (error) {
    // Log queue cleanup errors but don't fail prescription creation
    logger.error('[Prescription] Queue cleanup error (non-critical):', error);
    // Prescription was created successfully, queue cleanup is secondary
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
  decrypted.items = prescription.items.map((item) => {
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
    }),
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
 *
 * @param {Object} query - Query parameters: { page?, limit?, patientId?, doctorId?, status?, isActive?, startDate?, endDate? }
 * @param {string|ObjectId} tenantId - Tenant ID for multi-tenant isolation
 * @param {string|ObjectId} userId - User ID for audit logging
 * @returns {Promise<Object>} Paginated result with prescriptions (item instructions decrypted)
 *
 * @throws {Error} If database query fails
 *
 * @enterprise
 * - Uses aggregation pipeline with $lookup for optimal performance (avoids N+1 queries)
 * - Includes audit logging for compliance
 * - Proper error handling and logging
 * - Tenant isolation enforced via withTenant
 * - Performance monitoring via measureTime
 * - Automatically decrypts PHI fields (item instructions)
 */
export async function listPrescriptions(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Normalize tenantId to ObjectId so filter matches Prescription documents (schema uses ObjectId)
  const resolvedTenantId =
    tenantId && typeof tenantId === 'string' && mongoose.Types.ObjectId.isValid(tenantId)
      ? new mongoose.Types.ObjectId(tenantId)
      : tenantId;

  // Build filter
  const filter = withTenant(resolvedTenantId, {
    deletedAt: null,
  });

  if (query.patientId) {
    filter.patientId =
      typeof query.patientId === 'string' && mongoose.Types.ObjectId.isValid(query.patientId)
        ? new mongoose.Types.ObjectId(query.patientId)
        : query.patientId;
  }

  if (query.doctorId) {
    filter.doctorId =
      typeof query.doctorId === 'string' && mongoose.Types.ObjectId.isValid(query.doctorId)
        ? new mongoose.Types.ObjectId(query.doctorId)
        : query.doctorId;
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

  // Get total count (removed redundant early check to reduce connection pool usage)
  const total = await Prescription.countDocuments(filter);

  if (total === 0) {
    // No prescriptions exist - return empty result immediately
    await AuditLogger.auditWrite(
      'prescription',
      'list',
      userId,
      tenantId,
      AuditAction.READ,
      undefined,
      { count: 0, filters: query, emptyCollection: true },
    );
    return createPaginationResult([], 0, page || 1, limit || 10);
  }

  // Optimize: Use aggregation with $lookup instead of populate to avoid N+1 queries
  const pipeline = [
    { $match: filter },
    {
      $lookup: {
        from: 'patients',
        localField: 'patientId',
        foreignField: '_id',
        as: 'patient',
        pipeline: [
          {
            $project: {
              firstName: 1,
              lastName: 1,
              patientId: 1,
              firstName_es: 1,
              lastName_es: 1,
              firstName_ar: 1,
              lastName_ar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'doctorId',
        foreignField: '_id',
        as: 'doctor',
        pipeline: [{ $project: { firstName: 1, lastName: 1 } }],
      },
    },
    {
      $addFields: {
        patientId: { $arrayElemAt: ['$patient', 0] },
        doctorId: { $arrayElemAt: ['$doctor', 0] },
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: ((page || 1) - 1) * (limit || 10) },
    { $limit: limit || 10 },
  ];

  try {
    const prescriptions = await measureTime(`listPrescriptions-${tenantId}`, () =>
      Prescription.aggregate(pipeline),
    );

    // Apply localized patient and doctor names for UI (es/ar when requested)
    const locale = query.locale && String(query.locale).toLowerCase().slice(0, 2);
    const firstKey = locale === 'es' || locale === 'ar' ? `firstName_${locale}` : 'firstName';
    const lastKey = locale === 'es' || locale === 'ar' ? `lastName_${locale}` : 'lastName';
    const withLocalizedNames = prescriptions.map((rx) => {
      const p = rx.patientId;
      if (p) {
        const displayFirst = (p[firstKey] && String(p[firstKey]).trim()) || p.firstName || '';
        const displayLast = (p[lastKey] && String(p[lastKey]).trim()) || p.lastName || '';
        rx.patientId = { ...p, firstName: displayFirst, lastName: displayLast };
        let displayName = [displayFirst, displayLast].filter(Boolean).join(' ').trim() || null;
        if (locale === 'ar' && displayName && !(p.firstName_ar || p.lastName_ar)) {
          displayName =
            [transliterateToArabic(displayFirst), transliterateToArabic(displayLast)]
              .filter(Boolean)
              .join(' ')
              .trim() || displayName;
        }
        if (locale === 'es' && displayName && !(p.firstName_es || p.lastName_es)) {
          const esFirst = translateToSpanish(displayFirst) || displayFirst;
          const esLast = translateToSpanish(displayLast) || displayLast;
          displayName = [esFirst, esLast].filter(Boolean).join(' ').trim() || displayName;
        }
        rx.patientDisplayName = displayName;
      } else {
        rx.patientDisplayName = null;
      }
      const d = rx.doctorId;
      if (d) {
        let docFirst = d.firstName || '';
        let docLast = d.lastName || '';
        if (locale === 'ar') {
          docFirst = transliterateToArabic(docFirst) || docFirst;
          docLast = transliterateToArabic(docLast) || docLast;
        }
        if (locale === 'es') {
          docFirst = translateToSpanish(docFirst) || docFirst;
          docLast = translateToSpanish(docLast) || docLast;
        }
        rx.doctorId = { ...d, firstName: docFirst, lastName: docLast };
        rx.doctorDisplayName = [docFirst, docLast].filter(Boolean).join(' ').trim() || null;
      } else {
        rx.doctorDisplayName = null;
      }
      return rx;
    });

    // Decrypt item instructions for each prescription (needed when using aggregation)
    const decryptedPrescriptions = withLocalizedNames.map((prescription) =>
      decryptPrescriptionItems(prescription),
    );

    // Audit list access
    await AuditLogger.auditWrite(
      'prescription',
      'list',
      userId,
      tenantId,
      AuditAction.READ,
      undefined,
      { count: decryptedPrescriptions.length, filters: query },
    );

    return createPaginationResult(decryptedPrescriptions, total, page || 1, limit || 10);
  } catch (error) {
    logger.error('Error listing prescriptions:', {
      error: error.message,
      stack: error.stack,
      tenantId,
      userId,
      query,
    });
    throw error;
  }
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
    }),
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
            }),
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
      }),
    );
  }

  // Parse validUntil if provided
  if (input.validUntil) {
    updateData.validUntil =
      input.validUntil instanceof Date ? input.validUntil : new Date(input.validUntil);
  }

  // Remove patientId from update
  delete updateData.patientId;

  const prescription = await Prescription.findByIdAndUpdate(
    prescriptionId,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (prescription) {
    await AuditLogger.auditWrite(
      'prescription',
      prescription._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: prescription.toObject() },
    );

    const action = prescription.status === PrescriptionStatus.CANCELLED ? 'void' : 'update';
    await recordPrescriptionVersion(
      prescriptionId,
      action,
      tenantId,
      userId,
      input.reason || undefined,
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
    userId,
  );
}

/**
 * Sign prescription (e-sign and activate). Used for draft → active with signature.
 */
export async function signPrescription(prescriptionId, input, tenantId, userId) {
  await connectDB();

  const prescription = await Prescription.findOne(
    withTenant(tenantId, {
      _id: prescriptionId,
      deletedAt: null,
    }),
  );

  if (!prescription) {
    return null;
  }

  if (
    prescription.status !== PrescriptionStatus.DRAFT &&
    prescription.status !== PrescriptionStatus.ACTIVE
  ) {
    throw new Error('Only draft or active prescriptions can be signed');
  }

  if (!input.doctorSignature || String(input.doctorSignature).trim() === '') {
    throw new Error('Doctor signature is required to sign prescription');
  }

  const before = prescription.toObject();
  const now = new Date();

  prescription.doctorSignature = input.doctorSignature.trim();
  prescription.signedAt = now;
  prescription.signedByTitle = input.signedByTitle?.trim() || prescription.signedByTitle;
  prescription.signedByLicense = input.signedByLicense?.trim() || prescription.signedByLicense;
  prescription.status = PrescriptionStatus.ACTIVE;

  await prescription.save();

  await AuditLogger.auditWrite(
    'prescription',
    prescription._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: prescription.toObject() },
    { action: 'signed' },
  );

  const prescriptionObj = prescription.toObject();
  return decryptPrescriptionItems(prescriptionObj);
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
    }),
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
    { action: 'dispensed' },
  );

  // D4: Stock deduction for each drug item linked to inventory
  const items = prescription.items || [];
  for (const item of items) {
    if (item.itemType !== 'drug' || !item.drugId || !(item.quantity > 0)) continue;
    try {
      const inventoryItem = await InventoryItem.findOne(
        withTenant(tenantId, {
          drugId: item.drugId,
          deletedAt: null,
        }),
      ).lean();
      if (!inventoryItem || inventoryItem.availableQuantity < item.quantity) {
        if (inventoryItem && inventoryItem.availableQuantity < item.quantity) {
          logger.warn(
            `Dispense: insufficient stock for drug ${item.drugId}, available ${inventoryItem.availableQuantity}, required ${item.quantity}`,
          );
        }
        continue;
      }
      await createStockTransaction(
        {
          inventoryItemId: inventoryItem._id,
          type: TransactionType.SALE,
          quantity: -item.quantity,
          prescriptionId: prescription._id.toString(),
          referenceNumber: prescription.prescriptionNumber,
          notes: `Dispensed via prescription ${prescription.prescriptionNumber}`,
        },
        tenantId,
        userId,
      );
    } catch (err) {
      logger.error('Dispense stock deduction failed for item', {
        drugId: item.drugId,
        prescriptionId: prescription._id,
        err: err.message,
      });
      // Don't fail entire dispense; audit is already written
    }
  }

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
    userId,
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
    }),
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
    AuditAction.DELETE,
  );

  return true;
}
