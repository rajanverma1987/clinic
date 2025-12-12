import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { getAllLots } from '@/services/inventory.service';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/inventory/lots
 * Get all lots/batches from inventory items
 */
async function getHandler(req, user) {
  try {
    const { searchParams } = new URL(req.url);

    const filters = {
      expiringSoon: searchParams.get('expiringSoon') === 'true',
      expired: searchParams.get('expired') === 'true',
    };

    const lots = await getAllLots(user.tenantId, user.userId, filters);

    return NextResponse.json(successResponse(lots));
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch lots', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);

