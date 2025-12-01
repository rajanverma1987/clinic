import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/middleware/auth';
import connectDB from '@/lib/db/connection';
import User from '@/models/User';
import { successResponse, errorResponse, handleMongoError } from '@/lib/utils/api-response';

/**
 * GET /api/auth/me
 * Get current user profile
 */
async function handler(req: AuthenticatedRequest, user: any) {
  try {
    await connectDB();

    const userDoc = await User.findById(user.userId)
      .select('-password');

    if (!userDoc) {
      return NextResponse.json(
        errorResponse('User not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }
    
    // Get tenantId before populating (to avoid object conversion issues)
    // tenantId is an ObjectId at this point, not a populated object
    const userTenantId = userDoc.tenantId ? userDoc.tenantId.toString() : '';
    
    // Populate tenant for response
    await userDoc.populate('tenantId', 'name slug region settings');

    // Verify tenant access - allow if user has no tenantId or if tenantIds match
    // Use the tenantId we extracted before populating
    const dbTenantId = userTenantId;
    const tokenTenantId = user.tenantId || '';
    
    // Only check if both tenantIds exist and they don't match
    // Allow access if either is empty (no tenant restriction)
    if (dbTenantId && tokenTenantId && dbTenantId !== tokenTenantId) {
      console.error('Tenant mismatch:', { 
        dbTenantId, 
        tokenTenantId, 
        userId: user.userId,
        userDocTenantId: userDoc.tenantId,
        userTenantId: user.tenantId
      });
      return NextResponse.json(
        errorResponse('Access denied', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    return NextResponse.json(
      successResponse({
        id: userDoc._id.toString(),
        email: userDoc.email,
        firstName: userDoc.firstName,
        lastName: userDoc.lastName,
        role: userDoc.role,
        tenantId: userTenantId,
        tenant: userDoc.tenantId,
        isActive: userDoc.isActive,
        lastLoginAt: userDoc.lastLoginAt,
        createdAt: userDoc.createdAt,
      })
    );
  } catch (error: any) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse('Failed to fetch user profile', 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
}

export const GET = withAuth(handler);

