import { db } from "@/drizzle/db"
import { AuditLogInsertData, AuditLogTable } from "@/drizzle/schema"

export async function createAuditLog(data: AuditLogInsertData) {
  const [log] = await db
    .insert(AuditLogTable)
    .values(data)
    .returning()

  return log
}
