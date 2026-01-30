/**
 * Notification Template Service
 * Handles notification template management
 */

import connectDB from '@/lib/db/connection.js';
import NotificationTemplate from '@/models/NotificationTemplate.js';
import { withTenant } from '@/lib/db/tenant-helper.js';
import { AuditLogger, AuditAction } from '@/lib/audit/audit-logger.js';
import { createPaginationResult, getPaginationParams } from '@/lib/utils/pagination.js';

/**
 * Replace template variables with actual values
 */
function replaceVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

/**
 * Create notification template
 */
export async function createNotificationTemplate(input, tenantId, userId) {
  await connectDB();

  // Check if template name already exists
  const existing = await NotificationTemplate.findOne(
    withTenant(tenantId, {
      name: input.name,
    })
  );

  if (existing) {
    throw new Error('Template name already exists');
  }

  const template = await NotificationTemplate.create({
    tenantId,
    name: input.name,
    type: input.type,
    channels: input.channels,
    variables: input.variables || [],
    isDefault: input.isDefault || false,
    isActive: input.isActive !== false,
  });

  // If this is set as default, unset other defaults of the same type
  if (input.isDefault) {
    await NotificationTemplate.updateMany(
      withTenant(tenantId, {
        type: input.type,
        _id: { $ne: template._id },
        isDefault: true,
      }),
      {
        $set: { isDefault: false },
      }
    );
  }

  await AuditLogger.auditWrite(
    'notification_template',
    template._id.toString(),
    userId,
    tenantId,
    AuditAction.CREATE
  );

  return template;
}

/**
 * Get notification template by ID
 */
export async function getNotificationTemplateById(templateId, tenantId, userId) {
  await connectDB();

  const template = await NotificationTemplate.findOne(
    withTenant(tenantId, {
      _id: templateId,
    })
  ).lean();

  if (template) {
    await AuditLogger.auditRead('notification_template', templateId, userId, tenantId);
  }

  return template;
}

/**
 * List notification templates
 */
export async function listNotificationTemplates(query, tenantId, userId) {
  await connectDB();

  const { page, limit } = getPaginationParams({
    page: query.page,
    limit: query.limit,
  });

  const filter = withTenant(tenantId, {
    isActive: query.isActive !== false,
  });

  if (query.type) {
    filter.type = query.type;
  }

  if (query.isDefault !== undefined) {
    filter.isDefault = query.isDefault === 'true';
  }

  if (query.search) {
    filter.name = { $regex: query.search, $options: 'i' };
  }

  const total = await NotificationTemplate.countDocuments(filter);

  const templates = await NotificationTemplate.find(filter)
    .sort({ type: 1, name: 1 })
    .skip(((page || 1) - 1) * (limit || 10))
    .limit(limit || 10)
    .lean();

  await AuditLogger.auditWrite(
    'notification_template',
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
 * Get default template for a type
 */
export async function getDefaultTemplate(type, tenantId) {
  await connectDB();

  const template = await NotificationTemplate.findOne(
    withTenant(tenantId, {
      type,
      isDefault: true,
      isActive: true,
    })
  ).lean();

  return template;
}

/**
 * Apply template with variables
 */
export async function applyTemplate(templateId, variables, tenantId) {
  await connectDB();

  const template = await NotificationTemplate.findOne(
    withTenant(tenantId, {
      _id: templateId,
      isActive: true,
    })
  ).lean();

  if (!template) {
    throw new Error('Template not found');
  }

  const result = {
    email: null,
    sms: null,
    whatsapp: null,
  };

  if (template.channels.email?.enabled && template.channels.email.html) {
    result.email = {
      subject: replaceVariables(template.channels.email.subject || '', variables),
      html: replaceVariables(template.channels.email.html, variables),
      text: replaceVariables(template.channels.email.text || template.channels.email.html, variables),
    };
  }

  if (template.channels.sms?.enabled && template.channels.sms.message) {
    result.sms = replaceVariables(template.channels.sms.message, variables);
  }

  if (template.channels.whatsapp?.enabled && template.channels.whatsapp.message) {
    result.whatsapp = replaceVariables(template.channels.whatsapp.message, variables);
  }

  return result;
}

/**
 * Update notification template
 */
export async function updateNotificationTemplate(templateId, input, tenantId, userId) {
  await connectDB();

  const existing = await NotificationTemplate.findOne(
    withTenant(tenantId, {
      _id: templateId,
    })
  );

  if (!existing) {
    return null;
  }

  const before = existing.toObject();
  const updateData = { ...input };

  // If name changed, check for duplicates
  if (input.name && input.name !== existing.name) {
    const duplicate = await NotificationTemplate.findOne(
      withTenant(tenantId, {
        name: input.name,
        _id: { $ne: templateId },
      })
    );

    if (duplicate) {
      throw new Error('Template name already exists');
    }
  }

  // If setting as default, unset other defaults
  if (input.isDefault === true) {
    await NotificationTemplate.updateMany(
      withTenant(tenantId, {
        type: existing.type,
        _id: { $ne: templateId },
        isDefault: true,
      }),
      {
        $set: { isDefault: false },
      }
    );
  }

  const template = await NotificationTemplate.findByIdAndUpdate(
    templateId,
    { $set: updateData },
    { new: true, runValidators: true }
  );

  if (template) {
    await AuditLogger.auditWrite(
      'notification_template',
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
 * Delete notification template
 */
export async function deleteNotificationTemplate(templateId, tenantId, userId) {
  await connectDB();

  const template = await NotificationTemplate.findOne(
    withTenant(tenantId, {
      _id: templateId,
    })
  );

  if (!template) {
    return false;
  }

  // Soft delete
  template.isActive = false;
  await template.save();

  await AuditLogger.auditWrite(
    'notification_template',
    templateId,
    userId,
    tenantId,
    AuditAction.DELETE
  );

  return true;
}
