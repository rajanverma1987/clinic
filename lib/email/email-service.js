/**
 * Email Service
 * Sends transactional emails using SMTP (nodemailer)
 * Supports clinic-specific SMTP settings or global defaults
 */

import nodemailer from 'nodemailer';

/**
 * Get SMTP transporter
 * Uses tenant-specific SMTP settings if available, otherwise uses environment variables
 */
async function getTransporter(tenantId = null) {
  // If tenantId is provided, try to get tenant-specific SMTP settings
  if (tenantId) {
    try {
      const Tenant = (await import('@/models/Tenant.js')).default;
      const tenant = await Tenant.findById(tenantId);

      if (tenant?.settings?.smtp?.enabled && tenant.settings.smtp.host) {
        return nodemailer.createTransport({
          host: tenant.settings.smtp.host,
          port: tenant.settings.smtp.port || 587,
          secure: tenant.settings.smtp.secure || false, // true for 465, false for other ports
          auth: {
            user: tenant.settings.smtp.user,
            pass: tenant.settings.smtp.password,
          },
          tls: {
            rejectUnauthorized: tenant.settings.smtp.rejectUnauthorized !== false,
          },
        });
      }
    } catch (error) {
      console.warn('Failed to load tenant SMTP settings, using defaults:', error.message);
    }
  }

  // Use global SMTP settings from environment variables
  const smtpConfig = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: process.env.SMTP_USER && process.env.SMTP_PASSWORD ? {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    } : undefined,
    tls: {
      rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
    },
  };

  // If no SMTP configuration is available, return null (email won't be sent)
  if (!smtpConfig.host) {
    console.warn('⚠️ SMTP not configured. Emails will not be sent. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASSWORD environment variables.');
    return null;
  }

  return nodemailer.createTransport(smtpConfig);
}

/**
 * Get sender email address
 * Uses tenant-specific from email if available, otherwise uses environment variable or default
 */
async function getFromEmail(tenantId = null) {
  if (tenantId) {
    try {
      const Tenant = (await import('@/models/Tenant.js')).default;
      const tenant = await Tenant.findById(tenantId);

      if (tenant?.settings?.smtp?.fromEmail) {
        return tenant.settings.smtp.fromEmail;
      }
    } catch (error) {
      console.warn('Failed to load tenant from email, using defaults:', error.message);
    }
  }

  return process.env.SMTP_FROM_EMAIL || process.env.FROM_EMAIL || 'noreply@doctorsclinic.services';
}

/**
 * Send email notification
 * @param {Object} params - Email parameters
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject
 * @param {string} params.html - HTML email content
 * @param {string} params.text - Plain text email content (optional)
 * @param {string} params.from - Sender email address (optional, uses default if not provided)
 * @param {string} tenantId - Tenant ID for clinic-specific SMTP settings (optional)
 */
export async function sendEmail(params, tenantId = null) {
  try {
    const transporter = await getTransporter(tenantId);

    if (!transporter) {
      console.warn('📧 Email not sent (SMTP not configured):', {
        to: params.to,
        subject: params.subject,
      });
      return false;
    }

    const fromEmail = params.from || await getFromEmail(tenantId);
    const fromName = process.env.SMTP_FROM_NAME || 'Doctor\'s Clinic';

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || params.html?.replace(/<[^>]*>/g, ''), // Strip HTML if no text provided
    };

    console.log('📧 Sending email:', {
      to: params.to,
      subject: params.subject,
      from: fromEmail,
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully:', {
      messageId: info.messageId,
      to: params.to,
    });

    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
    });
    return false;
  }
}

/**
 * Send video consultation invitation email
 * @param {string} patientEmail - Patient's email address
 * @param {string} patientName - Patient's name
 * @param {string} doctorName - Doctor's name
 * @param {string} sessionLink - Video consultation link
 * @param {Date} scheduledTime - Scheduled appointment time
 * @param {string} sessionId - Session ID
 * @param {string} tenantId - Tenant ID for clinic-specific SMTP settings (optional)
 */
