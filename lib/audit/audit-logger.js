/**
 * Audit Logger Service
 * Creates audit logs for HIPAA/GDPR compliance
 * Based on NEW-PLANS.md requirements
 */

import connectDB from '@/lib/db/connection';
import { logger } from '@/lib/utils/logger.js';

/**
 * Helper function to validate and normalize resourceId
 */
function normalizeResourceId(resourceId, resource = null) {
  // For reports, resourceId should always be null
  if (resource === 'report') {
    return null;
  }
  
  // If resourceId is null or undefined, return null
  if (!resourceId) {
    return null;
  }
  
  // If resourceId is a string, check if it's a valid ObjectId format
  if (typeof resourceId === 'string') {
    // Valid ObjectId format is 24 hex characters
    if (resourceId.match(/^[0-9a-fA-F]{24}$/)) {
      return resourceId; // Valid ObjectId string
    } else {
      return null; // Not a valid ObjectId format
    }
  }
  
  // If it's already an ObjectId or other type, return as-is (Mongoose will handle it)
  return resourceId;
}

/**
 * Create an audit log entry
 * @param {Object} params
 * @param {string} params.userId - User ID performing the action
 * @param {string} params.tenantId - Tenant ID (optional)
 * @param {string} params.action - Action type (create, read, update, delete, login, logout, export)
 * @param {string} params.resource - Resource type (patient, appointment, prescription, invoice, user, etc.)
 * @param {string} params.resourceId - Resource ID (optional)
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.ipAddress - IP address of the user
 * @param {string} params.userAgent - User agent string
 * @param {boolean} params.phiAccessed - Whether PHI was accessed
 * @param {string} params.complianceType - 'hipaa', 'gdpr', 'both', or 'none'
 */
