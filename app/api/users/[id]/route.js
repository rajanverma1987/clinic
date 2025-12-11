import connectDB from '@/lib/db/connection';
import { errorResponse, handleMongoError, successResponse } from '@/lib/utils/api-response';
import { withAuth } from '@/middleware/auth';
import User from '@/models/User';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

/**
 * PUT /api/users/:id
 * Update a user
 */
async function putHandler(req, user, id) {
  try {
    // Validate ID parameter
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(errorResponse('Invalid user ID', 'VALIDATION_ERROR'), {
        status: 400,
      });
    }

    await connectDB();
    const body = await req.json();

    const targetUser = await User.findOne({
      _id: id,
      tenantId: user.tenantId,
    });

    if (!targetUser) {
      return NextResponse.json(errorResponse('User not found', 'NOT_FOUND'), { status: 404 });
    }

    // Update fields
    if (body.firstName !== undefined) targetUser.firstName = body.firstName;
    if (body.lastName !== undefined) targetUser.lastName = body.lastName;
    if (body.role !== undefined) targetUser.role = body.role;
    if (body.isActive !== undefined) targetUser.isActive = body.isActive;
    if (body.password !== undefined) targetUser.password = body.password;

    await targetUser.save();

    return NextResponse.json(
      successResponse({
        id: targetUser._id.toString(),
        email: targetUser.email,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        role: targetUser.role,
        isActive: targetUser.isActive,
        updatedAt: targetUser.updatedAt,
      })
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to update user',
        'UPDATE_ERROR'
      ),
      { status: 400 }
    );
  }
}

/**
 * DELETE /api/users/:id
 * Deactivate a user (soft delete)
 */
async function deleteHandler(req, user, id) {
  try {
    // Validate ID parameter
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(errorResponse('Invalid user ID', 'VALIDATION_ERROR'), {
        status: 400,
      });
    }

    await connectDB();

    const targetUser = await User.findOne({
      _id: id,
      tenantId: user.tenantId,
    });

    if (!targetUser) {
      return NextResponse.json(errorResponse('User not found', 'NOT_FOUND'), { status: 404 });
    }

    // Soft delete - set isActive to false
    targetUser.isActive = false;
    await targetUser.save();

    return NextResponse.json(
      successResponse({
        message: 'User deactivated successfully',
        id: targetUser._id.toString(),
      })
    );
  } catch (error) {
    if (error.name === 'MongoError' || error.name === 'ValidationError') {
      return NextResponse.json(handleMongoError(error), { status: 400 });
    }

    return NextResponse.json(
      errorResponse(
        (error instanceof Error ? error.message : String(error)) || 'Failed to deactivate user',
        'DELETE_ERROR'
      ),
      { status: 400 }
    );
  }
}

export async function PUT(req, context) {
  const params = await context.params;
  return withAuth((req, user) => putHandler(req, user, params.id))(req);
}

export async function DELETE(req, context) {
  const params = await context.params;
  return withAuth((req, user) => deleteHandler(req, user, params.id))(req);
}
