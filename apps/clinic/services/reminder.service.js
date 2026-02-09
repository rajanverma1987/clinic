/**
 * Reminder service
 * Handles automated reminders for appointments, payments, and prescription refills
 * Based on NEW-PLANS.md requirements
 */

import connectDB from '@/lib/db/connection.js';
import Appointment, { AppointmentStatus } from '@/models/Appointment.js';
import Invoice, { InvoiceStatus } from '@/models/Invoice.js';
import Prescription, { PrescriptionStatus } from '@/models/Prescription.js';
import Patient from '@/models/Patient.js';
import User from '@/models/User.js';
import Tenant from '@/models/Tenant.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createNotification } from '@/services/notification.service.js';
import { logger } from '@/lib/utils/logger.js';

/**
 * Find appointments that need reminders
 * This should be called by a cron job or background worker
 */
export async function findAppointmentsNeedingReminders() {
  await connectDB();

  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  // Find appointments that:
  // 1. Have reminderScheduledAt in the past or within next hour
  // 2. Haven't had reminder sent yet
  // 3. Are still scheduled/confirmed (not cancelled/completed)
  // 4. Are not deleted
  const appointments = await Appointment.find({
    reminderScheduledAt: {
      $lte: oneHourFromNow,
    },
    reminderSent: false,
    status: {
      $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED],
    },
    deletedAt: null,
  })
    .populate('patientId', 'firstName lastName phone email')
    .populate('doctorId', 'firstName lastName')
    .populate('tenantId', 'name')
    .lean();

  const reminderJobs = [];

  for (const appointment of appointments) {
    const patient = appointment.patientId;
    const doctor = appointment.doctorId;
    const tenant = appointment.tenantId;

    if (patient && doctor && tenant) {
      reminderJobs.push({
        appointmentId: appointment._id.toString(),
        patientId: patient._id.toString(),
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        doctorName: `${doctor.firstName} ${doctor.lastName}`,
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        tenantId: tenant._id.toString(),
        tenantName: tenant.name,
      });
    }
  }

  return reminderJobs;
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(appointmentId, tenantId) {
  await connectDB();

  await Appointment.findOneAndUpdate(
    withTenant(tenantId, {
      _id: appointmentId,
    }),
    {
      reminderSent: true,
      reminderSentAt: new Date(),
    }
  );
}

/**
 * Send appointment reminder
 * Uses notification service for multi-channel delivery
 */
export async function sendReminder(job) {
  try {
    // Get patient details
    const patient = await Patient.findById(job.patientId).lean();
    if (!patient) {
      await markReminderSent(job.appointmentId, job.tenantId);
      return false;
    }

    // Get user ID if patient has portal access
    const User = (await import('@/models/User.js')).default;
    const user = patient.email
      ? await User.findOne({ email: patient.email, tenantId: job.tenantId }).lean()
      : null;

    const userId = user?._id?.toString() || patient._id.toString();

    // Get appointment details
    const appointment = await Appointment.findById(job.appointmentId).lean();
    const appointmentType = appointment?.type || 'consultation';

    // Format appointment date and time
    const appointmentDate = new Date(job.appointmentDate);
    const startTime = new Date(job.startTime);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = startTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const hoursUntil = Math.round((startTime.getTime() - Date.now()) / (1000 * 60 * 60));
    const timeUntil = hoursUntil === 1 ? '1 hour' : `${hoursUntil} hours`;

    const title = 'Appointment Reminder';
    const message = `Reminder: You have an appointment with Dr. ${job.doctorName} on ${formattedDate} at ${formattedTime} (in ${timeUntil}).`;

    // Create notification (handles email, SMS, WhatsApp)
    await createNotification(
      {
        userId: userId,
        type: 'appointment',
        title,
        message,
        data: {
          appointmentId: job.appointmentId,
          appointmentDate: appointmentDate.toISOString(),
          startTime: startTime.toISOString(),
          doctorName: job.doctorName,
          appointmentType,
        },
        priority: 'high',
        channels: {
          email: !!patient.email,
          sms: !!patient.phone,
          whatsapp: !!patient.phone,
        },
        userEmail: patient.email,
        userPhone: patient.phone,
      },
      job.tenantId,
      'system'
    );

    // Mark as sent
    await markReminderSent(job.appointmentId, job.tenantId);

    return true;
  } catch (error) {
    logger.error('[APPOINTMENT REMINDER ERROR]', error);
    // Mark as sent to avoid infinite retries
    try {
      await markReminderSent(job.appointmentId, job.tenantId);
    } catch (markError) {
      logger.error('[REMINDER] Failed to mark reminder as sent:', markError);
    }
    return false;
  }
}

/**
 * Process all pending reminders
 * This should be called by a cron job (e.g., every 15 minutes)
 */