export async function createAuditLog({
  userId,
  tenantId = null,
  action,
  resource,
  resourceId = null,
  details = {},
  ipAddress,
  userAgent = '',
  phiAccessed = false,
  complianceType = 'none',
}) {
  try {
    await connectDB();
    const AuditLog = (await import('@/models/AuditLog')).default;

    // Normalize resourceId - this should already be done by the calling functions,
    // but we do it here as a safety measure
    const validResourceId = normalizeResourceId(resourceId, resource);

    const auditLog = new AuditLog({
      userId,
      tenantId,
      action,
      resource,
      resourceId: validResourceId,
      details,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: new Date(),
      phiAccessed,
      complianceType: phiAccessed ? 'both' : complianceType, // Auto-set to 'both' if PHI accessed
    });

    await auditLog.save();
    return auditLog;
  } catch (error) {
    logger.error('Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main flow
    return null;
  }
}

/**
 * Log PHI access (HIPAA requirement)
 */
export async function logPHIAccess(userId, tenantId, resource, resourceId, ipAddress, userAgent) {
  return createAuditLog({
    userId,
    tenantId,
    action: 'read',
    resource,
    resourceId: normalizeResourceId(resourceId, resource),
    ipAddress,
    userAgent,
    phiAccessed: true,
    complianceType: 'both',
  });
}

/**
 * Log data creation
 */
export async function logCreate(userId, tenantId, resource, resourceId, details, ipAddress, userAgent) {
  return createAuditLog({
    userId,
    tenantId,
    action: 'create',
    resource,
    resourceId: normalizeResourceId(resourceId, resource),
    details,
    ipAddress,
    userAgent,
    phiAccessed: isPHIResource(resource),
    complianceType: isPHIResource(resource) ? 'both' : 'none',
  });
}

/**
 * Log data update
 */
export async function logUpdate(userId, tenantId, resource, resourceId, details, ipAddress, userAgent) {
  return createAuditLog({
    userId,
    tenantId,
    action: 'update',
    resource,
    resourceId: normalizeResourceId(resourceId, resource),
    details,
    ipAddress,
    userAgent,
    phiAccessed: isPHIResource(resource),
    complianceType: isPHIResource(resource) ? 'both' : 'none',
  });
}

/**
 * Log data deletion
 */
export async function logDelete(userId, tenantId, resource, resourceId, details, ipAddress, userAgent) {
  return createAuditLog({
    userId,
    tenantId,
    action: 'delete',
    resource,
    resourceId: normalizeResourceId(resourceId, resource),
    details,
    ipAddress,
    userAgent,
    phiAccessed: isPHIResource(resource),
    complianceType: isPHIResource(resource) ? 'both' : 'none',
  });
}

/**
 * Log authentication events
 */
export async function logAuthEvent(userId, tenantId, action, ipAddress, userAgent, details = {}) {
  return createAuditLog({
    userId,
    tenantId,
    action, // 'login', 'logout', 'failed_login', 'password_reset', '2fa_enabled', etc.
    resource: 'auth',
    details,
    ipAddress,
    userAgent,
    phiAccessed: false,
    complianceType: 'none',
  });
}

/** System user ID used for audit when no user (e.g. failed login) */
const SYSTEM_USER_ID = '000000000000000000000001';

/**
 * Log failed login attempt (no userId; use system placeholder for schema)
 */
export async function logFailedLogin(email, ipAddress, userAgent, details = {}) {
  return createAuditLog({
    userId: SYSTEM_USER_ID,
    tenantId: null,
    action: 'failed_login',
    resource: 'auth',
    resourceId: null,
    details: { email: email || 'unknown', ...details },
    ipAddress: ipAddress || 'unknown',
    userAgent: userAgent || 'unknown',
    phiAccessed: false,
    complianceType: 'none',
  });
}

/**
 * Log data export (GDPR requirement)
 */
export async function logDataExport(userId, tenantId, resource, resourceId, ipAddress, userAgent) {
  return createAuditLog({
    userId,
    tenantId,
    action: 'export',
    resource,
    resourceId: normalizeResourceId(resourceId, resource),
    ipAddress,
    userAgent,
    phiAccessed: isPHIResource(resource),
    complianceType: 'gdpr',
  });
}

/**
 * Check if a resource contains PHI
 */
function isPHIResource(resource) {
  const phiResources = [
    'patient',
    'appointment',
    'prescription',
    'consultation',
    'clinical_note',
    'lab_order',
    'lab_result',
    'invoice',
    'payment',
  ];
  return phiResources.includes(resource.toLowerCase());
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs(filters = {}) {
  try {
    await connectDB();
    const AuditLog = (await import('@/models/AuditLog')).default;

    const query = {};
    if (filters.userId) query.userId = filters.userId;
    if (filters.tenantId) query.tenantId = filters.tenantId;
    if (filters.resource) query.resource = filters.resource;
    if (filters.resourceId) query.resourceId = filters.resourceId;
    if (filters.action) query.action = filters.action;
    if (filters.phiAccessed !== undefined) query.phiAccessed = filters.phiAccessed;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const limit = filters.limit || 100;
    const skip = filters.skip || 0;

    const logs = await AuditLog.find(query)
      .populate('userId', 'firstName lastName email role')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      total,
      limit,
      skip,
    };
  } catch (error) {
    logger.error('Failed to get audit logs:', error);
    throw error;
  }
}

/**
 * Audit Action Enum
 */
export const AuditAction = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  ACCESS: 'access',
  EXPORT: 'export',
  LOGIN: 'login',
  LOGOUT: 'logout',
};

/**
 * AuditLogger object with auditWrite method
 * Provides a convenient interface matching the usage pattern across services
 */
