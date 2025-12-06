import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/middleware/auth';
import connectDB from '@/lib/db/connection';
import Tenant from '@/models/Tenant';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/settings
 * Get tenant settings
 */
async function getHandler(req, user) {
  try {
    await connectDB();
    const tenant = await Tenant.findById(user.tenantId);

    if (!tenant) {
      return NextResponse.json(
        errorResponse('Tenant not found', 'NOT_FOUND'),
        { status: 404 }
      );
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
      })
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch settings', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/settings
 * Update tenant settings
 */
async function putHandler(req, user) {
  try {
    await connectDB();
    const body = await req.json();

    const tenant = await Tenant.findById(user.tenantId);
    if (!tenant) {
      return NextResponse.json(
        errorResponse('Tenant not found', 'NOT_FOUND'),
        { status: 404 }
      );
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
      
      // Update nested objects only if they are provided (not undefined or null)
      if (body.settings.taxRules !== undefined && body.settings.taxRules !== null) {
        tenant.settings.taxRules = body.settings.taxRules;
        tenant.markModified('settings.taxRules');
      }
      if (body.settings.complianceSettings !== undefined && body.settings.complianceSettings !== null) {
        tenant.settings.complianceSettings = body.settings.complianceSettings;
        tenant.markModified('settings.complianceSettings');
      }
      if (body.settings.queueSettings !== undefined && body.settings.queueSettings !== null) {
        tenant.settings.queueSettings = { ...tenant.settings.queueSettings, ...body.settings.queueSettings };
        tenant.markModified('settings.queueSettings');
      }
      if (body.settings.clinicHours !== undefined && body.settings.clinicHours !== null) {
        tenant.settings.clinicHours = body.settings.clinicHours;
        tenant.markModified('settings.clinicHours');
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
      })
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to update settings',
        'UPDATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export const GET = withAuth(getHandler);
export const PUT = withAuth(putHandler);

