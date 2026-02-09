/**
 * Appointment Notification Service
 * Sends email and SMS notifications for appointment bookings
 */

import { PRIMARY_900 } from '@/lib/constants/brand-colors';
import connectDB from '@/lib/db/connection';
import { sendEmail } from '@/lib/email/email-service';
import { sendSMS } from '@/lib/sms/sms-service';
import { logger } from '@/lib/utils/logger.js';
import Appointment from '@/models/Appointment';
import Doctor from '@/models/Doctor';
import User from '@/models/User';
import { createNotification } from './notification.service';

/**
 * Send appointment booking confirmation
 */
export async function sendAppointmentConfirmation(appointmentId, tenantId) {
  await connectDB();

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId')
      .populate('doctorId')
      .populate('tenantId')
      .lean();

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const patient = appointment.patientId;
    const doctor = appointment.doctorId;
    const tenant = appointment.tenantId;

    // Get doctor user details
    const doctorUser = await User.findById(doctor.userId).lean();
    const doctorProfile = await Doctor.findOne({ userId: doctorUser._id }).lean();

    // Format appointment date/time
    const appointmentDate = new Date(appointment.appointmentDate || appointment.startTime);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Email content
    const emailSubject = `Appointment Confirmed - ${formattedDate}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: ${PRIMARY_900};">Appointment Confirmed</h2>
        <p>Dear ${patient.firstName} ${patient.lastName},</p>
        <p>Your appointment has been confirmed with the following details:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Appointment Number:</strong> ${appointment.appointmentNumber || appointment._id}</p>
          <p><strong>Doctor:</strong> Dr. ${doctorUser.firstName} ${doctorUser.lastName}</p>
          <p><strong>Date:</strong> ${formattedDate}</p>
          <p><strong>Time:</strong> ${formattedTime}</p>
          <p><strong>Type:</strong> ${appointment.type === 'video' ? 'Video Consultation' : 'In-Clinic'}</p>
          ${appointment.reason ? `<p><strong>Reason:</strong> ${appointment.reason}</p>` : ''}
        </div>
        ${
          appointment.type === 'video'
            ? `
          <p><strong>Video Call Link:</strong> <a href="${(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}/telemedicine/${appointment._id}">Join Video Call</a></p>
        `
            : ''
        }
        <p>Please arrive 10 minutes before your appointment time.</p>
        <p>If you need to reschedule or cancel, please contact us at least 24 hours in advance.</p>
        <p>Thank you for choosing ${tenant.name || 'our clinic'}.</p>
      </div>
    `;

    const emailText = `
      Appointment Confirmed
      
      Dear ${patient.firstName} ${patient.lastName},
      
      Your appointment has been confirmed:
      - Appointment Number: ${appointment.appointmentNumber || appointment._id}
      - Doctor: Dr. ${doctorUser.firstName} ${doctorUser.lastName}
      - Date: ${formattedDate}
      - Time: ${formattedTime}
      - Type: ${appointment.type === 'video' ? 'Video Consultation' : 'In-Clinic'}
      
      ${appointment.type === 'video' ? `Video Call Link: ${(process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')}/telemedicine/${appointment._id}` : ''}
      
      Please arrive 10 minutes before your appointment time.
      Thank you for choosing ${tenant.name || 'our clinic'}.
    `;

    // SMS content
    const smsText = `Appointment confirmed with Dr. ${doctorUser.firstName} ${doctorUser.lastName} on ${formattedDate} at ${formattedTime}. Appointment #${appointment.appointmentNumber || appointment._id.slice(-8)}. ${tenant.name || 'Clinic'}`;

    // Send email
    if (patient.email) {
      await sendEmail(
        {
          to: patient.email,
          subject: emailSubject,
          html: emailHtml,
          text: emailText,
        },
        tenantId,
      );
    }

    // Send SMS
    if (patient.phone) {
      await sendSMS(
        {
          to: patient.phone,
          message: smsText,
        },
        tenantId,
      );
    }

    // Create in-app notification
    await createNotification({
      userId: patient.userId,
      tenantId,
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${doctorUser.firstName} ${doctorUser.lastName} on ${formattedDate} has been confirmed.`,
      type: 'appointment',
      relatedId: appointment._id,
    });

    // Notify doctor
    if (doctorUser._id) {
      await createNotification({
        userId: doctorUser._id,
        tenantId,
        title: 'New Appointment',
        message: `New appointment with ${patient.firstName} ${patient.lastName} on ${formattedDate} at ${formattedTime}.`,
        type: 'appointment',
        relatedId: appointment._id,
      });
    }

    return { success: true };
  } catch (error) {
    logger.error('Failed to send appointment confirmation:', error);
    throw error;
  }
}

/**
 * Send appointment reminder
 */
export async function sendAppointmentReminder(appointmentId, tenantId) {
  await connectDB();

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId')
      .populate('doctorId')
      .populate('tenantId')
      .lean();

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const patient = appointment.patientId;
    const doctor = appointment.doctorId;
    const tenant = appointment.tenantId;

    const doctorUser = await User.findById(doctor.userId).lean();

    const appointmentDate = new Date(appointment.appointmentDate || appointment.startTime);
    const formattedDate = appointmentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = appointmentDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const smsText = `Reminder: You have an appointment with Dr. ${doctorUser.firstName} ${doctorUser.lastName} tomorrow (${formattedDate}) at ${formattedTime}. Appointment #${appointment.appointmentNumber || appointment._id.slice(-8)}.`;

    // Send SMS reminder
    if (patient.phone) {
      await sendSMS(
        {
          to: patient.phone,
          message: smsText,
        },
        tenantId,
      );
    }

    // Create in-app notification
    await createNotification({
      userId: patient.userId,
      tenantId,
      title: 'Appointment Reminder',
      message: `Reminder: You have an appointment with Dr. ${doctorUser.firstName} ${doctorUser.lastName} tomorrow at ${formattedTime}.`,
      type: 'appointment',
      relatedId: appointment._id,
    });

    return { success: true };
  } catch (error) {
    logger.error('Failed to send appointment reminder:', error);
    throw error;
  }
}
