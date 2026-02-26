/**
 * User service – role updates and user management for dashboard-engine adapter and API.
 * Enterprise: input validation, model-aligned updates, safe error handling, no PHI in logs.
 */

import connectDB from '@/lib/db/connection';
import { withTenant } from '@/lib/db/tenant-helper';
import { handleMongoError } from '@/lib/utils/api-response';
import { logger } from '@/lib/utils/logger';
import User, { UserRole } from '@/models/User';
import mongoose from 'mongoose';

const ALLOWED_UPDATE_KEYS = ['firstName', 'lastName', 'isActive'];
const VALID_ROLES = new Set(Object.values(UserRole));

/**
 * Update a user's role and/or allowed profile fields. Used by dashboard-engine assignStaff.
 * Validates input, enforces User model (role enum, allowed keys), and returns updated user.
 * Never exposes raw DB errors or PHI in thrown messages or logs.
 *
 * @param {{ tenantId: string, userId?: string, id?: string, role?: string, firstName?: string, lastName?: string, isActive?: boolean }} input
 * @returns {Promise<import('mongoose').Document>} Updated user document (password not in result)
 * @throws {Error} With safe message only (VALIDATION_ERROR, NOT_FOUND, or generic)
 */
export async function updateUserRole(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Input object is required');
  }

  const { tenantId, userId, id, role, ...rest } = input;
  const targetUserId = userId ?? id;

  if (!tenantId) {
    throw new Error('tenantId is required');
  }
  if (!targetUserId) {
    throw new Error('userId or id is required');
  }
  if (!mongoose.Types.ObjectId.isValid(String(targetUserId))) {
    throw new Error('Invalid user id format');
  }

  if (role !== undefined) {
    if (typeof role !== 'string' || !VALID_ROLES.has(role)) {
      throw new Error(`role must be one of: ${Array.from(VALID_ROLES).slice(0, 5).join(', ')}...`);
    }
  }

  let user;
  try {
    await connectDB();
    user = await User.findOne(withTenant(tenantId, { _id: targetUserId }));
  } catch (err) {
    logger.error('user.service updateUserRole findOne failed', {
      code: err?.name,
      message: err?.message,
    });
    const res = handleMongoError(err);
    const message = res?.error?.message || 'Failed to lookup user';
    throw new Error(message);
  }

  if (!user) {
    throw new Error('User not found');
  }

  if (role !== undefined) {
    user.role = role;
  }
  ALLOWED_UPDATE_KEYS.forEach((key) => {
    if (rest[key] !== undefined) {
      if (key === 'isActive' && typeof rest[key] !== 'boolean') {
        return;
      }
      if ((key === 'firstName' || key === 'lastName') && typeof rest[key] === 'string') {
        user[key] = rest[key].trim();
      } else if (key === 'isActive') {
        user[key] = rest[key];
      }
    }
  });

  try {
    await user.save();
  } catch (err) {
    logger.error('user.service updateUserRole save failed', {
      code: err?.name,
      message: err?.message,
    });
    const res = handleMongoError(err);
    const message = res?.error?.message || 'Failed to update user';
    throw new Error(message);
  }

  return user;
}
