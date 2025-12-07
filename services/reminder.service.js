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
 * Send reminder via email
 * This sends email reminders based on tenant's notification preferences
 */
export async function sendReminder(job) {
  try {
    // Check if patient has email
    if (!job.patientEmail) {
      console.warn(`[REMINDER] No email for patient ${job.patientName}, skipping email reminder`);
      // Still mark as sent to avoid retrying
      await markReminderSent(job.appointmentId, job.tenantId);
      return true;
    }

    // Import email service
    const { sendAppointmentReminderEmail } = await import('@/lib/email/email-service.js');
    
    // Determine appointment type (default to 'consultation')
    const appointment = await Appointment.findById(job.appointmentId).lean();
    const appointmentType = appointment?.type || 'consultation';

    // Send email reminder
    const emailSent = await sendAppointmentReminderEmail(
      job.patientEmail,
      job.patientName,
      job.doctorName,
      job.appointmentDate,
      job.startTime,
      appointmentType,
      job.tenantId
    );

    if (emailSent) {
      console.log('[REMINDER] ✅ Email reminder sent:', {
        appointmentId: job.appointmentId,
        patientName: job.patientName,
        appointmentTime: job.startTime,
        tenant: job.tenantName,
      });
    } else {
      console.error('[REMINDER] ❌ Failed to send email reminder:', {
        appointmentId: job.appointmentId,
        patientEmail: job.patientEmail,
      });
    }

    // Mark as sent (even if email failed, to avoid infinite retries)
    await markReminderSent(job.appointmentId, job.tenantId);

    return emailSent;
  } catch (error) {
    console.error('[REMINDER ERROR]', error);
    // Mark as sent to avoid infinite retries
    try {
      await markReminderSent(job.appointmentId, job.tenantId);
    } catch (markError) {
      console.error('[REMINDER] Failed to mark reminder as sent:', markError);
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

