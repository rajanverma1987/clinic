/**
 * Audit logging for compliance (HIPAA, GDPR)
 * Immutable audit logs for every read/write
 */

import { Model } from 'mongoose';

export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  ACCESS = 'access',
}

export interface AuditLogData {
  resource: string; // e.g., 'patient', 'appointment'
  resourceId: string;
  action: AuditAction;
  userId: string;
  tenantId: string;
  ipAddress?: string;
  userAgent?: string;
  changes?: {
    before?: any;
    after?: any;
  };
  metadata?: Record<string, any>;
}

/**
 * Audit logger service
 * In production, this should write to a separate audit collection
 * that is append-only and immutable
 */
export class AuditLogger {
  /**
   * Log a write action (create, update, delete)
   */
  static async auditWrite(
    resource: string,
    resourceId: string,
    userId: string,
    tenantId: string,
    action: AuditAction,
    changes?: { before?: any; after?: any },
    metadata?: Record<string, any>
  ): Promise<void> {
    // TODO: Implement actual audit log storage
    // For now, we'll use console.log
    // In production, write to MongoDB audit collection with TTL indexes
    
    const logData: AuditLogData = {
      resource,
      resourceId,
      action,
      userId,
      tenantId,
      changes,
      metadata,
    };

    // In production, use:
    // await AuditLogModel.create(logData);
    
    console.log('[AUDIT]', JSON.stringify(logData));
  }

  /**
   * Log a read action (sensitive data access)
   */
  static async auditRead(
    resource: string,
    resourceId: string,
    userId: string,
    tenantId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.auditWrite(
      resource,
      resourceId,
      userId,
      tenantId,
      AuditAction.READ,
      undefined,
      metadata
    );
  }

  /**
   * Log data export (GDPR compliance)
   */
  static async auditExport(
    resource: string,
    resourceId: string,
    userId: string,
    tenantId: string,
    format: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.auditWrite(
      resource,
      resourceId,
      userId,
      tenantId,
      AuditAction.EXPORT,
      undefined,
      { format, ...metadata }
    );
  }
}

