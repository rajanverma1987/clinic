import { errorResponse, handleMongoError, successResponse } from '@/lib/utils/api-response';
import { signPrescription } from '@/services/prescription.service';
import { NextResponse } from 'next/server';

/**
 * POST /api/prescriptions/:id/sign
 * Sign prescription (e-sign and activate). Requires doctorSignature.
 */
async function postHandler(req, user, { params }) {
  try {
    const body = await req.json().catch(() => ({}));
    const { doctorSignature, signedByTitle, signedByLicense } = body;

    if (!doctorSignature || String(doctorSignature).trim() === '') {
      return NextResponse.json(errorResponse('Doctor signature is required', 'VALIDATION_ERROR'), {
        status: 400,
      });
    }

    const prescription = await signPrescription(
      params.id,
      {
        doctorSignature: String(doctorSignature).trim(),
        signedByTitle: signedByTitle != null ? String(signedByTitle).trim() : undefined,
        signedByLicense: signedByLicense != null ? String(signedByLicense).trim() : undefined,
      },
      user.tenantId,
      user.userId
    );

    if (!prescription) {
      return NextResponse.json(errorResponse('Prescription not found', 'NOT_FOUND'), {
        status: 404,
      });
    }

    return NextResponse.json(
      successResponse({
        id: prescription._id.toString(),
        prescriptionNumber: prescription.prescriptionNumber,
        status: prescription.status,
        signedAt: prescription.signedAt,
      })
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }
    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to sign prescription',
        'SIGN_ERROR'
      ),
      { status: 400 }
    );
  }
}

export async function POST(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return postHandler(req, authResult.user, { params });
}