export const AuditLogger = {
  /**
   * Read/access audit log entry (convenience method for READ actions)
   * @param {string} resource - Resource type (e.g., 'report', 'patient', 'appointment')
   * @param {string|null} resourceId - Resource ID (optional for reports, can be null or ObjectId string)
   * @param {string} userId - User ID performing the action
   * @param {string} tenantId - Tenant ID
   * @param {string} ipAddress - IP address (optional, defaults to 'unknown')
   * @param {string} userAgent - User agent (optional, defaults to 'unknown')
   */
  async auditRead(resource, resourceId, userId, tenantId, ipAddress = 'unknown', userAgent = 'unknown') {
    // For reports, resourceId might be a report type string (e.g., 'revenue', 'patient')
    // Convert to null if it's not a valid ObjectId format
    let validResourceId = resourceId;
    
    // For reports, resourceId should be null (reports don't have specific resource IDs)
    // The second param is actually the report type, not a resourceId
    if (resource === 'report') {
      validResourceId = null;
    } else if (resourceId && typeof resourceId === 'string' && !resourceId.match(/^[0-9a-fA-F]{24}$/)) {
      // If resourceId is not a valid ObjectId format (24 hex chars), set to null
      validResourceId = null;
    } else if (!resourceId) {
      validResourceId = null;
    }
    
    return this.auditWrite(resource, validResourceId, userId, tenantId, AuditAction.READ, undefined, {}, ipAddress, userAgent);
  },

  /**
   * Write an audit log entry
   * @param {string} resource - Resource type (e.g., 'user', 'patient', 'appointment')
   * @param {string} resourceId - Resource ID
   * @param {string} userId - User ID performing the action
   * @param {string} tenantId - Tenant ID
   * @param {string} action - Action type (from AuditAction enum)
   * @param {Object} before - State before the action (optional)
   * @param {Object} details - Additional details about the action (optional)
   * @param {string} ipAddress - IP address (optional, defaults to 'unknown')
   * @param {string} userAgent - User agent (optional, defaults to 'unknown')
   */
  async auditWrite(resource, resourceId, userId, tenantId, action, before = undefined, details = {}, ipAddress = 'unknown', userAgent = 'unknown') {
    try {
      // Normalize resourceId first to ensure it's valid before passing to any log functions
      const normalizedResourceId = normalizeResourceId(resourceId, resource);
      
      // Determine if PHI was accessed based on resource type
      const phiAccessed = isPHIResource(resource);
      
      // Map action to appropriate function
      const actionMap = {
        [AuditAction.CREATE]: logCreate,
        [AuditAction.READ]: logPHIAccess,
        [AuditAction.UPDATE]: logUpdate,
        [AuditAction.DELETE]: logDelete,
        [AuditAction.ACCESS]: logAuthEvent,
        [AuditAction.EXPORT]: logDataExport,
        [AuditAction.LOGIN]: logAuthEvent,
        [AuditAction.LOGOUT]: logAuthEvent,
      };

      const logFunction = actionMap[action] || createAuditLog;

      // Prepare details with before state if provided
      const auditDetails = {
        ...details,
        ...(before && { before }),
      };

      // For READ/ACCESS actions, use logPHIAccess if PHI resource
      if ((action === AuditAction.READ || action === AuditAction.ACCESS) && phiAccessed) {
        return await logPHIAccess(userId, tenantId, resource, normalizedResourceId, ipAddress, userAgent);
      }

      // For auth events, use logAuthEvent
      if (action === AuditAction.LOGIN || action === AuditAction.LOGOUT || action === AuditAction.ACCESS) {
        return await logAuthEvent(userId, tenantId, action, ipAddress, userAgent, auditDetails);
      }

      // For other actions, use the mapped function or createAuditLog
      if (logFunction === logCreate) {
        return await logCreate(userId, tenantId, resource, normalizedResourceId, auditDetails, ipAddress, userAgent);
      } else if (logFunction === logUpdate) {
        return await logUpdate(userId, tenantId, resource, normalizedResourceId, auditDetails, ipAddress, userAgent);
      } else if (logFunction === logDelete) {
        return await logDelete(userId, tenantId, resource, normalizedResourceId, auditDetails, ipAddress, userAgent);
      } else if (logFunction === logDataExport) {
        return await logDataExport(userId, tenantId, resource, normalizedResourceId, ipAddress, userAgent);
      } else {
        // Fallback to createAuditLog
        return await createAuditLog({
          userId,
          tenantId,
          action,
          resource,
          resourceId: normalizedResourceId,
          details: auditDetails,
          ipAddress,
          userAgent,
          phiAccessed,
          complianceType: phiAccessed ? 'both' : 'none',
        });
      }
    } catch (error) {
      logger.error('Failed to write audit log:', error);
      // Don't throw - audit logging should not break the main flow
      return null;
    }
  },
};
