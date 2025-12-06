/**
 * Appointment service
 * Handles all appointment-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import Appointment, { AppointmentStatus } from '@/models/Appointment.js';
import Patient from '@/models/Patient.js';
import User from '@/models/User.js';
import Queue, { QueueType, QueuePriority, QueueStatus } from '@/models/Queue.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import { getPaginationParams, createPaginationResult } from '@/lib/utils/pagination.js';

/**
 * Validate appointment time slot availability
 */
async function isTimeSlotAvailable(tenantId, doctorId, startTime, endTime, excludeAppointmentId) {
  await connectDB();

  const conflictingAppointment = await Appointment.findOne(
    withTenant(tenantId, {
      doctorId,
      startTime: { $lt: endTime },
      endTime: { $gt: startTime },
      status: {
        $in: [
          AppointmentStatus.SCHEDULED,
          AppointmentStatus.CONFIRMED,
          AppointmentStatus.ARRIVED,
          AppointmentStatus.IN_QUEUE,
          AppointmentStatus.IN_PROGRESS,
        ],
      },
      deletedAt: null,
      ...(excludeAppointmentId && { _id: { $ne: excludeAppointmentId } }),
    })
  );

  return !conflictingAppointment;
}

/**
 * Create a new appointment
 */
export async function createAppointment(input, tenantId, userId) {
  await connectDB();

  // Validate patient exists and belongs to tenant
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: input.patientId,
      deletedAt: null,
    })
  );

  if (!patient) {
    throw new Error('Patient not found');
  }

  // Validate doctor exists and belongs to tenant
  const doctor = await User.findOne(
    withTenant(tenantId, {
      _id: input.doctorId,
      isActive: true,
    })
  );

  if (!doctor) {
    throw new Error('Doctor not found or inactive');
  }

  // Parse dates
  const appointmentDate = input.appointmentDate instanceof Date
    ? input.appointmentDate
    : new Date(input.appointmentDate);
  
  const startTime = input.startTime instanceof Date
    ? input.startTime
    : new Date(input.startTime);

  // Calculate end time
  const duration = input.duration || 30; // Default 30 minutes
  const endTime = input.endTime
    ? (input.endTime instanceof Date ? input.endTime : new Date(input.endTime))
    : new Date(startTime.getTime() + duration * 60000);

  // Validate time slot availability
  const isAvailable = await isTimeSlotAvailable(tenantId, input.doctorId, startTime, endTime);
  if (!isAvailable) {
    throw new Error('Time slot is not available');
  }

  // Calculate reminder time (default: 24 hours before)
  let reminderScheduledAt;
  if (input.reminderScheduledAt) {
    reminderScheduledAt = input.reminderScheduledAt instanceof Date
      ? input.reminderScheduledAt
      : new Date(input.reminderScheduledAt);
  } else {
    // Default: 24 hours before appointment
    reminderScheduledAt = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
  }

  // For video consultations, set status to IN_QUEUE so they go directly to queue
  const initialStatus = input.isTelemedicine 
    ? AppointmentStatus.IN_QUEUE 
    : AppointmentStatus.SCHEDULED;

  // Create appointment
  const appointment = await Appointment.create({
    tenantId,
    patientId: input.patientId,
    doctorId: input.doctorId,
    appointmentDate,
    startTime,
    endTime,
    duration,
    type: input.type || 'consultation',
    status: initialStatus,
    reason: input.reason,
    notes: input.notes,
    reminderScheduledAt,
    reminderSent: false,
    isTelemedicine: input.isTelemedicine || false,
    telemedicineConsent: input.telemedicineConsent || false,
  });

  // For video consultations, automatically create queue entry
  if (input.isTelemedicine) {
    try {
      const { createQueueEntry } = await import('@/services/queue.service.js');
      await createQueueEntry(
        {
          type: QueueType.APPOINTMENT,
          appointmentId: appointment._id.toString(),
          patientId: appointment.patientId.toString(),
          doctorId: appointment.doctorId.toString(),
          priority: QueuePriority.NORMAL,
        },
        tenantId,
        userId
      );
      console.log(`✅ Queue entry created for video consultation appointment ${appointment._id}`);
    } catch (queueError) {
      // Log error but don't fail appointment creation
      console.error('Failed to create queue entry for video consultation:', queueError);
      // If it's a duplicate error, that's okay - queue entry already exists
      if (!queueError.message?.includes('duplicate') && !queueError.message?.includes('E11000')) {
        // For non-duplicate errors, we might want to handle differently
        // But for now, we'll continue with appointment creation
      }
    }
  }

  // Audit log
  await AuditLogger.auditWrite(
    'appointment',
    appointment._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return appointment;
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(appointmentId, tenantId, userId) {
  await connectDB();

  const appointment = await Appointment.findOne(
    withTenant(tenantId, {
      _id: appointmentId,
      deletedAt: null,
    })
  )
    .populate('patientId', 'firstName lastName patientId phone email')
    .populate('doctorId', 'firstName lastName email')
    .lean();

  if (appointment) {
    await AuditLogger.auditRead('appointment', appointmentId, userId, tenantId);
  }

  return appointment;
}

/**
 * List appointments with pagination and filters
 */
export async function listAppointments(query, tenantId, userId) {
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

  if (query.type) {
    filter.type = query.type;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  // Date filters - check both appointmentDate and startTime to catch all appointments
  if (query.date) {
    const date = new Date(query.date);
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);
    // Filter by both appointmentDate and startTime to catch all appointments on that date
    filter.$or = [
      { appointmentDate: { $gte: startOfDay, $lte: endOfDay } },
      { startTime: { $gte: startOfDay, $lte: endOfDay } }
    ];
    console.log('Date filter (single date):', {
      date: query.date,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString(),
      filter: filter.$or
    });
  } else if (query.startDate || query.endDate) {
    // When filtering by date range, check both appointmentDate and startTime
    const startDate = query.startDate ? new Date(query.startDate) : null;
    const endDate = query.endDate ? new Date(query.endDate) : null;
    
    console.log('Date filter (range):', {
      startDate: query.startDate,
      endDate: query.endDate,
      startDateParsed: startDate?.toISOString(),
      endDateParsed: endDate?.toISOString()
    });
    
    const orConditions = [];
    
    // Build conditions for appointmentDate
    const appointmentDateCondition = {};
    if (startDate) appointmentDateCondition.$gte = startDate;
    if (endDate) appointmentDateCondition.$lte = endDate;
    if (Object.keys(appointmentDateCondition).length > 0) {
      orConditions.push({ appointmentDate: appointmentDateCondition });
    }
    
    // Build conditions for startTime
    const startTimeCondition = {};
    if (startDate) startTimeCondition.$gte = startDate;
    if (endDate) startTimeCondition.$lte = endDate;
    if (Object.keys(startTimeCondition).length > 0) {
      orConditions.push({ startTime: startTimeCondition });
    }
    
    if (orConditions.length > 0) {
      filter.$or = orConditions;
      console.log('Date filter $or conditions:', JSON.stringify(orConditions, null, 2));
    }
  }
  
  console.log('Final filter for appointments:', JSON.stringify(filter, null, 2));

  // Get total count
  const total = await Appointment.countDocuments(filter);

  // Get paginated results - sorted by date descending (newest first)
  const appointments = await Appointment.find(filter)
    .populate('patientId', 'firstName lastName patientId phone')
    .populate('doctorId', 'firstName lastName')
    .sort({ appointmentDate: -1, startTime: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'appointment',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: appointments.length, filters: query }
  );

  return createPaginationResult(appointments, total, page || 1, limit || 10);
}

/**
 * Update appointment
 */
export async function updateAppointment(appointmentId, input, tenantId, userId) {
  await connectDB();

  const existing = await Appointment.findOne(
    withTenant(tenantId, {
      _id: appointmentId,
      deletedAt: null,
    })
  );

  if (!existing) {
    return null;
  }

  // Don't allow updates to completed or cancelled appointments
  if (
    existing.status === AppointmentStatus.COMPLETED ||
    existing.status === AppointmentStatus.CANCELLED
  ) {
    throw new Error('Cannot update completed or cancelled appointment');
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Parse dates if provided
  if (input.appointmentDate) {
    updateData.appointmentDate = input.appointmentDate instanceof Date
      ? input.appointmentDate
      : new Date(input.appointmentDate);
  }

  if (input.startTime) {
    updateData.startTime = input.startTime instanceof Date
      ? input.startTime
      : new Date(input.startTime);

    // Recalculate end time if duration exists
    if (existing.duration) {
      updateData.endTime = new Date(
        updateData.startTime.getTime() + existing.duration * 60000
      );
    }
  }

  // Validate time slot if time changed
  if (input.startTime || input.appointmentDate) {
    const startTime = updateData.startTime || existing.startTime;
    const endTime = updateData.endTime || existing.endTime;
    const isAvailable = await isTimeSlotAvailable(
      tenantId,
      existing.doctorId.toString(),
      startTime,
      endTime,
      appointmentId
    );
    if (!isAvailable) {
      throw new Error('Time slot is not available');
    }
  }

  // Remove patientId from update (shouldn't be changed)
  delete updateData.patientId;

  const appointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (appointment) {
    await AuditLogger.auditWrite(
      'appointment',
      appointment._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: appointment.toObject() }
    );
  }

  return appointment;
}

/**
 * Change appointment status
 */
export async function changeAppointmentStatus(appointmentId, input, tenantId, userId) {
  await connectDB();

  const appointment = await Appointment.findOne(
    withTenant(tenantId, {
      _id: appointmentId,
      deletedAt: null,
    })
  );

  if (!appointment) {
    return null;
  }

  const before = appointment.toObject();
  const updateData = {
    status: input.status,
  };

  // Set timestamps based on status
  const now = new Date();
  switch (input.status) {
    case AppointmentStatus.ARRIVED:
      updateData.arrivedAt = now;
      
      // Automatically create queue entry when patient arrives
      try {
        console.log(`[Queue Creation] Starting queue creation for appointment ${appointmentId}, tenantId: ${tenantId}`);
        
        // Check if queue entry already exists
        const existingQueueEntry = await Queue.findOne(
          withTenant(tenantId, {
            appointmentId: appointmentId,
            deletedAt: null,
          })
        );

        if (existingQueueEntry) {
          console.log(`ℹ️ Queue entry already exists for appointment ${appointmentId}: ${existingQueueEntry.queueNumber} (status: ${existingQueueEntry.status})`);
          // If status is not active, reactivate it
          if (existingQueueEntry.status === QueueStatus.COMPLETED || existingQueueEntry.status === QueueStatus.CANCELLED) {
            await Queue.findByIdAndUpdate(existingQueueEntry._id, {
              $set: {
                status: QueueStatus.WAITING,
                joinedAt: now,
              }
            });
            console.log(`✅ Reactivated queue entry for appointment ${appointmentId}`);
          }
        } else {
          console.log(`[Queue Creation] No existing queue entry found, creating new one...`);
          
          // Use the proper queue service function to handle queue number generation safely
          const { createQueueEntry } = await import('@/services/queue.service.js');
          
          try {
            await createQueueEntry(
              {
                type: QueueType.APPOINTMENT,
                appointmentId: appointmentId,
                patientId: appointment.patientId.toString(),
                doctorId: appointment.doctorId.toString(),
                priority: QueuePriority.NORMAL,
              },
              tenantId,
              userId
            );
            console.log(`✅ Queue entry created successfully for appointment ${appointmentId}`);
          } catch (queueError) {
            if (
              queueError.message?.includes('duplicate') || 
              queueError.message?.includes('E11000') ||
              queueError.message?.includes('already in queue')
            ) {
              console.log(`⚠️ Queue creation conflict detected, checking if queue entry exists...`);
              
              await new Promise(resolve => setTimeout(resolve, 200));
              
              const checkAgain = await Queue.findOne(
                withTenant(tenantId, {
                  appointmentId: appointmentId,
                  deletedAt: null,
                })
              );
              
              if (checkAgain) {
                console.log(`✅ Queue entry exists for appointment ${appointmentId}: ${checkAgain.queueNumber}`);
              } else {
                console.error('❌ Queue entry does not exist after conflict error');
                console.error('Queue creation failed but continuing with appointment status update');
              }
            } else {
              console.error('❌ Error creating queue entry:', queueError.message);
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to create queue entry for appointment:', {
          appointmentId,
          tenantId,
          error: error.message,
          stack: error.stack,
          name: error.name,
        });
        
        const finalCheck = await Queue.findOne(
          withTenant(tenantId, {
            appointmentId: appointmentId,
            deletedAt: null,
          })
        );
        
        if (finalCheck) {
          console.log(`✅ Queue entry exists despite error: ${finalCheck.queueNumber}`);
        } else {
          console.warn('⚠️ Queue entry creation failed, but continuing with appointment status update');
        }
      }
      break;
    case AppointmentStatus.IN_QUEUE:
      // Automatically create queue entry when appointment status changes to IN_QUEUE
      try {
        const existingQueueEntry = await Queue.findOne(
          withTenant(tenantId, {
            appointmentId: appointmentId,
            status: { $in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_PROGRESS] },
            deletedAt: null,
          })
        );

        if (!existingQueueEntry) {
          // Create queue entry directly (avoid circular dependency)
          const latest = await Queue.findOne(withTenant(tenantId, {}))
            .sort({ createdAt: -1 })
            .select('queueNumber')
            .lean();
          
          const queueNumber = latest && latest.queueNumber
            ? `Q-${(parseInt(latest.queueNumber.match(/Q-(\d+)/)?.[1] || '0', 10) + 1).toString().padStart(4, '0')}`
            : 'Q-0001';

          const waitingCount = await Queue.countDocuments(
            withTenant(tenantId, {
              doctorId: appointment.doctorId,
              status: QueueStatus.WAITING,
              deletedAt: null,
            })
          );
          const position = waitingCount + 1;

          await Queue.create({
            tenantId,
            type: QueueType.APPOINTMENT,
            appointmentId: appointmentId,
            patientId: appointment.patientId,
            doctorId: appointment.doctorId,
            queueNumber,
            position,
            priority: QueuePriority.NORMAL,
            status: QueueStatus.WAITING,
            joinedAt: now,
            estimatedWaitTime: Math.max(0, (position - 1) * 30),
          });
        }
      } catch (error) {
        console.error('Failed to create queue entry for appointment:', error);
      }
      break;
    case AppointmentStatus.IN_PROGRESS:
      updateData.startedAt = now;
      break;
    case AppointmentStatus.COMPLETED:
      updateData.completedAt = now;
      break;
    case AppointmentStatus.CANCELLED:
      updateData.cancelledAt = now;
      updateData.cancelledBy = userId;
      if (input.cancellationReason) {
        updateData.cancellationReason = input.cancellationReason;
      }
      break;
  }

  if (input.notes) {
    updateData.notes = input.notes;
  }

  const updated = await Appointment.findByIdAndUpdate(
    appointmentId,
    { $set: updateData },
    { new: true }
  );

  if (updated) {
    await AuditLogger.auditWrite(
      'appointment',
      updated._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: updated.toObject() },
      { statusChange: input.status }
    );
  }

  return updated;
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(appointmentId, reason, tenantId, userId) {
  return changeAppointmentStatus(
    appointmentId,
    {
      status: AppointmentStatus.CANCELLED,
      cancellationReason: reason,
    },
    tenantId,
    userId
  );
}

/**
 * Soft delete appointment
 */
export async function deleteAppointment(appointmentId, tenantId, userId) {
  await connectDB();

  const appointment = await Appointment.findOne(
    withTenant(tenantId, {
      _id: appointmentId,
      deletedAt: null,
    })
  );

  if (!appointment) {
    return false;
  }

  appointment.deletedAt = new Date();
  appointment.isActive = false;
  await appointment.save();

  await AuditLogger.auditWrite(
    'appointment',
    appointment._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}

