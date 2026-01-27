/**
 * Doctor Registration API Route
 * 
 * Handles doctor self-registration (5-step onboarding process)
 * Creates pending doctor account that requires admin approval
 * 
 * @module app/api/doctors/register/route
 * @since 1.0.0
 */

import { NextResponse } from 'next/server';
import { withErrorHandler } from '@/middleware/error-handler';
import { apiRateLimit } from '@/middleware/rate-limit';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/utils/api-response';
import { z } from 'zod';
import connectDB from '@/lib/db/connection.js';
import User, { UserRole } from '@/models/User.js';
import Doctor from '@/models/Doctor.js';
import { logger } from '@/lib/utils/logger.js';
import bcrypt from 'bcryptjs';

/**
 * Doctor registration validation schema
 */
const doctorRegisterSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  licenseNumber: z.string().min(1, 'License number is required'),
  qualification: z.string().min(1, 'Qualification is required'),
  specialization: z.array(z.string()).min(1, 'At least one specialization is required'),
  experienceYears: z.number().int().min(0).optional(),
  languages: z.array(z.string()).optional(),
  bio: z.string().optional(),
  workingDays: z.array(z.string()).min(1, 'At least one working day is required'),
  slots: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    slotDuration: z.number().min(15).max(60),
  })).optional(),
  consultationFee: z.number().min(0, 'Consultation fee must be 0 or greater'),
  videoConsultationFee: z.number().min(0).optional(),
  followUpFee: z.number().min(0).optional(),
  departments: z.array(z.string()).optional(),
});

/**
 * POST /api/doctors/register
 * Register a new doctor (pending approval)
 */
async function postHandler(req) {
  try {
    await connectDB();
    
    const body = await req.json();
    
    // Validate input
    const validationResult = doctorRegisterSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if email already exists
    const existingUser = await User.findOne({
      email: data.email.toLowerCase().trim(),
    });

    if (existingUser) {
      return NextResponse.json(
        errorResponse('Email already registered', 'EMAIL_EXISTS'),
        { status: 400 }
      );
    }

    // Check if license number already exists
    const existingDoctor = await Doctor.findOne({
      'professional.licenseNumber': data.licenseNumber,
    });

    if (existingDoctor) {
      return NextResponse.json(
        errorResponse('License number already registered', 'LICENSE_EXISTS'),
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user account (pending approval)
    // Note: For self-registration, we don't assign a tenantId yet
    // Admin will approve and assign to a clinic/tenant
    const user = await User.create({
      email: data.email.toLowerCase().trim(),
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: UserRole.DOCTOR,
      isActive: false, // Pending approval
      status: 'pending_approval',
      // No tenantId - will be assigned by admin on approval
    });

    // Create doctor profile (pending approval) – dp-6: verificationStatus for admin verification
    const doctor = await Doctor.create({
      userId: user._id,
      // No tenantId yet - will be assigned on approval (ensure a platform/default tenant if Doctor.tenantId is required)
      professional: {
        licenseNumber: data.licenseNumber,
        qualification: data.qualification,
        specialization: data.specialization,
        experienceYears: data.experienceYears || 0,
        languages: data.languages || [],
      },
      schedule: {
        workingDays: data.workingDays,
        slots: data.slots || [],
        leaves: [],
      },
      consultationFee: data.consultationFee,
      videoConsultationFee: data.videoConsultationFee || data.consultationFee,
      followUpFee: data.followUpFee || data.consultationFee,
      departments: data.departments || [],
      bio: data.bio || '',
      status: 'inactive',
      verificationStatus: 'pending',
    });

    logger.info('Doctor registration submitted', {
      userId: user._id,
      email: user.email,
      licenseNumber: data.licenseNumber,
    });

    return NextResponse.json(
      successResponse({
        message: 'Registration submitted successfully. Your account is pending admin approval.',
        doctorId: doctor._id,
        userId: user._id,
      }),
      { status: 201 }
    );
  } catch (error) {
    logger.error('Doctor registration error', error);
    return NextResponse.json(
      errorResponse('Registration failed. Please try again.', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export const POST = withErrorHandler(
  apiRateLimit(
    postHandler,
    { maxRequests: 5, windowMs: 15 * 60 * 1000 } // 5 requests per 15 minutes
  )
);
