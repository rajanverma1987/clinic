import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Subscription from '@/models/Subscription';
import Tenant from '@/models/Tenant';
import { NextResponse } from 'next/server';

const VALID_REGIONS = ['US', 'EU', 'APAC', 'IN', 'ME', 'CA', 'AU'];

/** Normalize location for duplicate check: region + city + state + zipCode (lowercase, trimmed). */
function locationKey(region, address) {
  const city = (address?.city ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const state = (address?.state ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  const zipCode = (address?.zipCode ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  return `${region || ''}|${city}|${state}|${zipCode}`;
}

/**
 * POST /api/admin/clients
 * Create a new clinic (tenant). Super Admin only.
 * Duplicate = same name + same location. Same name + different location = branch allowed.
 * If duplicate name+location: reject and ask for a different branch location.
 */
async function postHandler(req, user) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const slug =
    typeof body.slug === 'string' ? body.slug.trim().toLowerCase().replace(/\s+/g, '-') : '';
  const region =
    typeof body.region === 'string' && VALID_REGIONS.includes(body.region) ? body.region : 'US';
  const address =
    body.address && typeof body.address === 'object'
      ? {
          street: typeof body.address.street === 'string' ? body.address.street.trim() : undefined,
          city: typeof body.address.city === 'string' ? body.address.city.trim() : undefined,
          state: typeof body.address.state === 'string' ? body.address.state.trim() : undefined,
          zipCode:
            typeof body.address.zipCode === 'string' ? body.address.zipCode.trim() : undefined,
          country:
            typeof body.address.country === 'string' ? body.address.country.trim() : undefined,
        }
      : undefined;

  if (!name || !slug) {
    return NextResponse.json(errorResponse('name and slug are required', 'VALIDATION_ERROR'), {
      status: 400,
    });
  }
  if (slug.length < 2) {
    return NextResponse.json(
      errorResponse('slug must be at least 2 characters', 'VALIDATION_ERROR'),
      {
        status: 400,
      },
    );
  }
  const existingBySlug = await Tenant.findOne({ slug }).lean();
  if (existingBySlug) {
    return NextResponse.json(errorResponse('A clinic with this slug already exists', 'CONFLICT'), {
      status: 409,
    });
  }

  // Duplicate = same name + same location. Same name + different location = branch (allowed).
  const nameRegex = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
  const existingWithSameName = await Tenant.find({ name: nameRegex })
    .select('region settings.address')
    .lean();
  const newLocation = locationKey(region, address);
  const isDuplicate = existingWithSameName.some((t) => {
    const existingLoc = locationKey(t.region, t.settings?.address);
    return existingLoc === newLocation;
  });
  if (isDuplicate) {
    return NextResponse.json(
      errorResponse(
        'A clinic with this name and location already exists. To add a branch, provide a different branch location (different city/address).',
        'DUPLICATE_CLINIC',
      ),
      { status: 409 },
    );
  }

  // If same name exists but different location, require at least city or zipCode so branch is identifiable
  if (existingWithSameName.length > 0 && !address?.city && !address?.zipCode) {
    return NextResponse.json(
      errorResponse(
        'A clinic with this name already exists. To add a branch, provide a different branch location (city and/or address).',
        'BRANCH_LOCATION_REQUIRED',
      ),
      { status: 400 },
    );
  }

  const tenant = await Tenant.create({
    name,
    slug,
    region,
    isActive: true,
    settings: {
      locale: 'en-US',
      timezone: 'UTC',
      currency: 'USD',
      ...(address && Object.keys(address).length > 0 ? { address } : {}),
    },
  });

  return NextResponse.json(
    successResponse({
      message: 'Clinic created. Assign a plan from Clinic Management.',
      tenant: {
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        region: tenant.region,
        isActive: tenant.isActive,
      },
    }),
    { status: 201 },
  );
}

/**
 * GET /api/admin/clients
 * List all clients (tenants) with subscription info (Admin only)
 */
async function getHandler(req, user) {
  // Check if user is super admin
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }

  await connectDB();

  const tenants = await Tenant.find()
    .select(
      'name slug region isActive suspended suspendReason createdAt updatedAt template workflowType betaFeatures settings',
    )
    .sort({ createdAt: -1 })
    .lean();

  // Get subscription info for each tenant
  const tenantsWithSubscriptions = await Promise.all(
    tenants.map(async (tenant) => {
      const subscription = await Subscription.findOne({ tenantId: tenant._id })
        .populate('planId', '_id name price billingCycle currency')
        .sort({ createdAt: -1 })
        .lean();

      return {
        ...tenant,
        subscription: subscription || null,
      };
    }),
  );

  return NextResponse.json(successResponse(tenantsWithSubscriptions));
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates SUBSCRIPTION:READ permission
 * 6. Handler - Executes business logic (super_admin check inside handler)
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SUBSCRIPTION, ACTIONS.READ)(getHandler))),
  ),
);

export const POST = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SUBSCRIPTION, ACTIONS.MANAGE)(postHandler))),
  ),
);
