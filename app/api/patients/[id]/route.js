import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { updatePatientSchema } from '@/lib/validations/patient';
import {
  getPatientById,
  updatePatient,
  deletePatient,
} from '@/services/patient.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/patients/:id
 * Get a single patient by ID
 */
async function getHandler(
  req,
  user,
  { params }
) {
  try {
    const patient = await getPatientById(params.id, user.tenantId, user.userId);

    if (!patient) {
      return NextResponse.json(
        errorResponse('Patient not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        id: patient._id.toString(),
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        email: patient.email,
        phone: patient.phone,
        alternatePhone: patient.alternatePhone,
        address: patient.address,
        nationalId: patient.nationalId,
        insuranceId: patient.insuranceId,
        medicalHistory: patient.medicalHistory,
        allergies: patient.allergies,
        currentMedications: patient.currentMedications,
        emergencyContact: patient.emergencyContact,
        attachments: patient.attachments,
        notes: patient.notes,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      })
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch patient', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/patients/:id
 * Update a patient
 */
async function putHandler(
  req,
  user,
  { params }
) {
  try {
    const body = await req.json();

    // Validate input
    const validationResult = updatePatientSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    // Update patient
    const patient = await updatePatient(
      params.id,
      validationResult.data,
      user.tenantId,
      user.userId
    );

    if (!patient) {
      return NextResponse.json(
        errorResponse('Patient not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        id: patient._id.toString(),
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        updatedAt: patient.updatedAt,
      })
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to update patient',
        'UPDATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/patients/:id
 * Soft delete a patient
 */
async function deleteHandler(
  req,
  user,
  { params }
) {
  try {
    const deleted = await deletePatient(params.id, user.tenantId, user.userId);

    if (!deleted) {
      return NextResponse.json(
        errorResponse('Patient not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({ message: 'Patient deleted successfully' })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse('Failed to delete patient', 'DELETE_ERROR'),
      { status: 500 }
    );
  }
}

// Note: Next.js 14+ uses async params
export async function GET(
  req,
  context
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  
  return getHandler(authenticatedReq, authResult.user, { params });
}

export async function PUT(
  req,
  context
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  
  return putHandler(authenticatedReq, authResult.user, { params });
}

export async function DELETE(
  req,
  context
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  
  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  
  return deleteHandler(authenticatedReq, authResult.user, { params });
}

