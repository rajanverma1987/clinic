import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { createPrescriptionSchema, prescriptionQuerySchema } from '@/lib/validations/prescription';
import {
  createPrescription,
  listPrescriptions,
} from '@/services/prescription.service';
import { successResponse, errorResponse, handleMongoError, validationErrorResponse } from '@/lib/utils/api-response';

/**
 * GET /api/prescriptions
 * List prescriptions with pagination and filters
 */
async function getHandler(req: AuthenticatedRequest, user: any) {
  try {
    const { searchParams } = new URL(req.url);

    const queryParams = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      doctorId: searchParams.get('doctorId') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      isActive: searchParams.get('isActive') || undefined,
    };

    const validationResult = prescriptionQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const result = await listPrescriptions(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(successResponse(result));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch prescriptions', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * POST /api/prescriptions
 * Create a new prescription
 */
async function postHandler(req: AuthenticatedRequest, user: any) {
  try {
    const body = await req.json();

    const validationResult = createPrescriptionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        validationErrorResponse(validationResult.error.errors),
        { status: 400 }
      );
    }

    const prescription = await createPrescription(validationResult.data, user.tenantId, user.userId);

    return NextResponse.json(
      successResponse({
        id: prescription._id.toString(),
        prescriptionNumber: prescription.prescriptionNumber,
        patientId: prescription.patientId.toString(),
        doctorId: prescription.doctorId.toString(),
        status: prescription.status,
        region: prescription.region,
        itemsCount: prescription.items.length,
        validUntil: prescription.validUntil,
        createdAt: prescription.createdAt,
      }),
      { status: 201 }
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to create prescription',
        'CREATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const POST = withAuth(postHandler);

