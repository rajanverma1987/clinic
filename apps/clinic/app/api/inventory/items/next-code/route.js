import { NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { RESOURCES, ACTIONS } from '@/lib/permissions/constants';
import { generateNextItemCode } from '@/services/inventory.service';
import { successResponse } from '@/lib/utils/api-response';

/**
 * GET /api/inventory/items/next-code
 * Generate the next available item code for the tenant
 */
async function getHandler(req, user) {
  const code = await generateNextItemCode(user.tenantId);
  return NextResponse.json(successResponse({ code }));
}

export const GET = withErrorHandler(
  apiRateLimit(
    withAuth(
      requirePermission(RESOURCES.INVENTORY, ACTIONS.READ)(getHandler)
    )
  )
);
