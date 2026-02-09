/**
 * Note Template service
 * Handles all note template-related business logic
 */

import connectDB from '@/lib/db/connection.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';
import NoteTemplate from '@/models/NoteTemplate.js';
import User from '@/models/User.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';

/**
 * Create a new note template
 */
export async function createNoteTemplate(input, tenantId, userId) {
  await connectDB();

  // Validate doctor if provided
  if (input.doctorId) {
    const doctor = await User.findOne(
      withTenant(tenantId, {
        _id: input.doctorId,
        isActive: true,
      })
    );

    if (!doctor) {
      throw new Error('Doctor not found or inactive');
    }
  }

  // Create template
  const template = await NoteTemplate.create({
    tenantId,
    doctorId: input.doctorId || null,
    specialty: input.specialty || '',
    name: input.name,
    description: input.description || '',
    type: input.type || 'soap',
    fields: input.fields || [],
    soapTemplate: input.soapTemplate || null,
    isActive: input.isActive !== undefined ? input.isActive : true,
    isDefault: input.isDefault || false,
    usageCount: 0,
  });

  // If this is set as default, unset other defaults for the same type/specialty
  if (template.isDefault) {
    await NoteTemplate.updateMany(
      withTenant(tenantId, {
        _id: { $ne: template._id },
        type: template.type,
        specialty: template.specialty || null,
        isDefault: true,
      }),
      { $set: { isDefault: false } }
    );
  }

  // Audit log
  await AuditLogger.auditWrite(
    'note_template',
    template._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return template;
}

/**
 * Get template by ID
 */
export async function getNoteTemplateById(templateId, tenantId, userId) {
  await connectDB();

  const template = await NoteTemplate.findOne(
    withTenant(tenantId, {
      _id: templateId,
    })
  )
    .populate('doctorId', 'firstName lastName')
    .lean();

  if (template) {
    await AuditLogger.auditRead('note_template', templateId, userId, tenantId);
  }

  return template;
}

/**
 * List templates with pagination and filters
 */
export async function listNoteTemplates(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  // Build filter
  const filter = withTenant(tenantId, {});

  if (query.doctorId) {
    filter.doctorId = query.doctorId;
  }

  if (query.specialty) {
    filter.specialty = query.specialty;
  }

  if (query.type) {
    filter.type = query.type;
  }

  if (query.isActive !== undefined) {
    filter.isActive = query.isActive;
  }

  if (query.isDefault !== undefined) {
    filter.isDefault = query.isDefault;
  }

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  // Get total count
  const total = await NoteTemplate.countDocuments(filter);

  // Get paginated results
  const templates = await NoteTemplate.find(filter)
    .populate('doctorId', 'firstName lastName')
    .sort({ isDefault: -1, usageCount: -1, createdAt: -1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  // Audit list access
  await AuditLogger.auditWrite(
    'note_template',
    'list',
    userId,
    tenantId,
    AuditAction.READ,
    undefined,
    { count: templates.length, filters: query }
  );

  return createPaginationResult(templates, total, page || 1, limit || 10);
}

/**
 * Update note template
 */
export async function updateNoteTemplate(templateId, input, tenantId, userId) {
  await connectDB();

  const existing = await NoteTemplate.findOne(
    withTenant(tenantId, {
      _id: templateId,
    })
  );

  if (!existing) {
    return null;
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // Validate doctor if being changed
  if (input.doctorId !== undefined) {
    if (input.doctorId) {
      const doctor = await User.findOne(
        withTenant(tenantId, {
          _id: input.doctorId,
          isActive: true,
        })
      );

      if (!doctor) {
        throw new Error('Doctor not found or inactive');
      }
    }
  }

  // If setting as default, unset other defaults
  if (input.isDefault === true) {
    await NoteTemplate.updateMany(
      withTenant(tenantId, {
        _id: { $ne: templateId },
        type: input.type || existing.type,
        specialty: input.specialty !== undefined ? input.specialty : existing.specialty || null,
        isDefault: true,
      }),
      { $set: { isDefault: false } }
    );
  }

  const template = await NoteTemplate.findByIdAndUpdate(
    templateId,
    { $set: updateData },
    { new: true, runValidators: true }
  )
    .populate('doctorId', 'firstName lastName');

  if (template) {
    await AuditLogger.auditWrite(
      'note_template',
      template._id.toString(),
      userId,
      tenantId,
      AuditAction.UPDATE,
      { before, after: template.toObject() }
    );
  }

  return template;
}

/**
 * Apply template to create a clinical note structure
 */
export async function applyTemplate(templateId, tenantId, userId) {
  await connectDB();

  const template = await NoteTemplate.findOne(
    withTenant(tenantId, {
      _id: templateId,
      isActive: true,
    })
  );

  if (!template) {
    throw new Error('Template not found or inactive');
  }

  // Increment usage count
  template.usageCount += 1;
  await template.save();

  // Return template structure for creating a note
  return {
    templateId: template._id.toString(),
    type: template.type,
    fields: template.fields || [],
    soapTemplate: template.soapTemplate || null,
    defaultValues: extractDefaultValues(template),
  };
}

/**
 * Extract default values from template
 */
function extractDefaultValues(template) {
  const defaults = {};

  if (template.fields) {
    template.fields.forEach((field) => {
      if (field.defaultValue) {
        defaults[field.name] = field.defaultValue;
      }
    });
  }

  if (template.soapTemplate) {
    ['subjective', 'objective', 'assessment', 'plan'].forEach((section) => {
      if (template.soapTemplate[section]?.defaultText) {
        defaults[section] = template.soapTemplate[section].defaultText;
      }
    });
  }

  return defaults;
}

/**
 * Delete note template (soft delete)
 */
export async function deleteNoteTemplate(templateId, tenantId, userId) {
  await connectDB();

  const template = await NoteTemplate.findOne(
    withTenant(tenantId, {
      _id: templateId,
    })
  );

  if (!template) {
    return false;
  }

  // Soft delete by setting isActive to false
  template.isActive = false;
  await template.save();

  await AuditLogger.auditWrite(
    'note_template',
    template._id.toString(),
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}
