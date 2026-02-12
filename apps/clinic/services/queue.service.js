/**
 * Queue Service
 *
 * Enterprise-grade service for patient queue management with priority handling,
 * position tracking, and real-time updates.
 *
 * Features:
 * - Queue entry creation and management
 * - Priority-based queue ordering
 * - Position calculation and recalculation
 * - Status management (waiting, in_progress, completed, cancelled)
 * - Doctor-specific queues
 * - Appointment integration
 * - Real-time queue updates via Socket.IO
 * - Multi-tenant isolation
 * - Audit logging
 *
 * @module services/queue.service
 * @since 1.0.0
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { measureTime } from '@/lib/utils/enterprise-helpers.js';
import { logger } from '@/lib/utils/logger.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import Appointment, { AppointmentStatus } from '@/models/Appointment.js';
import Patient from '@/models/Patient.js';
import Queue, { QueuePriority, QueueStatus, QueueType } from '@/models/Queue.js';
import User from '@/models/User.js';

/**
 * Generate next queue number for tenant
 * Finds the next available queue number by checking all existing numbers
 */
async function generateQueueNumber(tenantId) {
  await connectDB();

  // Get all queue numbers for this tenant to find the next available
  const allQueues = await Queue.find(withTenant(tenantId, { deletedAt: null }))
    .select('queueNumber')
    .lean();

  if (!allQueues || allQueues.length === 0) {
    return 'Q-0001';
  }

  // Extract all queue numbers and find the highest
  const queueNumbers = allQueues
    .map((q) => q.queueNumber)
    .filter((qn) => qn && qn.match(/Q-(\d+)/))
    .map((qn) => {
      const match = qn.match(/Q-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((num) => num > 0)
    .sort((a, b) => b - a); // Sort descending

  // Find next available number (handle gaps)
  let nextNumber = 1;
  if (queueNumbers.length > 0) {
    const maxNumber = queueNumbers[0];
    // Check for gaps in sequence
    for (let i = 1; i <= maxNumber + 1; i++) {
      if (!queueNumbers.includes(i)) {
        nextNumber = i;
        break;
      }
    }
    if (nextNumber === 1 && queueNumbers.includes(1)) {
      nextNumber = maxNumber + 1;
    }
  }

  return `Q-${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Calculate next position in queue for a doctor
 */
async function calculateNextPosition(tenantId, doctorId, priority) {
  await connectDB();

  // Count active waiting entries for this doctor
  const waitingCount = await Queue.countDocuments(
    withTenant(tenantId, {
      doctorId,
      status: QueueStatus.WAITING,
      deletedAt: null,
    }),
  );

  // If high priority, insert at position 1 (will be reordered)
  // Otherwise, add to end
  return waitingCount + 1;
}

/**
 * Recalculate positions for a doctor's queue
 */
export async function recalculatePositions(tenantId, doctorId) {
  await connectDB();

  // Get all waiting entries for this doctor, ordered by priority and join time
  const entries = await Queue.find(
    withTenant(tenantId, {
      doctorId,
      status: QueueStatus.WAITING,
      deletedAt: null,
    }),
  )
    .sort({ priority: -1, joinedAt: 1 }) // Higher priority first, then by join time
    .lean();

  // Update positions
  for (let i = 0; i < entries.length; i++) {
    await Queue.findByIdAndUpdate(entries[i]._id, {
      $set: { position: i + 1 },
    });
  }
}

/**
 * Calculate estimated wait time based on queue position and average consultation time
 */
async function calculateEstimatedWaitTime(tenantId, doctorId, position) {
  await connectDB();

  // Get average consultation time from recent completed appointments (default: 30 minutes)
  const avgConsultationTime = 30; // minutes

  // Estimate: (position - 1) * average consultation time
  // For position 1, wait time is 0 (next to be called)
  return Math.max(0, (position - 1) * avgConsultationTime);
}

/**
 * Create a new queue entry
 */
export async function createQueueEntry(input, tenantId, userId) {
  await connectDB();

  // Validate patient exists and belongs to tenant
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: input.patientId,
      deletedAt: null,
    }),
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Validate doctor exists and belongs to tenant
  const doctor = await User.findOne(
    withTenant(tenantId, {
      _id: input.doctorId,
      isActive: true,
    }),
  );

  if (!doctor) {
    throw new Error('Doctor not found or inactive');
  }

  // If linked to appointment, validate appointment
  if (input.type === QueueType.APPOINTMENT && input.appointmentId) {
    const appointment = await Appointment.findOne(
      withTenant(tenantId, {
        _id: input.appointmentId,
        patientId: input.patientId,
        doctorId: input.doctorId,
        deletedAt: null,
      }),
    );

    if (!appointment) {
      throw new Error('Appointment not found or does not match patient/doctor');
    }

    // Check if appointment is already in queue
    const existingQueueEntry = await Queue.findOne(
      withTenant(tenantId, {
        appointmentId: input.appointmentId,
        status: { $in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_PROGRESS] },
        deletedAt: null,
      }),
    );

    if (existingQueueEntry) {
      throw new Error('Appointment is already in queue');
    }

    // Update appointment status to IN_QUEUE only if it's not already ARRIVED or IN_PROGRESS
    const currentStatus = appointment.status;
    if (
      currentStatus !== AppointmentStatus.ARRIVED &&
      currentStatus !== AppointmentStatus.IN_PROGRESS &&
      currentStatus !== AppointmentStatus.COMPLETED
    ) {
      await Appointment.findByIdAndUpdate(input.appointmentId, {
        $set: { status: AppointmentStatus.IN_QUEUE },
      });
    }
  }

  // Generate queue number
  const queueNumber = await generateQueueNumber(tenantId);

  // Calculate position
  const priority = input.priority || QueuePriority.NORMAL;
  const position = await calculateNextPosition(tenantId, input.doctorId, priority);

  // Calculate estimated wait time
  const estimatedWaitTime = await calculateEstimatedWaitTime(tenantId, input.doctorId, position);

  // Get display name (use patient name or queue number)
  const displayName = input.displayName || `${patient.firstName} ${patient.lastName}`;

  // Create queue entry
  const queueEntry = await Queue.create({
    tenantId,
    type: input.type,
    appointmentId: input.appointmentId,
    patientId: input.patientId,
    doctorId: input.doctorId,
    queueNumber,
    position,
    priority,
    status: QueueStatus.WAITING,
    joinedAt: new Date(),
    estimatedWaitTime,
    displayName,
    reason: input.reason,
    notes: input.notes,
  });

  // Recalculate positions to ensure proper ordering
  await recalculatePositions(tenantId, input.doctorId);

  // Audit log
  await AuditLogger.auditWrite(
    'queue',
    queueEntry._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE,
  );

  return queueEntry;
}

/**
 * Get queue entry by ID
 */
export async function getQueueEntryById(queueEntryId, tenantId, userId) {
  await connectDB();

  const queueEntry = await Queue.findOne(
    withTenant(tenantId, {
      _id: queueEntryId,
      deletedAt: null,
    }),
  )
    .populate('patientId', 'firstName lastName patientId phone')
    .populate('doctorId', 'firstName lastName email')
    .populate(
      'appointmentId',
      'appointmentDate startTime type isTelemedicine telemedicineSessionId endTime patientId doctorId',
    )
    .populate('calledBy', 'firstName lastName')
    .lean();

  if (queueEntry) {
    await AuditLogger.auditRead('queue', queueEntryId, userId, tenantId);
  }

  return queueEntry;
}

/**
 * List queue entries with pagination and filters
 */
export async function listQueueEntries(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter - exclude completed/cancelled entries by default unless status is explicitly provided
  const filter = withTenant(tenantId, {
    deletedAt: null,
  });

  if (query.doctorId) {
    filter.doctorId = query.doctorId;
  }

  if (query.patientId) {
    filter.patientId = query.patientId;
  }

  if (query.status) {
    filter.status = query.status;
  } else {
    // If no status filter provided, exclude completed/cancelled/skipped by default
    filter.status = { $nin: [QueueStatus.COMPLETED, QueueStatus.CANCELLED, QueueStatus.SKIPPED] };
  }

  if (query.priority) {
    filter.priority = query.priority;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.appointmentId) {
    filter.appointmentId = query.appointmentId;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  // Date filter (filter by joinedAt)
  if (query.date) {
    const date = new Date(query.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    filter.joinedAt = { $gte: startOfDay, $lte: endOfDay };
  }

  // Optimize: Get total count and entries in parallel using aggregation
  // This avoids two separate queries and leverages MongoDB's efficiency

  // Get paginated results
  // For active queues, sort by priority and position
  const sortOptions =
    query.status === QueueStatus.WAITING
      ? { priority: -1, position: 1, joinedAt: 1 }
      : { joinedAt: -1 };

  // Optimize: Use aggregation with $lookup instead of populate to avoid N+1 queries
  // Use $facet to get both count and data in a single aggregation
  const pipeline = [
    { $match: filter },
    {
      $facet: {
        // Get total count
        totalCount: [{ $count: 'count' }],
        // Get paginated results with lookups
        data: [
          {
            $lookup: {
              from: 'patients',
              localField: 'patientId',
              foreignField: '_id',
              as: 'patient',
              pipeline: [{ $project: { firstName: 1, lastName: 1, patientId: 1, phone: 1 } }],
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
            $lookup: {
              from: 'appointments',
              localField: 'appointmentId',
              foreignField: '_id',
              as: 'appointment',
              pipeline: [
                {
                  $project: {
                    appointmentDate: 1,
                    startTime: 1,
                    endTime: 1,
                    isTelemedicine: 1,
                    telemedicineSessionId: 1,
                    patientId: 1,
                    doctorId: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              patientId: { $arrayElemAt: ['$patient', 0] },
              doctorId: { $arrayElemAt: ['$doctor', 0] },
              appointmentId: { $arrayElemAt: ['$appointment', 0] },
            },
          },
          { $sort: sortOptions },
          { $skip: ((page || 1) - 1) * (limit || 10) },
          { $limit: limit || 10 },
        ],
      },
    },
  ];

  try {
    const result = await measureTime(`listQueueEntries-${tenantId}`, () =>
      Queue.aggregate(pipeline),
    );

    const aggregationResult = result[0] || { totalCount: [{ count: 0 }], data: [] };
    const total = aggregationResult.totalCount[0]?.count || 0;
    const queueEntries = aggregationResult.data || [];

    // Early return if no entries
    if (total === 0) {
      await AuditLogger.auditWrite('queue', 'list', userId, tenantId, AuditAction.READ, undefined, {
        count: 0,
        filters: query,
        emptyCollection: true,
      });
      return createPaginationResult([], 0, page || 1, limit || 10);
    }

    // Audit list access
    await AuditLogger.auditWrite('queue', 'list', userId, tenantId, AuditAction.READ, undefined, {
      count: queueEntries.length,
      filters: query,
    });

    return createPaginationResult(queueEntries, total, page || 1, limit || 10);
  } catch (error) {
    logger.error('Error listing queue entries:', {
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
 * Get current queue for a doctor (waiting entries only)
 */
export async function getDoctorQueue(doctorId, tenantId, userId) {
  await connectDB();

  const queueEntries = await Queue.find(
    withTenant(tenantId, {
      doctorId,
      status: QueueStatus.WAITING,
      deletedAt: null,
    }),
  )
    .populate('patientId', 'firstName lastName patientId phone')
    .populate(
      'appointmentId',
      'appointmentDate startTime endTime isTelemedicine telemedicineSessionId patientId doctorId',
    )
    .sort({ priority: -1, position: 1, joinedAt: 1 })
    .lean();

  await AuditLogger.auditRead('queue', `doctor-${doctorId}`, userId, tenantId);

  return queueEntries;
}

/**
 * Update queue entry
 */
export async function updateQueueEntry(queueEntryId, input, tenantId, userId) {
  await connectDB();

  const existing = await Queue.findOne(
    withTenant(tenantId, {
      _id: queueEntryId,
      deletedAt: null,
    }),
  );

  if (!existing) {
    return null;
  }

  // Don't allow updates to completed or cancelled entries
  if (existing.status === QueueStatus.COMPLETED || existing.status === QueueStatus.CANCELLED) {
    throw new Error('Cannot update completed or cancelled queue entry');
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // If priority changed, recalculate positions
  if (input.priority && input.priority !== existing.priority) {
    updateData.priority = input.priority;
  }

  // If position changed manually, update it
  if (input.position !== undefined) {
    updateData.position = input.position;
  }

  const queueEntry = await Queue.findByIdAndUpdate(
    queueEntryId,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (queueEntry && (input.priority || input.position)) {
    // Recalculate positions after priority/position change
    await recalculatePositions(tenantId, queueEntry.doctorId.toString());
  }

  if (queueEntry) {
    await AuditLogger.auditWrite(
      'queue',
      queueEntry._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: queueEntry.toObject() },
    );
  }

  return queueEntry;
}

/**
 * Change queue entry status
 */
export async function changeQueueStatus(queueEntryId, input, tenantId, userId) {
  await connectDB();

  const queueEntry = await Queue.findOne(
    withTenant(tenantId, {
      _id: queueEntryId,
      deletedAt: null,
    }),
  );

  if (!queueEntry) {
    return null;
  }

  const before = queueEntry.toObject();
  const updateData = {
    status: input.status,
  };

  // Set timestamps based on status
  const now = new Date();
  switch (input.status) {
    case QueueStatus.CALLED:
      updateData.calledAt = now;
      updateData.calledBy = userId;
      break;
    case QueueStatus.IN_PROGRESS:
      updateData.startedAt = now;
      // Calculate actual wait time
      if (queueEntry.joinedAt) {
        const waitTimeMs = now.getTime() - queueEntry.joinedAt.getTime();
        updateData.actualWaitTime = Math.round(waitTimeMs / 60000); // Convert to minutes
      }
      // Update appointment status if linked
      if (queueEntry.appointmentId) {
        await Appointment.findByIdAndUpdate(queueEntry.appointmentId, {
          $set: { status: AppointmentStatus.IN_PROGRESS, startedAt: now },
        });
      }
      break;
    case QueueStatus.COMPLETED:
      updateData.completedAt = now;
      // Update appointment status if linked
      if (queueEntry.appointmentId) {
        await Appointment.findByIdAndUpdate(queueEntry.appointmentId, {
          $set: { status: AppointmentStatus.COMPLETED, completedAt: now },
        });
      }
      // Remove from queue position (set to 0)
      updateData.position = 0;
      break;
    case QueueStatus.SKIPPED:
      // Remove from queue position
      updateData.position = 0;
      break;
    case QueueStatus.CANCELLED:
      // Update appointment status if linked
      if (queueEntry.appointmentId) {
        await Appointment.findByIdAndUpdate(queueEntry.appointmentId, {
          $set: { status: AppointmentStatus.CANCELLED, cancelledAt: now, cancelledBy: userId },
        });
      }
      // Remove from queue position
      updateData.position = 0;
      break;
  }

  if (input.notes) {
    updateData.notes = input.notes;
  }

  const updated = await Queue.findByIdAndUpdate(queueEntryId, { $set: updateData }, { new: true });

  if (
    updated &&
    (input.status === QueueStatus.COMPLETED ||
      input.status === QueueStatus.SKIPPED ||
      input.status === QueueStatus.CANCELLED)
  ) {
    // Recalculate positions after removing entry
    await recalculatePositions(tenantId, updated.doctorId.toString());
  }

  if (updated) {
    await AuditLogger.auditWrite(
      'queue',
      updated._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: updated.toObject() },
      { statusChange: input.status },
    );
  }

  return updated;
}

/**
 * Reorder queue entries
 */
export async function reorderQueue(doctorId, input, tenantId, userId) {
  await connectDB();

  // Validate all entries belong to the doctor and tenant
  const entries = await Queue.find(
    withTenant(tenantId, {
      _id: { $in: input.queueEntryIds },
      doctorId,
      deletedAt: null,
    }),
  );

  if (entries.length !== input.queueEntryIds.length) {
    throw new Error('Some queue entries not found or do not belong to this doctor');
  }

  // Update positions based on order in array
  const updatePromises = input.queueEntryIds.map((entryId, index) =>
    Queue.findByIdAndUpdate(entryId, {
      $set: { position: index + 1 },
    }),
  );

  await Promise.all(updatePromises);

  // Recalculate positions to ensure consistency
  await recalculatePositions(tenantId, doctorId);

  // Get updated queue
  const updatedQueue = await getDoctorQueue(doctorId, tenantId, userId);

  await AuditLogger.auditWrite(
    'queue',
    `doctor-${doctorId}`,
    userId,
    tenantId,
    AuditAction.UPDATE,
    undefined,
    { action: 'reorder', entryIds: input.queueEntryIds },
  );

  return updatedQueue;
}

/**
 * Remove queue entry (soft delete)
 */
export async function removeQueueEntry(queueEntryId, tenantId, userId) {
  await connectDB();

  const queueEntry = await Queue.findOne(
    withTenant(tenantId, {
      _id: queueEntryId,
      deletedAt: null,
    }),
  );

  if (!queueEntry) {
    return false;
  }

  // If linked to appointment, update appointment status
  if (queueEntry.appointmentId) {
    await Appointment.findByIdAndUpdate(queueEntry.appointmentId, {
      $set: { status: AppointmentStatus.SCHEDULED },
    });
  }

  queueEntry.deletedAt = new Date();
  queueEntry.isActive = false;
  queueEntry.status = QueueStatus.CANCELLED;
  queueEntry.position = 0;
  await queueEntry.save();

  // Recalculate positions
  await recalculatePositions(tenantId, queueEntry.doctorId.toString());

  await AuditLogger.auditWrite(
    'queue',
    queueEntry._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE,
  );

  return true;
}