export async function processPendingReminders() {
  const jobs = await findAppointmentsNeedingReminders();

  let sent = 0;
  let failed = 0;

  for (const job of jobs) {
    const success = await sendReminder(job);
    if (success) {
      sent++;
    } else {
      failed++;
    }
  }

  return {
    processed: jobs.length,
    sent,
    failed,
  };
}

/**
 * Find invoices that need payment reminders
 * Checks for invoices with due dates approaching or overdue
 */
export async function findInvoicesNeedingReminders(tenantId = null) {
  await connectDB();

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const filter = {
    status: { $in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
    balanceAmount: { $gt: 0 },
    deletedAt: null,
    $or: [
      // Due date is today or in the past (overdue)
      { dueDate: { $lte: now } },
      // Due date is within 3 days (approaching)
      { dueDate: { $gte: now, $lte: threeDaysFromNow } },
    ],
  };

  if (tenantId) {
    filter.tenantId = tenantId;
  }

  const invoices = await Invoice.find(filter)
    .populate('patientId', 'firstName lastName phone email')
    .select('_id patientId invoiceNumber balanceAmount dueDate status tenantId')
    .lean();

  const reminderJobs = [];

  for (const invoice of invoices) {
    const patient = invoice.patientId;
    if (patient && (patient.email || patient.phone)) {
      const isOverdue = invoice.dueDate && new Date(invoice.dueDate) < now;
      
      reminderJobs.push({
        invoiceId: invoice._id.toString(),
        patientId: patient._id.toString(),
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone,
        patientEmail: patient.email,
        invoiceNumber: invoice.invoiceNumber,
        balanceAmount: invoice.balanceAmount,
        dueDate: invoice.dueDate,
        isOverdue,
        tenantId: invoice.tenantId.toString(),
      });
    }
  }

  return reminderJobs;
}

/**
 * Find prescriptions that need refill reminders
 * Checks for prescriptions that are expiring soon or have refills available
 */
export async function findPrescriptionsNeedingRefills(tenantId = null) {
  await connectDB();

  const now = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filter = {
    status: PrescriptionStatus.ACTIVE,
    deletedAt: null,
    // Prescription is expiring soon or has refills available
    $or: [
      { validUntil: { $lte: sevenDaysFromNow, $gte: now } }, // Expiring within 7 days
      { 
        refillsAllowed: { $gt: 0 },
        $expr: { $lt: ['$refillsUsed', '$refillsAllowed'] }, // Has unused refills
        validUntil: { $gte: now }, // Still valid
      },
    ],
  };

  if (tenantId) {
    filter.tenantId = tenantId;
  }

  const prescriptions = await Prescription.find(filter)
    .populate('patientId', 'firstName lastName phone email')
    .populate('doctorId', 'firstName lastName')
    .select('_id patientId doctorId prescriptionNumber items validUntil refillsAllowed refillsUsed status tenantId')
    .lean();

  const reminderJobs = [];

  for (const prescription of prescriptions) {
    const patient = prescription.patientId;
    const doctor = prescription.doctorId;
    
    if (patient && (patient.email || patient.phone)) {
      const daysUntilExpiry = Math.ceil((new Date(prescription.validUntil).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const hasRefillsAvailable = prescription.refillsAllowed > 0 && prescription.refillsUsed < prescription.refillsAllowed;
      
      // Only send reminder if expiring within 7 days or has refills available
      if (daysUntilExpiry <= 7 || hasRefillsAvailable) {
        const itemsNeedingRefill = prescription.items
          .filter((item) => item.itemType === 'drug' && (item.drugName || item.genericName))
          .map((item) => ({
            drugName: item.drugName || item.genericName,
            quantity: item.quantity,
            duration: item.duration,
          }));

        if (itemsNeedingRefill.length > 0) {
          reminderJobs.push({
            prescriptionId: prescription._id.toString(),
            patientId: patient._id.toString(),
            patientName: `${patient.firstName} ${patient.lastName}`,
            patientPhone: patient.phone,
            patientEmail: patient.email,
            doctorName: doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Unknown',
            prescriptionNumber: prescription.prescriptionNumber,
            validUntil: prescription.validUntil,
            daysUntilExpiry,
            hasRefillsAvailable,
            refillsRemaining: prescription.refillsAllowed - prescription.refillsUsed,
            itemsNeedingRefill,
            tenantId: prescription.tenantId.toString(),
          });
        }
      }
    }
  }

  return reminderJobs;
}

/**
 * Send payment reminder
 */
export async function sendPaymentReminder(job) {
  try {
    const patient = await Patient.findById(job.patientId).lean();
    if (!patient) {
      return false;
    }

    // Get user ID if patient has portal access
    const User = (await import('@/models/User.js')).default;
    const user = patient.email
      ? await User.findOne({ email: patient.email, tenantId: job.tenantId }).lean()
      : null;

    const userId = user?._id?.toString() || patient._id.toString();

    const daysUntilDue = job.dueDate
      ? Math.ceil((new Date(job.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    const title = job.isOverdue
      ? 'Payment Overdue - Action Required'
      : 'Payment Reminder';

    const message = job.isOverdue
      ? `Your invoice ${job.invoiceNumber} is overdue. Outstanding balance: ${(job.balanceAmount / 100).toFixed(2)}. Please make payment as soon as possible.`
      : `Reminder: Your invoice ${job.invoiceNumber} is due in ${daysUntilDue} day(s). Outstanding balance: ${(job.balanceAmount / 100).toFixed(2)}.`;

    // Create notification
    await createNotification(
      {
        userId: userId,
        type: 'payment',
        title,
        message,
        data: {
          invoiceId: job.invoiceId,
          invoiceNumber: job.invoiceNumber,
          balanceAmount: job.balanceAmount,
          dueDate: job.dueDate,
          isOverdue: job.isOverdue,
        },
        priority: job.isOverdue ? 'urgent' : 'high',
        channels: {
          email: !!patient.email,
          sms: !!patient.phone,
          whatsapp: !!patient.phone,
        },
        userEmail: patient.email,
        userPhone: patient.phone,
      },
      job.tenantId,
      'system'
    );

    return true;
  } catch (error) {
    logger.error('[PAYMENT REMINDER ERROR]', error);
    return false;
  }
}

/**
 * Send prescription refill reminder
 */
export async function sendPrescriptionRefillReminder(job) {
  try {
    const patient = await Patient.findById(job.patientId).lean();
    if (!patient) {
      return false;
    }

    // Get user ID if patient has portal access
    const User = (await import('@/models/User.js')).default;
    const user = patient.email
      ? await User.findOne({ email: patient.email, tenantId: job.tenantId }).lean()
      : null;

    const userId = user?._id?.toString() || patient._id.toString();

    const drugNames = job.itemsNeedingRefill.map((item) => item.drugName).join(', ');
    const title = job.daysUntilExpiry <= 0 
      ? 'Prescription Expiring - Refill Needed'
      : 'Prescription Refill Reminder';
    
    let message = `Reminder: Your prescription ${job.prescriptionNumber} `;
    if (job.daysUntilExpiry <= 0) {
      message += `has expired and needs refills for: ${drugNames}. `;
    } else if (job.daysUntilExpiry <= 3) {
      message += `is expiring in ${job.daysUntilExpiry} day(s) and needs refills for: ${drugNames}. `;
    } else {
      message += `needs refills for: ${drugNames}. `;
    }
    
    if (job.hasRefillsAvailable && job.refillsRemaining > 0) {
      message += `You have ${job.refillsRemaining} refill(s) remaining. `;
    }
    
    message += 'Please contact the clinic or your doctor.';

    // Create notification
    await createNotification(
      {
        userId: userId,
        type: 'prescription',
        title,
        message,
        data: {
          prescriptionId: job.prescriptionId,
          prescriptionNumber: job.prescriptionNumber,
          itemsNeedingRefill: job.itemsNeedingRefill,
        },
        priority: 'medium',
        channels: {
          email: !!patient.email,
          sms: !!patient.phone,
          whatsapp: !!patient.phone,
        },
        userEmail: patient.email,
        userPhone: patient.phone,
      },
      job.tenantId,
      'system'
    );

    return true;
  } catch (error) {
    logger.error('[PRESCRIPTION REFILL REMINDER ERROR]', error);
    return false;
  }
}

/**
 * Process all pending reminders (appointments, payments, prescriptions)
 */
export async function processAllReminders(tenantId = null) {
  const results = {
    appointments: { processed: 0, sent: 0, failed: 0 },
    payments: { processed: 0, sent: 0, failed: 0 },
    prescriptions: { processed: 0, sent: 0, failed: 0 },
  };

  // Process appointment reminders
  const appointmentJobs = await findAppointmentsNeedingReminders();
  results.appointments.processed = appointmentJobs.length;
  for (const job of appointmentJobs) {
    const success = await sendReminder(job);
    if (success) {
      results.appointments.sent++;
    } else {
      results.appointments.failed++;
    }
  }

  // Process payment reminders
  const paymentJobs = await findInvoicesNeedingReminders(tenantId);
  results.payments.processed = paymentJobs.length;
  for (const job of paymentJobs) {
    const success = await sendPaymentReminder(job);
    if (success) {
      results.payments.sent++;
    } else {
      results.payments.failed++;
    }
  }

  // Process prescription refill reminders
  const prescriptionJobs = await findPrescriptionsNeedingRefills(tenantId);
  results.prescriptions.processed = prescriptionJobs.length;
  for (const job of prescriptionJobs) {
    const success = await sendPrescriptionRefillReminder(job);
    if (success) {
      results.prescriptions.sent++;
    } else {
      results.prescriptions.failed++;
    }
  }

  return results;
}

