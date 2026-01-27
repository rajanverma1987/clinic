/**
 * Real-time Manager
 * Handles real-time updates for appointments, queue, doctor availability
 * Separate from telemedicine Socket.IO to avoid conflicts
 * Based on NEW-PLANS.md requirements
 */

// Use relative path for compatibility (works in both ES modules and CommonJS contexts)
import { logger } from '../utils/logger.js';

let io = null;

/**
 * Initialize real-time manager with Socket.IO instance
 */
export function initRealtimeManager(socketIOServer) {
  io = socketIOServer;

  if (!io) {
    logger.warn('[Realtime] Socket.IO server not available');
    return;
  }

  // Create separate namespace for real-time features (not telemedicine)
  const realtimeNamespace = io.of('/realtime');

  realtimeNamespace.on('connection', (socket) => {
    logger.info('[Realtime] Client connected:', socket.id);

    // Join tenant room
    socket.on('join-tenant', (tenantId) => {
      if (tenantId) {
        socket.join(`tenant:${tenantId}`);
        logger.info(`[Realtime] Client ${socket.id} joined tenant: ${tenantId}`);
      }
    });

    // Join appointment room
    socket.on('join-appointment', (appointmentId) => {
      if (appointmentId) {
        socket.join(`appointment:${appointmentId}`);
        logger.info(`[Realtime] Client ${socket.id} joined appointment: ${appointmentId}`);
      }
    });

    // Join queue room
    socket.on('join-queue', (queueId) => {
      if (queueId) {
        socket.join(`queue:${queueId}`);
        logger.info(`[Realtime] Client ${socket.id} joined queue: ${queueId}`);
      }
    });

    // Join doctor room
    socket.on('join-doctor', (doctorId) => {
      if (doctorId) {
        socket.join(`doctor:${doctorId}`);
        logger.info(`[Realtime] Client ${socket.id} joined doctor: ${doctorId}`);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info('[Realtime] Client disconnected:', socket.id);
    });
  });

  logger.info('[Realtime] Manager initialized');
  return realtimeNamespace;
}

/**
 * Emit appointment status change
 */
export function emitAppointmentStatusChange(tenantId, appointmentId, status, appointment) {
  if (!io) return;

  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('appointment.statusChanged', {
    appointmentId,
    status,
    appointment,
    timestamp: new Date().toISOString(),
  });

  namespace.to(`appointment:${appointmentId}`).emit('appointment.statusChanged', {
    appointmentId,
    status,
    appointment,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit appointment created
 */
export function emitAppointmentCreated(tenantId, appointment) {
  if (!io) return;

  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('appointment.created', {
    appointment,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit queue update
 */
export function emitQueueUpdate(tenantId, queueId, queueData) {
  if (!io) return;

  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('queue.updated', {
    queueId,
    queue: queueData,
    timestamp: new Date().toISOString(),
  });

  namespace.to(`queue:${queueId}`).emit('queue.updated', {
    queueId,
    queue: queueData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit patient checked in
 */
export function emitPatientCheckedIn(tenantId, appointmentId, patientData) {
  if (!io) return;

  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('patient.checkedIn', {
    appointmentId,
    patient: patientData,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit doctor status change
 */
export function emitDoctorStatusChange(tenantId, doctorId, status) {
  if (!io) return;

  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('doctor.statusChanged', {
    doctorId,
    status, // online, busy, offline
    timestamp: new Date().toISOString(),
  });

  namespace.to(`doctor:${doctorId}`).emit('doctor.statusChanged', {
    doctorId,
    status,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit prescription ready
 */
export function emitPrescriptionReady(tenantId, prescriptionId, prescription) {
  if (!io) return;

  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('prescription.ready', {
    prescriptionId,
    prescription,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit lab result ready
 */
export function emitLabResultReady(tenantId, labResultId, labResult) {
  if (!io) return;

  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('labResult.ready', {
    labResultId,
    labResult,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit payment received
 */
export function emitPaymentReceived(tenantId, paymentId, payment) {
  if (!io) return;

  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('payment.received', {
    paymentId,
    payment,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit new notification
 */
export function emitNotification(tenantId, userId, notification) {
  if (!io) return;

  const namespace = io.of('/realtime');
  // Emit to specific user
  namespace.to(`tenant:${tenantId}`).emit('notification.new', {
    ...notification,
    userId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit notification update
 */
export function emitNotificationUpdate(tenantId, userId, notification) {
  if (!io) return;

  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('notification.updated', {
    ...notification,
    userId,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get Socket.IO instance
 */
export function getRealtimeIO() {
  return io ? io.of('/realtime') : null;
}

// Default export for convenience
export default {
  initRealtimeManager,
  emitAppointmentStatusChange,
  emitAppointmentCreated,
  emitQueueUpdate,
  emitPatientCheckedIn,
  emitDoctorStatusChange,
  emitPrescriptionReady,
  emitLabResultReady,
  emitPaymentReceived,
  emitNotification,
  emitNotificationUpdate,
  getRealtimeIO,
};
