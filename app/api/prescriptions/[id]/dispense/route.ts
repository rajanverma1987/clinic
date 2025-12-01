import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { dispensePrescriptionSchema } from '@/lib/validations/prescription';
import { dispensePrescription } from '@/services/prescription.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * POST /api/prescriptions/:id/dispense
 * Dispense a prescription
 */
async function postHandler(
  req: AuthenticatedRequest,
  user: any,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

    const validationResult = dispensePrescriptionSchema.safeParse(body);
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

    const prescription = await dispensePrescription(
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
        dispensedAt: prescription.dispensedAt,
        refillsUsed: prescription.refillsUsed,
      })
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        error.message || 'Failed to dispense prescription',
        'DISPENSE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) return authResult.error;

  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;

  return postHandler(authenticatedReq, authResult.user, { params });
}