export async function sendVideoConsultationEmail(
  patientEmail,
  patientName,
  doctorName,
  sessionLink,
  scheduledTime,
  sessionId,
  tenantId = null
) {
  const formattedDate = scheduledTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = scheduledTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const subject = `Video Consultation Scheduled - ${formattedDate}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Consultation Scheduled</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Video Consultation Scheduled</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear ${patientName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your video consultation has been scheduled with <strong>Dr. ${doctorName}</strong>.
    </p>
    
    <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">Appointment Details</h2>
      <table style="width: 100%; font-size: 15px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>Date:</strong></td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Time:</strong></td>
          <td style="padding: 8px 0;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Doctor:</strong></td>
          <td style="padding: 8px 0;">Dr. ${doctorName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Session ID:</strong></td>
          <td style="padding: 8px 0; font-family: monospace; font-size: 13px;">${sessionId}</td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${sessionLink}" 
         style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">
        🎥 Join Video Consultation
      </a>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ Important:</strong> Please join 5 minutes before your scheduled time. 
        Make sure you're in a quiet, private location with good internet connection.
      </p>
    </div>
    
    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af;"><strong>Technical Requirements:</strong></p>
      <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e40af;">
        <li>Camera and microphone enabled</li>
        <li>Stable internet connection (minimum 2 Mbps)</li>
        <li>Modern browser (Chrome, Firefox, Safari, Edge)</li>
        <li>Private, quiet environment</li>
      </ul>
    </div>
    
    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0 0 10px 0; font-size: 14px; color: #065f46;"><strong>🔒 Your Privacy is Protected:</strong></p>
      <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #065f46;">
        <li>Video calls are encrypted end-to-end</li>
        <li>HIPAA and GDPR compliant</li>
        <li>No third-party access to your data</li>
        <li>All sessions are secure and private</li>
      </ul>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If you need to reschedule or have any questions, please contact our office.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      Best regards,<br>
      <strong>Doctor's Clinic Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>© 2024 Doctor's Clinic. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  const text = `
Video Consultation Scheduled

Dear ${patientName},

Your video consultation has been scheduled with Dr. ${doctorName}.

Appointment Details:
- Date: ${formattedDate}
- Time: ${formattedTime}
- Doctor: Dr. ${doctorName}
- Session ID: ${sessionId}

Join Video Consultation:
${sessionLink}

Important: Please join 5 minutes before your scheduled time. Make sure you're in a quiet, private location with good internet connection.

Your privacy is protected - video calls are encrypted end-to-end and HIPAA/GDPR compliant.

Best regards,
Doctor's Clinic Team
  `;

  return await sendEmail({
    to: patientEmail,
    subject,
    html,
    text,
  }, tenantId);
}

/**
 * Send appointment confirmation email
 * @param {string} patientEmail - Patient's email address
 * @param {string} patientName - Patient's name
 * @param {string} doctorName - Doctor's name
 * @param {Date} appointmentDate - Appointment date
 * @param {Date} startTime - Appointment start time
 * @param {string} appointmentType - Type of appointment
 * @param {string} tenantId - Tenant ID for clinic-specific SMTP settings (optional)
 */
export async function sendAppointmentConfirmationEmail(
  patientEmail,
  patientName,
  doctorName,
  appointmentDate,
  startTime,
  appointmentType = 'consultation',
  tenantId = null
) {
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

  const subject = `Appointment Confirmed - ${formattedDate}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Appointment Confirmed</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear ${patientName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      Your appointment with <strong>Dr. ${doctorName}</strong> has been confirmed.
    </p>
    
    <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">Appointment Details</h2>
      <table style="width: 100%; font-size: 15px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>Date:</strong></td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Time:</strong></td>
          <td style="padding: 8px 0;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Doctor:</strong></td>
          <td style="padding: 8px 0;">Dr. ${doctorName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Type:</strong></td>
          <td style="padding: 8px 0;">${appointmentType}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #1e40af;">
        <strong>📅 Reminder:</strong> You will receive a reminder 24 hours before your appointment.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      If you need to reschedule or have any questions, please contact our office.
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      Best regards,<br>
      <strong>Doctor's Clinic Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>© 2024 Doctor's Clinic. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  const text = `
Appointment Confirmed

Dear ${patientName},

Your appointment with Dr. ${doctorName} has been confirmed.

Appointment Details:
- Date: ${formattedDate}
- Time: ${formattedTime}
- Doctor: Dr. ${doctorName}
- Type: ${appointmentType}

Reminder: You will receive a reminder 24 hours before your appointment.

If you need to reschedule or have any questions, please contact our office.

Best regards,
Doctor's Clinic Team
  `;

  return await sendEmail({
    to: patientEmail,
    subject,
    html,
    text,
  }, tenantId);
}

/**
 * Send appointment reminder email
 * @param {string} patientEmail - Patient's email address
 * @param {string} patientName - Patient's name
 * @param {string} doctorName - Doctor's name
 * @param {Date} appointmentDate - Appointment date
 * @param {Date} startTime - Appointment start time
 * @param {string} appointmentType - Type of appointment
 * @param {string} tenantId - Tenant ID for clinic-specific SMTP settings (optional)
 */
export async function sendAppointmentReminderEmail(
  patientEmail,
  patientName,
  doctorName,
  appointmentDate,
  startTime,
  appointmentType = 'consultation',
  tenantId = null
) {
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

  const subject = `Appointment Reminder - ${formattedDate} at ${formattedTime}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Appointment Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Appointment Reminder</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Dear ${patientName},</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      This is a reminder that you have an appointment with <strong>Dr. ${doctorName}</strong> in ${timeUntil}.
    </p>
    
    <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
      <h2 style="margin-top: 0; color: #1f2937; font-size: 20px;">Appointment Details</h2>
      <table style="width: 100%; font-size: 15px;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; width: 100px;"><strong>Date:</strong></td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Time:</strong></td>
          <td style="padding: 8px 0;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Doctor:</strong></td>
          <td style="padding: 8px 0;">Dr. ${doctorName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280;"><strong>Type:</strong></td>
          <td style="padding: 8px 0;">${appointmentType}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ Important:</strong> Please arrive on time. If you need to reschedule or cancel, please contact us as soon as possible.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      We look forward to seeing you!
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      Best regards,<br>
      <strong>Doctor's Clinic Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>© 2024 Doctor's Clinic. All rights reserved.</p>
  </div>
</body>
</html>
  `;

  const text = `
Appointment Reminder

Dear ${patientName},

This is a reminder that you have an appointment with Dr. ${doctorName} in ${timeUntil}.

Appointment Details:
- Date: ${formattedDate}
- Time: ${formattedTime}
- Doctor: Dr. ${doctorName}
- Type: ${appointmentType}

Important: Please arrive on time. If you need to reschedule or cancel, please contact us as soon as possible.

We look forward to seeing you!

Best regards,
Doctor's Clinic Team
  `;

  return await sendEmail({
    to: patientEmail,
    subject,
    html,
    text,
  }, tenantId);
}

