/**
 * Email Service
 * Sends transactional emails (appointments, video links, etc.)
 * For production: integrate with SendGrid, AWS SES, or similar
 */

/**
 * Send email notification
 * In production, replace with actual email service (SendGrid, SES, etc.)
 */
export async function sendEmail(params) {
  try {
    // TODO: Integrate with actual email service
    // For now, just log the email
    console.log('📧 Email would be sent:', {
      to: params.to,
      subject: params.subject,
      preview: params.text?.substring(0, 100),
    });

    // In production, use something like:
    /*
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: process.env.FROM_EMAIL },
        subject: params.subject,
        content: [{ type: 'text/html', value: params.html }],
      }),
    });
    */

    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

/**
 * Send video consultation invitation email
 */
export async function sendVideoConsultationEmail(
  patientEmail,
  patientName,
  doctorName,
  sessionLink,
  scheduledTime,
  sessionId
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
      <strong>ClinicHub Team</strong>
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #9ca3af;">
    <p>This is an automated message. Please do not reply to this email.</p>
    <p>© 2024 ClinicHub. All rights reserved.</p>
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
ClinicHub Team
  `;

  return await sendEmail({
    to: patientEmail,
    subject,
    html,
    text,
  });
}

