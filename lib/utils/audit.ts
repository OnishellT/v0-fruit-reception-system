import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

/**
 * Log an audit event
 */
export async function logAuditEvent(data: {
  userId: string;
  action: string;
  tableName?: string;
  recordId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await db.insert(auditLogs).values({
      userId: data.userId,
      action: data.action,
      tableName: data.tableName,
      recordId: data.recordId,
      oldValues: data.oldValues,
      newValues: data.newValues,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });
  } catch (error) {
    // Log audit errors to console but don't fail the operation
    console.error('Failed to log audit event:', error);
  }
}

/**
 * Log a cash POS action with RBAC context
 */
export async function logCashPOSAction(
  userId: string,
  action: string,
  details: {
    tableName?: string;
    recordId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  await logAuditEvent({
    userId,
    action: `cash_pos:${action}`,
    ...details,
  });
}

/**
 * Log RBAC permission check
 */
export async function logRBACCheck(
  userId: string,
  action: string,
  allowed: boolean,
  details?: {
    requiredRoles?: string[];
    userRole?: string;
    resource?: string;
    ipAddress?: string;
    userAgent?: string;
  }
) {
  await logAuditEvent({
    userId,
    action: `rbac:${action}:${allowed ? 'allowed' : 'denied'}`,
    tableName: 'rbac_permissions',
    oldValues: details,
  });
}