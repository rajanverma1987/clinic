import connectDB from '@/lib/db/connection';
import { ACTIONS, RESOURCES } from '@/lib/permissions/constants';
import { canEditClinicSettings } from '@/lib/permissions/cursor-md-matrix';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import { withErrorHandler } from '@/middleware/error-handler';
import { requirePermission } from '@/middleware/permission-check';
import { apiRateLimit } from '@/middleware/rate-limit';
import { withRequestLogger } from '@/middleware/request-logger';
import Tenant from '@/models/Tenant';
import { NextResponse } from 'next/server';

/**
 * GET /api/settings
 * Get tenant settings
 */
async function getHandler(req, user) {
  if (!user.tenantId && user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Tenant context required', 'MISSING_TENANT'), {
        status: 400,
      });
    }
    if (user.role === 'super_admin' && !user.tenantId) {
      return NextResponse.json(
        errorResponse(
          'Super admin has no tenant context. Use a clinic account or select a tenant.',
          'NO_TENANT_CONTEXT',
        ),
        { status: 400 },
      );
    }

    await connectDB();
    const tenant = await Tenant.findById(user.tenantId);

    if (!tenant) {
      return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
    }

    // Convert to plain object to ensure all nested fields (including clinicHours) are serialized
    const tenantObj = tenant.toObject();

    return NextResponse.json(
      successResponse({
        id: tenantObj._id.toString(),
        name: tenantObj.name,
        slug: tenantObj.slug,
        region: tenantObj.region,
        settings: tenantObj.settings,
        isActive: tenantObj.isActive,
      }),
    );
}

/**
 * PUT /api/settings
 * Update tenant settings (CursorMD/New: only Doctor and Super Admin can modify clinic profile / billing)
 */
async function putHandler(req, user) {
  if (!canEditClinicSettings(user.role)) {
    return NextResponse.json(
      errorResponse('Only Doctor or Super Admin can modify clinic settings', 'FORBIDDEN'),
      { status: 403 },
    );
  }

  await connectDB();
  const body = await req.json();

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
    }

    // Update tenant fields
    if (body.name !== undefined) tenant.name = body.name;
    if (body.region !== undefined) tenant.region = body.region;
    if (body.settings !== undefined) {
      // Only update settings fields that are explicitly provided (not undefined or null)
      // Update top-level settings fields
      if (body.settings.currency !== undefined) tenant.settings.currency = body.settings.currency;
      if (body.settings.locale !== undefined) tenant.settings.locale = body.settings.locale;
      if (body.settings.timezone !== undefined) tenant.settings.timezone = body.settings.timezone;
      if (body.settings.dataRetentionYears !== undefined) {
        tenant.settings.dataRetentionYears = body.settings.dataRetentionYears;
      }
      if (body.settings.prescriptionValidityDays !== undefined) {
        tenant.settings.prescriptionValidityDays = body.settings.prescriptionValidityDays;
      }
      if (body.settings.logo !== undefined) tenant.settings.logo = body.settings.logo;
      if (body.settings.phone !== undefined) tenant.settings.phone = body.settings.phone;
      if (body.settings.taxId !== undefined) tenant.settings.taxId = body.settings.taxId;
      if (body.settings.receiptFooter !== undefined)
        tenant.settings.receiptFooter = body.settings.receiptFooter;
      if (body.settings.address !== undefined && body.settings.address !== null) {
        tenant.settings.address = body.settings.address;
        tenant.markModified('settings.address');
      }

      // Update nested objects only if they are provided (not undefined or null)
      if (body.settings.taxRules !== undefined && body.settings.taxRules !== null) {
        tenant.settings.taxRules = body.settings.taxRules;
        tenant.markModified('settings.taxRules');
      }
      if (
        body.settings.complianceSettings !== undefined &&
        body.settings.complianceSettings !== null
      ) {
        tenant.settings.complianceSettings = body.settings.complianceSettings;
        tenant.markModified('settings.complianceSettings');
      }
      if (body.settings.queueSettings !== undefined && body.settings.queueSettings !== null) {
        tenant.settings.queueSettings = {
          ...tenant.settings.queueSettings,
          ...body.settings.queueSettings,
        };
        tenant.markModified('settings.queueSettings');
      }
      if (body.settings.clinicHours !== undefined && body.settings.clinicHours !== null) {
        tenant.settings.clinicHours = body.settings.clinicHours;
        tenant.markModified('settings.clinicHours');
      }
      if (body.settings.smtp !== undefined && body.settings.smtp !== null) {
        // Merge SMTP settings, only update password if provided
        const existingSmtp = tenant.settings.smtp || {};
        const newSmtp = { ...existingSmtp, ...body.settings.smtp };

        // If password is not provided in the update, keep the existing one
        if (!body.settings.smtp.password || body.settings.smtp.password === '') {
          delete newSmtp.password;
        }

        tenant.settings.smtp = newSmtp;
        tenant.markModified('settings.smtp');
      }
      if (body.settings.holidays !== undefined && body.settings.holidays !== null) {
        // Update holidays array
        tenant.settings.holidays = body.settings.holidays;
        tenant.markModified('settings.holidays');
      }
      if (body.settings.locations !== undefined && body.settings.locations !== null) {
        tenant.settings.locations = body.settings.locations;
        tenant.markModified('settings.locations');
      }
    }
    if (body.isActive !== undefined) tenant.isActive = body.isActive;

    await tenant.save();

    return NextResponse.json(
      successResponse({
        id: tenant._id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        region: tenant.region,
        settings: tenant.settings,
        isActive: tenant.isActive,
        updatedAt: tenant.updatedAt,
      }),
    );
}

/**
 * Apply enterprise middleware stack to GET endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates SETTINGS:READ permission
 * 6. Handler - Executes business logic
 */
export const GET = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.READ)(getHandler))),
  ),
);

/**
 * Apply enterprise middleware stack to PUT endpoint.
 *
 * Middleware order (bottom to top):
 * 1. Error handler - Catches and formats all errors
 * 2. Request logger - Logs request/response with correlation ID
 * 3. Rate limiter - Prevents abuse (60 req/min)
 * 4. Authentication - Validates JWT token
 * 5. Permission check - Validates SETTINGS:UPDATE permission
 * 6. Handler - Executes business logic
 */
export const PUT = withErrorHandler(
  withRequestLogger(
    apiRateLimit(withAuth(requirePermission(RESOURCES.SETTINGS, ACTIONS.UPDATE)(putHandler))),
  ),
);
