/**
 * Real-time Integration Helpers
 * Easy-to-use functions for emitting real-time events from services
 */

import { logger } from '@/lib/utils/logger.js';
import {
  emitAppointmentStatusChange,
  emitAppointmentCreated,
  emitPaymentFailure,
  emitStaffAssignment,
  emitQueueUpdate,
  emitPatientCheckedIn,
  emitPatientUpdated,
  emitDoctorStatusChange,
  emitPrescriptionReady,
  emitLabResultReady,
  emitPaymentReceived,
  emitStockLow,
  emitStockUpdated,
  emitMedicineExpired,
} from './realtime-manager.js';

/**
 * Emit appointment created event (call after creating appointment)
 */
export async function notifyAppointmentCreated(tenantId, appointment) {
  try {
    emitAppointmentCreated(tenantId, appointment);
  } catch (error) {
    logger.error('[Realtime] Error emitting appointment.created:', error);
    // Don't throw - real-time is non-critical
  }
}

/**
 * Emit appointment status change (call after updating appointment status)
 */
export async function notifyAppointmentStatusChange(tenantId, appointmentId, status, appointment) {
  try {
    emitAppointmentStatusChange(tenantId, appointmentId, status, appointment);
  } catch (error) {
    logger.error('[Realtime] Error emitting appointment.statusChanged:', error);
  }
}

/**
 * Emit queue update (call after queue changes)
 */
export async function notifyQueueUpdate(tenantId, queueId, queueData) {
  try {
    emitQueueUpdate(tenantId, queueId, queueData);
  } catch (error) {
    logger.error('[Realtime] Error emitting queue.updated:', error);
  }
}

/**
 * Emit patient checked in (call when patient checks in)
 */
export async function notifyPatientCheckedIn(tenantId, appointmentId, patientData) {
  try {
    emitPatientCheckedIn(tenantId, appointmentId, patientData);
  } catch (error) {
    logger.error('[Realtime] Error emitting patient.checkedIn:', error);
  }
}

/**
 * Emit patient updated (call after updating patient so clients can invalidate cache)
 */
export async function notifyPatientUpdated(tenantId, patientId, patient) {
  try {
    emitPatientUpdated(tenantId, patientId, patient);
  } catch (error) {
    logger.error('[Realtime] Error emitting patient.updated:', error);
  }
}

/**
 * Emit doctor status change (call when doctor status changes)
 */
export async function notifyDoctorStatusChange(tenantId, doctorId, status) {
  try {
    emitDoctorStatusChange(tenantId, doctorId, status);
  } catch (error) {
    logger.error('[Realtime] Error emitting doctor.statusChanged:', error);
  }
}

/**
 * Emit prescription ready (call when prescription is ready)
 */
export async function notifyPrescriptionReady(tenantId, prescriptionId, prescription) {
  try {
    emitPrescriptionReady(tenantId, prescriptionId, prescription);
  } catch (error) {
    logger.error('[Realtime] Error emitting prescription.ready:', error);
  }
}

/**
 * Emit lab result ready (call when lab result is ready)
 */
export async function notifyLabResultReady(tenantId, labResultId, labResult) {
  try {
    emitLabResultReady(tenantId, labResultId, labResult);
  } catch (error) {
    logger.error('[Realtime] Error emitting labResult.ready:', error);
  }
}

/**
 * Emit payment failure (dashboard-events channel)
 */
export async function notifyPaymentFailure(tenantId, payload) {
  try {
    emitPaymentFailure(tenantId, payload);
  } catch (error) {
    logger.error('[Realtime] Error emitting payment:failed:', error);
  }
}

/**
 * Emit staff assignment (dashboard-events channel)
 */
export async function notifyStaffAssignment(tenantId, payload) {
  try {
    emitStaffAssignment(tenantId, payload);
  } catch (error) {
    logger.error('[Realtime] Error emitting staff_assignment:', error);
  }
}

/**
 * Emit payment received (call when payment is received)
 */
export async function notifyPaymentReceived(tenantId, paymentId, payment) {
  try {
    emitPaymentReceived(tenantId, paymentId, payment);
  } catch (error) {
    logger.error('[Realtime] Error emitting payment.received:', error);
  }
}

/**
 * Emit stock low (CursorMD/New: stock:low) – call when stock below threshold
 */
export async function notifyStockLow(tenantId, payload) {
  try {
    emitStockLow(tenantId, payload);
  } catch (error) {
    logger.error('[Realtime] Error emitting stock:low:', error);
  }
}

/**
 * Emit stock updated (CursorMD/New: stock:updated) – call when stock quantity changes
 */
export async function notifyStockUpdated(tenantId, payload) {
  try {
    emitStockUpdated(tenantId, payload);
  } catch (error) {
    logger.error('[Realtime] Error emitting stock:updated:', error);
  }
}

/**
 * Emit medicine expired (CursorMD/New: medicine:expired) – call when medicine/batch expires
 */
export async function notifyMedicineExpired(tenantId, payload) {
  try {
    emitMedicineExpired(tenantId, payload);
  } catch (error) {
    logger.error('[Realtime] Error emitting medicine:expired:', error);
  }
}
