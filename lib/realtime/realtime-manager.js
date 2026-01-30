/**
 * Real-time Manager
 * Handles real-time updates for appointments, queue, doctor availability.
 * Event names follow CursorMD/New realtime-caching-strategy.md (colon format).
 */

const { logger } = require('../utils/logger.js');

let io = null;

/**
 * Initialize real-time manager with Socket.IO instance
 */
function initRealtimeManager(socketIOServer) {
  io = socketIOServer;

  if (!io) {
    logger.warn('[Realtime] Socket.IO server not available');
    return;
  }

  // Create separate namespace for real-time features (not telemedicine)
  const realtimeNamespace = io.of('/realtime');

  realtimeNamespace.on('connection', (socket) => {
    logger.info('[Realtime] Client connected:', socket.id);

    // Join tenant room (CursorMD/New: clinic:${clinicId} -> we use tenant:${tenantId})
    socket.on('join-tenant', (tenantId) => {
      if (tenantId) {
        socket.tenantId = tenantId;
        socket.join(`tenant:${tenantId}`);
        logger.info(`[Realtime] Client ${socket.id} joined tenant: ${tenantId}`);
      }
    });

    // CursorMD/New realtime-caching-strategy.md: subscribe:appointments -> join appointments:${clinicId}
    socket.on('subscribe:appointments', () => {
      const tid = socket.tenantId;
      if (tid) {
        socket.join(`appointments:${tid}`);
        logger.info(`[Realtime] Client ${socket.id} joined appointments: ${tid}`);
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

    // Heartbeat: respond to ping so client can detect connection loss
    socket.on('ping', (cb) => {
      if (typeof cb === 'function') cb();
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
 * Emit appointment status change (CursorMD/New: appointment:updated, :cancelled, :checkin, :completed)
 */
function emitAppointmentStatusChange(tenantId, appointmentId, status, appointment) {
  if (!io) return;

  const payload = {
    appointmentId,
    status,
    appointment,
    timestamp: new Date().toISOString(),
  };
  const namespace = io.of('/realtime');
  const room = `tenant:${tenantId}`;
  const apptRoom = `appointment:${appointmentId}`;

  const specEvent =
    status === 'cancelled'
      ? 'appointment:cancelled'
      : status === 'arrived' || status === 'in_queue' || status === 'in_progress'
        ? 'appointment:checkin'
        : status === 'completed'
          ? 'appointment:completed'
          : 'appointment:updated';

  namespace.to(room).emit(specEvent, payload);
  namespace.to(apptRoom).emit(specEvent, payload);
  namespace.to(room).emit('appointment.statusChanged', payload);
  namespace.to(apptRoom).emit('appointment.statusChanged', payload);
}

/**
 * Emit appointment created (CursorMD/New: appointment:created)
 */
function emitAppointmentCreated(tenantId, appointment) {
  if (!io) return;

  const payload = { appointment, timestamp: new Date().toISOString() };
  const namespace = io.of('/realtime');
  const room = `tenant:${tenantId}`;
  namespace.to(room).emit('appointment:created', payload);
  namespace.to(room).emit('appointment.created', payload);
}

/**
 * Emit queue update (CursorMD/New: patient:queue_status)
 */
function emitQueueUpdate(tenantId, queueId, queueData) {
  if (!io) return;

  const payload = {
    queueId,
    queue: queueData,
    timestamp: new Date().toISOString(),
  };
  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('patient:queue_status', payload);
  namespace.to(`tenant:${tenantId}`).emit('queue.updated', payload);
  namespace.to(`queue:${queueId}`).emit('patient:queue_status', payload);
  namespace.to(`queue:${queueId}`).emit('queue.updated', payload);
}

/**
 * Emit patient checked in (CursorMD/New: appointment:checkin)
 */
function emitPatientCheckedIn(tenantId, appointmentId, patientData) {
  if (!io) return;

  const payload = {
    appointmentId,
    patient: patientData,
    timestamp: new Date().toISOString(),
  };
  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('appointment:checkin', payload);
  namespace.to(`tenant:${tenantId}`).emit('patient.checkedIn', payload);
}

/**
 * Emit patient updated (CursorMD/New: patient:updated)
 */
function emitPatientUpdated(tenantId, patientId, patient) {
  if (!io) return;

  const payload = { id: patientId, patient, timestamp: new Date().toISOString() };
  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('patient:updated', payload);
  namespace.to(`tenant:${tenantId}`).emit('patient.updated', payload);
}

/**
 * Emit doctor status change
 */
function emitDoctorStatusChange(tenantId, doctorId, status) {
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
function emitPrescriptionReady(tenantId, prescriptionId, prescription) {
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
function emitLabResultReady(tenantId, labResultId, labResult) {
  if (!io) return;

  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('labResult.ready', {
    labResultId,
    labResult,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Emit payment received (CursorMD/New: payment:received)
 */
function emitPaymentReceived(tenantId, paymentId, payment) {
  if (!io) return;

  const payload = { paymentId, payment, timestamp: new Date().toISOString() };
  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('payment:received', payload);
  namespace.to(`tenant:${tenantId}`).emit('payment.received', payload);
}

/**
 * Emit new notification (CursorMD/New: notification:new)
 */
function emitNotification(tenantId, userId, notification) {
  if (!io) return;

  const payload = {
    ...notification,
    userId,
    timestamp: new Date().toISOString(),
  };
  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('notification:new', payload);
  namespace.to(`tenant:${tenantId}`).emit('notification.new', payload);
}

/**
 * Emit notification update (CursorMD/New: notification:new for updates)
 */
function emitNotificationUpdate(tenantId, userId, notification) {
  if (!io) return;

  const payload = {
    ...notification,
    userId,
    timestamp: new Date().toISOString(),
  };
  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit('notification:new', payload);
  namespace.to(`tenant:${tenantId}`).emit('notification.updated', payload);
}

/**
 * Get Socket.IO instance
 */
function getRealtimeIO() {
  return io ? io.of('/realtime') : null;
}

/**
 * Publish event to clinic/tenant room (CursorMD/New realtime-caching-strategy.md: publishEvent(clinicId, event, payload))
 */
function publishEvent(tenantId, event, payload) {
  if (!io || !tenantId) return;
  const namespace = io.of('/realtime');
  namespace.to(`tenant:${tenantId}`).emit(event, payload);
}

/**
 * Emit stock low (CursorMD/New: stock:low)
 */
function emitStockLow(tenantId, payload) {
  if (!io) return;
  const p = { ...payload, timestamp: new Date().toISOString() };
  io.of('/realtime').to(`tenant:${tenantId}`).emit('stock:low', p);
}

/**
 * Emit stock updated (CursorMD/New: stock:updated)
 */
function emitStockUpdated(tenantId, payload) {
  if (!io) return;
  const p = { ...payload, timestamp: new Date().toISOString() };
  io.of('/realtime').to(`tenant:${tenantId}`).emit('stock:updated', p);
}

/**
 * Emit medicine expired (CursorMD/New: medicine:expired)
 */
function emitMedicineExpired(tenantId, payload) {
  if (!io) return;
  const p = { ...payload, timestamp: new Date().toISOString() };
  io.of('/realtime').to(`tenant:${tenantId}`).emit('medicine:expired', p);
}

module.exports = {
  initRealtimeManager,
  emitAppointmentStatusChange,
  emitAppointmentCreated,
  emitQueueUpdate,
  emitPatientCheckedIn,
  emitPatientUpdated,
  emitDoctorStatusChange,
  emitPrescriptionReady,
  emitLabResultReady,
  emitPaymentReceived,
  emitNotification,
  emitNotificationUpdate,
  getRealtimeIO,
  publishEvent,
  emitStockLow,
  emitStockUpdated,
  emitMedicineExpired,
};
