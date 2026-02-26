import connectDB from '@/lib/db/connection';
import { errorResponse, successResponse } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import Subscription from '@/models/Subscription';
import Tenant from '@/models/Tenant';
import { updateTenantSubscription } from '@/services/subscription.service';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/clients/[id]
 * Fetch single clinic (tenant) with subscription for profile page. Super Admin only.
 */
async function getHandler(req, user, tenantId) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const tenant = await Tenant.findById(tenantId)
    .select('name slug region isActive suspended suspendReason createdAt updatedAt template workflowType betaFeatures settings')
    .lean();
  if (!tenant) {
    return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
  }
  const subscription = await Subscription.findOne({ tenantId })
    .populate('planId', '_id name price billingCycle currency')
    .sort({ createdAt: -1 })
    .lean();
  const client = {
    ...tenant,
    _id: tenant._id.toString(),
    subscription: subscription
      ? {
          ...subscription,
          planId: subscription.planId
            ? {
                _id: subscription.planId._id?.toString(),
                name: subscription.planId.name,
                price: subscription.planId.price,
                billingCycle: subscription.planId.billingCycle,
                currency: subscription.planId.currency,
              }
            : null,
        }
      : null,
  };
  return NextResponse.json(successResponse(client));
}

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

    // Deployment: template and workflow type (SA7)
    if (body.template !== undefined || body.workflowType !== undefined) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
      }
      if (body.template !== undefined) tenant.template = body.template ? String(body.template).trim() : undefined;
      if (body.workflowType !== undefined) tenant.workflowType = body.workflowType ? String(body.workflowType).trim() : undefined;
      await tenant.save();
      return NextResponse.json(
        successResponse({
          message: 'Client deployment settings updated',
          tenant: {
            id: tenant._id.toString(),
            template: tenant.template,
            workflowType: tenant.workflowType,
          },
        }),
      );
    }

    // SA9: Beta / feature rollout per clinic
    if (body.betaFeatures !== undefined) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
      }
      tenant.betaFeatures = Array.isArray(body.betaFeatures)
        ? body.betaFeatures.map((f) => String(f).trim()).filter(Boolean)
        : [];
      await tenant.save();
      return NextResponse.json(
        successResponse({
          message: 'Beta features updated',
          tenant: { id: tenant._id.toString(), betaFeatures: tenant.betaFeatures },
        }),
      );
    }

    // Extend trial: set or extend subscription trialEnd (Super Admin only)
    const extendDays = typeof body.extendTrialDays === 'number' ? Math.max(0, Math.min(365, body.extendTrialDays)) : null;
    if (extendDays !== null && extendDays > 0) {
      const subscription = await Subscription.findOne({ tenantId }).sort({ createdAt: -1 }).lean();
      if (!subscription) {
        return NextResponse.json(
          errorResponse('No subscription found for this clinic. Assign a plan first.', 'NOT_FOUND'),
          { status: 404 },
        );
      }
      const subDoc = await Subscription.findById(subscription._id);
      if (!subDoc) {
        return NextResponse.json(errorResponse('Subscription not found', 'NOT_FOUND'), { status: 404 });
      }
      const now = new Date();
      const newTrialEnd = new Date(now);
      newTrialEnd.setDate(newTrialEnd.getDate() + extendDays);
      subDoc.trialEnd = newTrialEnd;
      await subDoc.save();
      return NextResponse.json(
        successResponse({
          message: `Trial extended by ${extendDays} days`,
          trialEnd: newTrialEnd.toISOString(),
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
      errorResponse(
        'Invalid request. Provide planId, isActive, extendTrialDays, suspended, template, workflowType, or betaFeatures',
        'INVALID_REQUEST',
      ),
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

export async function GET(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return getHandler(req, authResult.user, params.id);
}

/**
 * DELETE /api/admin/clients/[id]
 * Soft-delete clinic (Super_Admin.md: type "DELETE [clinic name]", audit logged). Sets isActive false.
 */
async function deleteHandler(req, user, tenantId) {
  if (user.role !== 'super_admin') {
    return NextResponse.json(errorResponse('Unauthorized', 'UNAUTHORIZED'), { status: 403 });
  }
  await connectDB();
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    return NextResponse.json(errorResponse('Tenant not found', 'NOT_FOUND'), { status: 404 });
  }
  tenant.isActive = false;
  await tenant.save();
  try {
    const AuditLog = (await import('@/models/AuditLog')).default;
    const ipAddress =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';
    await AuditLog.create({
      userId: user._id ?? user.id,
      action: 'CLINIC_DELETED',
      resource: 'tenant',
      resourceId: tenantId,
      details: { name: tenant.name, slug: tenant.slug },
      ipAddress,
      userAgent: req.headers.get('user-agent') || undefined,
    });
  } catch (auditErr) {
    logger.error('Audit log CLINIC_DELETED failed', { error: auditErr?.message });
  }
  return NextResponse.json(
    successResponse({
      message: 'Clinic deleted (access removed). Audit logged.',
      tenant: { id: tenant._id.toString(), name: tenant.name },
    }),
  );
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

export async function DELETE(req, context) {
  const authResult = await import('@/middleware/auth').then((m) => m.authenticate(req));
  if ('error' in authResult) return authResult.error;
  const params = await context.params;
  return deleteHandler(req, authResult.user, params.id);
}
