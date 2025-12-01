import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { updatePrescriptionSchema } from '@/lib/validations/prescription';
import {
  getPrescriptionById,
  updatePrescription,
  deletePrescription,
  activatePrescription,
  cancelPrescription,
} from '@/services/prescription.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/prescriptions/:id
 * Get a single prescription by ID
 */
async function getHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const prescription = await getPrescriptionById(params.id, user.tenantId, user.userId);

    if (!prescription) {
      return NextResponse.json(
        errorResponse('Prescription not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(successResponse(prescription));
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch prescription', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/prescriptions/:id
 * Update a prescription
 */
async function putHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const validationResult = updatePrescriptionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        errorResponse(
          'Validation failed',
          'VALIDATION_ERROR',
          validationResult.error.errors
        ),
        { status: 400 }
      );
    }

    const prescription = await updatePrescription(
      params.id,
      validationResult.data,
      user.tenantId,
      user.userId
    );

    if (!prescription) {
      return NextResponse.json(
        errorResponse('Prescription not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({
        id: prescription._id.toString(),
        prescriptionNumber: prescription.prescriptionNumber,
        status: prescription.status,
        updatedAt: prescription.updatedAt,
      })
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to update prescription',
        'UPDATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/prescriptions/:id
 * Soft delete a prescription
 */
async function deleteHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const deleted = await deletePrescription(params.id, user.tenantId, user.userId);

    if (!deleted) {
      return NextResponse.json(
        errorResponse('Prescription not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      successResponse({ message: 'Prescription deleted successfully' })
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse('Failed to delete prescription', 'DELETE_ERROR'),
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return getHandler(authenticatedReq, authResult.user, { params });
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return putHandler(authenticatedReq, authResult.user, { params });
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return deleteHandler(authenticatedReq, authResult.user, { params });
}

