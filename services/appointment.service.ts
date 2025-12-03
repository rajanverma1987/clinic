/**
 * Appointment service
 * Handles all appointment-related business logic
 */

import connectDB from '@/lib/db/connection';
import Appointment, { IAppointment, AppointmentStatus } from '@/models/Appointment';
import Patient from '@/models/Patient';
import User from '@/models/User';
import Queue, { QueueType, QueuePriority, QueueStatus } from '@/models/Queue';
import { withTenant } from '@/lib/db/tenant-helper';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger';
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
  AppointmentQueryInput,
  ChangeStatusInput,
} from '@/lib/validations/appointment';
import { getPaginationParams, createPaginationResult, PaginationResult } from '@/lib/utils/pagination';

/**
 * Validate appointment time slot availability
 */
async function isTimeSlotAvailable(
  tenantId: string,
  doctorId: string,
  startTime: Date,
  endTime: Date,
  excludeAppointmentId?: string
): Promise<boolean> {
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
export async function createAppointment(
  input: CreateAppointmentInput,
  tenantId: string,
  userId: string
): Promise<IAppointment> {
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
  let reminderScheduledAt: Date | undefined;
  if (input.reminderScheduledAt) {
    reminderScheduledAt = input.reminderScheduledAt instanceof Date
      ? input.reminderScheduledAt
      : new Date(input.reminderScheduledAt);
  } else {
    // Default: 24 hours before appointment
    reminderScheduledAt = new Date(startTime.getTime() - 24 * 60 * 60 * 1000);
  }

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
    status: AppointmentStatus.SCHEDULED,
    reason: input.reason,
    notes: input.notes,
    reminderScheduledAt,
    reminderSent: false,
  });

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
export async function getAppointmentById(
  appointmentId: string,
  tenantId: string,
  userId: string
): Promise<IAppointment | null> {
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

  return appointment as IAppointment | null;
}

/**
 * List appointments with pagination and filters
 */
export async function listAppointments(
  query: AppointmentQueryInput,
  tenantId: string,
  userId: string
): Promise<PaginationResult<IAppointment>> {
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

  if (query.type) {
    filter.type = query.type;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  // Date filters
  if (query.date) {
    const date = new Date(query.date);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
  } else if (query.startDate || query.endDate) {
    filter.appointmentDate = {};
    if (query.startDate) {
      filter.appointmentDate.$gte = new Date(query.startDate);
    }
    if (query.endDate) {
      filter.appointmentDate.$lte = new Date(query.endDate);
    }
  }

  // Get total count
  const total = await Appointment.countDocuments(filter);

  // Get paginated results
  const appointments = await Appointment.find(filter)
    .populate('patientId', 'firstName lastName patientId phone')
    .populate('doctorId', 'firstName lastName')
    .sort({ appointmentDate: 1, startTime: 1 })
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

  return createPaginationResult(appointments as unknown as IAppointment[], total, page || 1, limit || 10);
}

/**
 * Update appointment
 */
export async function updateAppointment(
  appointmentId: string,
  input: UpdateAppointmentInput,
  tenantId: string,
  userId: string
): Promise<IAppointment | null> {
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
  const updateData: any = { ...input };

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
export async function changeAppointmentStatus(
  appointmentId: string,
  input: ChangeStatusInput,
  tenantId: string,
  userId: string
): Promise<IAppointment | null> {
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
  const updateData: any = {
    status: input.status,
  };

  // Set timestamps based on status
  const now = new Date();
  switch (input.status) {
    case AppointmentStatus.ARRIVED:
      updateData.arrivedAt = now;
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
          // Generate queue number
          const latest = await Queue.findOne(withTenant(tenantId, {}))
            .sort({ createdAt: -1 })
            .select('queueNumber')
            .lean();
          
          const queueNumber = latest && (latest as any).queueNumber
            ? `Q-${(parseInt((latest as any).queueNumber.match(/Q-(\d+)/)?.[1] || '0', 10) + 1).toString().padStart(4, '0')}`
            : 'Q-0001';

          // Calculate position
          const waitingCount = await Queue.countDocuments(
            withTenant(tenantId, {
              doctorId: appointment.doctorId,
              status: QueueStatus.WAITING,
              deletedAt: null,
            })
          );
          const position = waitingCount + 1;

          // Create queue entry
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
            estimatedWaitTime: Math.max(0, (position - 1) * 30), // 30 min average
          });
        }
      } catch (error) {
        // Log error but don't fail the appointment status update
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
export async function cancelAppointment(
  appointmentId: string,
  reason: string,
  tenantId: string,
  userId: string
): Promise<IAppointment | null> {
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
export async function deleteAppointment(
  appointmentId: string,
  tenantId: string,
  userId: string
): Promise<boolean> {
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

