/**
 * Department service
 * Handles all department-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import Department from '@/models/Department.js';
import User from '@/models/User.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Create a new department
 */
export async function createDepartment(input, tenantId, userId) {
  await connectDB();

  // Check if department code already exists for this tenant
  const existing = await Department.findOne(
    withTenant(tenantId, {
      code: input.code.toUpperCase(),
    })
  );

  if (existing) {
    throw new Error('Department code already exists');
  }

  // Validate head doctor if provided
  if (input.headDoctor) {
    const headDoctor = await User.findOne(
      withTenant(tenantId, {
        _id: input.headDoctor,
        isActive: true,
      })
    );

    if (!headDoctor) {
      throw new Error('Head doctor not found or inactive');
    }
  }

  // Create department
  const department = await Department.create({
    tenantId,
    name: input.name,
    code: input.code.toUpperCase(),
    description: input.description || '',
    headDoctor: input.headDoctor || null,
    location: input.location || '',
    status: input.status || 'active',
  });

  // Audit log
  await AuditLogger.auditWrite(
    'department',
    department._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return department;
}

/**
 * Get department by ID
 */
export async function getDepartmentById(departmentId, tenantId, userId) {
  await connectDB();

  const department = await Department.findOne(
    withTenant(tenantId, {
      _id: departmentId,
    })
  )
    .populate('headDoctor', 'firstName lastName email')
    .lean();

  if (department) {
    await AuditLogger.auditRead('department', departmentId, userId, tenantId);
  }

  return department;
}

/**
 * List departments with pagination and filters
 */
export async function listDepartments(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter = withTenant(tenantId, {});

  if (query.status) {
    filter.status = query.status;
  }

  if (query.headDoctor) {
    filter.headDoctor = query.headDoctor;
  }

  // Get total count
  const total = await Department.countDocuments(filter);

  // Get paginated results
  const departments = await Department.find(filter)
    .populate('headDoctor', 'firstName lastName email')
    .sort({ name: 1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'department',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: departments.length, filters: query }
  );

  return createPaginationResult(departments, total, page || 1, limit || 10);
}

/**
 * Update department
 */
export async function updateDepartment(departmentId, input, tenantId, userId) {
  await connectDB();

  const existing = await Department.findOne(
    withTenant(tenantId, {
      _id: departmentId,
    })
  );

  if (!existing) {
    return null;
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Check if code is being changed and if it conflicts
  if (input.code && input.code.toUpperCase() !== existing.code) {
    const codeExists = await Department.findOne(
      withTenant(tenantId, {
        code: input.code.toUpperCase(),
        _id: { $ne: departmentId },
      })
    );

    if (codeExists) {
      throw new Error('Department code already exists');
    }

    updateData.code = input.code.toUpperCase();
  }

  // Validate head doctor if provided
  if (input.headDoctor !== undefined) {
    if (input.headDoctor) {
      const headDoctor = await User.findOne(
        withTenant(tenantId, {
          _id: input.headDoctor,
          isActive: true,
        })
      );

      if (headDoctor) {
        updateData.headDoctor = input.headDoctor;
      } else {
        throw new Error('Head doctor not found or inactive');
      }
    } else {
      // Remove head doctor
      updateData.headDoctor = null;
    }
  }

  const department = await Department.findByIdAndUpdate(
    departmentId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('headDoctor', 'firstName lastName email');

  if (department) {
    await AuditLogger.auditWrite(
      'department',
      department._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: department.toObject() }
    );
  }

  return department;
}

/**
 * Assign head doctor to department
 */
export async function assignHeadDoctor(departmentId, doctorId, tenantId, userId) {
  await connectDB();

  const department = await Department.findOne(
    withTenant(tenantId, {
      _id: departmentId,
    })
  );

  if (!department) {
    return null;
  }

  // Validate doctor exists and is active
  const doctor = await User.findOne(
    withTenant(tenantId, {
      _id: doctorId,
      isActive: true,
    })
  );

  if (!doctor) {
    throw new Error('Doctor not found or inactive');
  }

  const before = department.toObject();
  department.headDoctor = doctorId;
  await department.save();

  // Audit log
  await AuditLogger.auditWrite(
    'department',
    department._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: department.toObject() },
    { action: 'assign_head_doctor', doctorId: doctorId.toString() }
  );

  return department.populate('headDoctor', 'firstName lastName email');
}

/**
 * Remove head doctor from department
 */
export async function removeHeadDoctor(departmentId, tenantId, userId) {
  await connectDB();

  const department = await Department.findOne(
    withTenant(tenantId, {
      _id: departmentId,
    })
  );

  if (!department) {
    return null;
  }

  const before = department.toObject();
  department.headDoctor = null;
  await department.save();

  // Audit log
  await AuditLogger.auditWrite(
    'department',
    department._id.toString(),
    userId,
    tenantId,
    AuditAction.UPDATE,
    { before, after: department.toObject() },
    { action: 'remove_head_doctor' }
  );

  return department;
}

/**
 * Delete department (soft delete by setting status to inactive)
 */
export async function deleteDepartment(departmentId, tenantId, userId) {
  await connectDB();

  const department = await Department.findOne(
    withTenant(tenantId, {
      _id: departmentId,
    })
  );

  if (!department) {
    return false;
  }

  // Soft delete by setting status to inactive
  department.status = 'inactive';
  await department.save();

  await AuditLogger.auditWrite(
    'department',
    department._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}
