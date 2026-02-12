import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import Tenant from '@/models/Tenant';
import { updateTenantSubscription } from '@/services/subscription.service';
import { NextResponse } from 'next/server';

/**
 * PUT /api/admin/clients/[id]
 * Update client subscription or status (Admin only)
 */
async function putHandler(req, user, tenantId) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    // Update subscription if planId provided
    if (body.planId) {
      // Get tenant details for PayPal subscription
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
      }

      // Get tenant's admin/doctor user email for PayPal (try clinic_admin, doctor, admin)
      const User = (await import('@/models/User')).default;
      const tenantUser =
        (await User.findOne({ tenantId, role: 'clinic_admin' })) ||
        (await User.findOne({ tenantId, role: 'doctor' })) ||
        (await User.findOne({ tenantId, role: 'admin' }));
      const customerEmail = tenantUser?.email || body.customerEmail;
      const customerName = tenant.name;

      const result = await updateTenantSubscription(
        tenantId,
        body.planId,
        customerEmail,
        customerName,
      );

      return NextResponse.json(
        successResponse({
          message: result.requiresPayment
            ? 'Subscription created. Payment required - send approval URL to client.'
            : 'Subscription updated successfully',
          subscription: result.subscription,
          approvalUrl: result.approvalUrl,
          requiresPayment: result.requiresPayment,
        }),
      );
    }

    // Update tenant status if isActive provided
    if (body.isActive !== undefined) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
      }

      tenant.isActive = body.isActive;
      await tenant.save();

      return NextResponse.json(
        successResponse({
          message: body.isActive
            ? 'Client activated successfully'
            : 'Client deactivated successfully',
          tenant: {
            id: tenant._id.toString(),
            name: tenant.name,
            isActive: tenant.isActive,
          },
        }),
      );
    }

    // Suspend clinic with reason
    if (body.suspended !== undefined) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
      }

      tenant.suspended = !!body.suspended;
      tenant.suspendReason =
        body.suspended && typeof body.suspendReason === 'string'
          ? body.suspendReason.trim()
          : undefined;
      await tenant.save();

      return NextResponse.json(
        successResponse({
          message: body.suspended
            ? 'Clinic suspended successfully'
            : 'Clinic unsuspended successfully',
          tenant: {
            id: tenant._id.toString(),
            name: tenant.name,
            suspended: tenant.suspended,
            suspendReason: tenant.suspendReason,
          },
        }),
      );
    }

    return NextResponse.json(
      errorResponse('Invalid request. Provide planId, isActive, or suspended', 'INVALID_REQUEST'),
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error('PUT /api/admin/clients/[id] failed', { error: message, tenantId });
    return NextResponse.json(errorResponse(message || 'Failed to update client', 'UPDATE_ERROR'), {
      status: 400,
    });
  }
}

export async function PUT(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) {
    return authResult.error;
  }

  const params = await context.params;
  const authenticatedReq = req;
  authenticatedReq.user = authResult.user;
  return putHandler(authenticatedReq, authResult.user, params.id);
}
