/**
 * Patient Authentication Service
 * Handles patient portal login and registration
 * Based on NEW-PLANS.md requirements
 */

import { AuditAction, AuditLogger } from '@/lib/audit/audit-logger.js';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt.js';
import { PRIMARY_900 } from '@/lib/constants/brand-colors';
import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { sendEmail } from '@/lib/email/email-service.js';
import Patient from '@/models/Patient.js';
import User, { UserRole } from '@/models/User.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Register patient for portal access
 */
export async function registerPatient(input, tenantId) {
  await connectDB();

  // Find patient by email or phone (don't use lean() - we need to save)
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      $or: [{ email: input.email?.toLowerCase().trim() }, { phone: input.phone?.trim() }],
      deletedAt: null,
    }),
  );

  if (!patient) {
    throw new Error('Patient record not found. Please contact the clinic to register.');
  }

  // Check if portal access is already enabled
  if (patient.portalAccess?.enabled) {
    throw new Error('Portal access is already enabled for this patient.');
  }

  // Check if email matches
  if (patient.email && patient.email.toLowerCase() !== input.email.toLowerCase()) {
    throw new Error('Email does not match patient record.');
  }

  // Check if phone matches
  if (patient.phone !== input.phone) {
    throw new Error('Phone number does not match patient record.');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(input.password, 10);

  // Create or update User account for patient
  let user = await User.findOne({
    email: input.email.toLowerCase().trim(),
    tenantId,
  });

  if (user) {
    // User exists, update password
    user.password = hashedPassword;
    user.isActive = true;
    await user.save();
  } else {
    // Create new user account
    user = await User.create({
      tenantId,
      email: input.email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: patient.firstName,
      lastName: patient.lastName,
      role: UserRole.PATIENT,
      phone: patient.phone,
      isActive: true,
    });
  }

  // Generate email verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Enable portal access for patient
  patient.portalAccess = {
    enabled: true,
    email: input.email.toLowerCase().trim(),
    lastLogin: null,
    emailVerified: false,
    verificationToken,
    verificationExpires,
  };
  await patient.save();

  // Send verification email (clinic-only: no patient portal; link points to login)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
  const verificationUrl = `${appUrl}/login?reason=clinic_only`;

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
        .button { display: inline-block; padding: 12px 24px; background: ${PRIMARY_900}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Verify Your Email</h1>
        </div>
        <div class="content">
          <p>Dear ${patient.firstName} ${patient.lastName},</p>
          <p>Thank you for registering for the Patient Portal. Please verify your email address to complete your registration.</p>

          <p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
          </p>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>

          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            This link will expire in 24 hours. If you didn't create an account, please ignore this email.
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
Verify Your Email

Dear ${patient.firstName} ${patient.lastName},

Thank you for registering for the Patient Portal. Please verify your email address to complete your registration.

Verification Link: ${verificationUrl}

This link will expire in 24 hours. If you didn't create an account, please ignore this email.

This is an automated message. Please do not reply to this email.
© ${new Date().getFullYear()} Doctor's Clinic. All rights reserved.
  `;

  await sendEmail(
    {
      to: input.email.toLowerCase().trim(),
      subject: 'Verify Your Email - Patient Portal',
      html: emailHtml,
      text: emailText,
    },
    tenantId,
  );

  // Audit log
  await AuditLogger.auditWrite(
    'patient',
    patient._id.toString(),
    user._id.toString(),
    tenantId,
    AuditAction.CREATE,
    undefined,
    { action: 'portal_registration' },
  );

  return {
    patient: {
      id: patient._id.toString(),
      patientId: patient.patientId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
    },
    user: {
      id: user._id.toString(),
      email: user.email,
    },
  };
}

/**
 * Login patient
 */
export async function loginPatient(input, tenantId) {
  await connectDB();

  // Normalize email and password
  const normalizedEmail = input.email?.toLowerCase().trim();
  const normalizedPassword = input.password?.trim();

  // Find user by email (can't use lean() because we need comparePassword method)
  const user = await User.findOne({
    email: normalizedEmail,
    tenantId,
    role: UserRole.PATIENT,
    isActive: true,
  }).select('+password');

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(normalizedPassword);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Find associated patient (don't use lean() - we need to save)
  const patient = await Patient.findOne(
    withTenant(tenantId, {
      email: normalizedEmail,
      'portalAccess.enabled': true,
      deletedAt: null,
    }),
  );

  if (!patient) {
    throw new Error('Patient record not found or portal access not enabled');
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  patient.portalAccess.lastLogin = new Date();
  await patient.save();

  // Audit log
  await AuditLogger.auditWrite(
    'patient',
    patient._id.toString(),
    user._id.toString(),
    tenantId,
    AuditAction.ACCESS,
    undefined,
    { action: 'portal_login' },
  );

  // Generate tokens
  const tokenPayload = {
    userId: user._id.toString(),
    tenantId: tenantId.toString(),
    email: user.email,
    role: user.role,
    patientId: patient._id.toString(),
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return {
    user: {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    patient: {
      id: patient._id.toString(),
      patientId: patient.patientId,
      firstName: patient.firstName,
      lastName: patient.lastName,
      emailVerified: patient.portalAccess?.emailVerified || false,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Get patient profile for portal
 */
export async function getPatientProfile(patientId, tenantId, userId) {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      'portalAccess.enabled': true,
      deletedAt: null,
    }),
  )
    .select('-medicalHistory -allergies -currentMedications -nationalId') // Exclude PHI
    .lean();

  if (!patient) {
    return null;
  }

  // Audit read
  await AuditLogger.auditRead('patient', patientId, userId, tenantId);

  return patient;
}

/**
 * Update patient profile (limited fields for portal)
 */
export async function updatePatientProfile(patientId, input, tenantId, userId) {
  await connectDB();

  const patient = await Patient.findOne(
    withTenant(tenantId, {
      _id: patientId,
      'portalAccess.enabled': true,
      deletedAt: null,
    }),
  );

  if (!patient) {
    return null;
  }

  const before = patient.toObject();

  // Allow updating only safe fields
  const allowedFields = ['phone', 'alternatePhone', 'address', 'email'];
  const updateData = {};

  for (const field of allowedFields) {
    if (input[field] !== undefined) {
      updateData[field] = input[field];
    }
  }

  // Update email in portalAccess if email changed
  if (input.email && input.email !== patient.email) {
    updateData.email = input.email.toLowerCase().trim();
    updateData['portalAccess.email'] = input.email.toLowerCase().trim();
  }

  const updated = await Patient.findByIdAndUpdate(
    patientId,
    { $set: updateData },
    { new: true, runValidators: true },
  );

  if (updated) {
    await AuditLogger.auditWrite(
      'patient',
      patientId,
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: updated.toObject() },
      { action: 'portal_profile_update' },
    );
  }

  return updated;
}
