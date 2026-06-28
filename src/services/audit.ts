import { createAuditLog } from "@/dal/audit-logs/mutations"
import { AuditAction, AuditResourceType } from "@/drizzle/schema"

/**
 * Audit Service — centralizes all audit logging.
 */
export async function logAction(
  userId: string,
  workspaceId: string,
  action: AuditAction,
  resourceType: AuditResourceType,
  resourceId: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
) {
  try {
    await createAuditLog({
      userId,
      workspaceId,
      action,
      resourceType,
      resourceId,
      metadata: metadata || {},
      ipAddress,
    })
  } catch (error) {
    // We typically don't want audit log failures to crash the main request,
    // but in a real system we'd alert on this.
    console.error("Failed to write audit log:", error)
  }
}
