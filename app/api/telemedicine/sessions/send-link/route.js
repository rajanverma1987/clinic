import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { sendEmail } from '@/lib/email/email-service';

/**
 * POST /api/telemedicine/sessions/send-link
 * Send video consultation link to patient via email
 */
async function postHandler(req, user) {
  try {
    const body = await req.json();
    const { sessionId, patientEmail, videoLink } = body;

    if (!sessionId || !patientEmail || !videoLink) {
      return NextResponse.json(
        errorResponse('Missing required fields: sessionId, patientEmail, videoLink', 'VALIDATION_ERROR'),
        { status: 400 }
      );
    }

    // Create email content
    const subject = 'Video Consultation Link - Doctor\'s Clinic';
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Consultation Link</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Video Consultation Link</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px; margin-bottom: 20px;">Hello,</p>
    
    <p style="font-size: 16px; margin-bottom: 20px;">
      You have been invited to join a video consultation. Click the link below to join:
    </p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${videoLink}" 
         style="background: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 16px; font-weight: bold;">
        🎥 Join Video Consultation
      </a>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 25px 0; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #92400e;">
        <strong>⚠️ Important:</strong> Make sure you're in a quiet, private location with good internet connection.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <span style="font-family: monospace; font-size: 12px; word-break: break-all;">${videoLink}</span>
    </p>
    
    <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
      Best regards,<br>
      <strong>Doctor's Clinic Team</strong>
    </p>
  </div>
</body>
</html>
    `;

    const text = `
Video Consultation Link

Hello,

You have been invited to join a video consultation. Use the link below to join:

${videoLink}

Important: Make sure you're in a quiet, private location with good internet connection.

Best regards,
Doctor's Clinic Team
    `;

    // Send email to patient (pass user's tenantId if available)
    await sendEmail({
      to: patientEmail,
      subject,
      html,
      text,
    }, user?.tenantId || null);

    return NextResponse.json(successResponse({ message: 'Email sent successfully' }));
  } catch (error) {
    console.error('Error sending telemedicine link email:', error);
    return NextResponse.json(
      errorResponse(
        error instanceof Error ? error.message : 'Failed to send email',
        'EMAIL_ERROR'
      ),
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;

  return postHandler(authenticatedReq, authResult.user);
}

