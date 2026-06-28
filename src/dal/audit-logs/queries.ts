import { db } from "@/drizzle/db"
import { AuditLogTable } from "@/drizzle/schema"
import { eq, desc } from "drizzle-orm"

export async function getWorkspaceAuditLogs(workspaceId: string, limit = 50) {
  return db.query.AuditLogTable.findMany({
    where: eq(AuditLogTable.workspaceId, workspaceId),
    with: {
      user: {
        columns: { name: true, email: true },
      },
    },
    orderBy: [desc(AuditLogTable.performedAt)],
    limit,
  })
}
