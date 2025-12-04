/**
 * Reminder service
 * Handles appointment reminder scheduling and sending
 */

import connectDB from '@/lib/db/connection.js';
import Appointment, { AppointmentStatus } from '@/models/Appointment.js';
import Patient from '@/models/Patient.js';
import User from '@/models/User.js';
import Tenant from '@/models/Tenant.js';
import { withTenant } from '@/lib/db/tenant-helper.js';

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
 * Send reminder (placeholder - integrate with SMS/Email/WhatsApp service)
 * This should be implemented based on tenant's notification preferences
 */
export async function sendReminder(job) {
  try {
    // TODO: Integrate with notification service
    // - Check tenant settings for preferred channel (SMS/Email/WhatsApp)
    // - Format message (no PHI in notifications per compliance rules)
    // - Send via appropriate gateway
    // - Log delivery attempt

    // For now, just log
    console.log('[REMINDER]', {
      appointmentId: job.appointmentId,
      patientName: job.patientName,
      appointmentTime: job.startTime,
      tenant: job.tenantName,
    });

    // Mark as sent
    await markReminderSent(job.appointmentId, job.tenantId);

    return true;
  } catch (error) {
    console.error('[REMINDER ERROR]', error);
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

