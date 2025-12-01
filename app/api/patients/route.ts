import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { createPatientSchema, patientQuerySchema } from '@/lib/validations/patient';
import {
  createPatient,
  listPatients,
} from '@/services/patient.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/patients
 * List patients with pagination and filters
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  // Check if Patient Management feature is available (skip for super_admin)
  if (user.role !== 'super_admin') {
    const { requireFeature } = await import('@/middleware/feature-check');
    const featureCheck = await requireFeature(req, user, 'Patient Management');
    if (!featureCheck.allowed) {
      return featureCheck.error!;
    }
  }

  try {
    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      gender: searchParams.get('gender') || undefined,
      bloodGroup: searchParams.get('bloodGroup') || undefined,
      isActive: searchParams.get('isActive') || undefined,
    };

    // Validate query
    const validationResult = patientQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    // Get patients
    const result = await listPatients(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(successResponse(result));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch patients', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/patients
 * Create a new patient
 */
async function postHandler(req: AuthenticatedRequest, user: any) {
  try {
    const body = await req.json();

    // Validate input
    const validationResult = createPatientSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    // Check if Patient Management feature is available (skip for super_admin)
    if (user.role !== 'super_admin') {
      const { requireFeature } = await import('@/middleware/feature-check');
      const featureCheck = await requireFeature(req, user, 'Patient Management');
      if (!featureCheck.allowed) {
        return featureCheck.error!;
      }
    }

    // Create patient
    const patient = await createPatient(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(
      successResponse({
        id: patient._id.toString(),
        patientId: patient.patientId,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        createdAt: patient.createdAt,
      }),
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to create patient',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

