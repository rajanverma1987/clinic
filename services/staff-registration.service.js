/**
 * Staff Registration Service
 * Handles staff account creation by admin/super_admin
 * Based on Registeration-Login.md requirements
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import { PRIMARY_900 } from '@/lib/constants/brand-colors';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { sendEmail } from '@/lib/email/email-service.js';
import Doctor from '@/models/Doctor.js';
import User, { UserRole } from '@/models/User.js';
import crypto from 'crypto';

/**
 * Register a new staff member
 * @param {Object} input - Registration data
 * @param {string} tenantId - Tenant ID
 * @param {string} createdBy - User ID of the creator
 */
export async function registerStaff(input, tenantId, createdBy) {
  await connectDB();

  const {
    role,
    email,
    firstName,
    lastName,
    phone,
    specialization,
    licenseNumber,
    qualification,
    consultationFee,
    departmentIds,
    sendWelcomeEmail = true,
    requirePasswordChange = true,
  } = input;

  // Check if email already exists
  const existingUser = await User.findOne(
    withTenant(tenantId, {
      email: email.toLowerCase().trim(),
    }),
  );

  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Generate temporary password (8 bytes = 16 hex characters)
  const tempPassword = crypto.randomBytes(8).toString('hex');

  // Create user account
  const user = await User.create({
    tenantId,
    email: email.toLowerCase().trim(),
    password: tempPassword, // Will be hashed by pre-save hook
    firstName,
    lastName,
    phone,
    role,
    isActive: true,
    status: 'active',
    // Store flag for password change requirement (we'll add this field to User model)
    passwordChangedAt: requirePasswordChange ? null : new Date(),
  });

  // If doctor, create doctor profile
  if (role === UserRole.DOCTOR) {
    await Doctor.create({
      tenantId,
      userId: user._id,
      professional: {
        licenseNumber: licenseNumber || '',
        specialization: specialization ? [specialization] : [],
        qualification: qualification || '',
      },
      consultationFee: consultationFee || 0,
      departments: departmentIds || [],
      status: 'active',
    });
  }

  // Send welcome email if requested
  if (sendWelcomeEmail) {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
    const loginUrl = `${appUrl}/login`;
    const roleDisplay = role.replace('_', ' ').toUpperCase();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${PRIMARY_900}; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .credentials { background: #fff; border: 1px solid ${PRIMARY_900}; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .button { display: inline-block; padding: 12px 24px; background: ${PRIMARY_900}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Doctor's Clinic</h1>
          </div>
          <div class="content">
            <p>Dear ${firstName} ${lastName},</p>
            <p>Your account has been created successfully. You can now access the clinic management system.</p>
            
            <div class="credentials">
              <h3>Your Login Credentials:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> <code style="background: #f3f4f6; padding: 5px 10px; border-radius: 3px; font-size: 16px; letter-spacing: 2px;">${tempPassword}</code></p>
              <p><strong>Role:</strong> ${roleDisplay}</p>
            </div>

            ${requirePasswordChange ? '<p><strong>⚠️ Important:</strong> You will be required to change your password on first login.</p>' : ''}

            <p>
              <a href="${loginUrl}" class="button">Login to Your Account</a>
            </p>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
              <strong>Security Note:</strong> Please keep your credentials secure and change your password after logging in.
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

    const emailText = `
Welcome to Doctor's Clinic

Dear ${firstName} ${lastName},

Your account has been created successfully. You can now access the clinic management system.

Your Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}
Role: ${roleDisplay}

${requirePasswordChange ? 'IMPORTANT: You will be required to change your password on first login.\n' : ''}

Login URL: ${loginUrl}

Security Note: Please keep your credentials secure and change your password after logging in.

This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Doctor's Clinic. All rights reserved.
    `;

    await sendEmail(
      {
        to: email,
        subject: 'Welcome to Clinic Management System',
        html: emailHtml,
        text: emailText,
      },
      tenantId,
    );
  }

  // Audit log
  await AuditLogger.auditWrite(
    'user',
    user._id.toString(),
    createdBy,
    tenantId,
    AuditAction.CREATE,
    undefined,
    { action: 'staff_registration', email, role, sendWelcomeEmail },
  );

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    tempPassword: sendWelcomeEmail ? null : tempPassword, // Only return if email not sent
    message: sendWelcomeEmail
      ? 'User created successfully. Welcome email sent.'
      : 'User created successfully. Temporary password generated.',
  };
}
