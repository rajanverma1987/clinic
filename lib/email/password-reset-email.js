/**
 * Password Reset Email Template
 * Sends password reset code to user
 */

import { sendEmail } from './email-service.js';

/**
 * Send password reset email with secret code
 * @param {string} userEmail - User's email address
 * @param {string} secretCode - 6-digit secret code
 * @param {string} tenantId - Tenant ID for clinic-specific SMTP settings (optional)
 */
export async function sendPasswordResetEmail(userEmail, secretCode, tenantId = null) {
  const subject = 'Password Reset Code - Doctor\'s Clinic';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0f89c7; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .code-box { background: #fff; border: 3px solid #0f89c7; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
        .code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f89c7; font-family: monospace; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>You have requested to reset your password for your Doctor's Clinic account.</p>
          
          <div class="code-box">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Your password reset code is:</p>
            <div class="code">${secretCode}</div>
            <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">This code will expire in 15 minutes</p>
          </div>

          <div class="warning">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>⚠️ Security Notice:</strong> If you didn't request this password reset, please ignore this email. 
              Your account remains secure.
            </p>
          </div>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
            <strong>Next Steps:</strong><br>
            1. Enter this code on the password reset page<br>
            2. Create a new secure password<br>
            3. Login with your new password
          </p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>© ${new Date().getFullYear()} Doctor's Clinic. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request

You have requested to reset your password for your Doctor's Clinic account.

Your password reset code is: ${secretCode}

This code will expire in 15 minutes.

SECURITY NOTICE: If you didn't request this password reset, please ignore this email. Your account remains secure.

Next Steps:
1. Enter this code on the password reset page
2. Create a new secure password
3. Login with your new password

This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Doctor's Clinic. All rights reserved.
  `;

  return await sendEmail(
    {
      to: userEmail,
      subject,
      html,
      text,
    },
    tenantId
  );
}
