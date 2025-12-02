import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import connectDB from '@/lib/db/connection';
import Tenant from '@/models/Tenant';
import { updateTenantSubscription } from '@/services/subscription.service';

/**
 * PUT /api/admin/clients/[id]
 * Update client subscription or status (Admin only)
 */
async function putHandler(req: AuthenticatedRequest, user: any, tenantId: string) {
  try {
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        errorResponse('Unauthorized', 'UNAUTHORIZED'),
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();

    // Update subscription if planId provided
    if (body.planId) {
      // Get tenant details for PayPal subscription
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return NextResponse.json(
          errorResponse('Tenant not found', 'NOT_FOUND'),
          { status: 404 }
        );
      }

      // Get tenant's admin user email for PayPal
      const User = (await import('@/models/User')).default;
      const adminUser = await User.findOne({ tenantId, role: 'clinic_admin' });
      const customerEmail = adminUser?.email || body.customerEmail;
      const customerName = tenant.name;

      const result = await updateTenantSubscription(
        tenantId, 
        body.planId,
        customerEmail,
        customerName
      );
      
      return NextResponse.json(
        successResponse({
          message: result.requiresPayment 
            ? 'Subscription created. Payment required - send approval URL to client.' 
            : 'Subscription updated successfully',
          subscription: result.subscription,
          approvalUrl: result.approvalUrl,
          requiresPayment: result.requiresPayment,
        })
      );
    }

    // Update tenant status if isActive provided
    if (body.isActive !== undefined) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant) {
        return NextResponse.json(
          errorResponse('Tenant not found', 'NOT_FOUND'),
          { status: 404 }
        );
      }

      tenant.isActive = body.isActive;
      await tenant.save();

      return NextResponse.json(
        successResponse({
          message: body.isActive ? 'Client activated successfully' : 'Client deactivated successfully',
          tenant: {
            id: tenant._id.toString(),
            name: tenant.name,
            isActive: tenant.isActive,
          },
        })
      );
    }

    return NextResponse.json(
      errorResponse('Invalid request. Provide planId or isActive', 'INVALID_REQUEST'),
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      errorResponse(error.message || 'Failed to update client', 'UPDATE_ERROR'),
      { status: 400 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await import('@/middleware/auth').then(m => m.authenticate(req));
  if ('error' in authResult) {
    return authResult.error;
  }
  
  const params = await context.params;
  const authenticatedReq = req as AuthenticatedRequest;
  authenticatedReq.user = authResult.user;
  return putHandler(authenticatedReq, authResult.user, params.id);
}

